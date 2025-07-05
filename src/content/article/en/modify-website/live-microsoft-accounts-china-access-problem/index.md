---
title: 'Microsoft Accounts Experience Access Anomalies in Mainland China'
categories: Website and Servers
tags: [Microsoft]
date: 2014-10-04 22:41:00
image: /usr/uploads/46671412433584.png
autoTranslated: true
---


On the evening of October 4, 2014, attempts to access Microsoft account login pages from China triggered invalid SSL certificate warnings, as shown:

![/usr/uploads/46671412433584.png](/usr/uploads/46671412433584.png)

```bash
颁发对象
公用名 (CN)    hotmai.com
组织 (O)    hotmail.com
组织单位 (OU)     <未包含在证书中>
序列号    29
颁发者

颁发者
公用名 (CN)    hotmai.com
组织 (O)    hotmail.com
组织单位 (OU)     <未包含在证书中>
有效期

颁发日期    14-9-23
截止日期    15-9-23
指纹

SHA-256 指纹    7B AC CB 75 4D A5 BA 45 1F C5 FA E5 10 6B CE 22
34 E3 14 0C 8A 3B 05 9B 36 B0 8C 47 C7 C1 97 2D
SHA-1 指纹    30 F3 B3 AD C6 E5 70 BD A6 06 B9 F9 6D E2 41 90
CE 26 2C 67
```

Copied from Chrome. The "issuer common name being only a domain" and "hotmai.com" (missing 'l') indicate this was an SSL man-in-the-middle attack.

The fake certificate content:

```bash
-----BEGIN CERTIFICATE-----
MIICYjCCAcugAwIBAgIBKTANBgkqhkiG9w0BAQQFADA4MQswCQYDVQQGEwJjbjEU
MBIGA1UEChMLaG90bWFpbC5jb20xEzARBgNVBAMTCmhvdG1haS5jb20wHhcNMTQw
OTIzMTEzNDAzWhcNMTUwOTIzMTEzNDAzWjA4MQswCQYDVQQGEwJjbjEUMBIGA1UE
ChMLaG90bWFpbC5jb20xEzARBgNVBAMTCmhvdG1haS5jb20wgZ8wDQYJKoZIhvcN
AQEBBQADgY0AMIGJAoGBAJ0A+/fnNmwleMfxTRBS5iYkwq4jdOzdXMdWxJjYCJSL
izdyB2lfR1UFK0Q6230HkIYqUVzaUC4hsS9nvin3jQB37W5UESXAextNCIgpSQ9N
Baf4t5q5ud3AkbR11rdb559e/wMLzGsyD4CML3HlJwgcf4ZHAtrKIVbbBRcGt86J
AgMBAAGjfDB6MAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgQwMB0GA1UdDgQW
BBQ0j1vwhAYDwOUlEFdLxqlBjF0t6TARBglghkgBhvhCAQEEBAMCBeAwKAYJYIZI
AYb4QgENBBsWGWV4YW1wbGUgY29tbWVudCBleHRlbnNpb24wDQYJKoZIhvcNAQEE
BQADgYEANQTg2dSEXNPVBJYPSSEe6jLuFbAF7mULievq90yRzPDvXpzdBDxnevbg
A2bkXJJUJ3CimwvSg2WVgu4VK+fJMFiXBZthHjkcjGbPydtO7f+WeQKaEUK7EZe1
rNGBhbyz/1RpgXRwAw+oBp/Ii9ZoNsde1qD4hkP3OOlTTQNP2kg=
-----END CERTIFICATE-----
```

Simultaneously, reports indicated login.windows.net experienced similar issues. DNS queries confirmed no DNS poisoning occurred.

![/usr/uploads/26971412433584.png](/usr/uploads/26971412433584.png)

Left: Google DNS (TCP query), Right: 114DNS (UDP query)

![/usr/uploads/96551412433589.png](/usr/uploads/96551412433589.png)

Testing via SSH tunnel through Windows Azure China showed no issues. Left: Local query result; Right: Azure China query result, reconfirming DNS integrity.

![/usr/uploads/59401412433590.png](/usr/uploads/59401412433590.png)

tcping tests ([https://github.com/jlyo/tcping](https://github.com/jlyo/tcping)) to port 443 revealed clear hijacking. Normal ping latency to login.live.com is ~200ms, making sub-10ms responses impossible.

Around 10:30 PM, the issue resolved and SSL connections to login.live.com normalized.
```
