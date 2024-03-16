---
title: 去除 OpenVPN 的 Stable-privacy IPv6 地址
categories: 随手记
tags: [OpenVPN, DN42]
date: 2020-03-21 12:28:40
---

在我的 VPS 上，OpenVPN 创建的 TAP 网络界面/虚拟网卡会带有一个随机生成的 IPv6 地址，scope 为 `stable-privacy`。

这个地址本身是随机生成、用于防止根据 IPv6 地址追踪用户的，但在 DN42 组网时，BGP 握手可能会从这个地址发出（而非设置的 Link-local 地址），然后因为来源地址不符而握手失败。

解决方法是对这些 TAP 网络界面通过 sysctl 设置，关闭可能会自动产生地址的几项。可以设置 OpenVPN 让它在创建网络界面时自动运行 sysctl：

```bash
# 在 OpenVPN 的 conf 文件里加上
script-security 2
up "/bin/sh -c '/sbin/sysctl -w net.ipv6.conf.$dev.autoconf=0 && /sbin/sysctl -w net.ipv6.conf.$dev.accept_ra=0 && /sbin/sysctl -w net.ipv6.conf.$dev.addr_gen_mode=1'"
```

根据你的 Linux 发行版不同，可能需要调整 `/bin/sh` 和 `/sbin/sysctl` 的路径。
