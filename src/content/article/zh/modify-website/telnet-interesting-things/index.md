---
title: '在 Telnet 中显示有趣的东西'
categories: 网站与服务端
tags: [Telnet]
date: 2016-07-27 16:42:00
---
Telnet 是1969年发布的最古老的网络协议之一，却经久不衰，因为它实现简单，也可以用来实现一些有趣的用途。

网络上有人开发出可以在 Telnet 终端中观看的彩虹猫（Nyancat），还有在 Telnet 中观看的星球大战。

<img src="/usr/uploads/2016/07/3175903277.png" alt="屏幕快照 2016-07-27 下午4.33.48.png" />

<img src="/usr/uploads/2016/07/43160460.png" alt="屏幕快照 2016-07-27 下午4.31.49.png" />

<img src="/usr/uploads/2016/07/1644335517.png" alt="屏幕快照 2016-07-27 下午4.31.56.png" />

在你的终端中输入以下内容，就可以看到 ASCII 字符版星球大战：（Windows 7 及以上用户需要先到控制面板-程序与功能-添加删除 Windows 功能里选中 Telnet 客户端功能才能使用）

```bash
telnet towel.blinkenlights.nl
```

输入以下内容就可以看到彩虹猫：

```bash
telnet nyancat.dakko.us
```

我们也可以在自己的服务器上建立一个类似的 Telnet 服务，让它显示自己定义的内容。我们以在终端中显示黑客帝国数字雨的 CMatrix 软件为例，说明如何建立这个服务。

- 登陆到你的 Debian 服务器上，输入下面的命令：

```bash
apt-get install openbsd-inetd telnetd cmatrix
```

并等待安装完成。

- 创建 /opt/cmatrix.sh ，输入如下内容：

```bash
#!/bin/sh
cmatrix -abu 2
```

- 编辑 /etc/inetd.conf ，在末尾追加以下内容：

```bash
telnet stream tcp nowait nobody /usr/sbin/tcpd /usr/sbin/in.telnetd -L /opt/cmatrix.sh
telnet stream tcp6 nowait nobody /usr/sbin/tcpd /usr/sbin/in.telnetd -L /opt/cmatrix.sh
```

- 重启 inetd 服务：

```bash
service inetd restart
```

然后，在你的电脑上输入 telnet &laquo;你的服务器地址&raquo;，就可以看到黑客帝国的数字雨效果了。

<img src="/usr/uploads/2016/07/40895505.png" alt="屏幕快照 2016-07-27 下午4.40.59.png" />

我也在自己的服务器上做了设置，输入以下命令可以看到彩虹猫：

```bash
telnet lantian.pub 2001
```

输入以下命令可以看到数字雨：

```bash
telnet lantian.pub 2002
```
