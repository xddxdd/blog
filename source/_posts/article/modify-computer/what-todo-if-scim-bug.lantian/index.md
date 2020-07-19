---
title: 'SCIM抽风的解决办法'
categories: 计算机与客户端
tags: [Linux,折腾]
date: 2012-12-31 22:27:39
---
在Ubuntu 12.10下，我不喜欢用默认的ibus，软件源里的fcitx和scim都不带拼音包，于是我自己下载了scim的谷歌拼音模块，编译安装使用。

但是在使用过程中，scim经常动不动抽几下风，症状是无论点击什么输入框，scim通通不识别，认为这里无法输入中文。于是就只能打英文。

Bug掉的那次，我在和同学用pywebqq聊天，结果scim一抽，接下来的聊天都是用拼音进行的，直到对方一会儿没回复，我乘机注销，重新登录，才找回了scim。结果今天我在用电脑写作文，scim又抽风了。

我实在不想注销系统，于是打开终端，查查scim的命令。

```bash
xdd@xdd-asus:~$ scim --help
Smart Common Input Method 1.4.14

Usage: scim [option]...

The options are:
  -l, --list              List all of available modules.
  -f, --frontend name     Use specified FrontEnd module.
  -c, --config name       Use specified Config module.
  -e, --engines name      Load specified set of IMEngines.
  -ne,--no-engines name   Do not load those set of IMEngines.
  -d, --daemon            Run scim as a daemon.
  --no-socket             Do not try to start a SCIM SocketFrontEnd daemon.
  -h, --help              Show this help message.
xdd@xdd-asus:~$
```

我发现了-d这个命令行选项，估计是启动scim的。然后我一想，scim挂了，把它干了然后重启不就行了吗。于是我输了下面一行代码：

```bash
pkill -9 scim & scim -d
```

一执行，scim消失了。这时我按下Ctrl+Space，scim再次出现。点击libreoffice，语言、符号选项等全部出现，至此，问题解决。
