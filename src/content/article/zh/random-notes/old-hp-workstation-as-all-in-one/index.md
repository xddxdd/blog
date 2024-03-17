---
title: 老款 HP 工作站配置 NAS+软路由笔记
categories: 随手记
tags: [HP, NAS, 软路由]
date: 2023-03-26 15:05:19
---

我买了一台 HP 的老款工作站，用作家里的 NAS+软路由。本文简单记录这台工作站的配置
过程。

## 硬件选择

NAS 的硬件主要有这些选择：

-   成品 NAS（如群晖）
    -   优点：开箱即用。
    -   缺点：
        -   价格贵，到了“买系统送硬件”的程度。
        -   而且与各种 Linux 发行版相比，NAS 的原厂系统难以定制。
-   二手服务器
    -   优点：
        -   便宜，在保修期结束后,这些服务器大都被数据中心当作废品处理，然后被以
            极低的成本回收，翻新后二次售卖。
        -   稳定，这些服务器在设计时就考虑了长期运行，并且一直在温湿度稳定、无尘
            的数据中心中运行。
    -   缺点：
        -   噪音大，需要自行修改系统配置降低风扇转速，更换静音风扇，或者加装风扇
            减速线。
        -   体积大（主要针对机架式服务器）。
        -   专用配件，服务器厂商会定制各种配件供特定型号使用，如果你有扩展需求，
            需要加价购买这些专用配件。
-   二手工作站
    -   优点：
        -   便宜、稳定，与二手服务器相同。
        -   噪音小，毕竟工作站是放在办公桌边，而不是在机房里使用的。
    -   缺点：
        -   专用配件，与二手服务器相同。
-   自己购买电脑配件组装
    -   优点：
        -   可以完全根据自己的需求定制。
    -   缺点：
        -   性价比不如二手服务器和工作站。
        -   家用配件的稳定性可能不及商用服务器和工作站。

而我对于这台 NAS 有这些需求：

-   需要能用 Jellyfin 视频转码，而且最好支持 H265 编码，这需要一块 6 代
    （Skylake）以上、带核显的 Intel CPU，或者加装一块 NVIDIA 的显卡。
-   除此之外，只要不是非常差的 CPU（例如 Intel Atom 系列），对性能几乎没要求。
-   低噪音，我目前住在单间公寓，这台 NAS 会和我的床放在同一个房间。
-   我不喜欢成品 NAS 系统，希望自己安装 NixOS 然后自行配置。
-   能省则省。

综上考虑，我选择购买二手工作站。由于我目前人在美国，我在 eBay 上花 50 刀购买了一
台回收翻新的 HP 工作站。关键配置如下：

-   型号：HP Z220 SFF
-   CPU：Intel E3-1225 v2
-   内存：4GB DDR3
-   硬盘：250GB 机械硬盘
-   电源：240W
-   三根 PCI-E 插槽，一根 x16，一根 x4，一根 x1。
-   一根 PCI 插槽。

## 存储

作为一台 NAS，首先要考虑的就是数据存储。

这台工作站有 4 个 SATA 接口，两个 3.5 寸硬盘位，以及一个 5 寸光驱位（安装了光
驱）。我拆掉了原装硬盘，加装了两块全新的 16TB 机械硬盘作为数据存储。我计划先将这
两块硬盘组成 RAID-1 阵列，在未来容量不足时加装一块硬盘转换成 RAID-5。ZFS 不支持
从 RAID-1 转换成 RAID-5，而且 ZFS 内核模块由于没有合入 Linux 主线，经常在升级内
核版本时挂掉。而 Btrfs 本身的 RAID-5 功能有严重的稳定性问题，容易造成数据丢失。
因此我最终选择的方案是 Btrfs + LVM RAID-1，让配置更加灵活的 LVM 来处理 RAID。

我还加装了一块 180GB 容量的 Intel 520 固态硬盘作为启动盘。虽然这块固态硬盘很老，
但它的价格仅 15 刀，接近 eBay 上所有固态硬盘的最低价，同时它用的是 MLC 颗粒，相
比现在的 TLC 颗粒寿命更长。这块硬盘上只装 NixOS 的系统文件（`/nix` 文件夹），以
及一些会被每日备份到云存储的配置文件，所以我不担心丢失这块硬盘上的数据。

