---
title: '在 DN42 中使用 Docker 建立 Anycast DNS 服务'
categories: 网站与服务端
tags: [DN42, Anycast, BGP]
date: 2019-03-14 22:54:00
---

## 2020-03-16 提示

本文中的方案已有更新版本：参见
《[Docker 容器共享网络命名空间，集成 Bird 实现 Anycast 高可用](/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian)》。

建议阅读本文的概念介绍部分及 Bird 的大致配置，配合上文的 Docker 部署方案使用。

---

## 什么是 Anycast

互联网上常用的路由协议 BGP 是这样工作的：

-   我在 DN42 拥有 IP 段 172.22.76.104/29。
-   我通过 BIRD 等 BGP 软件，“宣告”这台服务器上可以访问到 172.22.76.104/29 这个
    IP 段。
-   与我有 Peering 的其它服务器记录下这一条消息：“通过某条路径，走 1 格可以访问
    到 172.22.76.104/29。”
-   其它服务器向与它们有 Peering 的服务器继续宣告：“这台服务器距离
    172.22.76.104/29 只有 1 格距离。”
-   以此类推，其余服务器也通过类似的流程，宣布自己与 172.22.76.104/29 有 2 格，3
    格，4 格距离……
-   所有服务器也都通过距离最短的路径，将数据发送到我的服务器。

在这种情况中，只有一台服务器宣布自己是 172.22.76.104/29 的“源头”。这就是单播
（Unicast）。而任播，即 Anycast，就是我在多台服务器（实际中往往在不同地理位置，
比如中国香港、美国洛杉矶、法国巴黎等）上都宣告自己有 172.22.76.104/29，其余服务
器仍然数格子将数据发送到最近的服务器。这样，中国大陆的用户更可能将数据发送到中国
香港的服务器，因为一般而言从中国大陆到香港的“格子”要比到其它地区少很多；同理，德
国的用户会请求法国巴黎服务器，美国芝加哥的用户会请求洛杉矶的服务器。

（注：以上说明相对真实情况做了简化；真实情况下 BGP 的选择路径流程更加复杂。）

在以上配置中，所有服务器都共享了同一个网段，最终互联网用户只要访问这个网段中的
IP 地址，就会被自动导到较近的服务器上，无需客户端软件的支持。

不过，Anycast 也有它的局限性：每台服务器仍然是独立的服务器，它们之间的网络连接状
态往往是不共享的。而互联网上的路由千变万化，每个用户都有可能在下一刻被分配到另一
台服务器，而这一切都在网络层（L3）完成，应用层（L7）的软件并不知情。这就意味着基
于有状态协议的服务（例如 TCP）较难稳定工作。因此，现在 Anycast 最常用在 DNS 等无
状态协议服务上。

## 我要实现什么功能

1. 统一某个服务的 IP 地址，方便其它程序配置：例如我将 DNS IP 固定为
   172.18.53.53，并在各个 VPS 上配置 Anycast，让到这个 IP 的请求发到最近的 VPS。
   之后我配置需要 DNS 的服务时，就可以直接将 IP 固定为 172.18.53.53，并将配置文
   件直接复制粘贴到其它 VPS 上批量部署。
2. 故障转移：有的时候我的 VPS 上的服务，还是例如 DNS，会因为我配置改错了/VPS 母
   鸡爆炸等原因停止运行。此时这台 VPS 上的 DNS 停止运行，VPS 停止宣布自己可以直
   接访问到 DNS 这个 IP，到 DNS 的请求会自动发到其它的 VPS。还活着的服务就不会跟
   着 DNS 一起挂掉。
3. 降低延迟：在 DN42 中，欧洲用户可以访问我的法国 VPS，美国用户可以访问洛杉矶
   VPS，亚洲用户访问香港 VPS，将延迟最小化，提高服务的稳定性。

一些额外的要求：服务部署必须使用 Docker。

## 现有方案的问题，及我的方法

