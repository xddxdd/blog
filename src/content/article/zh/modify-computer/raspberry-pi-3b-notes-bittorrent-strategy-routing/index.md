---
title: '树莓派 3B 折腾笔记：BT 下载与策略路由'
categories: 计算机与客户端
tags: [Linux,Raspberry Pi,策略路由]
date: 2017-10-21 19:17:00
---
这次就直接进入正题。（其实是不知道该拿什么开头）

安装 Transmission 挂 PT
--------

作为一个可以自由连接各种传感器的小型电脑，树莓派的可玩性相当高。即使你不想在 GPIO 上接一大堆传感器（或者像我一样觉得另外的传感器暂时没什么用），你也可以利用它低功耗的特点，让它 24 小时运行，做一些不需要大量 CPU 运算，但是因为其它因素需要较长时间才能完成的任务，例如……挂机下载。

我所在的大学有一个内网的 PT（Private Tracker）站。PT 站就是一个 BT 种子的发布网站，但是它在传统 BT 的基础上增加了用户管理功能，并且通过限制客户端种类、强制要求上传率等方式，解决了传统 BT 下各类客户端吸血（只下载不上传，例如迅雷）和种子很快失效（因为一段时间后就没人继续上传了）的问题。

但因为有了这些要求，PT 站用户往往需要长时间挂机上传下载，而这刚好是树莓派擅长的事。

在[上篇文章][1]里，我弄好了一个简单的 NAS。在此基础上装一个 BT 下载软件就可以挂 PT 了。这个 PT 站在 Linux 下仅允许 Deluge，Rufus，Transmission 和 rTorrent。我一开始准备用 Deluge，但是 PT 站提示不允许使用 Raspbian 软件源内最新的 Deluge 1.3.13。该站推荐旧版本的 Deluge 1.3.3，可以在 Debian 7 软件源内找到，但是可能是因为 Debian 9 基于 systemd，我装上旧版后无法启动。

总之我选择了 Transmission。首先 apt-get：

```bash
apt-get install transmission-daemon
```

然后编辑 `/etc/transmission-daemon/settings.json`：

```json
# 屏蔽吸血客户端
"blocklist-enabled": true,
"blocklist-url": "http://john.bitsurge.net/public/biglist.p2p.gz",
# 修改默认下载位置
"download-dir": "/mnt/usb/Transmission",
# 用 PT 站一定要把这几项都关掉，如果用传统 BT 这里不用改
"dht-enabled": false,
"lpd-enabled": false,
"pex-enabled": false,
# 远程 Web 管理
"rpc-enabled": true,
"rpc-authentication-required": true,
"rpc-username": "用户名",
"rpc-password": "密码，启动 Transmission 后会被自动加密",
```

最后 `service transmission-daemon start` 启动后，访问 [树莓派 IP]:9091 可以查看 Web 管理界面，可以上传种子、调整限速等。

针对学校网络环境的调整
-----------

在[上篇文章][2]中我提到过，学校提供了一个有线网和两个 Wi-Fi，它们各自有如下特点：

1. 有线网，限速 1.5M，网页方式登录，其它设备局域网内可访问
2. 无线网，限速 1.5M，网页方式登录，其它设备若通过无线网连接则无法访问（Wi-Fi 设备隔离，通过有线网仍可访问）
3. eduroam，不限速，WPA2 企业级登录，其它设备若通过无线网连接则无法访问（Wi-Fi 设备隔离，通过有线网仍可访问）

由于树莓派有一个有线网卡和一个无线网卡，因此最佳的方案是，树莓派平时通过 eduroam 进行 PT 下载，我用自己电脑访问树莓派有线网卡的 IP 进行管理和访问文件。

但是如果你直接把有线网和无线网都连上，你会发现只有一张网卡有流量，另外一张网卡甚至无法 ping 通。这是因为 Linux 内核在收到连接请求（例如 TCP SYN）时，并不是“从哪来回哪去”，直接从连接请求来源网卡继续建立连接（TCP ACK）。相反，Linux 会根据内核的路由表来确定从哪张网卡回复。这样就会造成从有线网卡进入的请求被从无线网卡回复，然后回复因为设备隔离策略或是来源 IP 与网卡 IP 不符而被丢弃。

因此我们需要设置一下 Linux 的策略路由功能，做到“从哪来回哪去”。策略路由可以指定符合某些条件的数据包（例如从某张网卡进入的数据包）不经主路由表处理，而是单独开一张路由表处理它。这个功能早在《[OpenVZ 配置 Hurricane Electric IPv6 隧道，开启整个地址池并与原生 IPv6 共同使用][3]》里我就用过了。虽然当时是用在了 IPv6 地址上，但是 Linux 下 IPv4 和 IPv6 的网络命令都大致相同，因此稍微改一下就可以使用。

首先输入 `route` 命令查看路由表，你会看到这样的输出：

