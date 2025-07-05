---
title: 'GetIPIntel Anti-Fraud Service'
categories: Website and Servers
tags: [GetIPIntel, Anti-Fraud]
date: 2016-10-01 20:50:00
autoTranslated: true
---


You never know whether the person chatting with you online is a human or a dog. The anonymity of the internet greatly facilitates online fraud. A few years ago, several webmasters in a student webmaster alliance had their email addresses leaked. Troublemakers then used Go^_^Agent to impersonate them, using their common usernames and email addresses to harass other bloggers in the alliance, causing widespread chaos.

The widely used Akismet clearly failed to help, and blocking IPs afterward proved ineffective (the troublemaker would hit-and-run). Popular anti-fraud services at the time, like MaxMind, required high fees that ordinary webmasters couldn't afford.

But now, times have changed! [GetIPIntel](http://getipintel.net/) is a project by an American graduate student specializing in machine learning and cybersecurity. It uses machine learning technology to comprehensively analyze various data points of an IP address, determining whether visitors from that IP are using proxies like VPNs or TOR.

This service is completely free (though donations are accepted) and doesn't even require manual registration. Simply include your email address when calling their API and reply to any verification email they might send.

The service offers 4 modes:

1. Checks only if an IP belongs to a known VPN, TOR, or other proxy server. This brute-force method is the fastest, with the official claiming response times under 60ms (excluding network latency). In my tests, all my VPS IPs were directly blocked, suggesting they blacklist entire data center IP ranges.

![/usr/uploads/2016/10/577727895.png](/usr/uploads/2016/10/577727895.png)

(The IP in the image belongs to my AlphaRacks Los Angeles VPS)

2. Enables dynamic checks. From my understanding, this scans for open ports commonly used by VPNs and proxy servers. Official response time: under 130ms.

3. Adds more checks, including determining if an IP is a botnet zombie (hacker-controlled computer). Official response time is also under 130ms, but with higher false-positive rates. They recommend re-checking after 5 seconds.

4. Full inspection with forced completion wait. Response times can reach 5s, making it unsuitable for frontend use.

Thus, Mode 3 essentially returns Mode 2 results first, then performs a Mode 4 check in the background.

How to use it? Based on the mode:

Mode 1 (Blacklist only):
```bash
http://check.getipintel.net/check.php?ip=IP_TO_CHECK&contact=YOUR_EMAIL&flags=m
```

Mode 2 (Basic dynamic checks):
```bash
http://check.getipintel.net/check.php?ip=IP_TO_CHECK&contact=YOUR_EMAIL&flags=b
```

Mode 3 (Advanced dynamic checks):
```bash
http://check.getipintel.net/check.php?ip=IP_TO_CHECK&contact=YOUR_EMAIL
```

Mode 4 (Full inspection):
```bash
http://check.getipintel.net/check.php?ip=IP_TO_CHECK&contact=YOUR_EMAIL&flags=f
```

The response is a number between 0-1 (negative values indicate errors). A value of 1 means the IP is blacklisted, while values between 0-1 indicate the probability of proxy usage.

![/usr/uploads/2016/10/3429481723.png](/usr/uploads/2016/10/3429481723.png)

(The IP is my home address, with last digits redacted)

PHP example for Mode 1 check:
```php
function getIPIntel($ip) {
    return file_get_contents('http://check.getipintel.net/check.php?ip='. $ip .'&contact=YOUR_EMAIL&flags=m') == 1;
}
$isProxy = getIPIntel($_SERVER['REMOTE_ADDR']);
```

If your PHP server is behind a proxy, you may need to replace `REMOTE_ADDR` with `HTTP_X_FORWARDED_FOR`.

GetIPIntel uses CloudFlare, so overseas servers needn't worry about speed (except in Mode 4). I currently use Mode 1 to hide the comment box for proxy users. Later I may develop a Typecho plugin to block their comments entirely.

Important: If your site is blocked in mainland China, do NOT enable this service—mainland visitors will be unable to access it.

Official page: [http://getipintel.net/](http://getipintel.net/)
```
