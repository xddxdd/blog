---
title: 'Windows Azure Virtual Machine Trial'
categories: Computers and Clients
tags: [Windows, Azure, Virtual Machine]
date: 2014-05-23 16:40:00
image: /usr/uploads/2014/05/1498285805.png
autoTranslated: true
---


Windows Azure is a virtual machine service provided by Microsoft, similar to AWS. Due to China's regulations prohibiting cloud computing services from sharing data with foreign countries, Azure operates in China through a dedicated company called 21Vianet, with data centers currently in East China and North China.

Currently, Azure doesn't appear to have a time-limited trial. After checking online, it seems there are no time restrictions. The trial server limits each user to a maximum of 3000 CPU hours per month (1500 hours for high-memory servers), meaning a 4-core server can run continuously for a full month without shutdown.

I applied for an activation code long ago and recently received it unexpectedly in my email. It stated that "the activation code will expire if not activated within 7 days," so I proceeded with activation.

When creating a virtual machine, options include Server 2012 R2, Server 2012, Server 2008 R2, Ubuntu, CentOS, etc. I chose Server 2012 R2 with 4 cores and 7GB RAM in the East China data center.

This is the management panel:

![/usr/uploads/2014/05/1498285805.png](/usr/uploads/2014/05/1498285805.png)

Clicking the link below downloads an RDP file – double-click it to connect to your server.

After connecting, server-related information appears in the top-right corner of the desktop:

![/usr/uploads/2014/05/1140965806.png](/usr/uploads/2014/05/1140965806.png)

The server operates very quickly with virtually no noticeable network latency. The 4-core, 7GB RAM configuration can handle nearly any program:

![/usr/uploads/2014/05/222836011.png](/usr/uploads/2014/05/222836011.png)

External ping tests are impossible since the server blocks them, and the lack of a dedicated IP prevents website hosting. However, overall, this is an exceptionally powerful configuration for a free virtual machine.
```
