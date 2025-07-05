---
title: 'OpenSSL "Heartbleed" Vulnerability Causes Huge Impact'
categories: Website and Servers
tags: [OpenSSL]
date: 2014-04-11 22:16:00
autoTranslated: true
---


On April 8, 2014, Microsoft officially discontinued support services for Windows XP.

On April 8, 2014, the renowned open-source SSL support software OpenSSL exposed the "Heartbleed" vulnerability. Against this vulnerability, nearly all current IDS systems and firewalls are defenseless.

SSL, fully known as Secure Socket Layer, is a widely used encryption protocol on the internet that prevents data from being eavesdropped during transmission between users and servers. OpenSSL is an open-source SSL support software. By invoking it, any software can easily implement SSL encrypted connections without needing to research SSL from scratch. The HTTPS protocol utilizes SSL to protect user data, and major websites redirect users to HTTPS pages during login to safeguard user information.

However, the "Heartbleed" vulnerability exposed in OpenSSL has caused massive repercussions for all such software. What does this vulnerability lead to? Random memory reads, 64KB at a time.

64KB per read—and this attack can be repeated continuously without detection by firewalls. Thus, hackers can repeatedly traverse the entire server's memory to extract critical data such as user passwords, cookies, and website source code. Using this information, hackers can steal accounts and leverage the source code to launch further attacks on servers.

The vulnerability affects OpenSSL versions 1.01 to 1.01f. The latest version 1.01g has patched this vulnerability, and OpenSSL versions prior to 1.01 are unaffected.

This vulnerability impacts:

1. (Almost) all SSL-enabled web servers on Linux, BSD, Mac, and similar platforms, including Apache, Nginx, Lighttpd, Tengine (essentially Nginx), etc. Affected websites include critical platforms like Alipay, Taobao, and Tencent.

2. All open-source web servers with SSL enabled running on Windows platforms, such as Apache and Nginx.

3. (Almost) all SSL-based email services (POP3, IMAP, SMTP), including Gmail, QQ Mail, etc.

4. All OpenVPN services and other SSL-based VPN services.

As a user, there is essentially no direct defense. If you've logged into these services recently, change your password immediately (most providers have patched the vulnerability).

As a website administrator:  
- If using shared hosting, request your provider to upgrade the system.  
- If managing your own VPS, simply perform a system upgrade.
```
