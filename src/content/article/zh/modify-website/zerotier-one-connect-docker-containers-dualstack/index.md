---
title: '使用 ZeroTier One 在多台 Docker 服务器间建立双栈互通网络'
categories: 网站与服务端
tags: [ZeroTier One, Docker, IPv6, IPv4]
date: 2017-05-06 12:15:00
image: /usr/uploads/2017/05/3925858191.png
---

## 前言

多台 Docker 服务器上的容器互通是一个不好解决的问题。如果自建一个 Overlay 网络，
就需要在一台服务器上建立 etcd 之类的服务。但如果 etcd 所在的服务器挂了，整个网络
就 GG 了。我用的便宜 VPS 有偶尔网络中断的情况，我自己搞崩也服务器是常有的事，所
以我不能采取这种方式。

Docker 也有其它的基于 Overlay 的商业化组网方案，例如 Weave，但是对于个人用户来说
这些方案的价格太高了（我只是搞来玩玩），所以也不考虑。

在这些网络结构上，etcd 或者 Weave 之类的中心服务器记录了每个容器所在的服务器和内
部 IP，所以在任何容器上都可以直接 DNS 解析到其它容器。也就是说，假如我设置了
lantian-nginx 和 lantian-phpfpm 两个容器，在 nginx 的配置文件里我可以直接把
php-fpm 的地址填成 lantian-phpfpm:[端口号]，方便配置。

但我好像可以放弃这个功能啊？我的容器数量并不多，而且只有几个 MariaDB 需要跨服务
器连接，做数据库主从备份，手动指定一下 IP 并不麻烦。

那么我就可以直接使用传统的 VPN 方案来做互通了。

问题又来了：由于自己的服务器不稳定，我不希望某台服务器挂掉导致网络互通挂掉，所以
Open^\_^VPN 之类需要架设中心 VPN 服务器的也算了。Tinc 这类 P2P VPN 符合我的要
求，但是我的服务器常有增减，难道我每次都要一台台上去改配置吗？

有中央管理面板的 P2P VPN，我或许可以用 LogMeIn Hamachi。这款免费软件通过和
LogMeIn 公司的中心服务器连接，获取网络内其它计算机的实际 IP，并分别建立 P2P 连
接。我的服务器上倒是有 Hamachi，但是它只给每台计算机一个 IPv4 和一个 IPv6，对于
Docker 组网来说不够用啊。而且它每个网络只能让 5 台计算机互联，否则就要加钱。

到现在为止，我的需求如下：

1.  任何一台服务器 GG 不能影响其它服务器
2.  需要一个统一的管理面板可以快速增减服务器
3.  不需要 Docker 的 DNS 解析之类功能
4.  每台服务器可以获得多于一个的 IPv4 和 IPv6（可以是内网 ULA 网段），最好有一个
    内网网段

经过一番搜索，我选定了 ZeroTier One 这款软件。它类似于 Hamachi，但是相比之下它有
如下优点：

1.  我可以指定哪些 IPv4 网段被路由到 ZeroTier One，并且可以任意设置分配地址池。
2.  我可以让每台计算机分配到一个 IPv6 ULA 下的 /80 网段，足够 Docker 使用。
3.  每个用户可以免费添加 100 台计算机。

第一点尤其重要，例如，我可以设置给每台计算机在 172.27.0.0/16 下自动分配 IP，但是
我又可以统一指定把 172.28.0.0/24 路由到某台 Docker 服务器，172.28.1.0/24 路由到
另一台，以此类推。

## 安装与配置

ZeroTier One 官方提供一键安装脚本。在你的服务器上运行如下命令即可。

```bash
curl -s 'https://pgp.mit.edu/pks/lookup?op=get&search=0x1657198823E52A61' | gpg --import && \ if z=$(curl -s 'https://install.zerotier.com/' | gpg); then echo "$z" | sudo bash; fi
```

然后在 ZeroTier One 官方注册一个账号。这里需要你的手机号。我测试中国电信手机号可
以收到验证短信，但是隔了 7 个小时……最后我用的是 Google Voice 的号码。

注册登录后你就能看到如下界面：

![ZeroTier 管理界面][1]

点击上方的 Network（网络），再点击 Create New Network（创建新网络），你会看到列
表上多了一个网络。

![创建完成的新网络][2]

如图，第二个是我已有的网络，第一个是新创建的。点击进去。

![网络管理界面][3]

左上角是 Network ID，稍后你要输入到你的 ZeroTier 客户端去。

Short Name 是网络名称，你可以自定义以使得它更好辨别。

右上角 Managed Routes 是路由表设置，稍后再改。

IPv4 Auto-Assign 是 IPv4 地址的自动分配，我们要把它打开。

![打开后][4]

打开后，在列出的网段中选一个看得顺眼的。这个网段不能与你服务器实际在用的网段有重
合。例如，如果有一台 NAT VPS，其 IPv4 所在网段是 172.17.0.0/16，那么你就不能选
它，否则它有可能会断网。选择后，会自动给你添加好路由表设置，如图：

![自动添加路由表设置][5]

IPv6 Auto-Assign 是 IPv6 的自动分配，下有两个选项。

![IPv6 配置][6]

