---
title: Remove OpenVPN's Stable-privacy IPv6 Addresses
categories: 'Random Notes'
tags: [OpenVPN, DN42]
date: 2020-03-21 12:28:40
---

On my VPSes, the TAP network interface created by OpenVPN has a randomly-generated IPv6 address with scope `stable-privacy`.

This address itself is created randomly to prevent tracking users by their IPv6 addresses. But when building a network in DN42, BGP handshakes may originate from this address (rather than your manually assigned link-local address) and fail for mismatching origin/IP.

The solution is to configure the TAP interfaces with sysctl, and disable the automatic address generation options. OpenVPN can be configured to run `sysctl` automatically when creating the interface:

```bash
# Add to OpenVPN's config file
script-security 2
up "/bin/sh -c '/sbin/sysctl -w net.ipv6.conf.$dev.autoconf=0 && /sbin/sysctl -w net.ipv6.conf.$dev.accept_ra=0 && /sbin/sysctl -w net.ipv6.conf.$dev.addr_gen_mode=1'"
```

Depending on your Linux distribution, you may need to adjust the path of `/bin/sh` and `/sbin/sysctl`.
