---
title: 'gogoCLIENT DNS解析问题解决'
categories: 计算机与客户端
tags: [gogoCLIENT, IPv6, Windows]
date: 2014-06-01 23:17:00
image: /usr/uploads/87001401635846.png
---

这几天Google服务不怎么正常，所以我决定使用IPv6隧道来连接Google，以便获得较好的访
问速度。

按照我去年10月写的文章
《[Windows 8.1 下 gogoCLIENT 的安装使用与Bug修复](/article/modify-computer/windows-8-1-gogoclient-install-repair-bug.lantian)》，
我在我的电脑上设置好了隧道。但是此时我打开命令提示符Ping ipv6.google.com，系统竟
然提示“Ping 请求找不到主机 ipv6.google.com”。

这样我相当于还是在通过IPv4连接谷歌服务，无法达到我想要的效果。一般这个时候我都会
去Google，但是问题是Google连接时断时通……

很长时间过后，我终于找到了解决方案。

原因是微软在设计操作系统的时候，默认不会从IPv6隧道中查询DNS。解决方法如下：

1.开始-运行（或者Win+R），输入regedit回车。

<img src="/usr/uploads/87001401635846.png" style="float:none;" title="QQ截图20140601231205.png"/>

2.在左边窗口打开HKEY_LOCAL_MACHINE - SYSTEM - CurrentControlSet - services -
Dnscache - Parameters。

<img src="/usr/uploads/57211401635846.png" title="QQ截图20140601231245.png" style="white-space: normal; float: none;"/><br/>

3.在右边窗口右键新建-DWORD值，名字为AddrConfigControl。

经过以上操作，无需重启计算机，你就可以正常解析IPv6地址了。

感谢
[http://blog.ihipop.info/2012/01/2953.html](http://blog.ihipop.info/2012/01/2953.html)
和
[http://ipv6-or-no-ipv6.blogspot.sg/2009/02/teredo-ipv6-on-vista-no-aaaa-resolving.html](http://ipv6-or-no-ipv6.blogspot.sg/2009/02/teredo-ipv6-on-vista-no-aaaa-resolving.html)
。
