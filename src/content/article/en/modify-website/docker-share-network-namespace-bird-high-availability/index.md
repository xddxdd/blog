---
title: 'Sharing Network Namespace Among Docker Containers for Bird Anycasting'
categories: 'Website and Servers'
tags: [Docker, Bird]
date: 2020-03-13 20:23:20
---

At exactly one year ago, I [set up an Anycast service with Docker in the DN42 network (Chinese only atm)](/article/modify-website/dn42-docker-anycast-dns.lantian). Back then, I customized the container's image and added a Bird installation to it, then put in a config file to broadcast Anycast routes via OSPF. However, as time went by, a few problems were exposed:

1. The process of installing Bird takes time. Instead of installing Bird with `apt-get`, since [my Dockerfiles need to support multiple architectures (Chinese only atm)](/article/modify-website/gpp-preprocess-dockerfile-include-if.lantian), and Bird isn't available in some architecture's repos for Debian. And since my building server is AMD64, and [is running images of other architectures with `qemu-user-static` (Chinese only atm)](/article/modify-computer/build-arm-docker-image-on-x86-docker-hub-travis-automatic-build.lantian), a lot of instruction translation is needed in the image building and software compilation progress, which is extremely inefficient. It may take more than 2 hours to build an image for different architectures, while if I installed it with Bird, it will take less than 5 minutes.
2. Customizing image also takes time. Since both the target application (such as PowerDNS) and Bird need to be run simultaneously, I cannot simply use the target app as the ENTRYPOINT. Adding other managing software (supervisord, s6-supervise, tini, or a custom Bash script) adds extra complexity to the image (and therefore increases chances of error), and other factors such as signals, return values and zombie processes need to be taken into account.

