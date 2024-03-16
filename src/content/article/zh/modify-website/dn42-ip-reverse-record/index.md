---
title: '在 DN42 中设置 IP 反向解析'
categories: 网站与服务端
tags: [DNS,DN42]
date: 2018-05-05 21:58:00
image: /usr/uploads/2018/05/2031962398.png
---
DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 使用了大量在互联网骨干上应用的技术（例如 BGP），可以很好的模拟一个真实的网络环境。

我在[先前的一篇文章][1]中加入了 DN42 网络，并在[另一篇文章][2]中注册了自己的域名，设置了自己的 DNS 服务器。有了 DNS 服务器，我们就可以给自己的 IP 也设置上反向解析记录。反向解析记录的主要用途是反垃圾邮件，以及在 ping、traceroute 等网络工具中或许能好看一点。

设置 IP 段的解析服务器
-------------

第一步是将自己所有的 IP 段解析到自己的 DNS 服务器上，我的服务器是 ns[1-3].lantian.dn42，理论上可以全填，但是由于 DN42 现在修改配置需要发 Pull Request，流程比较长，我就保留了最初注册这个 IP 时设置的 DNS 服务器，只有 ns1.lantian.dn42。

在 git clone 下 DN42 的数据文件后，在自己的 IP 段文件中添加这样一句话：

    nserver:            ns1.lantian.dn42

整个文件就看起来像这个样子：

    inetnum:            172.22.76.184 - 172.22.76.191
    netname:            LANTIAN-IPV4
    remarks:            Peer with me at b980120@hotmail.com
    descr:              Peer with me at b980120@hotmail.com
    country:            CN
    admin-c:            LANTIAN-DN42
    tech-c:             LANTIAN-DN42
    mnt-by:             LANTIAN-MNT
    nserver:            ns1.lantian.dn42
    status:             ASSIGNED
    cidr:               172.22.76.184/29
    source:             DN42

接下来 git add，git commit，发 Pull Request 等待合并，等待递归 DNS 生效等等。

设置 PowerDNS
-----------

在等待的同时，就可以把解析服务器先搭起来。首先按照[这篇文章][3]，我们已经有了一个 PowerDNS 的服务器。而解析 IP，其实类似于解析一个特殊的域名。

对于 /24 的 IP 段，这个特殊的域名就是 [IP 顺序反过来].in-addr.arpa，例如 192.168.0.0/24 的就是 0.168.192.in-addr.arpa。但多数 DN42 用户用不到 /24，只注册了 /26 至 /29 的 IP 段，就需要把 IP 最后一位连上“/26”等一起处理。以我的 IP 段 172.22.76.184/29 为例，对应域名就是 184/29.76.22.172.in-addr.arpa。

将这个域名添加到 PowerDNS 中，如图：

![PowerDNS 域名设置][4]

然后就是为每个 IP 设置自己的反向解析记录，即 PTR 记录。例如 172.22.76.185 的就是 185.184/29.76.22.172.in-addr.arpa，如图填写：

![PowerDNS PTR 记录设置][5]

等待 DN42 的递归 DNS 生效之后，就可以用 dig -x [IP 地址] @172.23.0.53 的命令查询反向记录了，类似下图：

![查询反向记录][6]

另外 DN42 的 IPv6 反向解析可以在[这篇文章][7]看到。

  [1]: /article/modify-website/join-dn42-experimental-network.lantian
  [2]: /article/modify-website/register-own-domain-in-dn42.lantian
  [3]: /article/modify-website/register-own-domain-in-dn42.lantian
  [4]: /usr/uploads/2018/05/717887706.png
  [5]: /usr/uploads/2018/05/1880640802.png
  [6]: /usr/uploads/2018/05/2031962398.png
  [7]: /article/modify-website/dn42-reverse-record-ipv6.lantian
