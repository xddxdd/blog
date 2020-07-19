---
title: '加入 DN42 实验网络'
categories: 网站与服务端
tags: [DN42,ZeroTier One]
date: 2017-07-17 16:41:00
image: /usr/uploads/2017/07/1491468561.png
---

2020-03-16 提示
===============

本文已有更新版本：参见《[DN42 实验网络介绍（2020 版）](/article/modify-website/dn42-experimental-network-2020.lantian)》。

新版介绍中有更详细的注册申请流程，并根据 DN42 三年来的变化做出了修改。

以下内容写于 2017 年，仅作存档用途。

---

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 使用了大量在互联网骨干上应用的技术（例如 BGP），可以很好的模拟一个真实的网络环境。

正因为它的真实，使用 DN42 的门槛比较高。你要扮演一个 ISP（互联网服务提供商），注册一个 ASN 号码，注册 IPv4 和 IPv6 的地址池，并且使用 BGP 在自己的服务器上广播它们。你还要和其它的用户联系，和他们做 Peering（对接），一步步进入完整的 DN42 网络。

DN42 在 172.20.0.0/14 和 fd00::/8 上运行，而这两个 IP 段都是分配给内网使用的。换句话说，你在 DN42 上怎么折腾，都不会影响到服务器其它的互联网连接。

DN42 官方提供了[很详细的注册 ASN 和 IP 的教程][1]，只需一步一步照着做就可以，因此本文不会涉及该方面。本文的重点在地址池的广播和与其它用户的 Peering 上面。本文假定读者已经完成了 ASN、地址池的注册和设置，如图所示：

![DN42 Web 管理界面][2]

首先，登录上你自己的服务器、VPS、OpenWRT 路由器、树莓派或者是其它什么有固定 IP，可以长时间在线，并且运行 Linux 的东西。我使用的系统是 Debian 9，因此如果你使用 CentOS、Arch Linux 之类的系统，一些软件包的名称和配置文件的位置可能会不同。

使用 OpenVPN 与其它用户 Peering
========================

第一步当然是安装 OpenVPN，我们同时安装 Supervisor 方便管理：

    apt-get install openvpn supervisor
    update-rc.d openvpn disable #禁止 OpenVPN 开机自启动，全部交由 Supervisor 管理

然后生成一个预共享密钥用于 OpenVPN 的 P2P 互联：

    openvpn --genrsa --secret [名称].key

之后，你就要联系其它已经接入 DN42 网络的用户。绝大多数情况下，你不知道你可以和谁 Peer，因此你可以访问 [DN42 PingFinder][3]，这个网站可以测量你的服务器到各个 DN42 用户服务器的延迟，方便你挑选延迟低的服务器来联系其管理员。大多数服务器集中在美国和欧洲，亚太地区只有日本和新加坡有寥寥几台，导致我的香港 VPS 有点懵逼。

![DN42 PingFinder][4]

![DN42 PingFinder Results][5]

还有一点要注意，你可以和不止一个人进行 Peer，就像在真实网络中一样。中国电信不可能只和中国联通连接吧？它还要连接其它国家的运营商。DN42 网络同理。你大可以一口气和离你服务器近的几个人全部发邮件联系，并且同时和他们所有人 Peer。

总之，你决定好了要和谁 Peer。现在你要和他交换以下信息：

 1. 双方服务器的公网 IP，和 OpenVPN P2P 模式连接的端口
 2. 双方服务器在 DN42 内的 IP
 3. 双方的 DN42 AS 编号
 4. OpenVPN 的预共享密钥

然后双方同时在服务器上安装这样一份 OpenVPN 配置文件：

    proto       udp
    mode        p2p
    remote      [对方真实 IP]
    rport       [对方端口号]
    local       [我方真实 IP]
    lport       [我方端口号]
    dev-type    tun
    tun-ipv6
    resolv-retry infinite
    dev         [Linux 虚拟网卡名称，可随便起]
    comp-lzo
    persist-key
    persist-tun
    cipher aes-256-cbc
    ifconfig-ipv6 [我方 DN42 IPv6] [对方 DN42 IPv6]
    ifconfig [我方 DN42 IPv4] [对方 DN42 IPv4]
    secret [前面生成的预共享密钥的位置].key

并且都 `openvpn --config [配置文件路径]` 运行起来，互相 Ping 通对方的 DN42 IP，互联的第一步就成功了。

向 `/etc/supervisor/conf.d` 里放一份配置文件：

    [program:[自己起个名字]]
    command=openvpn --config [配置文件路径]
    autostart=true
    autorestart=true

然后 `supervisorctl reload`，你以后就可以用 Supervisor 来控制这个连接了。

使用 Bird 进行 BGP 宣告
=================

连接 VPN 类似于在真实世界中两个 ISP 之间拉上了网线。接下来，两个 ISP 要互相告诉对方自己能连接到哪些 IP，这个过程称为 BGP 宣告。比较常用的 BGP 软件是 Bird，因此先安装它：

    apt-get install bird

