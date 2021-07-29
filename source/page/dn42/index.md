---
title: 'DN42'
date: 1970-01-01 00:00:00
---

如果你需要 DN42 配置上的帮助，可以参见《[DN42 实验网络介绍（2020 版）](/article/modify-website/dn42-experimental-network-2020.lantian)》，以及浏览本站之前有关 DN42 的文章。

一些可以帮助你调试的链接
--------------------

这些链接可以帮助你在 Peering 过程中调试常见的问题。

- [我的 Looking Glass](https://lg.lantian.pub/)
  - 可以查看我这边各个节点的 BIRD 路由软件状态，包括 BGP 链接是否建立、是否收到路由等等。
  - 可以对公网和 DN42 内的地址进行 Traceroute。
- 路由 ROA 过滤状态
  - 我的网络只允许接收在 DN42 中注册过的路由，收到的无效路由或未知路由会被显示在这里。
  - 无效路由：这个 IP 段在 DN42 中注册过了，但是实际广播的路由来源与注册信息不符。
    - 例如，我注册了 `172.22.76.184/29` 这个地址段，允许 4242422547（也就是我的 AS）广播。如果你尝试广播这个路由，就会显示在这里。
    - 查看[无效的 IPv4 路由列表](https://lg.lantian.pub/route_generic/hostdare/table%20roa_fail_v4)，以及[无效的 IPv6 路由列表](https://lg.lantian.pub/route_generic/hostdare/table%20roa_fail_v6)。
  - 未知路由：这个 IP 段没有在 DN42 中注册过。
    - 一般意味着你把你私人内网的路由信息（例如 `192.168.0.0/16`，`10.0.0.0/8` 等）错误地广播给了其他人。
    - 也有可能是你刚注册成功，我的 ROA 信息还没更新。请等待 4-8 小时，然后重启我们的 Peering。
    - 也有可能是你在 DN42 中只创建了 inetnum/inet6num 没有创建 route/route6 对象。
    - 查看[未知的 IPv4 路由列表](https://lg.lantian.pub/route_generic/hostdare/table%20roa_unknown_v4)，以及[未知的 IPv6 路由列表](https://lg.lantian.pub/route_generic/hostdare/table%20roa_unknown_v6)。

“1xRTT”（单次来回）对接（Peering）
------------------------------

我住在中国，而你有可能在地球的另一侧。此时我们的一轮邮件（你发一封，我在你睡着时回复，你醒来后查看）需要 24 小时甚至更多。

以下是进行 “1xRTT” Peering 的说明，意味着我们可以只用两封邮件建立 Peering，一封来自你，一封来自我。即使没有时区差异，“1xRTT” Peering 仍然能减少很多麻烦。

1. 从下面的列表中选择一个服务器。一般你应该选择到你那边延迟（Ping）最低的服务器。
   - 如果你有多台服务器加入 DN42，并且愿意的话，我可以同时建立多个 Peering。
2. 选择一种 VPN 建立隧道。
   - 我偏好使用 WireGuard 和 OpenVPN，但明文 GRE 和 ZeroTier One 也可以。
     - 由于 GRE/IPSec 配置非常复杂，而且不同的 IPSec 实现之间常常有严重的兼容性问题，需要耗费几天甚至几周来调试，**我不再接受 GRE/IPSec 隧道**，已有隧道也可能随时中断。
   - **注意：我不**与中国大陆的服务器 Peer，以避免可能的法律问题。
   - 我也愿意尝试其它种类的 VPN，只要你询问就可以了。
3. 在你那边配置好 VPN 隧道和 BGP 客户端。你可以假设我会使用以下的配置：
   - 基础信息：
     - ASN：**4242422547**
     - 公网 IP：见以下列表
     - DN42 IPv4（隧道我这端的地址）：见以下列表
       - 如果你需要为隧道设置一个地址块（例如 /30），这个地址块将来自你的地址池（由你分配给我）。
       - 以上设置常见于 Mikrotik 等硬件路由器。
     - DN42 IPv6：**fe80::2547**，用于本地链路（Link-local）连接
       - 如果你需要为隧道设置一个地址块（例如 /64），这个地址块将来自你的地址池（由你分配给我）。
     - Multiprotocol BGP（MP-BGP）：
       - 虽然我支持 MP-BGP，但我默认仍会同时配置 v4、v6 两条 BGP 会话。
       - 如果你也支持 MP-BGP，只需要一条会话，直接告诉我就行。
   - 建立 VPN 隧道：
     - WireGuard/OpenVPN 我这端的端口号：**你的 ASN 的后五位**
       - 例如 4242420001 意味着我会使用 20001 端口
     - OpenVPN 预共享密钥：你来生成，之后发送给我
     - OpenVPN 默认设置：见下
       - 如果你无法使用我的默认参数，请设置好你可以接受的参数，然后发送给我。
     - ZeroTier One：我会申请加入你的网络
       - 如果可以的话，你可以尝试发送加入网络的邀请。
4. 将以下信息发邮件给 **b980120@hotmail.com**:
   - 基础信息：
     - ASN
     - 公网 IP
       - 我偏好 IPv4 地址，因为在我的一些服务器上，IPv6 是由隧道提供的（即 HE.NET Tunnelbroker）
     - DN42 IPv4 and IPv6（隧道你那端的地址）
       - 或者地址块，如果你需要的话
       - 对于 IPv6 Peering，需要包括本地链路（Link-local）地址
     - 你想和哪台服务器连接
   - 建立 VPN 隧道：
     - WireGuard/OpenVPN 你那端的端口号
       - 如果你不写明，我会假设你使用 22547 端口
     - OpenVPN 预共享密钥：由你生成
     - ZeroTier One：你的网络 ID（我会申请加入）
     - OpenVPN 设置参数（如果你无法使用我的默认参数）
5. 等我设置好 VPN 隧道和 Peering，然后回复邮件。一般这时 Peering 就已经成功了。
   - 你可以使用[我的 Looking Glass](https://lg.lantian.pub/) 来调试连接。

注：我不建议通过 IRC 联系我。虽然我开着 IRC 客户端，但我每月只会去看一两次信息，除非你主动在邮件中要求。

基本信息
-------

- ASN：4242422547
- IPv4 地址池：172.22.76.184/29 和 172.22.76.96/27
- IPv6 地址池：fdbc:f9dc:67ad::/48
- 我这边的默认端口号：你的 ASN 的后五位
- 服务状态：[https://lg.lantian.pub](https://lg.lantian.pub/)

服务器列表
--------

- 服务器 1：中国香港，微基主机（idc.wiki，原 50KVM）服务商
  - 域名：`50kvm.lantian.pub`
  - 公网 IPv4：`23.226.61.104`
  - 公网 IPv6：`2001:470:19:10bd::1`
  - DN42 IPv4：`172.22.76.186`
  - DN42 IPv6：`fdbc:f9dc:67ad:1::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`xelzwt1j0aoKjsQnnq8jMjZNLbLucBPwPTvHgFH/czs=`

- 服务器 2：美国洛杉矶，HostDare 服务商
  - 域名：`hostdare.lantian.pub`
  - 公网 IPv4：`185.186.147.110`
  - 公网 IPv6：`2607:fcd0:100:b100::198a:b7f6`
  - DN42 IPv4：`172.22.76.185`
  - DN42 IPv6：`fdbc:f9dc:67ad:3::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`zyATu8FW392WFFNAz7ZH6+4TUutEYEooPPirwcoIiXo=`

- 服务器 3：美国纽约，VirMach 服务商
  - 域名：`virmach-ny1g.lantian.pub`
  - 公网 IPv4：`107.172.134.89`
  - 公网 IPv6：`2001:470:1f07:54d::1`
  - DN42 IPv4：`172.22.76.190`
  - DN42 IPv6：`fdbc:f9dc:67ad:8::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`a+zL2tDWjwxBXd2bho2OjR/BEmRe2tJF9DHFmZIE+Rk=`

- 服务器 4：德国法兰克福，Virtono 服务商
  - 域名：`virtono.lantian.pub`
  - 公网 IPv4：`45.138.97.165`
  - 公网 IPv6：`2001:ac8:20:3::433a:a05d`
  - DN42 IPv4：`172.22.76.187`
  - DN42 IPv6：`fdbc:f9dc:67ad:2::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`DkmSBCIgrxPPZmT07DraoCSD/jSByjPkYqHJWfVZ5hM=`

推荐配置模板（默认参数）
-------------------

> 以下模板均是以你的视角写成，你在自己的服务器上使用这些模板时不用交换两边。

OpenVPN:

{% insertmd _templates/dn42-experimental-network-2020/openvpn-zh.md %}

WireGuard 配置（用于 `wg-quick up` 命令）：

{% insertmd _templates/dn42-experimental-network-2020/wireguard-zh.md %}
