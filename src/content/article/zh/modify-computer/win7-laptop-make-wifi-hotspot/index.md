---
title: 'Win7 笔记本电脑发射无线网络'
categories: 计算机与客户端
tags: [Windows,无线网络]
date: 2013-07-30 10:31:44
---
先扯几句。

1.搬家了。

2.刚刚来装了网络，接口在客厅。

3.客厅没空调。

手上设备情况：两台笔记本电脑（分别Macbook，Win7），一只手机（貌似没用）。要求：用Win7笔记本发射无线网络。

尝试Macbook，结果只能发射Adhoc热点，我的安卓手机不认。尝试Win7自带网络创建，也是Adhoc，手机不认，Macbook虽然认出但是无法连接。

背景介绍完毕，正文开始。

1.开始菜单-程序-附件，右键以管理员权限打开，开始输入命令。

```bash
netsh wlan set hostednetwork mode=allow ssid=lantian key=lantian.pub
```

lantian改成自己想要的网络名，lantian.pub改成自己的密码，不能少于8位。

2.打开网络共享中心，找到多出来的一个无线网络，应该有Microsoft Virtual WiFi Miniport Adapter的字样，把它改个名字，比如“WiFi 热点”（不改也可以，自己分清楚）如果这个网络被禁用，那么启用它。如果没有多出来，见文末PS。

3.检查所有网络连接，IP设置全部改成自动分配IP。（可以先不做，但是不做的后果是等会可能会出现错误）

4.右键点击连外网的连接（如果是ADSL就是“宽带连接”，是局域网就是“本地连接”），属性-共享-允许其它用户通过此计算机的 Internet 连接来连接，打上勾，家庭网络连接选择“WiFi 热点”（就是刚才多出来的网络）。

如果出现英文提示“Internet Connection Sharing cannot be enabled...”，执行第3步。

5.命令提示符继续输入：

```bash
netsh wlan start hostednetwork
```

开启完成，现在其它设备都可以联网了。

PS：如果没有出现这个无线网络，请用驱动精灵驱动人生等等将你的无线网卡驱动更新到最新。如果还是不行，你的网卡不支持，放弃吧。