RFC4193 选项会为你随机生成一个 ULA 网段（在 fd00::/8 下），每台服务器获得一个
IPv6（/128）；6PLANE 在另一个 ULA 网段（fc00::/8 下），每台服务器获得一个 /80
段。为了 Docker 组网，我们需要的就是 6PLANE 网段。

接下来，我们把服务器加进这个网络。在服务器上输入命令：

```bash
zerotier-cli join [网络ID]
```

然后在设置页面的下方，勾上对应服务器的 Auth 选项：

![勾上 Auth 选项][7]

页面上会显示服务器对应的 IPv4 和 IPv6，各台服务器也能互相 ping 通了。

## 配置 Docker - 原生 Docker

在这个例子中，假定这台 Docker 服务器分配到了 10.147.17.233 和
fc23:3333:3333:3333:3333::1/80，我们希望添加一个 172.28.233.x/24 供它使用，系统
环境是 Debian 8。

我们需要指定 Docker 使用一些启动命令参数。在 Debian 8 这类 systemd 发行版上，我
们需要修改一下 systemd 的配置。输入以下命令：

```bash
cd /etc/systemd/system
mkdir docker.service.d
cd docker.service.d
nano docker.conf
```

向 docker.conf 输入如下内容：

```ini
[Service]
EnvironmentFile=-/etc/default/docker
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// $DOCKER_OPTS
```

Ctrl+X，Y，回车保存退出，再运行：

```bash
systemctl daemon-reload
cd /etc/default
nano docker
```

经过如上修改，此处显示的 DOCKER_OPTS 环境变量就能生效了。将对应的这一行修改成：

```bash
DOCKER_OPTS="--fixed-cidr=172.28.233.0/24 --ipv6 --fixed-cidr-v6=fc23:3333:3333:3333:3333::/80"
```

重启 Docker：

```bash
service docker restart
```

然后你的 Docker 容器就有了在这两个网段上的 IP。

问题又来了，由于容器获得的是 ULA 网段，无法访问 IPv6 公网，怎么办？我们需要借助
docker-ipv6nat。这个软件（容器）可以根据你的容器设置自动配置 IPv6 NAT，就像
Docker 在 IPv4 上做的一样。

等等，为什么要用 IPv6 NAT？我认为它的优点如下：

1.  某些主机商只提供一个 IPv6 地址
2.  更方便的防火墙配置（外网无法直接访问到容器）
3.  它在 ULA 网段上运行，刚好符合这次的需求

启动这个容器：

```bash
docker run -d --restart=always -v /var/run/docker.sock:/var/run/docker.sock:ro --privileged --net=host robbertkl/ipv6nat
```

你可能需要重新启动一下其它容器以使配置生效。这样你的容器就能访问 IPv6 公网了。

如果你愿意，可以在 DOCKER_OPTS 里加一句 `--userland-proxy=false`，禁用 Docker 的
应用层代理，可以节省内存。

## 配置 Docker - Compose

如果你用 Docker-Compose，那么事情就方便了许多，不需要修改 systemd 配置了。将你的
docker-compose.yml 里修改成如下内容：

```yaml
version: "2.1"
services:
  docker-ipv6nat:
    image: robbertkl/ipv6nat
    container_name: docker-ipv6nat
    restart: always
    privileged: true
    network_mode: host
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"

  你原有的容器:
    [...]
    depends_on:
      - docker-ipv6nat

  [你原有的容器们...]

networks:
  default:
    driver: bridge
    enable_ipv6: true
    ipam:
      driver: default
      config:
      - subnet: 172.28.233.0/24
        gateway: 172.28.233.1
      - subnet: fc23:3333:3333:3333:3333::/80
        gateway: fc23:3333:3333:3333:3333::1
```

注意要给原有的每个容器添加依赖 docker-ipv6nat。然后重新 `docker-compose up -d`
即可。

## 配置系统转发

在 /etc/sysctl.conf 里添加以下内容：

```ini
net.ipv4.ip_forward = 1
net.ipv6.conf.default.forwarding=1
net.ipv6.conf.all.forwarding=1
net.ipv6.conf.all.proxy_ndp=1
```

执行 `sysctl -p` 开启转发。如果你有防火墙，记得给相应的网段放行。

## 配置 ZeroTier 路由表

在右上角 Managed Routes 里添加“172.28.233.1/24，10.147.17.233”，代表把
172.28.233.1/24 网段的请求全部交由 10.147.17.233 处理。

![路由表配置][8]

然后，你在其它服务器就能 ping 通 10.147.17.233 上的 Docker 容器了。在其它服务器
上如法炮制（记得 IP 段不能重合），就能在所有 Docker 服务器和容器之间建成一张双栈
局域网了。

[1]: /usr/uploads/2017/05/3925858191.png
[2]: /usr/uploads/2017/05/4222596500.png
[3]: /usr/uploads/2017/05/37543027.png
[4]: /usr/uploads/2017/05/1079836324.png
[5]: /usr/uploads/2017/05/1221668903.png
[6]: /usr/uploads/2017/05/4005783584.png
[7]: /usr/uploads/2017/05/2937559188.png
[8]: /usr/uploads/2017/05/218976299.png
