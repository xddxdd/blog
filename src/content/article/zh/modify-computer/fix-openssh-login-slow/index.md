---
title: '解决 OpenSSH 登录缓慢的方法'
categories: 计算机与客户端
tags: [ssh]
date: 2014-12-26 19:53:57
---

今天连接 Azure 中国版虚拟机时发现登录反应非常慢，在网络环境良好的情况下要等上十
几秒才出现输入密码的提示。

经过 Google 查询，发现是 DNS 反向解析的问题。

OpenSSH 会在你登录时把你的 IP 拿去做反向解析，从而判断你的 IP 在不在系统的黑名单
内。但是中国电信不对民用网络的 IP 做反向解析，导致 OpenSSH 要等待解析结果直到超
时，然后才建立连接。

解决方法就是把反向解析关掉就行。

```bash
sudo nano /etc/ssh/sshd_config
# 在文件末尾加上“UseDNS no”，关闭文件
sudo service ssh restart
```

如果这样设置后还是连接缓慢，可以尝试如下设置：

```bash
sudo nano /etc/ssh/sshd_config
# 在文件末尾加上“GSSAPIAuthentication no”，关闭文件
sudo service ssh restart
```

如此设置之后，SSH 就可以在2秒内连通，相比之前十几秒的时间相比，速度大有改观。
