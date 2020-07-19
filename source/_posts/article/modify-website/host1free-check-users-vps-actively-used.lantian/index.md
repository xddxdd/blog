---
title: 'Host1Free 检查所有用户是否使用VPS'
categories: 网站与服务端
tags: [VPS,Host1Free]
date: 2013-02-06 19:48:05
---

Host1Free送VPS的活动已经搞了好一段时间了，总共上了30多台服务器，划出了总共30000台VPS（超售严重啊……免费的忍忍吧），引来超级大批用户注册，最重要的是官方不歧视景德镇用户注册。但是景德镇的人有一个特点，就是拿到之后玩，玩烦了就把它放在一边不管，或者是自己又搞到了其他的VPS（比如EC2，还有早几个月可以弄到VPS.me），就再也不去用它了。但是Host1Free总体比较敬业，每次服务器down掉，都会把所有的VPS都开起来，于是那些没人用的VPS，一个就是128M内存+640M Swap，浪费资源。

于是Host1Free想了一个奇葩的方法检查用户是否活跃使用，关机！大概上个星期四晚上，所有VPS全部被关机。同时Host1Free发邮件通知所有用户，赶紧到SolusVM里开启VPS，否则过几天就要被干掉了。

上个星期回到家，我想折腾VPS，结果连不上，到SolusVM里发现VPS关机了，于是我就开启了它（我以为Host1Free抽风了），折腾了一会儿。

结果今天我偶然点开Thunderbird看了一下，就看到Host1Free的这封邮件：

    Dear Host1Free Users,

    We have recently noticed that majority of the ONLINE free VPS servers are not being used and are simply kept online consuming resources.
    A week ago we have issued a shutdown on all of free VPS servers and we are currently monitoring the system to see how many of the servers are being actively used.

    We would like to inform you that all of the servers that will not be turned back ONLINE after the initial shutdown will be TERMINATED next week.

    Please take your time and turn ON your free VPS if you intend to use it, otherwise you will lose all of the data present on your server.

    If you found this message in your spam folder - mark it as not spam for future service alerts.

    Keep in mind - Host1Free does not provide any backups for your free services. You should do it by yourself.

    Regards,
    Host1Free

最危险的是，这篇文章居然是我在垃圾邮件箱里找到的！还好我的VPS已经开机，并且在活跃使用（折腾）。这时我突然想到imbushuo，他也有一个Host1Free VPS，但是他后来折腾EC2去了。不如帮他检查一下。

他的VPS绑了[http://preview.imbushuo.net](http://preview.imbushuo.net)，我打开网页，果然是CloudFlare的AlwaysOnline页面，然后我用微博通知他启动VPS。

我也提醒一下大家（虽然我的博客没什么人看），大家一定要赶紧开启VPS（不想再折腾的除外），免得自己的数据挂掉。
