---
title: 'Writing Stories in Traceroute'
categories: 'Computers and Clients'
tags: [Traceroute, DN42]
date: 2018-08-15 19:46:00
image: /usr/uploads/2018/08/2301166997.png
---

## 2020-10-11 Update

Now a better way exists that doesn't involve a bunch of Docker containers.
Please refer to
[Writing Stories in Traceroute, Elegantly](/en/article/creations/traceroute-chain.lantian).

## Intro

Traceroute is one of the popular tools for network inspection. It shows the IP
addresses of routers on the route from your computer to a destination server,
similar to:

![Traceroute Example][1]

Domains are shown on the last 2 hops, which is the IP's reverse DNS record.
Reverse DNS records exist as PTR records in the format of
`4.3.2.1.in-addr.arpa`. For more information, you may refer to
[Setting IP Reverse Records in DN42 (Chinese Only)](/article/modify-website/dn42-ip-reverse-record.lantian).

However, PTR records need not be real domains. They can be any string that
"looks like" a domain. With this, we can write one sentence on each hop of a
Traceroute path to make a story:

![Traceroute Story Example][3]

This story is set up in DN42. If you have already joined DN42, you may `ping` or
`traceroute` IPs in this post. However, this configuration is not limited to
DN42. If you have a public IP block with control on reverse DNS, you may use the
same method.

## Prepare Routes

The first step is setting up a bunch of routers that forward packets for a
specific IP one by one, to create a route long enough to show an essay.

The primitive method is chaining a bunch of physical routers with network
cables. But first, I need the bunch of routers; and then I need to connect them
to DN42.

On a second thought, Linux has routing capabilities. I can set up some Linux VMs
with their own IPs, and execute this command on each of them:

```bash
ip route add [Target IP]/32 via [Next Hop IP]
```

Packets to the destination IP will be forwarded through each VM to create a
path.

Next, I need to think of a way to create the VMs. I have ESXi on Kimsufi, and it
shouldn't be that resource-intensive to start a bunch of Alpine Linux VMs. But
I'd have to do manual configuration for each of them, which is too much of a
hassle!

From another perspective, Docker is a management tool for LXC containers, and
LXC containers have their independent network namespaces with their own IPs and
routes. For my purpose, they are perfect replacements for full Linux VMs.

So I went to create Docker images. All I need is an Alpine image that runs the
following script on startup:

```bash
#!/bin/sh
echo Target IP is $TARGET_IP
THIS_IP=$(ip addr show dev eth0 | grep inet | cut -d' ' -f6 | cut -d'/' -f1)
echo My IP is $THIS_IP
NEXT_IP=$(echo $THIS_IP | awk -F. '{print $1 "." $2 "." $3 "." $4 + 1}')
if [ $THIS_IP == $NEXT_IP ]; then
    echo I\'m the target, listening
else
    echo Routing $TARGET_IP to $NEXT_IP
    ip route add $TARGET_IP/32 via $NEXT_IP
fi
ping 127.0.0.1 -q
```

The last `ping` keeps the container running, or it will exit. The full
Dockerfile is available at
[https://github.com/xddxdd/dockerfiles/tree/25625c20fd1b47b3057cf59b6b84b8401d1b3e1e/dockerfiles/route-next][4].

Then I need to generate a `docker-compose.yml` for simpler management. An
example is available on the repo above. Or, you can use the `mk-compose.py` tool
to quickly generate a `docker-compose.yml`, but you would still have to change
the network information manually in the file.

Then copy it onto the server, and run `docker-compose up -d` to start the
containers.

Finally, run this command on the Docker host:

```bash
ip route add 172.22.76.102/32 via 172.22.76.98
```

So packets will flow into the first Docker container. Now a Traceroute will show
the packet path:

![Packet Path][5]

## Prepare Essay

Since PTR records are limited to English, I'll need a short English essay. Since
it's almost Aug 17, I chose this one:

> One should uphold his country’s interest with his life, he should not do
> things just to pursue his personal gains and he should not evade
> responsibilities for fear of personal loss.

The path I created has 5 hops, so I split the essay to 5 sentences, and removed
punctuations PTR records aren't allowed to have:

- one should uphold his country s interest with his life
- he should not do things
- just to pursue his personal gains
- and he should not evade responsibilities
- for fear of personal loss

The replace spaces with periods:

- one.should.uphold.his.country.s.interest.with.his.life
- he.should.not.do.things
- just.to.pursue.his.personal.gains
- and.he.should.not.evade.responsibilities
- for.fear.of.personal.loss

The fill it to PTR records for the IPs on the path:

![PTR Record Settings][6]

Save and wait for DNS updates to propagate:

![Traceroute Story Example][3]

You will see your small essay in Traceroute.

[1]: /usr/uploads/2018/08/2301166997.png
[2]: /article/modify-website/dn42-ip-reverse-record.lantian
[3]: /usr/uploads/2018/08/1311499371.png
[4]:
  https://github.com/xddxdd/dockerfiles/tree/25625c20fd1b47b3057cf59b6b84b8401d1b3e1e/dockerfiles/route-next
[5]: /usr/uploads/2018/08/846969415.png
[6]: /usr/uploads/2018/08/921227701.png
