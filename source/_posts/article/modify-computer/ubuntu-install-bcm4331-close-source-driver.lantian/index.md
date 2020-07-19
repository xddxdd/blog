---
title: 'Ubuntu 安装 BCM4331 网卡闭源驱动'
categories: 计算机与客户端
tags: [Linux]
date: 2014-10-12 16:11:47
---
Ubuntu 系统对于大量设备都可以做到安装即用，因为 Ubuntu 内置了许多开源社区提供的驱动。问题是，开源驱动相对于官方驱动有稳定性差、性能差的问题，而闭源驱动由于版权问题不能集成在安装光盘内，因此一般安装完 Ubuntu 后就要立即联网安装闭源驱动。

正如知乎网友邓博元所说：[http://www.zhihu.com/question/22776909](http://www.zhihu.com/question/22776909)

```bash
Windows消失后：一时间世界人民给石油工地的电脑装上Linux和新开发的Linux上的工业软件，但是圈内就石油设备的驱动问题分成两派，美国的开源原教旨主义者坚持在墨西哥湾的钻井平台上使用开源驱动，导致产能大大下降；大庆油田被cnbeta的技术宅装上了5种桌面8种发行版并逐一美化跑分，而且要用石油设备放个Bad Apple，后自行编译内核，卒…其他油田由于发行版不同，升级工业软件后有些需要停工几天，特别是天天pacman -Syu的，爆炸事故时有发生。```

我的 Macbook Pro 使用 BroadCom 公司的 BCM4331 无线网卡，Ubuntu 内置了其开源驱动。但是在使用过程中频繁出现掉线问题（体现为ping提示“Destination Host Unreachable”，即数据包无法到达目标机器），经过 Google 搜索，这款网卡的开源驱动问题许多人都有，而且 BroadCom 提供这款网卡的闭源驱动。

BroadCom 公司给出的 Linux 闭源驱动支持列表虽然不包括 BCM4331，但是经过网友测试（[http://wireless.kernel.org/en/users/Drivers/b43#Supported_devices](http://wireless.kernel.org/en/users/Drivers/b43#Supported_devices)），BCM4331 在闭源驱动上工作正常。

以下是卸载开源驱动，安装闭源驱动的方法。折腾前建议确保自己有其它连接网络的方式，例如插网线联网，或者用蓝牙连接手机联网。

```bash
sudo apt-get install b43-fwcutter firmware-b43-installer linux-firmware-nonfree
sudo apt-get purge bcmwl-kernel-source broadcom-sta-common broadcom-sta-source
```

执行完成后重启电脑即可。
