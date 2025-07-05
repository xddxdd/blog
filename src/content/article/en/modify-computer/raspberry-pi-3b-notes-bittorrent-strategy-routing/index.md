---
title: 'Raspberry Pi 3B Tinkering Notes: BT Download and Policy Routing'
categories: Computers and Clients
tags: [Linux, Raspberry Pi, Policy Routing]
date: 2017-10-21 19:17:00
autoTranslated: true
---


Let's get straight to the point this time. (Actually, I'm not sure how to start.)

## Installing Transmission for PT

As a compact computer that can freely connect to various sensors, the Raspberry Pi offers high playability. Even if you don't want to connect a bunch of sensors to the GPIO (or like me, think additional sensors are temporarily unnecessary), you can leverage its low-power characteristics to run it 24/7 for tasks that don't require heavy CPU computation but take a long time to complete due to other factors—like... background downloading.

My university has an intranet PT (Private Tracker) site. A PT site is a platform for releasing BT seeds, but it adds user management features on top of traditional BT. By restricting client types and enforcing upload ratio requirements, it solves issues like leeching (downloading without uploading, e.g., Xunlei) and rapid seed expiration (due to lack of seeders) in traditional BT.

These requirements mean PT users often need to run downloads/uploads for extended periods—exactly what the Raspberry Pi excels at.

In the [previous article][1], I set up a simple NAS. Building on that, installing a BT client allows me to run PT. This PT site only allows Deluge, Rufus, Transmission, and rTorrent on Linux. I initially tried Deluge, but the site flagged that the latest Deluge 1.3.13 from Raspbian's repo wasn't allowed. They recommended Deluge 1.3.3 from Debian 7's repo, but likely due to Debian 9's systemd base, the old version failed to start after installation.

So I chose Transmission. First, apt-get:

```bash
apt-get install transmission-daemon
```

Then edit `/etc/transmission-daemon/settings.json`:

```json
# Block leecher clients
"blocklist-enabled": true,
"blocklist-url": "http://john.bitsurge.net/public/biglist.p2p.gz",
# Change default download location
"download-dir": "/mnt/usb/Transmission",
# Must disable these for PT sites; no need to change for traditional BT
"dht-enabled": false,
"lpd-enabled": false,
"pex-enabled": false,
# Remote web management
"rpc-enabled": true,
"rpc-authentication-required": true,
"rpc-username": "username",
"rpc-password": "password (will be auto-encrypted after Transmission starts)",
```

Finally, run `service transmission-daemon start`. Access the web interface at [Raspberry Pi IP]:9091 to upload torrents, adjust speed limits, etc.

## Adjustments for Campus Network Environment

As mentioned in the [previous article][2], my university provides one wired network and two Wi-Fi networks with these characteristics:

1. Wired network: 1.5M speed limit, web-based login, accessible by other devices on the LAN
2. Wireless network: 1.5M speed limit, web-based login, inaccessible to other wireless devices (Wi-Fi isolation, still accessible via wired connection)
3. eduroam: No speed limit, WPA2 Enterprise login, inaccessible to other wireless devices (Wi-Fi isolation, still accessible via wired connection)

Since the Raspberry Pi has both wired and wireless NICs, the optimal setup is:  
- Raspberry Pi uses eduroam for PT downloads  
- I manage it via the wired NIC's IP from my computer  

But if you connect both interfaces simultaneously, you'll notice only one NIC has traffic—the other can't even ping. This happens because when the Linux kernel receives a connection request (e.g., TCP SYN), it doesn't "return via the same path." Instead, it uses the routing table to decide which NIC to respond from. This causes responses from the wireless NIC to be sent for requests arriving via the wired NIC, which get dropped due to isolation policies or IP mismatches.

We need policy routing to enforce "return via the incoming path." Policy routing directs packets matching specific conditions (e.g., arriving via a certain NIC) to a dedicated routing table instead of the main one. I used this before in "[Configuring Hurricane Electric IPv6 Tunnel on OpenVZ, Enabling Full Address Pool with Native IPv6][3]." Though that was for IPv6, Linux's IPv4/IPv6 commands are similar—just tweak as needed.

First, check routes with `route`:

```bash
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         10.106.65.1     0.0.0.0         UG    202    0        0 eth0
default         10.107.128.1    0.0.0.0         UG    303    0        0 wlan0
10.106.65.0     0.0.0.0         255.255.255.0   U     400    0        0 eth0
10.107.128.0    0.0.0.0         255.255.240.0   U     303    0        0 wlan0
```

Note the two default routes:  
- eth0 (wired) gateway: 10.106.65.1  
- wlan0 (wireless) gateway: 10.107.128.1  

Then check IPs with `ip addr`:

```bash
[...]
2: eth0: [...]
    inet 10.106.65.213/24 [...]
3: wlan0: [...]
    inet 10.107.134.208/20 [...]
```

Key details:  
- Wired IP: 10.106.65.213/24 → Subnet: 10.106.65.0/24  
- Wireless IP: 10.107.134.208/20 → Subnet: 10.107.128.0/20  

Edit `/etc/iproute2/rt_tables` to add dedicated routing tables:

```bash
[...]
# Add these at the end:
100    university_eth
101    university_wlan
```

Set up policy routing:

```bash
# Route university_eth traffic via wired gateway
ip route add default via 10.106.65.1 dev eth0 table university_eth
# Route university_wlan traffic via wireless gateway
ip route add default via 10.107.128.1 dev wlan0 table university_wlan
# Route packets FROM wired subnet to university_eth table
ip rule add from 10.106.65.0/24 table university_eth
# Route packets FROM wireless subnet to university_wlan table
ip rule add from 10.107.128.0/20 table university_wlan
```

Add these four commands to `/etc/rc.local` for auto-start. If they fail at boot, add `sleep 5` before them—network services may not be ready.

Finally, Linux prioritizes the wired NIC due to lower metric. To prioritize wireless instead, edit `/etc/dhcpcd.conf`:

```bash
interface eth0    # For eth0 (wired)
metric 400        # Set metric to 400 (wireless default is 303; any number >303 works)
```

Reboot. Now all traffic prefers the wireless NIC.

## Final Result

All downloads on the Pi use the unlimited eduroam Wi-Fi. I manage SSH, Transmission, and file sharing via the slower wired IP (1.5M is sufficient for 1080p video streaming).

[1]: /en/article/modify-computer/raspberry-pi-3b-notes.lantian
[2]: /en/article/modify-computer/raspberry-pi-3b-notes.lantian#quicklink8
[3]: /en/article/modify-computer/openvz-he-ipv6-use-whole-block-along-native-ipv6.lantian
```
