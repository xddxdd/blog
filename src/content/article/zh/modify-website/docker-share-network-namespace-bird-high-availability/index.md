---
title: 'Docker 容器共享网络命名空间，集成 Bird 实现 Anycast 高可用'
categories: 网站与服务端
tags: [Docker, Bird]
date: 2020-03-13 20:23:20
---

正好一年前，
我[在 DN42 网络内用 Docker 建立了 Anycast 服务](/article/modify-website/dn42-docker-anycast-dns.lantian)。
当时我的方法是，自定义容器的镜像，在其中安装一个 Bird，然后加入 OSPF 协议的配置
文件来广播 Anycast 路由。但是随着时间推移，这套方案出现了以下问题：

1. 安装 Bird 本身是个较花时间的过程。我的 Bird 不是用 `apt-get` 装的，因
   为[我的 Dockerfile 需要支持多种 CPU 架构](/article/modify-website/gpp-preprocess-dockerfile-include-if.lantian)，
   而 Debian 有些架构的软件源里没有 Bird。而又因为我的构建服务器是 AMD64 架
   构，[使用 `qemu-user-static` 支持其它架构的镜像运行](/article/modify-computer/build-arm-docker-image-on-x86-docker-hub-travis-automatic-build.lantian)，
   为其它架构制作镜像、编译程序时就涉及到大量的指令集翻译，效率非常低。构建一个
   镜像在不同架构下的版本可能需要 2 小时以上，而安装应用本身的 `apt-get` 流程只
   需要几分钟。
2. 自己定制镜像也比较花时间。因为容器中需要同时运行目标应用（例如之前的
   PowerDNS）和 Bird，就不能直接把目标应用作为 ENTRYPOINT 了，而添加其它的管理程
   序（supervisord、s6-supervise、tini、自己写 Bash 脚本）等都额外增加了镜像复杂
   度（也就是出问题的概率），还要考虑信号、返回值传递，以及僵尸进程的问题。

