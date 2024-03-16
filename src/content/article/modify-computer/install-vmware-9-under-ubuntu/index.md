---
title: 'Ubuntu 环境下安装 VMware Workstation 9'
categories: 计算机与客户端
tags: [折腾]
date: 2013-02-13 10:40:59
---
话说Ubuntu软件源里的VirtualBox越来越不给力，原先至少还能安装，现在装都装不上。官方源的那个倒是能用，但是要拖下来一大堆KDE组件，等VBox装好了，KDE也差不多了。然后我就决定去弄一个VMware玩玩。

下载地址：[http://download.pchome.net/system/sysenhance/download-10771.html](http://download.pchome.net/system/sysenhance/download-10771.html)

下载下来是一个末尾是bundle的文件，这就是VMware的安装程序。但是直接执行是不行的，我们要先给它执行的权限。

```bash
chmod +x VMware-Workstation-Full-9.0.0-812388.i386.bundle
sudo ./VMware-Workstation-Full-9.0.0-812388.i386.bundle
```

文件名记得自己改改。

然后安装程序启动，是一个安装向导，一路Next就可以了。安装完了，可是还没完。打开VMware的快捷方式，马上给我弹出一个框：找不到你当前Linux内核对应的头文件，请手动指定目录……

马上在命令行里一行apt-get install linux-headers，提示已经安装了。我点了一下浏览，默认的目录是/usr/src，里面linux的头文件挺全，怎么会找不到？继续Google。结果我发现，Linux 3.7内核的版本号文件被移动过了，VMware按照原来的目录当然找不到了。

（备注：Ubuntu原版的同学应该没有这个问题，原版内核是3.5，我的Ubuntu用PPA升级到了3.7）

解决方法很简单，建一个链接回去就行了。

```bash
ln -s /usr/src/linux-headers-3.7.0-7/include/generated/uapi/linux/version.h /usr/src/linux-headers-3.7.0-7/include/linux/version.h
ln -s /usr/src/linux-headers-3.7.0-7-generic/include/generated/uapi/linux/version.h /usr/src/linux-headers-3.7.0-7-generic/include/linux/version.h
```

（备注：若今后Linux内核版本号更新，记得把3.7.0-7改成自己的内核版本）

重新打开VMware，正常启动，提示正在编译内核文件。2分钟后，编译完成。我创建一个虚拟机，把Windows 8的光盘加载进去，点击了一下启动，这时我电脑突然黑屏了，屏幕上是一大排VMware内核驱动的调试信息……

Ctrl+Alt+F8，Ctrl+Alt+F7，回到X，VMware弹出一个提示：Cannot find a valid peer process to connect to。八成是那个Peer Process挂掉了。绝对是内核兼容性问题，绝对的。

再次Google，就找到了《[VMware Workstation 9引发kernel 3.5（包含最新版ubuntu）崩溃的解决方案](http://forum.ubuntu.org.cn/viewtopic.php?f=65&t=391262)》。里面提供了一个补丁。

描述的症状和我的还比较像，试一试。下载补丁后：

```bash
tar xjfv vmware9_kernel35_patch.tar.bz2
cd vmware9_kernel3.5_patch
sudo ./patch-modules_3.5.0.sh
```

Patch过程中，VMware驱动会重新编译。编译完，再次打开VMware，点击启动，问题解决了，Win8的小旗子出现在我的屏幕上。
