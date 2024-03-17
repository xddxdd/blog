---
title: 'Kimsufi 独服安装升级 ESXi 并设置软路由'
categories: 网站与服务端
tags: [Kimsufi, ESXi]
date: 2018-06-06 17:22:00
image: /usr/uploads/2018/06/4190919588.png
---

Kimsufi 是法国 OVH 公司的一个廉价品牌，专门出租性价比极高的服务器。我自己租的是
KS-4C 型号，i5-2400 处理器，16GB 内存，2TB 硬盘，百兆带宽无限流量，只需要 13欧元
/月，性价比极高，非常适合开虚拟机做实验。

VMware ESXi（现在也叫 vSphere Hypervisor）和 Proxmox VE 是两个非常流行的专门用来
开虚拟机的操作系统，且两者都是免费的。最重要的是，Kimsufi 的控制面板中都有两款系
统的一键安装。但我在使用过程中发现 Proxmox VE 在网络条件不佳的情况下远程控制虚拟
机经常连接不上（VNC 黑屏）或者丢键（输密码时尤其要命），因此还是换装了 ESXi。

这里又产生了一个问题：ESXi 不是完整的 Linux、FreeBSD 等系统，它不具有 Linux 等所
有的 NAT 功能，也就是不能一个 IP 地址开好几台虚拟机然后做端口转发。不过，由于
Kimsufi 同时提供 IPv4 和 IPv6 地址，可以把 IPv4 给一台虚拟机用，让 ESXi 用
IPv6；再设置这台虚拟机做 NAT 就可以了。

这就是本文中要做的事。

## 为什么要写这篇文章

因为我在配置的过程中遇到了一堆问题：

1. ESXi 5.0 从命令行下在线升级的方法已经不能用了，会报错；

2. ESXi 6 系列带的网页面板虽然平时管理虚拟机很好用，不需要装客户端，但是一设置
   ESXi 的网络就会出现 bug。

## 安装 ESXi

Kimsufi 提供的 ESXi 版本极其古老，是 5.0 版本，而本文写成时最新版本已经到了
6.7。因此，安装完 ESXi 后就需要立即升级系统。但是由于 VMware 官方的一些操作，下
面这种在线升级的方法已经行不通了：

```bash
esxcli software profile update -p ESXi-6.5.0-20170702001-standard -d https://hostupdate.vmware.com/software/VUM/PRODUCTION/main/vmw-depot-index.xml
```

ESXi 5.0 运行上述命令会提示 XML 格式错误等等。所以必须下载离线安装包，本地升级。
但是 ESXi 的 wget 居然不支持 HTTPS，因此还需要另一台 VPS 中转。

具体步骤如下：

1: 挂上中转 VPS 的 SS，因为 VMware 下载网站会验证下载的 IP。

