---
title: 'Installation, Usage, and Bug Fixes for gogoCLIENT on Windows 8.1'
categories: Computers and Clients
tags: [IPv6, gogoCLIENT]
date: 2013-10-02 20:28:15
image: /usr/uploads/2013/10/3582034854.png
autoTranslated: true
---


Half a year ago, when I was still using Ubuntu, I [achieved interoperability between IPv4 and IPv6 using an XP virtual machine + gogoCLIENT](/en/article/modify-computer/ipv4-ipv6-porting.lantian). Today, when I tried to install gogoCLIENT (hereinafter referred to as GC) on Windows 8.1, I encountered a bizarre bug.

Download link:  
[http://www.gogo6.com/profile/gogoCLIENT](http://www.gogo6.com/profile/gogoCLIENT) (account registration required).

When I launched the installer, GC immediately gave me a harsh welcome:

![/usr/uploads/2013/10/3582034854.png](/usr/uploads/2013/10/3582034854.png)

The solution was straightforward: Right-click the installer, change the compatibility mode to Vista, and the main program will run without issues.

![/usr/uploads/2013/10/3762193501.png](/usr/uploads/2013/10/3762193501.png)

After installation, I launched the main program, entered the previously used `hg.tfn.net.tw`, and connected. After 10 seconds, a notification popped up indicating a successful connection. But when I checked the network connections, IPv6 showed "No network access"! Viewing the details revealed:

![/usr/uploads/2013/10/3344136822.png](/usr/uploads/2013/10/3344136822.png)

All I could think was: Where is the default gateway? (The DNS was also manually configured by me.)

A Baidu search yielded no results. Switching to Google and searching in English for "windows gogo6 default gateway" revealed it was indeed a bug!

**Fix method:**  

1. Open Notepad via the Start Menu (or Start Screen) with **Administrator privileges**.  
2. Open `C:\Program Files\gogo6\gogoCLIENT\template\windows.cmd` in Notepad and replace **all occurrences** of:  

```bash
netsh int ipv6 add route ::/0 "%TSP_TUNNEL_INTERFACE%" publish=yes %NETSH_PERS% > NUL
```  

with:  

```bash
netsh int ipv6 add route ::/0 "%TSP_TUNNEL_INTERFACE%" nexthop=%TSP_SERVER_ADDRESS_IPV6%  publish=yes %NETSH_PERS% > NUL
```  

Save the file.  
3. Open GC and reconnect to the server.  

This successfully sets the default gateway, enabling IPv6 internet access.
```