DN42 官方有提供 Bird 的配置文件示例，但是有点小问题，让我走了一些弯路。首先，还是按照[官方教程][6]把配置文件都创建好。注意，配置文件中有些地方需要替换成自己的 AS 和 IP 段。

然后，假设你已经和另一名用户建立了 VPN 连接。在 `/etc/bird/peers4/` 文件夹里建立一个配置文件，内容如下：

    protocol bgp [自定义名称] from dnpeers {
      neighbor [对方 DN42 IPv4] as [对方 AS 号];
      direct;
    };

相比官方文件多了一行 direct。没有这行 direct，Bird 就运行在 Multihop 模式下，有可能会出现 Bird 把对方宣告的路由全部标记成 unreachable 的情况。

同理，在 `/etc/bird/peers6/` 里建立类似的配置文件，只要将上面的 IPv4 换成 IPv6 地址即可。完成后，执行 `birdc configure && birdc6 configure` 来重新加载配置。

执行 `birdc show protocol` 可以查看连接情况：

![birdc show protocol][7]

最后的 Established 表明两台服务器已经成功建立 BGP 连接。如果出现 Idle，就必须把配置里的 direct 去掉。但是这又意味着有可能无法正常将对应的 IP 段路由到对方。这个问题我目前没有解决办法。

执行 `birdc show route` 可以查看 BGP 宣告过来的路由表：

![birdc show route][8]

Ping 一下 172.23.0.53 或者 fd42:d42:d42:53::1（官方 DNS 服务器地址），连通了就代表你成功加入了 DN42 网络！

使用 ZeroTier One 多服务器互联
======================

之前的 BGP 连接都是与其它用户进行连接。但是如果你有多台服务器，你也可以把它们互联起来，然后分别和距离较近的其它用户互联，组成一张大网。

一般的方法是服务器之间两两设置 OpenVPN P2P，但是麻烦不说，经常会因为路由表而出现问题，例如出现 A 连上 B，B 连上 C，C 连上 A，但是 B 连不上 A，C 连不上 B，A 连不上 C；或者是 A、B 能连 C，但 A、B 不能互联之类的诡异问题。这是因为 OpenVPN 对于多条链接建立了多个虚拟网卡，如果路由表设置不当，数据包走错网卡，就会“迷路”，出现诡异情况。

更加简单的方法自然是我之前写了两篇文章介绍的 ZeroTier One 了！所有服务器互联使用一张虚拟网卡，不再出现走错路的情况；另外中心管理之类的优点我就不再重复了。

首先自然是创建一个 ZeroTier 网络，并且把你从 DN42 拿到的 IP 段填入 Managed Routes 里：

![ZeroTier Managed Routes][9]

把你的 IPv4 段填入 IPv4 Auto Assign 里，让 ZeroTier 自动为你的服务器分配 IP 地址：

![ZeroTier IPv4 Auto Assign][10]

并且把 IPv6 段填入 IPv6 Auto Assign 的 Auto Assign from Range 里。注意不需要启用 RFC4193 或者 6PLANE 的地址分配。

![ZeroTier IPv6 Auto Assign][11]

然后在每台服务器上装好 ZeroTier One 并且加入网络：

![ZeroTier Server List][12]

如果你有一些服务器的 IP 已经在之前的 Peering 过程中定好了，就应该在 ZeroTier 的面板上配置相同的 IP，防止冲突。可以用 Managed IP 的加号来添加自定义 IP，使用 IP 地址旁的垃圾桶来删除。

配置完成，测试各台服务器可以 Ping 通，接下来就按照上面的 Bird BGP 宣告教程进行就可以了。对方 IPv4 地址即为其它服务器分配到的 IP，而对方 AS 号这里直接填写自己的 AS 号就可以了。

记得开启系统的数据包转发功能，否则没有直接和外界 Peer 的服务器可能连不上 DN42 网络。

如何与我 Peering
===============

如果你想加入 DN42 网络，可以找我 Peering，请阅读[这篇文章][13]，按照文中步骤操作。你也可以直接在这里评论。

（注：我不会在这里直接回复你的评论。我会向你填写的邮箱发送邮件来进行沟通。）


  [1]: https://wiki.dn42.us/howto/Getting-started
  [2]: /usr/uploads/2017/07/1491468561.png
  [3]: https://dn42.us/peers
  [4]: /usr/uploads/2017/07/220484720.png
  [5]: /usr/uploads/2017/07/3173481156.png
  [6]: https://wiki.dn42.us/howto/Bird
  [7]: /usr/uploads/2017/07/452968114.png
  [8]: /usr/uploads/2017/07/4224758666.png
  [9]: /usr/uploads/2017/07/3392936414.png
  [10]: /usr/uploads/2017/07/1103065050.png
  [11]: /usr/uploads/2017/07/3667447924.png
  [12]: /usr/uploads/2017/07/3034721652.png
  [13]: /page/dn42/