---
title: '自建基于 GPS 的 NTP 服务端'
categories: 网站与服务端
tags: [NTP, GPS]
date: 2019-09-16 21:01:00
image: /usr/uploads/2019/09/61107773.png
---

## NTP 是什么

NTP（Network Time Protocol）是目前使用最广泛的互联网时间同步协议。我们常用的
Windows、macOS、Linux 等都自带了 NTP 客户端，可以连接远程服务器获取当前的时间。
例如，Windows 的 Internet 时间同步功能就是基于 NTP：

![Windows Internet 时间同步][1]

（图片来自网络）

Windows 默认会连接到 time.windows.com 这台由微软维护的 NTP 服务器同步时间。但
是，默认的这台服务器在国内并不好用。这台服务器位于美国，到国内的延迟很大并且容易
波动，因此 NTP 客户端也很难得出准确的时间。

那么中国大陆有没有 NTP 服务器呢？有，但是不多：

-   cn.pool.ntp.org
    -   由 [www.pool.ntp.org][2] 维护的 NTP 服务器池项目，所有服务器由志愿者提
        供，在各个地区通过 DNS 负载均衡到不同的服务器上。
    -   现在（2019 年 9 月 16 日）共有 63 台服务器位于 CN 池内（但不是所有的服务
        器都在国内）
    -   可以通过 0.cn.pool.ntp.org，1.cn.pool.ntp.org 等方式获得更多的服务器
-   cn.ntp.org.cn
    -   V2EX 网友 qiuai 维护的 NTP 服务器池，似乎部分服务器是自行维护的，部分是
        志愿者提供
    -   目前网站 [www.ntp.org.cn][3] 正在备案，但 NTP 仍然可用
-   ntp.ntsc.ac.cn
    -   中科院国家授时中心的 NTP 服务器
-   ntp[1-7].aliyun.com
    -   阿里云的 NTP 服务器，共有 7 台服务器
    -   之前的域名是 time.pool.aliyun.com 以及 time[1-7].aliyun.com，似乎现在还
        可以使用
-   time[1-5].cloud.tencent.com
    -   腾讯云的 NTP 服务器，共有 5 台服务器

## 自建 NTP 服务器的用途

1. 特殊环境对时间精度有极高要求：
    - 金融（高频交易？）
    - 航空航天
    - 科研
    - 跨地区数据同步
2. 保证时间服务的可用性：
    - 比起依赖志愿者的 NTP 服务器，自建更加可靠
    - 避免单台服务器由于故障、受攻击等下线
    - 在互联网中断时仍然可以保持各设备时间同步
3. 这很有趣，不是吗？

## 需要的设备、材料

-   一台运行 Linux 系统的电脑，要求带有串口

    -   树莓派就是个不错的选择，如果你只是为了 NTP 服务器，树莓派 0 就不错（淘宝
        上大概 60 块钱一个）
    -   或者一台台式电脑，加上一个 USB 转串口模块（淘宝上 5 块钱一个，关键词
        CH340）
    -   我是连接 Tinker Board 使用，但为了配置 GPS 模块（非必须）也用到了串口模
        块，是下图这个
    -   ![CH340 USB 转串口模块][4]

-   一个 GPS 模块

    -   如果你在大概 10 年前用过当时的智能手机（诺基亚塞班系统）或者导航仪
        （Windows CE）进行导航，你可能会有一个 USB 或者蓝牙的 GPS 接收器，你可以
        直接拿来用
    -   如果没有，那就淘宝搜索 ATGM336H（GPS/北斗/GLONASS 三模模块，大概 30 块钱
        一个）
        -   我用的就是这个，目前（2019 年 9 月 16 日）淘宝上能找到的最便宜的三模
            GPS 模块
        -   部分商家会标成 GPS/北斗 双模模块，但如果需要的话 GLONASS 可以通过配
            置软件自行打开
        -   我买的是下图这个
        -   ![ATGM336H 模块][5]