最近我在读
[`docker-compose` 的参考文档](https://docs.docker.com/compose/compose-file/compose-file-v2/)时，
发现了 `network_mode` 即容器的网络模式可以设置成 `container:[ID]` 或者
`service:[name]`，也就是多个容器可以共享它们的网络命名空间，统一进行 IP 的分配和
路由。这意味着我可以单开一个 Bird 容器，然后把它挂到应用程序的网络上，就可以在不
动原容器的情况下实现 Anycast 了。

## 方案一：两个容器

最简单直观的方法就是两个容器，一个跑应用程序，一个跑 Bird。此处以 PowerDNS 为
例，我的配置文件如下：

```yaml
services:
    powerdns:
        image: xddxdd/powerdns
        container_name: powerdns
        restart: always
        volumes:
            - './conf/powerdns:/etc/powerdns:ro'
            - '/etc/geoip:/etc/geoip:ro'
        depends_on:
            - mysql
            - docker-ipv6nat
        ports:
            - '53:53'
            - '53:53/udp'
        networks:
            default:
                ipv4_address: 172.18.3.54
                ipv6_address: fcf9:a876:eddd:c85a:8a93::54
            anycast_ip:
                ipv4_address: 172.22.76.109
                ipv6_address: fdbc:f9dc:67ad:2547::54

    powerdns-bird:
        image: xddxdd/bird
        container_name: powerdns-bird
        restart: always
        network_mode: 'service:powerdns'
        volumes:
            - './conf/powerdns/bird-static.conf:/etc/bird-static.conf:ro'
        cap_add:
            - NET_ADMIN
        depends_on:
            - docker-ipv6nat
            - powerdns

networks: [省略...]
```

此处我把网络相关配置（包括 IP 和端口）都设置在了 PowerDNS 容器上，然后把 Bird 容
器指定 `network_mode: service:powerdns`，让它们共享网络命名空间。此处 Bird 容器
仍然需要 `NET_ADMIN` 权限来处理广播和路由的事情，但 PowerDNS 就不需要
`NET_ADMIN` 了，也算是提升了一点安全性？

然后 `docker-compose up -d` 启动两个容器就可以了。

## 问题出现了

但是没多久，主系统就收不到 Bird 容器发来的 OSPF 广播了。我进入 Bird 容器一看：

```bash
# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/sit 0.0.0.0 brd 0.0.0.0
3: gre0@NONE: <NOARP> mtu 1476 qdisc noop state DOWN group default qlen 1000
    link/gre 0.0.0.0 brd 0.0.0.0
4: gretap0@NONE: <BROADCAST,MULTICAST> mtu 1462 qdisc noop state DOWN group default qlen 1000
    link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
5: erspan0@NONE: <BROADCAST,MULTICAST> mtu 1450 qdisc noop state DOWN group default qlen 1000
    link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
```

IP 分配没了。我再一看 PowerDNS 容器，因为我的服务器上都有
[Watchtower](https://github.com/containrrr/watchtower) 自动跟进镜像的最新版本，
然后这段时间我的构建服务器更新了 PowerDNS 的镜像，容器被重新创建了。

因为 `network_mode` 中的 `service` 实际上是 `docker-compose` 提供的简写方式，实
际上是按容器 ID 绑定的。因为 PowerDNS 容器被重新创建了，Bird 容器的网络命名空间
也丢失了。

此时如果尝试重启 Bird 容器，会提示找不到 PowerDNS 原先 ID 对应的容器。但麻烦事情
来了：这时你执行 `docker-compose up -d` 时，`docker-compose` 不会帮你重新创建容
器，只会尝试启动现有的容器，然后失败。

因此，我需要一个永远运行、永远不更新的容器来承载网络命名空间，把随时会更新的
PowerDNS 和 Bird 的容器都挂载上去，来保证更新时不会出现严重的问题。

## 方案二：三个容器

我选择了 [Busybox 容器](https://hub.docker.com/_/busybox?tab=tags) 来永远运行，
它够小，占用内存也可以忽略不计。在我写这篇文章时，Busybox 的最新版本是 1.31.1。
但是 1.31.1 的镜像还是隔一段时间会有更新。因此我选择了上一个版本的 1.31.0 的镜
像，这个版本的镜像上次更新在 3 个月前。

我用 Busybox 运行 `tail -f /dev/null` 来让它永久运行。这个操作不占用 CPU。我额外
给容器设置了 Label，禁止 Watchtower 对它进行更新。

配置文件如下：

```yaml
services:
    powerdns-net:
        image: amd64/busybox:1.31.0
        container_name: powerdns-net
        restart: always
        entrypoint: 'tail -f /dev/null'
        labels:
            - com.centurylinklabs.watchtower.enable=false
        depends_on:
            - docker-ipv6nat
        ports:
            - '53:53'
            - '53:53/udp'
        networks:
            default:
                ipv4_address: 172.18.3.54
                ipv6_address: fcf9:a876:eddd:c85a:8a93::54
            anycast_ip:
                ipv4_address: 172.22.76.109
                ipv6_address: fdbc:f9dc:67ad:2547::54

    powerdns:
        image: xddxdd/powerdns
        container_name: powerdns
        restart: always
        network_mode: 'service:powerdns-net'
        volumes:
            - './conf/powerdns:/etc/powerdns:ro'
            - '/etc/geoip:/etc/geoip:ro'
        depends_on:
            - docker-ipv6nat
            - powerdns-net

    powerdns-bird:
        image: xddxdd/bird
        container_name: powerdns-bird
        restart: always
        network_mode: 'service:powerdns-net'
        volumes:
            - './conf/powerdns/bird-static.conf:/etc/bird-static.conf:ro'
        cap_add:
            - NET_ADMIN
        depends_on:
            - docker-ipv6nat
            - powerdns

networks: [省略...]
```

此处，Busybox 的容器会一直稳定的运行，保证网络命名空间的正常；PowerDNS 和 Bird
都挂上去提供服务，同时它们可以任意更新而不影响整个网络命名空间的存在。

至于 Busybox 占用多少资源：

```bash
# docker stats --no-stream
CONTAINER ID        NAME                     CPU %               MEM USAGE / LIMIT   MEM %               NET I/O             BLOCK I/O           PIDS
...
803b11f02b3a        powerdns-recursor-net    0.00%               384KiB / 734MiB     0.05%               10.3MB / 3.98MB     1.43MB / 0B         1
...
```

384KB 内存可以直接忽略不计。
