---
title: 'pfSense 配置 IPv6 多 WAN 自动切换'
categories: 网站与服务端
tags: [pfSense, Tunnelbroker, IPv6]
date: 2018-11-17 03:29:00
image: /usr/uploads/2018/11/725695690.png
---

就在几天前，HE.NET Tunnelbroker 的法国服务器出了一次故障。因为我在配置 Kimsufi
服务器时，将 Kimsufi 原生的 IPv6 分给了 ESXi 单独使用（见[这篇文
章][1]），pfSense 只具有原生 IPv4 并通过 Tunnelbroker 获取 IPv6 地址，所以这次服
务器上的所有虚拟机都失去了 IPv6 连接。更严重的是，由于我在服务器上也参照[这篇文
章][2]搭了个 NAT64 服务，为了优先使用 IPv6，我设置了 pfSense 的 DNS 解析优先使用
Google DNS 的 NAT64 解析服务器，就是 2001:4860:4860::64 和 2001:4860:4860::6464
这两个，只在这两个 DNS 全部失效后才去使用 IPv4 解析。由于 IPv6 不通了，而
pfSense DNS 服务器的超时又很长，内部的 DNS 解析几乎全部失败。

为了防止 IPv6 出问题后再次引起连锁反应，我准备使用多个 Tunnelbroker 互相作为备
份，并配置 pfSense 的 Multi-WAN Failover 功能，在一个 Tunnelbroker 断线后立即切
换到其它 Tunnelbroker，保证 IPv6 对外连接不中断。

## 设置额外的 Tunnelbroker

目前还在运行的 Tunnelbroker 列表可以直接查看 Wikipedia 页面，[List of IPv6
tunnel brokers][3]。其中我申请成功的是 HE.NET，IP4Market 和 NetAssist，其中
NetAssist 的服务器之前工作正常，但现在常年不通。

IP4Market 是一个俄罗斯网站，网页也是俄文的，但是通过 Google 翻译可以毫无障碍地完
成申请。

注册完成后就可以获得服务器和客户端的 IPv4、IPv6 地址等信息：（下图 IP 地址被截
断）

![IP4Market 界面信息][4]

接下来就用这些信息在 pfSense 中创建隧道。在 Interface / Assignments / GIFs 中添
加一条 GIF 隧道：（IP 依然被截断）

![pfSense 配置信息][5]

然后给这条隧道创建一个 Interface。在 Interface / Assignments 界面中，添加刚刚创
建的这条隧道，并进入这个 Interface 的设置界面，启用它：

![pfSense 启用 Interface][6]

进入 Status / Gateways 界面确认隧道对端可以 ping 通就完成了。

## 设置多 WAN 自动切换

接下来就要设置在一个隧道断线时自动切换的功能了。在 pfSense 的 System / Routing
界面中可以看到 Gateway Groups 选项，它可以将多个网关（包括隧道的对端）作为一个整
体来使用，并实现负载均衡、断线切换等功能。

在 System / Routing / Gateway Groups 中添加一个网关组，并将几个 Tunnel 的网关按
优先级从高到低设置成 Tier 1，Tier 2 等等，并将 Trigger Level（切换条件）设置成
Member Down（成员离线）：

![pfSense Gateway Group 设置][7]

但是此时如果你将默认网关设置成这个 Gateway Group，你会发现当你的主要网关掉线后，
尽管 Gateway Group 已经作出切换，网内的其它机器还是无法访问 IPv6。这是因为 LAN
中每台机器的 IPv6 地址一般而言是从主要网关（我的是 HE.NET）的地址池分配的，而其
它的 Tunnelbroker（例如 IP4Market）不认识这个 IPv6 地址，自然不会让数据包通过。
即使数据包通过了，远程服务器返回数据时也会发回到主要网关（我的是 HE.NET）的地址
上，但此时这个网关已经离线，也无法将数据转发回来。

解决方法是用 pfSense 的 NPt（Network Prefix Translation，网络前缀转换）功能。这
个功能可以将一个 IPv6 子网的地址 1：1 映射到另一个子网，在此处就是将 HE.NET 的地
址映射到 IP4Market 的地址，让它认出这些地址并且放行。

进入 Firewall / NAT / NPt，添加一个条目，将 LAN 上的地址映射到 IP4Market 提供的
地址池：

![pfSense NPt 配置][8]

之后 LAN 上的机器也就可以通过 IP4Market 的 Tunnelbroker 上网了。

[1]: /article/modify-website/kimsufi-dedi-esxi-software-router.lantian
[2]: /article/modify-computer/nat64-server-build.lantian
[3]: https://en.wikipedia.org/wiki/List_of_IPv6_tunnel_brokers
[4]: /usr/uploads/2018/11/725695690.png
[5]: /usr/uploads/2018/11/2702646429.png
[6]: /usr/uploads/2018/11/2363686930.png
[7]: /usr/uploads/2018/11/4028108843.png
[8]: /usr/uploads/2018/11/2438253327.png
