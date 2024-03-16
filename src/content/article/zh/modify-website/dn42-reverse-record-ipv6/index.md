---
title: '在 DN42 中设置 IPv6 反向解析'
categories: 网站与服务端
tags: [DN42,DNS]
date: 2018-05-27 20:19:00
image: /usr/uploads/2018/05/635187896.png
---
DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 使用了大量在互联网骨干上应用的技术（例如 BGP），可以很好的模拟一个真实的网络环境。

我在[先前的一篇文章][1]中加入了 DN42 网络，并在[另一篇文章][2]中注册了自己的域名，设置了自己的 DNS 服务器。然后，我在[这一篇文章][3]设置了 IPv4 的反向解析。当时由于 DN42 Wiki 上的信息有点问题，导致我当时认为不能设置 IPv6 反向解析，但经过我尝试后发现是可以的。

因为设置的是大体相同的东西，所以本文会和之前 IPv4 的文章有比较多的内容重复（复制粘贴）。

设置 IP 段的解析服务器
-------------

第一步是将自己所有的 IP 段解析到自己的 DNS 服务器上，我的服务器是 ns[1-2].lantian.dn42，可以全填。

在 IPv4 文中我直接用了原先的设置，但是因为我 IPv6 的 DNS 设置有问题，不得不改，因此只能发一次 Pull Request 修改 IPv6 的 DNS 服务器，并顺手把 IPv4 的也改了。

在 git clone 下 DN42 的数据文件后，在自己的 IP 段文件中添加这样一句话：

    nserver:            ns1.lantian.dn42
    nserver:            ns2.lantian.dn42

整个文件就看起来像这个样子：

    inet6num:           fdbc:f9dc:67ad:0000:0000:0000:0000:0000 - fdbc:f9dc:67ad:ffff:ffff:ffff:ffff:ffff
    netname:            LANTIAN-IPV6
    descr:              Peer with me at b980120@hotmail.com
    country:            CN
    admin-c:            LANTIAN-DN42
    tech-c:             LANTIAN-DN42
    mnt-by:             LANTIAN-MNT
    nserver:            ns1.lantian.dn42
    nserver:            ns2.lantian.dn42
    status:             ASSIGNED
    cidr:               fdbc:f9dc:67ad::/48
    source:             DN42

接下来 git add，git commit，发 Pull Request 等待合并，等待递归 DNS 生效等等。

设置 PowerDNS
-----------

在等待的同时，就可以把解析服务器先搭起来。首先按照[这篇文章][4]，我们已经有了一个 PowerDNS 的服务器。而解析 IP，其实类似于解析一个特殊的域名。

因为 IPv6 地址够多，DN42 中人手一个 /48 块，因此不存在像 IPv4 一样，需要根据 IP 段的大小加上“/29”等内容。IPv6 的特殊域名就是 “[IP 顺序反过来].ip6.arpa”。例如我的 fdbc:f9dc:67ad::/48 对应的就是 d.a.7.6.c.d.9.f.c.b.d.f.ip6.arpa。

将这个域名添加到 PowerDNS 中，如图：

![PowerDNS 域名设置][5]

然后就是为每个 IP 设置自己的反向解析记录，即 PTR 记录。例如 fdbc:f9dc:67ad::8b:c606:ba01 的就是 1.0.a.b.6.0.6.c.b.8.0.0.0.0.0.0.0.0.0.0.d.a.7.6.c.d.9.f.c.b.d.f.ip6.arpa，如图填写：

![单个 IP 的反向解析记录][6]

但是这样手动转换很容易少 0，出现问题。偷懒的办法是找一台 Linux 或 Mac 机器运行 `dig -x fdbc:f9dc:67ad::8b:c606:ba01`，出现如图输出：

![Screen Shot 2018-05-27 at 7.52.32 PM.png][7]

其中 QUESTION SECTION 下面就会出现 IPv6 地址对应的 PTR 记录名：

    ;; QUESTION SECTION:
    ;1.0.a.b.6.0.6.c.b.8.0.0.0.0.0.0.0.0.0.0.d.a.7.6.c.d.9.f.c.b.d.f.ip6.arpa. IN PTR

此例中即为 1.0.a.b.6.0.6.c.b.8.0.0.0.0.0.0.0.0.0.0.d.a.7.6.c.d.9.f.c.b.d.f.ip6.arpa。

等待 DN42 的递归 DNS 生效之后，就可以用 dig -x [IP 地址] @172.23.0.53 的命令查询反向记录了。


  [1]: /article/modify-website/join-dn42-experimental-network.lantian
  [2]: /article/modify-website/register-own-domain-in-dn42.lantian
  [3]: /article/modify-website/dn42-ip-reverse-record.lantian
  [4]: /article/modify-website/register-own-domain-in-dn42.lantian
  [5]: /usr/uploads/2018/05/635187896.png
  [6]: /usr/uploads/2018/05/3021831817.png
  [7]: /usr/uploads/2018/05/2820033637.png