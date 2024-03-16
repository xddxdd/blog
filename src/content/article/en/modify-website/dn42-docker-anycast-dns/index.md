---
title: 'Running Anycast DNS with Docker in DN42'
categories: 'Website and Servers'
tags: [DN42,Anycast,BGP]
date: 2019-03-14 22:54:00
---

2020-03-16 Notes
---------------

There is an updated scheme compared to this post, see [Sharing Network Namespace Among Docker Containers for Bird Anycasting](/en/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian).

It is suggested to read only the concept explanations in this post, and use the above scheme instead for deployment.

---

What's Anycast
--------------

The commonly used routing protocol on Internet, the BGP, works like this:

- I own an IP range, 172.22.76.104/29, on DN42.
- With a BGP software like BIRD, I "announce" that my server has access to IP range 172.22.76.104/29.
- Servers with peering to me will record this message: "Over this path, I can access 172.22.76.104/29 which is 1 step away."
- These servers continue to announce to others with peering to them: "This server is 1 step away from the source of 172.22.76.104/29."
- Similarly, other servers announce that they are 2, 3, 4... steps away from 172.22.76.104/29.
- All servers will take the shortest route to send data to my server.

In this case, only one server is announcing that it's the source for 172.22.76.104/29, which is called Unicast. By contrast, Anycast is announcing the source of 172.22.76.104/29 on multiple servers (usually in different locations, such as Hong Kong, Los Angeles, Paris, etc.), while other servers still count steps to send data to the closest servers. Therefore, visitors in Mainland China are more likely to hit my Hong Kong server, since usually there are much fewer steps from Mainland China to Hong Kong compared to other locations; similarly, German visitors will access my Paris server, and Chicago users will connect to my Los Angeles server.

(P.S. There are some simplifications done in the previous explanation. Actual BGP route selection is more complex than that.)

In the config above, all servers are sharing one IP range, and users are automatically directed to their closest server, without the assistance of client side software, by simply accessing IPs in the range.

However, Anycast has its limitations: since each server is still independent, the network connection status is not shared among them. The routing situation on the Internet changes rapidly, and every user may be redirected to another server at any time. Since everything happens on the network layer (L3), the application layer (L7) is unaware of the change. This means that stateful protocols (like TCP) cannot work reliably. Therefore, Anycast is more commonly used for stateless services, like DNS.

What I'm Trying to Achieve
--------------------------

1. Unifying the IP address of services to ease configuration. For example, I set the DNS service's IP to 172.18.53.53, and set up Anycast on every server, so requests will end up in the nearest server. Then, while configuring services that require DNS, I could simply hard code 172.18.53.53, and copy config files to every server for mass deployment.
2. Fast recovery from failures: sometimes, my services, such as DNS, may stop running on one server for an erroneous config change or an upstream provider issue. With the DNS stop running on the server, it will stop announcing its access to the DNS IP. Requests to DNS services are automatically sent to other servers. Services that are still up won't die together with DNS anymore.
3. Lower latency: in DN42, European users can reach my France server, United States users can reach my Los Angeles server, and Asian users can reach my Hong Kong server. The latencies are minimized, and therefore the stability is improved.

Extra requirements: I must use Docker for the whole deployment.

Problems with Existing Solutions
--------------------------------

There are some common solutions that all have some shortcomings:

