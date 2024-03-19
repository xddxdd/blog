---
title: '在 Traceroute 里膜 拜大佬'
categories: 计算机与客户端
tags: [Traceroute, DN42]
date: 2018-08-15 19:46:00
image: /usr/uploads/2018/08/2301166997.png
---

## 2020-10-11 更新

已经有了更好的配置方法，不需要启动一大堆 Docker 容器了。请参阅
《[优雅地在 Traceroute 里膜 拜大佬](/article/creations/traceroute-chain.lantian)》。

## 简介

Traceroute 是常用的检查网络状况的工具之一，会显示你操作的电脑到指定服务器的网络
路径上经过的每一个路由器的 IP 地址，类似于这样：

![Traceroute 示例][1]

可以看到后两跳的 IP 显示出了对应的域名，这个域名就是 IP 的反向解析记录。反向解析
记录在 DNS 服务器中以类似 4.3.2.1.in-addr.arpa 域名的 PTR 记录形式存在。更多的信
息可以参考《[在 DN42 中设置 IP 反向解析][2]》这篇文章。

然而，PTR 记录并不一定要设置成实际的域名，可以设置成任意的字符串，只要“和域名长
得像”即可。利用这一点，我们可以在一段 Traceroute 中的每一跳上写一句话，整段就组
成了完整的文章，类似下图：

![Traceroute 文章示例][3]

本文均在 DN42 网络中完成，如果你已经加入了 DN42 网络，可以 ping、traceroute 通文
中的 IP。但本文并不局限于 DN42，如果你有可以自己控制反向解析的公网或内网 IP 段，
也可以用相同的方法完成设置。

## 准备路由

第一步是设置一批路由器，让它们依次把某个 IP 对应的数据包层层转发下去，从而在
Traceroute 中产生一条较长、足以写文章的路径。

最原始的方法，就是找几台路由器，用网线串联起来。但是首先，我得有这么多路由器；另
外，我还得把它们连入 DN42。

进一步想，Linux 也具有路由功能，也可以在一台服务器上开几台 Linux 虚拟机，分别分
配 IP 地址，然后在每台上面运行：

```bash
ip route add [目标 IP]/32 via [下一个虚拟机的 IP]
```

目标 IP 的流量就会经过每一台虚拟机转发，产生一段路径。

接下来就要考虑怎么开这些虚拟机了。我的 Kimsufi 服务器上有 ESXi，用 Alpine Linux
开一排虚拟机也不是很占资源，但是如果这样操作，就需要手动配置好几台（本例中是 5
台）虚拟机，太麻烦了！

换一种思路：Docker 实际上就是一个对 LXC 容器的管理工具，而 LXC 容器都拥有独立的
网络命名空间，可以独立设置自己的 IP、路由信息，在这个用途中完全可以代替完整的
Linux 虚拟机。

接下来就开始制作 Docker 镜像了。大致思路是基于 Alpine 镜像，然后在启动时运行如下
脚本：

```bash
#!/bin/sh
echo Target IP is $TARGET_IP
THIS_IP=$(ip addr show dev eth0 | grep inet | cut -d' ' -f6 | cut -d'/' -f1)
echo My IP is $THIS_IP
NEXT_IP=$(echo $THIS_IP | awk -F. '{print $1 "." $2 "." $3 "." $4 + 1}')
if [ $THIS_IP == $NEXT_IP ]; then
    echo I\'m the target, listening
else
    echo Routing $TARGET_IP to $NEXT_IP
    ip route add $TARGET_IP/32 via $NEXT_IP
fi
ping 127.0.0.1 -q
```

最后一行的 ping 是让容器一直运行下去，不要退出。完整的 Dockerfile 可以在
[https://github.com/xddxdd/dockerfiles/tree/master/route-next][4] 看到。

然后是生成对应的 docker-compose.yml 以便统一管理，示例可以在上述 Repo 中看到。也
可以用上述 Repo 中的 mk-compose.py 工具来快速生成 docker-compose.yml，但是生成完
后仍需手工修改 network 中的网段信息。

然后把它传到服务器上 `docker-compose up -d` 启动这批容器。

最后，在运行 Docker 的服务器上执行这条命令：

```bash
ip route add 172.22.76.102/32 via 172.22.76.98
```

把流量传入第一个 Docker 容器。这时 Traceroute 一下，可以看到数据包的路径：

![数据包的路径][5]

## 准备文章

由于 PTR 记录只能存在英文，因此我们要先找一篇英文短文。由于 8 月 17 快到了，我选
了这样一篇文章：

> One should uphold his country’s interest with his life, he should not do
> things just to pursue his personal gains and he should not evade
> responsibilities for fear of personal loss.

由于上面数据包的路径上总共有 5 跳，因此将文章拆分成 5 段，并删除 PTR 记录中不允
许存在的标点符号：

- one should uphold his country s interest with his life
- he should not do things
- just to pursue his personal gains
- and he should not evade responsibilities
- for fear of personal loss

然后把空格全部换成英文句点：

- one.should.uphold.his.country.s.interest.with.his.life
- he.should.not.do.things
- just.to.pursue.his.personal.gains
- and.he.should.not.evade.responsibilities
- for.fear.of.personal.loss

然后一句一句填到路径上各个 IP 的 PTR 反向解析记录里：

![PTR 记录设置][6]

保存，等待 DNS 生效后：

![Traceroute 文章示例][3]

你在 Traceroute 中就可以看到一篇文章了。

[1]: /usr/uploads/2018/08/2301166997.png
[2]: /article/modify-website/dn42-ip-reverse-record.lantian
[3]: /usr/uploads/2018/08/1311499371.png
[4]: https://github.com/xddxdd/dockerfiles/tree/master/route-next
[5]: /usr/uploads/2018/08/846969415.png
[6]: /usr/uploads/2018/08/921227701.png