```bash
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         10.106.65.1     0.0.0.0         UG    202    0        0 eth0
default         10.107.128.1    0.0.0.0         UG    303    0        0 wlan0
10.106.65.0     0.0.0.0         255.255.255.0   U     400    0        0 eth0
10.107.128.0    0.0.0.0         255.255.240.0   U     303    0        0 wlan0
```

此处可以看到，有两条 Destination（目标）为 default（默认）的路由，一条对应有线网卡（eth0），一条对应无线网卡（wlan0）。它们的网关分别是 10.106.65.1 和 10.107.128.1，记录好它们。

再输入 `ip addr` 看一下现在的 IP。你会看到类似如下输出：

```bash
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
   link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
   inet 127.0.0.1/8 scope host lo
      valid_lft forever preferred_lft forever
   inet6 ::1/128 scope host
      valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq state UP group default qlen 1000
   link/ether b8:27:eb:7c:5b:07 brd ff:ff:ff:ff:ff:ff
   inet 10.106.65.213/24 brd 10.106.65.255 scope global eth0
      valid_lft forever preferred_lft forever
   inet6 fe80::62f6:bc87:f1f5:533a/64 scope link
      valid_lft forever preferred_lft forever
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq state UP group default qlen 1000
   link/ether b8:27:eb:29:0e:52 brd ff:ff:ff:ff:ff:ff
   inet 10.107.134.208/20 brd 10.107.143.255 scope global wlan0
      valid_lft forever preferred_lft forever
   inet6 fe80::f013:e96e:8451:7a94/64 scope link
      valid_lft forever preferred_lft forever
```

很长？其实重要的就几句话。我们只关心各张网卡的地址：

```bash
2: eth0: [...]
    inet 10.106.65.213/24 [...]
3: wlan0: [...]
    inet 10.107.134.208/20 [...]
```

这样就可以清楚地看到，有线网卡的地址是 10.106.65.213/24。因为 IPv4 的地址用 32 bit 表示，所以把最后（32-24=）8 bit 清零，获得 10.106.65.0/24。也就是说，你 DHCP 自动获取到的 IP 必然在 10.106.65.0/24 这个 IP 段以内。同理，无线网卡的地址是 10.107.134.208/20，清掉最后（32-20=）12 bit，获得 10.107.128.0/20。记好，等会也要用。

然后修改 `/etc/iproute2/rt_tables`，这里记录了路由表的列表，我们需要在这里加两张路由表，分别给两张网卡使用：

```bash
#
# reserved values
#
255    local
254    main
253    default
0    unspec
#
# local
#
#1    inr.ruhep

# 上面的都是 Raspbian 默认的设置，在文件末尾添加这两行：
100    university_eth
101    university_wlan
```

然后设置策略路由：

```bash
# 对于 university_eth 这张路由表，设置流量默认从 10.106.65.1（就是有线网卡的网关）走
ip route add default via 10.106.65.1 dev eth0 table university_eth
# 对于 university_wlan 这张路由表，设置默认走 10.107.128.1（无线网卡网关）
ip route add default via 10.107.128.1 dev wlan0 table university_wlan
# 对于来自 10.106.65.0/24（也就是刚才算出的有线网卡的 IP 段），走 university_eth 路由表
ip rule add from 10.106.65.0/24 table university_eth
# 对于来自 10.107.128.0/20（也就是刚才算出的无线网卡的 IP 段），走 university_wlan 路由表
ip rule add from 10.107.128.0/20 table university_wlan
```

输完这些命令，你的两张网卡就都能 ping 通了，“从哪来到哪去”完工。你可以把上面这四条命令加入 `/etc/rc.local` 以开机自动设置。如果开机时没有生效，在四行命令上面再加一行 `sleep 5` 就可以了——开机的时候有可能 Linux 网络功能还没启动完，因此先等 5 秒让网络功能启动了再继续设置。

最后一个问题，在同时连接了有线和无线的情况下，Linux 的 DHCP 客户端会给有线网卡设置更低的 Metric，使得流量优先从有线网卡走。Metric 就是 Linux 下每条路由的优先级，Metric 越低，优先级越高。但是我希望优先使用无线网卡，因此就要修改 DHCP 客户端的设置，给有线网卡更高的 Metric。

编辑 `/etc/dhcpcd.conf`：

```bash
interface eth0    # 对于网卡 eth0（有线网卡）
metric 400        # 将它的 Metric 设置成 400（无线网卡默认是 303，任何比 303 大的数都可以）
```

保存重启，然后网络请求就都优先通过无线网卡发送了。

最终效果
----

树莓派下所有的下载软件均通过不限速的 eduroam Wi-Fi 进行下载。我用自己的电脑通过连接较慢的有线网卡的 IP 操作 SSH、Transmission，访问共享等，不影响 Wi-Fi 的传输速度，同时 1.5M 的限速也足以观看 1080p 分辨率的视频（特别高清的除外）。

  [1]: /article/modify-computer/raspberry-pi-3b-notes.lantian
  [2]: /article/modify-computer/raspberry-pi-3b-notes.lantian#quicklink8
  [3]: /article/modify-computer/openvz-he-ipv6-use-whole-block-along-native-ipv6.lantian
