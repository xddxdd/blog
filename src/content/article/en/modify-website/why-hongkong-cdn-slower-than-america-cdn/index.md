---
title: 'Why Hong Kong CDN Can Be Slower Than US CDN'
categories: Website and Servers
tags: [CDN, Tech Experiments, Website]
date: 2013-02-16 22:21:09
autoTranslated: true
---

CDN, or Content Delivery Network, creates distributed copies of your website across multiple locations. These copies store static resources like JS, CSS, and images, accelerating access for visitors. Sometimes CDNs can also optimize network paths between regions.

For example, if your website is hosted in **Location B**, and you (and your visitors) are in **Location A**, the connection between A and B might pass through **Location C** with poor network quality. When you ping your site, packet loss occurs at C, forcing clients to wait and retransmit data, slowing down the site. By using a CDN in **Location D**, traffic bypasses the problematic C, reducing packet loss and improving speed.

```bash
A
autoTranslated: true
---
->C(X)-->B  # This path suffers packet loss
|            |
+---->D------+  # Bypassing C significantly speeds up access
```

However, CDNs can backfire. For instance, if traffic originally took path D but is rerouted through C after enabling CDN, speeds drop. An extreme case: if your site is on the US East Coast and you're on the West Coast, a CDN might route traffic through Asia and Europe first. Thus, CDN selection should consider both the CDN's location *and* its routing paths to your origin server and users.

Previously, my blog used Safeguard CDN (安全宝) with a ChinaCache node in Los Angeles. Being a Chinese-operated data center, it performed exceptionally well (for a US server), reducing ping from 250ms to 150ms. Later, I switched DNS to DNSPod and reconfigured CNAME records, which assigned me a Hong Kong New World Telecom node. While geographically closer, the site felt slower. Chrome's loading spinner now spun half a circle (or even three!) instead of just 1/8th. Clearly, the CDN was backfiring.

To verify, I used **traceroute** to map the network path. Without a Hong Kong VPS, I turned to WebKaka for cross-region testing. WebKaka provides speed tests, ping, and traceroute tools. I temporarily routed international traffic to Incapsula CDN (with US West/East Coast and Israel nodes) while keeping Safeguard CDN for China. Then, I ran traceroutes from WebKaka's Hong Kong New World and US Los Angeles BN nodes to my origin IP:

```bash
Route Start: Hong Kong New World | Route End: USA | Max Hops: 30
Node    IP Address    DNS Name    Location    Latency
1    59.188.196.193        Hong Kong New World Telecom    0 ms
2    58.64.160.241        Hong Kong New World Telecom DC    4 ms
3    113.10.230.177        Hong Kong New World Telecom    0 ms
4    113.10.229.97    irb8.10g-tc1.wpc.nwtgigalink.com    Hong Kong    5 ms
5    113.10.229.178    ae2.10g-pp1.wpc.nwtgigalink.com    Hong Kong    1 ms
6    195.22.223.145    ge0-5-2-2.hongkong1.hok.seabone.net    Italy    3 ms
7    195.22.223.163    xe-11-0-1.singapore2.sin.seabone.net    Italy    32 ms
8    195.22.218.232    te0-14-1-0.palermo17.pal.seabone.net    Italy    435 ms
... (additional hops through Europe) ...
17    31.170.166.141    31-170-166-141.main-hosting.com    USA    478 ms
**Total: 4789 ms | Max: 513 ms | Avg: 266 ms**

Route Start: US Los Angeles BN | Route End: USA | Max Hops: 30
1    184.82.255.233    184-82-255-233.static.hostnoc.net    BurstNET, USA    2 ms
2    64.120.246.77    ec0-60.gwy02.laca02.hostnoc.net    BurstNET, USA    0 ms
... (direct US routing) ...
17    31.170.166.141    31-170-166-141.main-hosting.com    USA    62 ms
**Total: 455 ms | Max: 138 ms | Avg: 26 ms**
```

The results showed Hong Kong traffic detouring through Europe, while US nodes took direct paths. Unsurprisingly, US-based routing was faster.

To resolve this, I manually routed international traffic to Incapsula's default nodes and forced Chinese users to a US West Coast node. The original speed returned. Hooray! 🎉
