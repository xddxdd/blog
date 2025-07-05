---
title: 'Configuring Hurricane Electric IPv6 Tunnel on OpenVZ, Enabling the Entire Address Pool and Using it Alongside Native IPv6'
categories: Computers and Clients
tags: [OpenVZ, Hurricane Electric, IPv6, VPS]
date: 2016-08-09 23:19:00
image: /usr/uploads/2016/08/3015453537.png
autoTranslated: true
---


AlphaRacks is a cost-effective hosting provider, offering VPS with 1 CPU, 512MB RAM, and 10GB storage for just $9.9/year. However, this provider is quite stingy with IPv6 addresses, requiring users to justify their need for IPv6. It's said they provide up to 20 addresses? But they may not allocate the full amount. For example, when I explained I needed IPv6 to serve IPv6-only users, the provider replied:

> We've added 1 IPv6 address to your VPS.

A single IPv6 address is insufficient for my needs. Fortunately, Hurricane Electric in the US offers [IPv6 tunneling services](https://tunnelbroker.net/), providing each user with 5 tunnels. Each tunnel includes a /64 address pool, and users can instantly activate a /48 address pool with one click.

Despite this generous service, using it on OpenVZ VPS requires extra effort. OpenVZ kernels are often version 2.6.32, which lacks native tunnel support. The newer 3.10 kernel that supports this feature has just been released, and many providers haven't updated yet.

## Enabling HE Tunnel on OpenVZ

We need a third-party utility that converts Hurricane Electric tunnels into Tun/Tap tunnels (similar to OpenVPN's network adapter in Windows) and configures them on the server. Download and install as follows:

```bash
apt-get install iproute gcc
wget http://tb-tun.googlecode.com/files/tb-tun_r18.tar.gz
tar -xf tb-tun_r18.tar.gz
gcc tb_userspace.c -l pthread -o tb_userspace
mv tb_userspace /usr/bin/tb_userspace
```

Then create `/etc/init.d/ipv6tb` and input the startup script below (adapted from [https://www.cybermilitia.net/2013/07/22/ipv6-tunnel-on-openvz/](https://www.cybermilitia.net/2013/07/22/ipv6-tunnel-on-openvz/)):

(Note: Replace the IP addresses accordingly)

```bash
touch /etc/init.d/ipv6tb
chmod +x /etc/init.d/ipv6tb
nano /etc/init.d/ipv6tb
```

```bash
#!/bin/sh
case "$1" in
  start)
    echo "Starting ipv6tb"
      setsid /usr/bin/tb_userspace tb [HE Tunnel Server IPv4 Address] [Your VPS IPv4 Address] sit > /dev/null 2>&1 &
      sleep 1s
      ifconfig tb up
      ifconfig tb inet6 add [Your HE Tunnel Client IPv6 Address]/128
      ifconfig tb inet6 add [Your Assigned /64 Address Pool]::1/64
      ifconfig tb inet6 add [Your Assigned /48 Address Pool - delete if unavailable]::1/48
      ifconfig tb mtu 1480
      route -A inet6 add ::/0 dev tb
      route -A inet6 del ::/0 dev venet0
    ;;
  stop)
    echo "Stopping ipv6tb"
      ifconfig tb down
      route -A inet6 del ::/0 dev tb
      killall tb_userspace
    ;;
  *)
    echo "Usage: /etc/init.d/ipv6tb {start|stop}"
    exit 1
    ;;
esac
exit 0
```

Then execute:

```bash
/etc/init.d/ipv6tb start
```

The tunnel will activate. However, you'll notice two issues:

1. Although you have an entire /64 (and possibly /48) pool, only addresses ending with ::1 are usable;
2. The VPS's native IPv6 stops working as all traffic routes through the tunnel.

We'll resolve these step by step.

## Enabling the Entire Address Pool

Linux kernel supports an AnyIP feature, allowing you to assign entire address ranges to a network interface without manual configuration.

As an aside, a /64 address pool contains 18,446,744,073,709,551,616 IPs.

Enable it with:

```bash
ip -6 route add local [Your Assigned /64 Address Pool]/64 dev lo
ip -6 route add local [Your Assigned /48 Address Pool - delete if unavailable]/48 dev lo
```

After execution, all IPs in your address pool become usable.

## Using Native IPv6 and Tunnel Simultaneously

When multiple IPv6 connections coexist on a VPS, you'll find only one works at a time. Linux routes response packets through the default interface instead of the originating path.

Fortunately, Linux supports policy-based routing. Configure it as follows:

- Create routing table and stop existing tunnel:
```bash
echo 200 ipv6tb >> /etc/iproute2/rt_tables
/etc/init.d/ipv6tb stop
```

- Replace the contents of `/etc/init.d/ipv6tb` with the following (modified from [http://itkia.com/ipv6-policy-routing-linux-gotchas/](http://itkia.com/ipv6-policy-routing-linux-gotchas/)):
```bash
#! /bin/sh
touch /var/lock/ipv6tb
case "$1" in
    start)
        setsid /usr/bin/tb_userspace tb [HE Tunnel Server IPv4 Address] [Your VPS IPv4 Address] sit > /dev/null 2>&1 &
        sleep 1s
        # bring up the tunnel interface & set mtu
        ifconfig tb up
        ifconfig tb mtu 1480
        # hack: show ip in ifconfig
        ifconfig tb inet6 add [Your HE Tunnel Client IPv6 Address]/128
        ifconfig tb inet6 add [Your Assigned /64 Address Pool]::1/64
        ifconfig tb inet6 add [Your Assigned /48 Address Pool - delete if unavailable]::1/48
        # make use of the whole ipv6 block
        ip -6 route add local [Your VPS Native IPv6 Address]/128 dev lo
        ip -6 route add local [Your HE Tunnel Client IPv6 Address]/128 dev lo
        ip -6 route add local [Your Assigned /64 Address Pool]/64 dev lo
        ip -6 route add local [Your Assigned /48 Address Pool - delete if unavailable]/48 dev lo
        # nullroute native ipv6 to prevent sending via wrong interface
        ip -6 route add unreachable [Your VPS Native IPv6 Address]/128
        # nullroute ipv6 tunnel to prevent sending via wrong interface
        ip -6 route add unreachable [Your HE Tunnel Client IPv6 Address]/128
        ip -6 route add unreachable [Your Assigned /64 Address Pool]/64
        ip -6 route add unreachable [Your Assigned /48 Address Pool - delete if unavailable]/48
        # flush route table & route the interfaces
        ip -6 route flush table ipv6tb
        ip -6 route add 2000::/3 dev venet0 src [Your VPS Native IPv6 Address]
        ip -6 route add 2000::/3 dev tb src [Your HE Tunnel Client IPv6 Address] table ipv6tb
        # flush rule table
        ip -6 rule flush
        # restore routing in ipv6 tunnel address block
        ip -6 rule add priority 200 to [Your HE Tunnel Client IPv6 Address]/128 table main
        ip -6 rule add priority 201 to [Your Assigned /64 Address Pool]/64 table main
        ip -6 rule add priority 202 to [Your Assigned /48 Address Pool - delete if unavailable]/48 table main
        # restore routing in native ipv6 address block
        ip -6 rule add priority 210 to [Your VPS Native IPv6 Address]/128 table main
        # restore routing to reserved ipv6 range
        ip -6 rule add priority 1000 to 2001:db8::/32 table main
        # route packets from tunnel back to the tunnel
        ip -6 rule add priority 30000 from [Your HE Tunnel Client IPv6 Address]/128 to 2000::/3 table ipv6tb
        ip -6 rule add priority 30001 from [Your Assigned /64 Address Pool]/64 to 2000::/3 table ipv6tb
        ip -6 rule add priority 30002 from [Your Assigned /48 Address Pool - delete if unavailable]/48 to 2000::/3 table ipv6tb
        # restore ipv6 main route & flush cache
        ip -6 rule add priority 32766 from all table main
        ip -6 route flush cache
    ;;
    stop)
        ifconfig tb down
        # restore rule table
        ip -6 rule flush
        ip -6 rule add priority 32766 from all table main
        pkill -9 tb_userspace
    ;;
    *)
        echo "Usage: /etc/init.d/ipv6tb {start|stop}"
        exit 1
        ;;
esac
exit 0
```

- Restart the tunnel:
```bash
/etc/init.d/ipv6tb start
```

- (Optional) Auto-start on boot: Edit `/etc/rc.local`, add before `exit 0`:
```bash
/etc/init.d/ipv6tb start
```

After modification, the file should resemble:

![/usr/uploads/2016/08/3015453537.png](/usr/uploads/2016/08/3015453537.png)

The tunnel will now auto-start. This configuration allows peaceful coexistence between IPv6 tunnel and native IPv6. System operations (e.g., software updates) use native IPv6 instead of the tunnel, significantly improving stability and speed.
```
