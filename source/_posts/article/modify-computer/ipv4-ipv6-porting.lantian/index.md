---
title: 'IPv4 与 IPv6 的互通'
categories: 计算机与客户端
tags: [互通,IPv6,IPv4,折腾]
date: 2013-04-20 18:25:37
---
IPv4 是目前支持最广泛的网络协议，网内计算机以IP地址标记，理论总共能放 $2^{32}$ 台（IPv4：8个16进制位）网络设备，可惜现在已经用完了，真不知道各大ISP是怎样把有限的IP分给无限的计算机的。

IPv6 则要NB的多，每个地址有32个16进制位，也就是 $2^{128}$ 台网络设备，在人类因为地球撑不住而挂掉之前，这些IP完全够用。这一协议被各大互联网公司推崇，包括Google，DNSPod，等等。但是目前天朝好像只有大学里用IPv6，普通百姓家只能用IPv4。

（吐槽：大学里也不完善，国外一般都是IPv4v6通吃，教育网内只有v6）

而现在IPv6资源也越来越多，所以在天朝ISP采取行动前，我们可以先通过软件辅助，让我们用上IPv6。

1.Miredo（Teredo） 篇
Miredo好像是一个开源组织搞出来的程序，用来实现46通，不过后来协议被微软借去了，写进Win7，同时微软也顺带捐赠了一台服务器……Miredo可以用来实现简单的46互通，但是因为节点巨少，速度巨慢。

```bash
sudo apt-get install miredo
sudo gedit /etc/miredo/miredo.conf
```

把里面的内容改成下面的：

```bash
InterfaceName teredo
#ServerAddress teredo.ipv6.microsoft.com
ServerAddress teredo-debian.remlab.net
#ServerAddress teredo.managemydedi.com
BindPort 3545
```

里面三个ServerAddress都是目前网络上只剩的可用服务器，第一台微软，第二台是默认的（开源社区弄的），第三台不清楚。

三台服务器距离天朝较远，速度较慢，能勉强打开Google，连打开百度都有困难，只能用作炫耀用。

改完执行：

```bash
sudo service miredo restart
ifconfig
```

看到一个名叫teredo的网络设备，就是他了。

2.gogoCLIENT 篇
gogoCLIENT是gogo6网站弄出来的，该网站专门销售支持IPv6的各种设备，他开发了gogoCLIENT，并且开源使用。缺点是，节点还是很少。还有一个缺点，Ubuntu软件源里的gogo6用不了，自己编译根本通不过。

所以，我用QEMU安装了一个XP虚拟机。

```bash
sudo apt-get install kvm qemu
qemu-img create -f raw winxp.img 4G
qemu-kvm -hda winxp.img -cdrom winxp.iso -boot d -m 1024 #安装系统
```

然后下载gogoCLIENT：（要注册一个帐号）[http://www.gogo6.com/profile/gogoCLIENT](http://www.gogo6.com/profile/gogoCLIENT)

并在虚拟机中安装。安装完成后打开gogoCLIENT主界面，Server Address 改成“hg.tfn.net.tw”，点击下面的Connect。很快，你就连接上了IPv6网络。我之所以推崇这种方式，是因为gogo6服务器相对miredo要多，上面这个是台湾的，速度很快，官方还提供了montreal.freenet6.net（蒙特利尔）和amsterdam.freenet6.net（阿姆斯特丹）和taiwan.freenet6.net（台湾，我这里连不上）三台服务器，注意：前两台需要用户名密码，可以去gogo6申请，与账户信息独立。

接下来，我们就要把IPv6导入主机。首先解决qemu自动启动问题。我不喜欢一个大窗口呆在屏幕上，所以我选择了VNC后台桌面。

```bash
sudo apt-get install vnc4server
vncpasswd
#输入两次密码
wget http://www.zhujis.com/myvps/vncserver
sudo cp vncserver /etc/init.d/
sudo chmod +x /etc/init.d/vncserver
sudo update-rc.d vncserver defaults
#感谢www.freehao123.com
vncserver
vncserver -kill :1
leafpad ~/.vnc/xstartup
#末尾添加：
#qemu-kvm -hda /路径/winxp.img -m 1024 -smp 4 -localtime -usbdevice tablet -vga std -redir tcp:3389::3389 -redir tcp:1080::1080 &
#不要添加前面的#号！
#注释：-m 1024 为内存（MB），-smp 4 为处理器核心数目，
#-localtime为使用当前时区时间，-usbdevice tablet 解决鼠标bug，
#-vga std 扩大分辨率调节范围，-redir为端口转发
#我给虚拟机开了远程桌面所以开放3389，如果你不需要请删掉这一个参数！
sudo service vncserver restart
```

然后用remmina连上虚拟机，安装代理软件apache。（CCProxy不支持IPv6）

首先安装Apache 1.3，然后在服务管理器里停止Apache 1.3，删掉C:\Program Files\Apache Group\Apache里的所有文件，替换成下面的。

注意：apache原版对IPv6支持不佳，请下载我提供的Apache 1.3 修改版，已经配置好HTTP代理。

下载：[/usr/uploads/2013/04/1343548325.7z](../../../../usr/uploads/2013/04/1343548325.7z)

在服务管理器启动服务。一般就可以直接用了。

在你的主机上设置浏览器代理为HTTP 127.0.0.1:1080，访问www.kame.net，上面的小乌龟应该会动，如果不会动，说明你的配置出现了问题。
