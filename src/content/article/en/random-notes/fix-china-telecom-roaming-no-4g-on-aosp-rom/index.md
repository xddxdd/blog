---
title: Fix China Telecom 4G Roaming on AOSP ROM by Changing APN
categories: 'Random Notes'
tags: [AOSP, 'China Telecom', Roaming, 4G, LTE]
date: 2023-04-17 19:16:39
---

Since the support life of my OnePlus 8T's official ROM is about to end, I
flashed Nameless OS, a Lineage OS based third party Android ROM, onto my phone.
But after flashing the ROM, I found that my China Telecom SIM card cannot roam
on the 4G network of local mobile service providers, only 2G or 3G work. Since
the local providers are recently shutting down 2G and 3G networks, the roaming
cellular signal strength is really bad. I experience a high latency on receiving
or sending messages, nor can I use VoLTE to make calls normally.

I tested other Lineage OS based third party ROMS, and experienced the same
problem.

After numerous attempts, I found that the problem **seems to be** with the
phone's APN settings. I use the term **seems to be** because while changing APN
settings fixed my problem, I have no idea why this works, nor am I sure this is
the correct way to fix it.

Here are my steps to resolve the problem:

1. Enter phone settings - SIMs - China Telecom - Access Point Name settings.
2. Select "中国电信NET设置" (`ctnet`, China Telecom NET Settings) to manage
   detailed options.
3. Change `APN Type` to: `default,supl,dun,ims`
    - The original value is `default,supl,dun`
4. Click the three-dot menu on top right, and select Save.
5. Select the radio button on the right of `ctnet`.
6. Turn off the phone, wait a few minutes, and then turn it on again.
