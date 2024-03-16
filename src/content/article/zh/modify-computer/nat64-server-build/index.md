---
title: 'NAT64 服务器搭建'
categories: 计算机与客户端
tags: [NAT64]
date: 2018-03-10 20:21:00
---
NAT64 是 IPv4 向 IPv6 过渡时出现的一项技术。它通过将 IPv4 的地址映射到一个 IPv6 地址段上，来让仅支持 IPv6 的设备同样能够访问 IPv4 网络。但由于仅支持 IPv6 的设备并不多，目前它在国内的应用主要是两个方面：

1. 对于 IPv4 收费/限速/限流量而 IPv6 免费/不限速/不限流量的教育网用户，可以使用公共 NAT64 服务来省钱。
2. 对于 iOS 应用开发者，用于搭建测试环境以通过 App Store 的审核。

我们也可以在自己的同时拥有 IPv4 和 IPv6 连接的路由器上安装相应的软件，来搭建 NAT64 服务器。常用的软件是 Tayga 和 Jool。其中 Tayga 年久失修，上次更新已经是 2011 年的事了，而 Jool 一直在活跃地更新，因此本文采用 Jool 来搭建。

安装 Jool
-------

第一步是安装 Jool。Arch Linux 的 AUR 上有 Jool，而 Jool 在 Debian 和 Ubuntu 的官方源中都找不到，因此在这两个系统下需要手动编译安装。

对于 Arch Linux，直接 `yaourt -S jool-dkms-git` 即可。对于树莓派，需要修改 PKGBUILD，将 `arch=('i686' 'x86_64')` 修改成 `arch=('i686' 'x86_64' 'armv7h')`，即添加树莓派的架构信息，否则会提示没有对应的可以安装的架构。安装完成后，从下面的“设置内核模块开机自动加载”这一步开始做。

对于 Debian 和 Ubuntu，执行如下指令：

```bash
# 安装依赖
apt-get install build-essential dkms autoconf automake linux-headers
# 下载 Jool（本文写成时最新版本为 3.5.6）
wget https://github.com/NICMx/releases/raw/master/Jool/Jool-3.5.6.zip
unzip Jool-3.5.6.zip
cd Jool-3.5.6
# 安装内核模块
dkms install .
# 安装管理软件（可选）
cd usr
./configure && make && make install
# 设置内核模块开机自动加载
cat >/etc/modprobe.d/jool.conf <<EOF
options jool pool6=64:ff9b::/96
EOF
echo jool > /etc/modules-load.d/jool.conf
# 加载内核模块
modprobe -v jool pool6=64:ff9b::/96
```

安装完成后执行 jool，如果看到类似 Status: Enabled 的字样，就说明安装成功了。

测试 NAT64
--------

IPv6 地址中专门给 NAT64 划了一个地址池，就是上文的 64:ff9b::/96。使用 64:ff9b:: 加上 IPv4 地址就可以通过 NAT64 访问了，例如如果我们的原 IP 是 8.8.8.8，那么使用 64:ff9b::8.8.8.8 就能访问。

但是在安装 Jool 的本机上直接访问这个地址是不通的，必须让本机作为路由器，让其它机器通过它才能访问 NAT64 的地址。我将树莓派作为路由器并打开 WiFi 热点，并用自己的电脑连接，可以 ping 通相应的地址就是成功了。

![ping 通 NAT64 地址][1]


  [1]: /usr/uploads/2018/03/1745244524.png