1. Directly assign the IP in the OS and do BGP announcements. When the DNS service crashes, BGP announcements will still continue, directing external requests to this server. Since DNS service is dead, it will be unavailable in the region.
2. Directly assign the IP in the OS, and use ExaBGP along with monitoring scripts to withdraw BGP announcements on a service crash. Now while routes are removed, the IP address will still be present in the OS. If DNS requests go through this server (even though they're heading for other servers), they will be handled by this server. Therefore, DNS service will still be down in the region.

In addition, neither of them supports Docker.

As for my final solution, I added IPs in Docker containers, and installed Bird to communicate with the host Bird instance via OSPF, to do the announcements. If the container crashed, the announcement will automatically stop. As the IP isn't configured on the host OS, it will forward the packets correctly, instead of stopping them halfway.

Adding IPs to Containers
------------------------

Docker's default network driver, `bridge`, creates a virtual network card on the host OS, adds an IP block, and routes relevant traffic to them. But if I take this approach, there will always be a route to send relevant traffic to the virtual card, causing request loss during downtime. Therefore, I need a network isolated from the host OS.

An isolated network can be created with Docker's `macvlan` driver, with `internal` option enabled.

```docker
networks:
  anycast_ip:
    driver: macvlan
    internal: true
    enable_ipv6: true
    ipam:
      config:
        - subnet: 172.22.76.104/29
        - subnet: fdbc:f9dc:67ad:2547::/64
```

This network is only responsible for adding IPs, and containers still access the network via Docker's default bridge network. Therefore, containers need to be configured like:

```docker
services:
  dnsmasq:
    image: xddxdd/dnsmasq-bird
    [...]
    networks:
      default:
        ipv4_address: 172.18.1.53
        ipv6_address: fcf9:a876:ed8b:c606:ba01::53
      anycast_ip:
        ipv4_address: 172.22.76.110
        ipv6_address: fdbc:f9dc:67ad:2547::53
```

In the example above, 172.18.1.53 is the container's IP in `bridge` network, and 172.22.76.110 is the container's Anycast IP address.

Once we start the container, we can check that the container indeed has two IPs:

```bash
# docker exec -it dnsmasq ip addr
[...]
391: eth1@if302: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:16:4c:6e brd ff:ff:ff:ff:ff:ff
    inet 172.22.76.110/29 brd 172.22.76.111 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fdbc:f9dc:67ad:2547::53/64 scope global flags 02
       valid_lft forever preferred_lft forever
392: eth0@if393: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:12:01:35 brd ff:ff:ff:ff:ff:ff
    inet 172.18.1.53/24 brd 172.18.1.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fcf9:a876:ed8b:c606:ba01::53/80 scope global flags 02
       valid_lft forever preferred_lft forever
```

And the container will still use the `bridge` network by default, thus not affecting network access:

```bash
# docker exec -it dnsmasq ip route
default via 172.18.1.1 dev eth0
172.18.1.0/24 dev eth0 scope link  src 172.18.1.53
172.22.76.104/29 dev eth1 scope link  src 172.22.76.110
```

Announcing IP from Containers
-----------------------------

The next step is installing Bird and announcing owned IPs. An example of Dockerfile can be seen in [this commit][1]. The changes are mostly relevant to installing Bird and Supervisord and starting Bird and Dnsmasq with Supervisord. In addition, put a simple Bird configuration to the container, so it will announce its IPs via OSPF.

Note that BGP isn't used, since an ASN needs to be manually allocated, which in addition to complexity, may cause problems if they're assigned incorrectly. But for OSPF, there is no unique identifiers for each device, so it's easier to deploy.

The configuration looks like: (Alpine uses Bird 2.0)

```bash
log syslog all;
protocol device {}
protocol ospf {
    ipv4 {
        import none;
        export all;
    };
    area 0.0.0.0 {
        interface "eth*" {
            type broadcast;
            cost 1;
            hello 2;
            retransmit 2;
            dead count 2;
        };
    };
}
protocol ospf v3 {
    ipv6 {
        import none;
        export all;
    };
    area 0.0.0.0 {
        interface "eth*" {
            type broadcast;
            cost 1;
            hello 2;
            retransmit 2;
            dead count 2;
        };
    };
}

include "/etc/bird-static.conf";
```

But with this config alone, Bird only announces routes obtained from the container itself, or only 172.22.76.104/29. But what we expect is an independent route for 172.22.76.110/32, so we need a static route in `bird-static.conf`. This file is in place so that it can be easily replaced with Volumes.

```bash
protocol static {
    ipv4;
    route 172.22.76.110/32 unreachable;
}

protocol static {
    ipv6;
    route fdbc:f9dc:67ad:2547::53/128 unreachable;
}
```

This config tells Bird to announce these two IPs on every network card via OSPF.

Then, add OSPF protocol to Bird's host OS: (Host OS is using Bird 1.6)

```bash
protocol ospf lt_docker_ospf {
    tick 2;
    rfc1583compat yes;
    area 0.0.0.0 {
        interface "docker*" {
        type broadcast;
        cost 1;
        hello 2;
        retransmit 2;
        dead count 2;
        };
        interface "ltnet" {
        type broadcast;
        cost 1;
        hello 2;
        retransmit 2;
        dead count 2;
        };
    };
}
```

Don't forget to add `NET_ADMIN` capability to the container, or Bird cannot establish OSPF connection correctly:

```yaml
  dnsmasq:
    image: xddxdd/dnsmasq-bird
    [...]
    cap_add:
      - NET_ADMIN
```

Then the host OS can see announcements from the containers:

```bash
# birdc show route protocol lt_docker_ospf
BIRD 1.6.3 ready.
172.22.76.110/32   via 172.18.1.53 on ltnet [lt_docker_ospf 00:00:37] * E2 (150/1/10000) [172.18.1.53]
172.22.76.109/32   via 172.18.1.54 on ltnet [lt_docker_ospf 17:41:06] * E2 (150/1/10000) [172.18.1.54]
172.22.76.104/29   via 172.18.1.54 on ltnet [lt_docker_ospf 01:00:08] * I (150/2) [172.18.1.54]
[...]
```

Note that the container is still broadcasting the Anycast IP range (which is a bit hard to filter), but since each Anycast IP generated a `/32` route that precedents `/29` routes, there's no actual impact.

With each server configured identically and peers established between, the host OS's Bird will announce the container's routes to other servers, so every server can access the container's services.

When a container is stopped, all traffic will be redirected to another service, so the service isn't interrupted.

DN42 Demonstrations
-------------------

Currently I have two Anycast services in DN42:

172.22.76.110 - A Dnsmasq-based recursive DNS
172.22.76.109 - A PowerDNS-based authoritative DNS, for DNS resolution of my IP range and `lantian.dn42`

  [1]: https://github.com/xddxdd/dockerfiles/tree/0b36ccecc7f8da33e994a479686bb78e918a969f/dnsmasq-bird
