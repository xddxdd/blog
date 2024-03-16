---
title: 'W3 Total Cache 实现内存缓存'
categories: 网站与服务端
tags: [VPS,网站,折腾]
date: 2013-02-23 21:30:05
---
W3 Total Cache默认使用硬盘作为缓存，对于一些虚拟主机用户他们只能选择这个，但是对于VPS用户，他们的选择就大的多了，尤其是买到一些超售技术较好的VPS商（Host1Free？）硬盘速度稍微偏慢，就可以利用你多余的内存来做缓存了。

我自己先后在SAE、OpenShift、Host1Free VPS上搭了3个WP测试站，在这三者中只有VPS可以DIY，所以今天就对它开刀。（PS：SAE的本地文件读写限制搞得W3 Total Cache连设置都保存不了）

另外，一些PHP Opcode缓存软件（比如Zend Optimizer（不是Zend Guard），eAccelerator，XCache，APC等）也被W3TC支持，可以作为另一种方式的内存缓存，当然速度会略慢。

1.安装Memcache服务端和PHP支持组件

```bash
apt-get install memcached php5-memcached php5-memcache
# 如果你用LNMP或LLsMP（FastCGI）执行这一行
service php5-fpm restart
# 如果你用LAMP或LLsMP（LiteSpeed SAPI）执行这行
service apache2 restart
```

默认情况下Memcache占用内存是64M，但是不是一直64M，是个最大限制，平时你放了多少数据就占多少内存。所以你一般不用改，对于一个正常流量（1000IP）的站最大也就占20M左右。但是如果你的VPS是64M的，你可以到/etc/memcached.conf，把-m 64改成-m 16之类的。改完别忘service memcached restart。

2.W3TC设置

进入WP控制台/Performance/General Settings，把所有Cache的模式全部改成Memcached，如果是灰色的，说明你的Memcached没有配置成功，你需要检查你的设置。全部选择Memcached，然后保存配置，刷新缓存，就OK了。

3.使用Opcode组件缓存

根据我的测试，W3TC无法正常识别eAccelerator，所以我安装了XCache。

```bash
apt-get install php5-xcache
# 如果你用LNMP或LLsMP（FastCGI）执行这一行
service php5-fpm restart
# 如果你用LAMP或LLsMP（LiteSpeed SAPI）执行这行
service apache2 restart
```

进入WP控制台/Performance/General Settings，把所有Cache的模式全部改成Opcode:XCache，如果是灰色的，说明你的XCache没有配置成功，你需要检查你的设置。全部选择XCache，然后保存配置，刷新缓存，就OK了。