2: 访问 [https://my.vmware.com/group/vmware/patch#search][1]，选择 ESXi
6.0.0（5.0 不能直接升级 6.5），点击搜索，出现补丁列表：

![VMware 补丁列表][2]

3: 向下翻，找到任何文件名类似于 update-from-esxi6.0-6.0_update03 的补丁：

![我们要的补丁][3]

4: 点击下载，然后把下载链接复制到 VPS 上去 wget。在 VPS 上 wget 完后，开一个
HTTP 服务器，再从 ESXi 上 wget 一遍。

5: 点击第三栏的 KBxxxxxx 链接，在上图中就是 KB2148155。

6: 在新开的页面向下翻，找到 Image Profiles 段：

![Image Profiles][4]

这里的类似 ESXi-6.0.0-20170202001-standard 的这一段名称就是更新的版本名称。

7: 在 ESXi 的 SSH 中输入：

```bash
esxcli software profile update -d [下载的补丁 ZIP 的绝对路径] -p [版本名称]
```

例如：

```bash
esxcli software profile update -d /vmfs/volumes/datastore1/update-from-esxi6.0-6.0_update03.zip -p ESXi-6.0.0-20170202001-standard
```

回车执行升级，重启。

8: 回到第二步，选择 6.5.0 版本（本文写成时还没有 6.7 的升级文件），重复以上流
程。

如上操作完成后，我们就有了一个 6.5 版本的 ESXi。

## 设置 IPv6

我们的目标是把 IPv6 给 ESXi 用，把 IPv4 分给虚拟机，因此需要先给 ESXi 配置
IPv6。但是这里 ESXi 的网页界面配置会出现无法成功保存设置的问题，因此需要命令行操
作，步骤如下：

1: 登录 ESXi，执行如下命令开启 IPv6，然后重启：

```bash
esxcli network ip set -e true
```

2: 执行如下命令开启默认网卡的 IPv6：

```bash
esxcli network ip interface ipv6 set -e true -r false -i vmk0
```

3: 假设你的服务器分到的 IPv6 是 2001:41d0:1:234::1，那么你的 IPv6 网关是
2001:41d0:1:2ff:ff:ff:ff:ff，具体可以参照 Kimsufi 其它系统上的 IPv6 设置教程。我
们需要添加两个 IPv6 地址，一个是我们自己的 IPv6，另一个则是在和网关同一个 /64 里
随便取一个，以让 ESXi 承认这个网关：

```bash
esxcli network ip interface ipv6 address add -i vmk0 -I 2001:41d0:1:234::1
esxcli network ip interface ipv6 address add -i vmk0 -I 2001:41d0:1:2ff:12:34:56:78
```

4: 接下来就是设置默认网关：

```bash
esxcli network ip route ipv6 add -g 2001:41d0:1:2ff:ff:ff:ff:ff -n default
```

5: 从其它支持 IPv6 的 VPS 等 ping 一下，确认可以 ping 通再继续下一步。

6: 如果本地没有 IPv6，可以考虑使用 Cloudflare 反代服务器的 IPv6 地址，方便之后的
操作。

## 安装软路由

我使用的软路由系统是 pfSense。首先把 pfSense 的 ISO 下载到 ESXi 服务器上。因为
pfSense 的下载服务器支持 HTTP，所以不必再中转了：

```bash
cd /vmfs/volumes/datastore1
wget http://frafiles.pfsense.org/mirror/downloads/pfSense-CE-2.4.3-RELEASE-amd64.iso.gz
gunzip pfSense-CE-2.4.3-RELEASE-amd64.iso.gz
```

然后在网页面板上点 Networking - Virtual Switches，创建一个虚拟交换机，并在 Port
groups 页面创建一个端口组，连接到这个交换机，这将是之后虚拟机之间的内网。

![新的端口组][5]

如果你想要让 ESXi 连接进入虚拟机的内网，需要先做一些准备操作：再创建一个端口组，
连接到这个交换机，如图：

![第二个新的端口组][6]

然后在 VMkernel NICs 创建一个虚拟网卡，连接到这个端口组，选择 Services 中的
Management，如图：

![ESXi 连接到内网][7]

然后在 Physical NIC 页面中复制下物理网卡的 MAC 地址。由于机房有 IP 和 MAC 的绑
定，我们要让这台虚拟机伪装成主服务器的 MAC 地址，才能正常获取 IP 地址。

然后按照正常步骤创建虚拟机、安装系统。此处注意虚拟机的第一张网卡的 MAC 地址要改
的和物理网卡相同，并将这张网卡连接到“VM Network”，也就是和外网相通。如果你现在通
过 IPv4 连接服务器，那么在软路由系统启动后，到 ESXi 管理面板的连接会突然中断一
下，这是正常的，因为 ESXi 和软路由在同时抢占这个地址。因为相同的原因，现在软路由
里已经可以 ping 通外网了，但是 TCP 连接会被 reset。接下来就要关闭 ESXi 的 IPv4，
解决这个冲突。

## 关闭 IPv4

这一步是危险操作，因为如果你 IPv6 没有设置好，又关闭了 IPv4，那么就没有人可以访
问这台服务器了，只能重装！因此请务必确认服务器的 IPv6 已经正常工作！

从支持 IPv6 的 VPS ssh 到服务器上，运行如下命令即可：

```bash
esxcli network ip interface ipv4 set -i vmk0 -t none
```

此时软路由应该已经可以正常上网了。

如果你之前想让 ESXi 连接到内网，只要在网页面板 VMkernel NICs 页面上修改之前手动
创建的虚拟网卡的 IP 地址，符合内网的设置：

![修改虚拟网卡地址][8]

然后在 ESXi SSH 中运行：

```bash
esxcli network ip route ipv4 add -g [内网网关 IP] -n default
```

例如：

```bash
esxcli network ip route ipv4 add -g 172.18.254.1 -n default
```

然后 ESXi 就也能通过软路由访问 IPv4 的网站了。

[1]: https://my.vmware.com/group/vmware/patch#search
[2]: /usr/uploads/2018/06/4190919588.png
[3]: /usr/uploads/2018/06/162530643.png
[4]: /usr/uploads/2018/06/85829824.png
[5]: /usr/uploads/2018/06/1606507342.png
[6]: /usr/uploads/2018/06/4199878051.png
[7]: /usr/uploads/2018/06/1501702341.png
[8]: /usr/uploads/2018/06/3509596894.png