网络上常见几种方案，都存在一些问题：

1. 在系统内直接添加 IP，直接进行 BGP 宣告。此时如果 DNS 服务爆炸，BGP 宣告不会停
   止，外部流量还是会转发到这台 VPS。因为 DNS 已经 GG，这个地区的 DNS 服务将不可
   用。
2. 在系统内直接添加 IP，使用 ExaBGP 配合监控脚本，在 DNS 爆炸时自动取消宣告路
   由。此时虽然路由已经取消，但系统内还是有这个 IP 地址，如果到 DNS 的流量经过这
   台 VPS（即使它们是奔着其它 VPS 去的），就会被这台 VPS 处理，该地区 DNS 服务仍
   然不可用。

这两个方案还有一个共同的缺点：不支持 Docker。

我最终采取的方案是，在 Docker 容器内添加 IP，并安装 Bird 通过 OSPF 协议与主系统
的 Bird 通信，进行宣告。如果容器挂掉了，宣告会自动停止。此时主系统上没有这个
IP，就会正常转发数据，而不会半路拦截。

## 给容器添加 IP

Docker 默认的网络驱动 bridge 会在主系统创建一张虚拟网卡，并且添加一个网段，让这
个网段都从这张网卡走。但如果这样配置，主系统会一直有一条将这个 IP 段指向虚拟网卡
的路由，导致经过这里的请求失败。因此，我们需要一个和主系统隔绝的网络。

在 Docker 中，在创建网络时使用 macvlan 驱动，并且开启 internal 选项，就可以创建
一个隔离的网络。

```docker
networks:
  anycast_ip:
    driver: macvlan
    internal: true
    enable_ipv6: true
    ipam:
      config:
        - subnet: 172.22.76.104/29
        - subnet: fdbc:f9dc:67ad:2547::/64
```

这个网络只负责给容器添加 IP 用，互联网访问仍然是走 Docker 默认的 bridge 网络。因
此，在容器中要这样配置：

```docker
services:
  dnsmasq:
    image: xddxdd/dnsmasq-bird
    [...]
    networks:
      default:
        ipv4_address: 172.18.1.53
        ipv6_address: fcf9:a876:ed8b:c606:ba01::53
      anycast_ip:
        ipv4_address: 172.22.76.110
        ipv6_address: fdbc:f9dc:67ad:2547::53
```

上例中 172.18.1.53 是容器在 bridge 网络的 IP，172.22.76.110 是容器分配到的
Anycast IP 地址。

启动容器后，可以看到容器分配到了两个 IP 地址：

```bash
# docker exec -it dnsmasq ip addr
[...]
391: eth1@if302: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:16:4c:6e brd ff:ff:ff:ff:ff:ff
    inet 172.22.76.110/29 brd 172.22.76.111 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fdbc:f9dc:67ad:2547::53/64 scope global flags 02
       valid_lft forever preferred_lft forever
392: eth0@if393: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:12:01:35 brd ff:ff:ff:ff:ff:ff
    inet 172.18.1.53/24 brd 172.18.1.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fcf9:a876:ed8b:c606:ba01::53/80 scope global flags 02
       valid_lft forever preferred_lft forever
```

并且容器默认仍然走 bridge 网络，外网访问没有受到影响：

```bash
# docker exec -it dnsmasq ip route
default via 172.18.1.1 dev eth0
172.18.1.0/24 dev eth0 scope link  src 172.18.1.53
172.22.76.104/29 dev eth1 scope link  src 172.22.76.110
```

## 容器宣告 IP

下一步是在容器中安装 Bird，对自己的 IP 进行宣告。Dockerfile 的例子可以在[这个
commit][1] 中看到。大致就是在容器中安装 Bird 和 Supervisord，由 Supervisord 启动
Bird 和 Dnsmasq。并且，将一份简单的 Bird 配置文件放入镜像中，让容器使用 OSPF 协
议进行 IP 宣告。

