---
title: '使用 ZeroTier One 建立自己的 IPv6 隧道'
categories: 计算机与客户端
tags: [IPv6, ZeroTier One]
date: 2017-07-06 16:10:15
---

## 前言

天朝绝大多数 ISP 均不为用户提供 IPv6 地址，除了教育网。但是教育网的 IPv6 很不稳
定（可能和我的学校有关），而且一旦离开学校就没有 IPv6 了，很不爽。

有一种方法是使用 [HE.NET 的隧道服务][1]。在 SixXS 关闭之后，他们是目前仅存的最大
的 IPv6 隧道提供者，而且他们的服务完全免费。但是他们的服务并不适用于天朝的家庭网
络环境，因为家庭网络普遍是动态 IP，并且部分运营商为了节省成本已经开始使用大内
网，用户无法获取独立 IP，在同一内网就会产生冲突。

好消息是，我有好几台 VPS，均由 VPS 提供商或者 HE.NET 的隧道服务提供了 IPv6。这意
味着我可以使用 VPN 方案。但是 Open^\_^VPN 早就无法正常跨境使用了，其它 VPN 方案
或多或少都有一些问题。

之前我拿来 Docker 组网的 ZeroTier One VPN 倒是能很好的解决这个问题。有中心管理面
板，配置简单；跨境使用目前没有问题；官方甚至提供了详细的教程。

## 准备

ZeroTier One 的注册安装和加入网络，请参见[这篇文章][2]。本文假定 VPS 已经有了一
个 IPv6 地址块，并且已经和你需要 IPv6 的设备加入了同一个网络，已经能够互通。

如果你之前有像[这篇文章][3]一样开启了整个地址块，必须把它先关闭。你应该在
`/etc/rc.local` 之类的地方添加过这样的指令：

```bash
ip -6 route add local 2333:3333:3333:3333:3333::/80 dev lo
```

把它删了并重启 VPS。

## 设置转发

本文假定 IPv6 地址池是 2333:3333:3333:3333:3333::/80 ，并且 ZeroTier One 生成的
虚拟网卡是 zt0，请注意替换。

登陆你的 VPS，向 `/etc/sysctl.conf` 添加如下指令：

```ini
net.ipv6.conf.default.forwarding=1
net.ipv6.conf.all.forwarding=1
net.ipv6.conf.all.proxy_ndp=1
net.ipv6.conf.all.accept_ra=2
```

保存后运行 `sysctl -p` 生效。

如果你有配置 iptables 防火墙，向配置中添加如下两行，并保存生效：

```bash
ip6tables -A FORWARD -i zt0 -s 2333:3333:3333:3333:3333::/80 -j ACCEPT
ip6tables -A FORWARD -i henet -d 2333:3333:3333:3333:3333::/80 -j ACCEPT
```

## ZeroTier 管理页面设置

登陆 ZeroTier 管理界面，点击进入你已经创建好的网络，找到 IPv6 Auto Assign（应该
在屏幕右下角）：

![IPv6 Auto Assign][4]

勾上 Auto Assign from Range（从地址池中自动分配）选项。

![Auto Assign from Range][5]

它会要求输入你的地址池的开始与结束地址。对于我们用做演示的
2333:3333:3333:3333:3333::/80，其配置如图所示：

![输入地址之后][6]

你会发现 ZeroTier One 还没有给网络内的设备在这个地址池内分配 IPv6 地址，因为你还
没有设置这个地址池的路由。看到屏幕右上角的 Managed Routes 选项，在第一个框输入要
用的地址池 `2333:3333:3333:3333:3333::/80`，第二个框留空，如图。

![添加地址池][7]

然后，我们要告诉设备，将 ZeroTier 的虚拟网卡默认用于 IPv6 连接。继续添加，在第一
个框输入 `::0/0`，第二个输入你的 VPS 的内网 IPv6 地址，就是 ZeroTier RFC4193 分
配的地址，类似如图：（记得替换地址）

![添加默认路由][8]

保存。这时页面下方应该已经显示你的设备拥有了一个公网 IPv6 地址。

## ZeroTier 客户端设置

但是当你到你的电脑上查看，会发现看不到分配的公网 IPv6。这是由于 ZeroTier 的安全
策略所致。为了防止用户不知情地将所有流量转发到一个 ZeroTier 网络上（即不知情地将
ZeroTier 作为全局 VPN 使用），并允许该网络的管理员为所欲为，你必须手动在每台设备
上允许该功能。

在 Windows 和 Mac 设备上，通过 GUI 界面就能打开。打开 Network Details 界面：

![ZeroTier 菜单][9]

找到你的网络，打开 Allow Global 和 Allow Default 选项即可，立即生效。

![打开两个选项][10]

在 Linux 设备上，假设你的网络 ID 是 2333333333333333，运行如下命令：

```bash
zerotier-cli set 2333333333333333 allowGlobal=true
zerotier-cli set 2333333333333333 allowDefault=true
```

立即生效。如此配置后，你就建好了自己的、在动态 IP 下也可方便使用的 IPv6 隧道了。

[1]: https://tunnelbroker.net
[2]:
    /article/modify-website/zerotier-one-connect-docker-containers-dualstack.lantian
[3]:
    /article/modify-computer/openvz-he-ipv6-use-whole-block-along-native-ipv6.lantian
[4]: /usr/uploads/2017/05/4005783584.png
[5]: /usr/uploads/2017/07/4075241417.png
[6]: /usr/uploads/2017/07/1687451490.png
[7]: /usr/uploads/2017/07/4958991.png
[8]: /usr/uploads/2017/07/2880366477.png
[9]: /usr/uploads/2017/07/4067377253.png
[10]: /usr/uploads/2017/07/626155356.png