Recently when I was reading [`docker-compose`'s reference document](https://docs.docker.com/compose/compose-file/compose-file-v2/), I realized that `network_mode`, or the container's network scheme, can be set to `container:[ID]` or `service:[name]`, which means multiple containers can share the same namespace, and therefore the same IP allocations and routes. This means I can create an individual Bird container, attach it to the application container's network namespace, to achieve Anycast without modifying the original container image.

Scheme 1: Two Containers
------------------------

The most straightforward solution is using two containers, one for application and one for Bird. Using PowerDNS as an example, this is my config file:

```yaml
services:
  powerdns:
    image: xddxdd/powerdns
    container_name: powerdns
    restart: always
    volumes:
      - "./conf/powerdns:/etc/powerdns:ro"
      - "/etc/geoip:/etc/geoip:ro"
    depends_on:
      - mysql
      - docker-ipv6nat
    ports:
      - "53:53"
      - "53:53/udp"
    networks:
      default:
        ipv4_address: 172.18.3.54
        ipv6_address: fcf9:a876:eddd:c85a:8a93::54
      anycast_ip:
        ipv4_address: 172.22.76.109
        ipv6_address: fdbc:f9dc:67ad:2547::54

  powerdns-bird:
    image: xddxdd/bird
    container_name: powerdns-bird
    restart: always
    network_mode: "service:powerdns"
    volumes:
      - "./conf/powerdns/bird-static.conf:/etc/bird-static.conf:ro"
    cap_add:
      - NET_ADMIN
    depends_on:
      - docker-ipv6nat
      - powerdns

networks: [Redacted...]
```

Here I set all networking-related configuration (including IP and ports) on the PowerDNS container, and set `network_mode: service:powerdns` on the Bird container, so they share the network namespace. Here `NET_ADMIN` capability is still required by Bird to handle the broadcasting and routing, but no longer assigned to PowerDNS. Hence security is improved a bit?

Then run `docker-compose up -d` to start both containers.

And Problem Arises
------------------

Not long has passed before the host cannot receive OSPF broadcasts from the Bird container anymore. I entered the Bird container, did some checks, and saw:

```bash
# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/sit 0.0.0.0 brd 0.0.0.0
3: gre0@NONE: <NOARP> mtu 1476 qdisc noop state DOWN group default qlen 1000
    link/gre 0.0.0.0 brd 0.0.0.0
4: gretap0@NONE: <BROADCAST,MULTICAST> mtu 1462 qdisc noop state DOWN group default qlen 1000
    link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
5: erspan0@NONE: <BROADCAST,MULTICAST> mtu 1450 qdisc noop state DOWN group default qlen 1000
    link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
```

The IP allocation is gone. Upon further inspection on the PowerDNS container, I realized that since I have [Watchtower](https://github.com/containrrr/watchtower) automatically updating images to the latest version, and my building server updated PowerDNS's image, the PowerDNS container has been recreated.

Since `service` in `network_mode` is, in fact, a convenience function provided by `docker-compose`, and is assigned by container ID on Docker level, when PowerDNS container was recreated, the network namespace for Bird container is lost as well.

Now, if I attempt to restart the Bird container, Docker will show an error about unable to find the container with the original ID. Here the complexity arises: if I run `docker-compose up -d` again, instead of recreating containers, `docker-compose` simply tries to start existing containers, which will fail.

Therefore, I need a container that is always running and never updated for the network namespace, and attach PowerDNS and Bird containers, which may be updated any time, onto the long-running container, to avoid issues when updating containers.

Scheme 2: Three Containers
--------------------------

I chose the [Busybox container](https://hub.docker.com/_/busybox?tab=tags) to run forever since it's small enough and occupies negligible memory space. The latest version of Busybox was 1.31.1 when I was writing this post, but since images of 1.31.1 was still updated periodically, I chose the image for 1.31.0, which was last updated 3 months ago.

I run `tail -f /dev/null` forever with Busybox without it eating CPU cycles. In addition, I set labels to the container to prevent Watchtower from auto-updating it.

Here is my updated config file:

```yaml
services:
  powerdns-net:
    image: amd64/busybox:1.31.0
    container_name: powerdns-net
    restart: always
    entrypoint: "tail -f /dev/null"
    labels:
      - com.centurylinklabs.watchtower.enable=false
    depends_on:
      - docker-ipv6nat
    ports:
      - "53:53"
      - "53:53/udp"
    networks:
      default:
        ipv4_address: 172.18.3.54
        ipv6_address: fcf9:a876:eddd:c85a:8a93::54
      anycast_ip:
        ipv4_address: 172.22.76.109
        ipv6_address: fdbc:f9dc:67ad:2547::54

  powerdns:
    image: xddxdd/powerdns
    container_name: powerdns
    restart: always
    network_mode: "service:powerdns-net"
    volumes:
      - "./conf/powerdns:/etc/powerdns:ro"
      - "/etc/geoip:/etc/geoip:ro"
    depends_on:
      - docker-ipv6nat
      - powerdns-net

  powerdns-bird:
    image: xddxdd/bird
    container_name: powerdns-bird
    restart: always
    network_mode: "service:powerdns-net"
    volumes:
      - "./conf/powerdns/bird-static.conf:/etc/bird-static.conf:ro"
    cap_add:
      - NET_ADMIN
    depends_on:
      - docker-ipv6nat
      - powerdns

networks: [Redacted...]
```

Here the Busybox container will run forever stably to keep the network namespace running, and PowerDNS and Bird will attach to it and provide services. Either PowerDNS or Bird can be updated at any time without affecting the existence of the whole network namespace.

As for resource consumptions of Busybox:

```bash
# docker stats --no-stream
CONTAINER ID        NAME                     CPU %               MEM USAGE / LIMIT   MEM %               NET I/O             BLOCK I/O           PIDS
...
803b11f02b3a        powerdns-recursor-net    0.00%               384KiB / 734MiB     0.05%               10.3MB / 3.98MB     1.43MB / 0B         1
...
```

The size is merely 384KB and can be simply ignored.