这里不使用 BGP 是因为 BGP 需要手工分配一个 AS 号，不仅麻烦，如果分配不当更会导致
诡异的路由结果。而 OSPF 的各个设备没有唯一的编号，方便部署。

配置文件如下：（Alpine 的 Bird 是 2.0 版本）

```bash
log syslog all;
protocol device {}
protocol ospf {
    ipv4 {
        import none;
        export all;
    };
    area 0.0.0.0 {
        interface "eth*" {
            type broadcast;
            cost 1;
            hello 2;
            retransmit 2;
            dead count 2;
        };
    };
}
protocol ospf v3 {
    ipv6 {
        import none;
        export all;
    };
    area 0.0.0.0 {
        interface "eth*" {
            type broadcast;
            cost 1;
            hello 2;
            retransmit 2;
            dead count 2;
        };
    };
}

include "/etc/bird-static.conf";
```

不过如果只使用这份配置文件，Bird 只会广播容器获得的路由，也就是只有
172.22.76.104/29 一条。而我们希望容器的 IP 172.22.76.110/32 也能有一条独立路由，
就要在 bird-static.conf 中设置静态路由。独立出一个文件是为了方便之后以 Volume 的
方式覆盖这个文件。

```bash
protocol static {
    ipv4;
    route 172.22.76.110/32 unreachable;
}

protocol static {
    ipv6;
    route fdbc:f9dc:67ad:2547::53/128 unreachable;
}
```

这份配置文件使 Bird 以 OSPF 协议在所有网卡上宣告这个两个 IP。

然后，在主系统上的 Bird 中添加 OSPF：（主系统的 Bird 是 1.6 版本）

```bash
protocol ospf lt_docker_ospf {
    tick 2;
    rfc1583compat yes;
    area 0.0.0.0 {
        interface "docker*" {
        type broadcast;
        cost 1;
        hello 2;
        retransmit 2;
        dead count 2;
        };
        interface "ltnet" {
        type broadcast;
        cost 1;
        hello 2;
        retransmit 2;
        dead count 2;
        };
    };
}
```

容器启动时不要忘了添加 NET_ADMIN 权限，否则 Bird 无法正常建立 OSPF 连接：

```yaml
  dnsmasq:
    image: xddxdd/dnsmasq-bird
    [...]
    cap_add:
      - NET_ADMIN
```

随后主系统就可以看到容器的宣告了：

```bash
# birdc show route protocol lt_docker_ospf
BIRD 1.6.3 ready.
172.22.76.110/32   via 172.18.1.53 on ltnet [lt_docker_ospf 00:00:37] * E2 (150/1/10000) [172.18.1.53]
172.22.76.109/32   via 172.18.1.54 on ltnet [lt_docker_ospf 17:41:06] * E2 (150/1/10000) [172.18.1.54]
172.22.76.104/29   via 172.18.1.54 on ltnet [lt_docker_ospf 01:00:08] * I (150/2) [172.18.1.54]
[...]
```

注意这里可以看到容器仍然广播了 Anycast 的 IP 段（似乎难以过滤），但因为单个的
Anycast IP 有 /32 的路由覆盖 /29 的路由，所以实际上没什么影响。

在每台 VPS 上做相同的设置，并将 VPS 两两做好 Peering，一个容器的宣告就可以被主系
统上的 Bird 再次宣告给其它 VPS，让所有 VPS 都可以访问到容器上的服务。

当某个容器被停止，所有流量会被转发到其它的 VPS，保证服务不中断。

## DN42 中的演示

我目前在 DN42 中建立了这样两个 Anycast 服务：

172.22.76.110 - 基于 Dnsmasq 的递归 DNS 172.22.76.109 - 基于 PowerDNS 的权威
DNS，为我的 IP 段和 lantian.dn42 域名提供解析服务

[1]:
    https://github.com/xddxdd/dockerfiles/tree/0b36ccecc7f8da33e994a479686bb78e918a969f/dnsmasq-bird
