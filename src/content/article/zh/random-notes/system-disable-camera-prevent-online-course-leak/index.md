---
title: 系统禁用摄像头防止网课翻车
categories: 随手记
tags: [Linux, 摄像头]
date: 2020-03-11 15:50:47
---

本文介绍如何在 Windows 和 Linux 中禁用摄像头驱动，从而：

1. 在系统层面上避免误操作开启摄像头，把你 ~~在吃饭~~ ~~在床上~~ ~~在玩王者荣耀~~
   ~~在（数据删除）~~ 的样子直播出来
2. 避免部分网课软件后台开启偷拍

## Windows 操作方法

按下 `Win+R` 组合键调出运行窗口，输入 `devmgmt.msc` 并确定调出设备管理器窗口。你
的摄像头会出现在 `图像处理设备` 一类中，右键停用它。

（下图截自 Windows XP，但 Windows 7 和 10 上的操作相同。）

![Windows 禁用摄像头](../../../../usr/uploads/202003/windows-disable-camera.png)

当需要使用摄像头时，再回到此处启用摄像头，关闭并重新打开浏览器/网课软件即可。

## Linux 操作方法

```bash
# 首先关闭浏览器、网课软件等占用摄像头的设备
sudo modprobe -rv uvcvideo
sudo nano /etc/modprobe.d/disablecamera.conf
# 输入如下内容并保存
blacklist uvcvideo
```

当需要使用摄像头时运行 `sudo modprobe -v uvcvideo` 加载驱动，用完后
`sudo modprobe -rv uvcvideo` 卸载驱动。加载/卸载后，关闭并重新打开浏览器/网课软
件即可。
