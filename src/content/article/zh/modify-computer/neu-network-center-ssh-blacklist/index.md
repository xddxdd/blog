---
title: '使用东北大学网络中心的 SSH 黑名单系统'
categories: 计算机与客户端
tags: [Linux, ssh]
date: 2017-03-27 22:26:00
image: /usr/uploads/2017/03/4117890454.png
---

东北大学网络中心在其网站上提供了一份 SSH 黑名单，列出了使用端口扫描工具扫描 SSH
端口的 IP 名单，貌似是由他们自己设立的蜜罐服务器检测统计的。同时，他们也提供了黑
名单对应的 hosts.deny 文件的下载，允许用户使用 cron 一类的计划任务软件自动更新
SSH 黑名单列表并屏蔽这些扫描者（阻止它们登录）。

不确定这套系统是什么时候推出的，但是它至少已经运行了两年了。另外，它对于这些 IP
的屏蔽时间貌似是最后一次发现的 60 天内。

![东北大学网络中心 网络威胁黑名单系统][1]

使用方法：在服务器上安装 cron，然后运行如下命令安装脚本：

    ldd `which sshd` | grep libwrap
    cd /usr/local/bin/
    wget antivirus.neu.edu.cn/ssh/soft/fetch_neusshbl.sh
    chmod +x fetch_neusshbl.sh
    cd /etc/cron.hourly/
    ln -s /usr/local/bin/fetch_neusshbl.sh .
    ./fetch_neusshbl.sh

这个脚本会每小时连接东北大学网络中心的服务器，下载最新的 hosts.deny 并应用到你的
系统上。

[1]: /usr/uploads/2017/03/4117890454.png
