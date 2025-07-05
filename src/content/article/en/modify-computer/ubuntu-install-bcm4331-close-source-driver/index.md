---
title: 'Installing Closed-Source Driver for BCM4331 Network Card on Ubuntu'
categories: Computers and Clients
tags: [Linux]
date: 2014-10-12 16:11:47
autoTranslated: true
---


The Ubuntu system supports a wide range of devices out-of-the-box because it includes numerous open-source drivers provided by the community. However, open-source drivers often suffer from stability and performance issues compared to official drivers. Due to licensing restrictions, closed-source drivers cannot be bundled with the installation media, so users typically need to install them immediately after setting up Ubuntu.

As noted by Zhihu user Deng Boyuan:  
[http://www.zhihu.com/question/22776909](http://www.zhihu.com/question/22776909)

````bash
Windows消失后：一时间世界人民给石油工地的电脑装上Linux和新开发的Linux上的工业软件，但是圈内就石油设备的驱动问题分成两派，美国的开源原教旨主义者坚持在墨西哥湾的钻井平台上使用开源驱动，导致产能大大下降；大庆油田被cnbeta的技术宅装上了5种桌面8种发行版并逐一美化跑分，而且要用石油设备放个Bad Apple，后自行编译内核，卒…其他油田由于发行版不同，升级工业软件后有些需要停工几天，特别是天天pacman -Syu的，爆炸事故时有发生。```

My MacBook Pro uses Broadcom's BCM4331 wireless network card, for which Ubuntu includes an open-source driver. However, I frequently experienced disconnection issues (manifested as "Destination Host Unreachable" ping errors, indicating packets couldn't reach the target machine). After researching on Google, I discovered many users report problems with this card's open-source driver, and Broadcom provides a closed-source alternative.

Although Broadcom's official Linux closed-source driver compatibility list doesn't include BCM4331, user testing ([http://wireless.kernel.org/en/users/Drivers/b43#Supported_devices](http://wireless.kernel.org/en/users/Drivers/b43#Supported_devices)) confirms it works properly with the closed-source driver.

Below is the method to uninstall the open-source driver and install the closed-source version. Before proceeding, ensure you have alternative network access (e.g., Ethernet cable or Bluetooth tethering to a mobile device).

```bash
sudo apt-get install b43-fwcutter firmware-b43-installer linux-firmware-nonfree
sudo apt-get purge bcmwl-kernel-source broadcom-sta-common broadcom-sta-source
````

Reboot your computer after executing these commands.
```
