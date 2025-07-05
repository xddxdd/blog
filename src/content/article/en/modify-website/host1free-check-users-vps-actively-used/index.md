---
title: 'Host1Free Checks If All Users Are Using Their VPS'
categories: Website and Servers
tags: [VPS, Host1Free]
date: 2013-02-06 19:48:05
autoTranslated: true
---


Host1Free's free VPS campaign has been running for quite some time. They've deployed over 30 servers, allocating a total of 30,000 VPS instances (severe overselling... but it's free, so we have to bear with it). This attracted a massive number of user registrations, and most importantly, the official service doesn't discriminate against users from China. However, Chinese users have a characteristic: after getting the VPS, they play around with it until they get bored, then abandon it. Or if they obtain other VPS services (like EC2 or VPS.me, which was available months ago), they stop using it entirely. But Host1Free is quite diligent overall – whenever a server goes down, they restart all VPS instances. Consequently, those unused VPSes, each with 128MB RAM + 640MB Swap, waste resources.

So Host1Free devised an unusual method to check user activity: shutdown! Last Thursday night, all VPSes were powered off. Simultaneously, Host1Free emailed all users, urging them to start their VPS via SolusVM immediately, warning that inactive instances would be terminated within days.

When I got home last week and tried to tinker with my VPS, I couldn't connect. Checking SolusVM, I found it was shut down, so I started it up (assuming Host1Free was glitching) and played with it briefly.

Today, I happened to check Thunderbird and found Host1Free's email:

    Dear Host1Free Users,

    We have recently noticed that majority of the ONLINE free VPS servers are not being used and are simply kept online consuming resources.
    A week ago we have issued a shutdown on all of free VPS servers and we are currently monitoring the system to see how many of the servers are being actively used.

    We would like to inform you that all of the servers that will not be turned back ONLINE after the initial shutdown will be TERMINATED next week.

    Please take your time and turn ON your free VPS if you intend to use it, otherwise you will lose all of the data present on your server.

    If you found this message in your spam folder - mark it as not spam for future service alerts.

    Keep in mind - Host1Free does not provide any backups for your free services. You should do it by yourself.

    Regards,
    Host1Free

The critical detail? This email was in my spam folder! Thankfully, my VPS was already running and in active use (tinkering). Then I remembered imbushuo – he also has a Host1Free VPS but switched to EC2 later. I decided to check his status.

His VPS is linked to [http://preview.imbushuo.net](http://preview.imbushuo.net). When I opened the page, it showed CloudFlare's AlwaysOnline screen. I immediately notified him via Weibo to start his VPS.

I also want to remind everyone (though my blog has few readers) to start your VPS immediately (unless you've abandoned it) to avoid losing your data.
```
