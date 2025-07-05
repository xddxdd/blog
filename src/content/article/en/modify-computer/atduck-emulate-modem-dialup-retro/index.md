---
title: (Nostalgia) ATduck Virtual Modem Dial-up Internet
categories: Computers and Clients
tags: [Dial-up Internet, PPP]
date: 2019-12-12 21:10:04
autoTranslated: true
---


- Is this really the year 2019?
- Yes.

For nostalgic purposes, I wanted to try dial-up internet on legacy operating systems like Windows 2000. Of course, in 2019, most people no longer use telephone line modems, and many might not even know they ever existed. Modern computers no longer have telephone line interfaces, and ISPs no longer provide dial-up services.

[This article by Doge Microsystems](https://dogemicrosystems.ca/wiki/Dial_up_server) describes a method for self-hosting a dial-up ISP. The author purchased a hardware telephone modem, used Asterisk to build a SIP-based VoIP network, and then connected the modem to the network using an Analog Telephone Adapter (ATA). The author also used mgetty on Linux to operate the modem and combined it with pppd to provide a PPP dial-up service.

The main issues with this approach are: the entire set of equipment is too expensive and takes up space. The author used a physical Windows 98 host for dialing, unlike my virtual machine setup. If I adopted a similar solution, I'd need various adapters and hubs to connect all devices to the host, plus passthrough configuration in the virtualization software.

I prefer software that emulates modem serial port commands. Modern virtualization software (e.g., VirtualBox, QEMU) can forward serial ports to TCP ports or named pipes in Linux, and the emulation software only needs to support one of these. I chose [Nandhp's ATduck](https://github.com/nandhp/atduck).

Unlike [《Raspberry Pi 3B Tinkering Notes: Serial Port Dial-up Internet》](/en/article/modify-computer/raspberry-pi-3b-ppp-dial-ethernet.lantian/), which uses "raw PPP protocol" without any modem component, this article simulates a complete Hayes-compatible modem.

## Installing ATduck

ATduck itself is simple to install, but it depends on Perl's IO-Pty module and Slirp software. Slirp can emulate a SLIP or PPP protocol server on a TTY, while ATduck only implements the modem functionality, leaving the networking part to Slirp.

However, for obvious reasons, Slirp is rarely used today. Arch Linux's official repositories don't include it, and it's not even in the AUR. According to [Slirp's Wikipedia page](https://en.wikipedia.org/wiki/Slirp), part of its maintenance is handled by Debian maintainers.

Therefore, I created a Docker image for ATduck based on Debian Buster. The image exposes TCP port 5555, which can be pointed to by virtual serial ports in VirtualBox, etc. The Dockerfile for the image can be [viewed here](https://github.com/xddxdd/dockerfiles/blob/master/dockerfiles/atduck/template.Dockerfile).

Start it directly with docker-compose:

```yaml
version: '2.1'
services:
  atduck:
    image: xddxdd/atduck
    container_name: atduck
    restart: always
    ports:
      - '127.0.0.1:5555:5555'
```

Then configure VirtualBox as shown:

![VirtualBox Virtual Serial Port Configuration](/usr/uploads/2019/12/atduck-virtualbox-config.png)

## Configuring Windows 2000

After Windows 2000 starts, it will automatically detect an "Unknown Modem". We need to install a driver compatible with the Hayes modem protocol via Device Manager.

In the driver installation interface, choose manual driver selection (don't auto-detect), then select the "Hayes Compatible 9600" driver from Hayes manufacturer, as shown:

![Windows 2000 Driver Selection](/usr/uploads/2019/12/atduck-win2000-driver.png)

After driver installation completes, create a dial-up network connection. Set the dial number to 5555, select PPP protocol, and enter any username/password. ATduck will recognize this number and automatically start Slirp to simulate the PPP handshake.

![Windows 2000 Dial-up Connection Configuration](/usr/uploads/2019/12/atduck-dialup-config.png)

Double-click to dial, and the process completes:

![Windows 2000 Successful Dial-up](/usr/uploads/2019/12/atduck-win2000-success.png)

## Minor Issues

ATduck has a small bug. If you disconnect the dial-up connection, the second dial attempt may fail. It seems ATduck doesn't correctly recognize the hang-up command.
```
