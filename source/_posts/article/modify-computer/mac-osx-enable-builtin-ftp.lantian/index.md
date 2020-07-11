---
title: 'Mac OS X 开启内置FTP服务'
label: mac-osx-enable-builtin-ftp
categories: 计算机与客户端
tags: [Mac,FTP]
date: 2014-07-05 21:15:17
image: /usr/uploads/52151404566003.png
---
由于某些原因，我希望从手机里通过FTP访问电脑上的文件。而Mac OS X一直内置了FTP和SSH服务，因此我希望把他们启用。

点左上角苹果图标-系统偏好设置-共享，选中左侧远程登录的复选框，同时确认你的用户名在允许登录的列表里。

<img src="/usr/uploads/52151404566003.png" title="屏幕快照 2014-07-05 下午9.05.20.png"/>

在手机的ES文件浏览器里选择SFTP方式连接，输入电脑的IP和你的用户名密码就可以连接了。但是实际使用中，由于SFTP是基于SSH的协议，安全要求高，也就是传输速度慢，仅100KB/S左右，连保证正常播放视频都不能做到。

旧版本Mac里在共享中可以启用FTP方式共享文件，但是在新版系统中这个选项被删除了，但是内置的FTP服务器一直保留，我们只需要打开实用工具-终端，用一行命令启用它就可以了：

```bash
sudo -s launchctl load -w /System/Library/LaunchDaemons/ftp.plist
```

过程中需要输入你的密码，注意输入时是不显示的，连星号也没有。

回车后，在手机里选择FTP方式，同样输入电脑内网IP和用户名密码，连接成功，实际使用中可以做到1MB/S的速度。
