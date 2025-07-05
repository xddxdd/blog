---
title: 'Resolving gogoCLIENT DNS Issues'
categories: Computers and Clients
tags: [gogoCLIENT, IPv6, Windows]
date: 2014-06-01 23:17:00
image: /usr/uploads/87001401635846.png
autoTranslated: true
---


Google services have been unstable recently, so I decided to use an IPv6 tunnel to connect to Google for better access speeds.

Following the article I wrote last October,  
"[Installation, Usage, and Bug Fixes for gogoCLIENT on Windows 8.1](/en/article/modify-computer/windows-8-1-gogoclient-install-repair-bug.lantian)",  
I set up the tunnel on my computer. But when I opened the command prompt and tried to ping ipv6.google.com, the system unexpectedly reported "Ping request could not find host ipv6.google.com".

This meant I was still connecting to Google services via IPv4, which didn't achieve the desired effect. Normally, I would search on Google for a solution, but the problem was that the connection to Google was intermittent...

After a long time, I finally found a solution.

The reason is that Microsoft, in designing the operating system, does not query DNS over IPv6 tunnels by default. The solution is as follows:

1. Start → Run (or Win+R), type `regedit` and press Enter.

<img src="/usr/uploads/87001401635846.png" style="float:none;" title="QQ截图20140601231205.png"/>

2. In the left pane, navigate to `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\Dnscache\Parameters`.

<img src="/usr/uploads/57211401635846.png" title="QQ截图20140601231245.png" style="white-space: normal; float: none;"/><br/>

3. Right-click in the right pane, select **New → DWORD (32-bit) Value**, and name it `AddrConfigControl`.

After performing these steps, you can resolve IPv6 addresses normally without restarting the computer.

Thanks to  
[http://blog.ihipop.info/2012/01/2953.html](http://blog.ihipop.info/2012/01/2953.html)  
and  
[http://ipv6-or-no-ipv6.blogspot.sg/2009/02/teredo-ipv6-on-vista-no-aaaa-resolving.html](http://ipv6-or-no-ipv6.blogspot.sg/2009/02/teredo-ipv6-on-vista-no-aaaa-resolving.html).
```