-   一根带较高增益的有源 GPS 天线

    -   如果你家住楼顶，或者准备把 GPS 模块放阳台等无遮挡处，可以不需要
    -   如果你家不在楼顶，并且你准备把模块放在窗边甚至室内，**强烈建议**购买一根
        天线，否则会很难搜到星
    -   需要的是看起来比较大个的天线，不是某些模块附送的迷你陶瓷天线，那种天线没
        什么用
    -   天线淘宝上大概 10 块钱一根，我买的是下图这个
    -   ![GPS 天线][6]
    -   如果你买的是类似上图的 SMA 接头天线，由于 ATGM336H 使用 IPX 接头，你还需
        要买一根 SMA 转 IPX 的转换线

-   一些母对母杜邦线，用于连接 GPS 模块与电脑
    -   淘宝上几块钱就能买一大堆

## GPS 模块安装及配置

第一步是把 GPS 的串口连接上。ATGM336H 模块的电压是 3.3V，因此可以直接连接 Tinker
Board：

-   模块 VCC 连接 17 针 3.3V 供电
-   模块 GND 连接 20 针地线
-   模块 RX 连接 8 针串口 1 的 TX
-   模块 TX 连接 10 针串口 1 的 RX
-   模块 PPS 连接 22 针

![Tinker Board 针脚图][7]

然后登录 Tinker Board 开始安装软件，我用的是 Armbian 系统。

首先运行 `armbian-config`，在 System - Hardware 中开启 uart 开头的所有选项（所有
串口），然后重启。

然后安装 gpsd，负责接收 GPS 模块的定位信息

    apt-get install gpsd gpsd-clients

然后编辑 `/etc/default/gpsd`，按如下所示修改配置：

    START_DAEMON="true"
    USBAUTO="false"
    DEVICES="/dev/ttyS1"
    GPSD_OPTIONS="-n -b"

上述配置启用了 gpsd，指定了 GPS 所在的串口（ttyS1），让 gpsd 一启动就立即开始定
位，并且禁止 gpsd 修改模块设置。

启动 gpsd：

    systemctl enable gpsd
    systemctl start gpsd

然后运行 cgps，可以看到位置与搜星情况：

![GPS 搜星情况][8]

## NTP 服务器配置

首先禁用 systemd-timesyncd，系统自带的功能比较简单的 NTP 客户端：

    systemctl disable systemd-timesyncd
    systemctl stop systemd-timesyncd

然后安装全功能的 ntp 服务端：

    apt-get install ntp

在 `/etc/ntp.conf` 中添加 GPS 相关的配置：

    # GPS Serial data reference
    server 127.127.28.0 minpoll 4 maxpoll 4
    fudge 127.127.28.0 time1 0.0 refid GPS

最后启动 NTP 服务端：

    systemctl enable ntp
    systemctl start ntp

运行 `ntpq -pn` 查看状态：

![NTP 状态][9]

## 还需改进的地方

1. 没有利用上高精度的 PPS 信号
    - Tinker Board 的 Armbian 内核没有 PPS 对应的配置，
    - 需要重新编译内核，或者用用户态的程序处理

更新：以上问题已经在后续文章中解决，点击链接进
入：[/article/modify-website/diy-ntp-pps-on-tinker-board.lantian][10]

[1]: /usr/uploads/2019/09/51126337.jpg
[2]: http://www.pool.ntp.org
[3]: http://www.ntp.org.cn
[4]: /usr/uploads/2019/09/4242908871.jpg
[5]: /usr/uploads/2019/09/2614025970.jpg
[6]: /usr/uploads/2019/09/354608019.jpg
[7]: /usr/uploads/2019/09/2308734009.png
[8]: /usr/uploads/2019/09/32557744.png
[9]: /usr/uploads/2019/09/61107773.png
[10]: /article/modify-website/diy-ntp-pps-on-tinker-board.lantian