另外，我配置了 [Bees](https://github.com/Zygo/bees) 软件用于 Btrfs 上的数据去
重。我的两块硬盘 RAID-1 后有大约 14.6TB 的可用存储空间。Bees 要有效去重这些空间
需要占用 2GB 内存创建一个硬盘内容的哈希表。再加上一些其它的服务，原装的 4GB 内存
很快就不够用了。因此，我又花了 40 刀给这台工作站换上了 16GB 的 DDR3 ECC-UDIMM 内
存。

## 软路由

这台工作站将直接接到运营商的光猫，作为我家的主路由。我不打算使用 OpenWRT 等专为
路由器设计的 Linux 发行版，而是直接在 NixOS 上配置数据包转发和 NAT。开启转发功能
只需要几行 sysctl 配置：

```nix
{
  boot.kernel.sysctl = {
    "net.ipv4.conf.all.forwarding" = lib.mkForce 1;
    "net.ipv4.conf.default.forwarding" = lib.mkForce 1;
    "net.ipv4.conf.*.forwarding" = lib.mkForce 1;
    "net.ipv6.conf.all.forwarding" = lib.mkForce 1;
    "net.ipv6.conf.default.forwarding" = lib.mkForce 1;
    "net.ipv6.conf.*.forwarding" = lib.mkForce 1;
  };
}
```

而 NAT 则需要配置防火墙。我使用的是 Nftables，简化后的配置如下：

```bash
table inet lantian {
  # 内网 IPv4 地址
  set RESERVED_IPV4 {
    type ipv4_addr
    flags constant,interval
    elements = { 10.0.0.0/8, 172.16.0.0/12,
                 192.0.0.0/24, 192.0.2.0/24,
                 192.168.0.0/16, 198.18.0.0/15,
                 198.51.100.0/24, 203.0.113.0/24,
                 233.252.0.0/24, 240.0.0.0/4 }
  }

  # 内网 IPv6 地址
  set RESERVED_IPV6 {
    type ipv6_addr
    flags constant,interval
    elements = { 64:ff9b::/96,
                 64:ff9b:1::/48,
                 2001:2::/48,
                 2001:20::/28,
                 2001:db8::/32,
                 fc00::/7 }
  }

  chain NAT_POSTROUTING {
    type nat hook postrouting priority srcnat + 5; policy accept;
    # 对来自内网，去向公网网卡的 IPv4 数据包进行 NAT
    ip saddr @RESERVED_IPV4 oifname @INTERFACE_WAN masquerade
    # 对来自内网，去向公网网卡的 IPv6 数据包进行 NAT
    # 这里只处理源地址是私有 IP 的情况，不影响直接分配了公网 IP 的设备
    ip6 saddr @RESERVED_IPV6 oifname @INTERFACE_WAN masquerade
  }
}
```

然后，启用 MiniUPnPd，让客户端上的软件可以按需配置端口转发：

```nix
{
  services.miniupnpd = {
    enable = true;
    upnp = true;
    natpmp = true;
    internalIPs = ["192.168.0.1"];
    externalInterface = "eth-wan";
  };
}
```

最后在内网接口上配置好 IP 和 DHCP 服务器：

```nix
{
  systemd.network.networks.eth-lan = {
    matchConfig.PermanentMACAddress = "12:34:56:12:34:56";
    address = ["192.168.0.1/24"];
    networkConfig = {
      DHCP = "no";
      DHCPServer = "yes";
    };
    dhcpServerConfig = {
      PoolOffset = 10;
      PoolSize = 200;
      EmitDNS = "yes";
      DNS = ["8.8.8.8"];
    };
  };
}
```

应用配置，`networkctl reload` 后，客户端即可上网。

## 视频转码

作为一台小体积（Small Form Factor）工作站，HP Z220 SFF 只能使用矮尺寸的 PCI-E 扩
展卡（高 8 厘米）而非标准尺寸的扩展卡（高 12 厘米）。同时，功率仅 240W 的电源也
没有额外的显卡供电线，所以我也无法使用高性能高功率的显卡。

我最开始花 40 刀买了一块 NVIDIA Quadro P400 显卡，TDP 为 30W。这块显卡本身的性能
非常差，约等于传说中的 NVIDIA GT 1010 显卡，连 1030 都不如。但是，它搭载了和 10
系列显卡相同的视频编解码电
路，[支持 H265 10-bit 视频编码](https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new)。
除了 GPU 核心工作频率不同外，Quadro P400 的视频转码性能和其它 10 系列显卡完全相
同。因此，Quadro P400 也是 Reddit 上很多 DIY NAS 玩家的选择。

我买到卡后进行测试，发现它确实可以转码 4K HEVC 的视频，速度能达到每秒 60 帧。但
如果我开启了 Jellyfin 的色彩空间映射（Tone-mapping），转码速度就会降到十几帧，导
致视频无法流畅播放。Tone-mapping 的用途是将视频的特殊色彩空间（例如 HDR 或杜比视
界）映射到标准的 SDR 色彩空间，让不支持 HDR 的设备也可以正确地显示这些视
频。Jellyfin Tone-mapping 用到了显卡的 3D 处理单元，而 Quadro P400 的 3D 性能非
常弱，导致了瓶颈的出现。

我后来把显卡换成了 NVIDIA Tesla P4，TDP 为 50W。虽然它是数据中心用的 Tesla 系列
计算卡，但它也支持视频编解码，拥有和 10 系列显卡相同的编解码电路。这张卡本身在
eBay 上卖 100 刀左右，但它是被动散热卡，所以还需要加 20 刀加装风扇和导风罩，让它
能在普通台式电脑中散热。

经过测试，这张卡可以在开启 Tone-mapping 的情况下，以 60 帧左右的速度将视频转码到
4K 80Mbps，完全满足我的视频转码需求。唯一的缺点是，HP Z220 SFF 的主板上没有标准
的风扇接口，我只能使用 USB 5V 到 12V 的升压线给风扇供电，让风扇一直保持在满速状
态。风扇噪音稍大，但对我来说可以接受。

另外，Tesla P4 还原生支持 NVIDIA GRID 功能，可以生成虚拟显卡给虚拟机使用。但
NVIDIA GRID 需要使用专门的宿主机驱动，不支持 3D、视频转码等功能，导致 Jellyfin
的视频转码无法使用。所以，我目前还是选择使用普通的驱动。
