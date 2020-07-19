---
title: 'Docker 镜像的精简'
categories: 计算机与客户端
tags: [Docker]
date: 2018-07-18 03:18:00
---
自从放弃 OpenVZ 架构的 VPS 并购买 KVM 架构的 VPS 以来，我一直使用 Docker 部署 nginx、MariaDB、PHP 等网站需要的程序，不仅方便平时单个服务的重启和配置管理（把配置目录全部用 volume 映射到一起管理），而且方便了服务的升级。

例如，我现在博客所在的 VPS 因为配置不高，内存占用最近一直在 80% 左右。我要更新 nginx 或者向 nginx 里加模块时，如果直接在这台 VPS 上编译 nginx，不仅速度慢，而且有可能因为内存不足而把网站也崩掉。使用 Docker 后，我就可以在其它的空闲资源较多的 VPS 或者在我自己的电脑上构建镜像，push 到 Docker Hub，再在 VPS 上 pull 下来运行。

不过，一直以来，我的 nginx 镜像大小都在 200 MB 左右（Docker Hub 显示大小，不包含基础镜像大小，比一般 docker image 显示的要小），明显大于它应该有的容量，不过因为 VPS 的硬盘暂时足够，而且前段时间我也没什么时间，我就没有管这个问题。现在有了空，我就仔细研究并解决了这个问题，修改了 Dockerfile，把镜像大小降到了 17 MB。

合并 RUN 命令
------------

刚打开 Dockerfile，我就发现了一个低级错误：

```docker
FROM debian:stretch
MAINTAINER Lan Tian "lantian@lantian.pub"
ENV NGINX_VERSION=1.15.1 OPENSSL_VERSION=OpenSSL_1_1_1-pre8
RUN apt-get update -q \
    && apt-get -y upgrade \
    && apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip libjemalloc-dev patch
RUN cd /tmp \
    && wget -q http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
    && tar xf nginx-${NGINX_VERSION}.tar.gz \
    && # 接下来是编译过程
```

Docker 在构建镜像时，会为 Dockerfile 中的每一条指令生成一“层”镜像，将一层层镜像叠加起来成为一“个”镜像。

在上述第一条 RUN 指令中，Docker 生成了一“层”包含了 nginx 所需的依赖包，以及 apt-get 下载下来的临时文件的镜像。后续的编译、安装过程在第二条 RUN 指令中，是在含依赖包那一层之上的一“层”操作的，完全不能影响到依赖包那一层。虽然我后续执行了 apt-get clean，但是这只是在最顶层中标记了删除这些文件，这些文件仍然在第二层含依赖包的一层留存着。

修改方法就是把两个 RUN 命令通过 `&&` 和反斜杠连接起来，共同构成一层就可以了。

当时我这样写 Dockerfile，是因为后续的 nginx 编译过程反复出现问题，我在测试时为了防止反复下载依赖包就分离了这些指令，来重复利用下载好的依赖包。但是在测试完成后，我忘了把这里改回去！

这里修改后，Docker 镜像的大小直接小了 25 MB。虽然 175 MB 的镜像比之前已经小了一些，但是还是很大，还有精简的空间

使用 Alpine 作为基础镜像
---------------------

我之前一直使用我比较熟悉的 Debian 作为基础镜像。Debian 的好处是可以使用常用的 apt-get 等工具，但是它基础镜像的体积大概在 125 MB 左右，很大。而 Alpine Linux 是一个体积只有 5 MB 左右，被广泛运用在 Docker 镜像中的 Linux 发行版。为了精简体积，我准备使用它。

首先是把 Dockerfile 开头的 `FROM debian:stretch` 换成 `FROM alpine`。我直接用了 Alpine 的最新版本，如果软件对系统版本有要求记得指定。

然后，把 apt-get 安装的依赖包在 Alpine 的包管理器 apk 中找到对应的包，并安装上去。我在 Debian 中安装依赖的命令如下：

```bash
apt-get update -q
apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip libjemalloc-dev patch
```

把这些包一一在 apk 中找到对应的包：

```bash
apk --no-cache add build-base git autoconf automake libtool wget tar zlib-dev pcre-dev unzip jemalloc-dev patch linux-headers
```

其中 --no-cache 参数代表 apk 不使用本地缓存，直接去镜像源拉取软件包列表和下载，并且会自动删除下载缓存，相当于自带了 apt-get update 和 apt-get clean 两行。

同理，把最后删除编译依赖包的部分也改掉。原先在 Debian 下我是这样删的：

```bash
apt-get purge -y unzip -q git autoconf libtool automake build-essential
apt-get autoremove -y --purge
```

在 Alpine 下我这样删：

```bash
apk del build-base git autoconf automake wget tar unzip patch linux-headers
```

这样操作后，镜像的体积被直接减到了 17 MB！在 docker images 中包含 Alpine 本身显示为 39.6 MB。相比原先已经非常小了。这里应该不只是 Alpine 本身的差距，还可能和 Alpine 自带的轻量级 musl C 库文件有关。

同样操作精简其它镜像
-----------------

nginx 的镜像精简完了，用类似的操作也可以精简其它的镜像。首先拿 PHP-FPM 开刀，这里因为我需要一大堆 PHP 模块所以不能直接用官方的镜像。

原先的安装命令是这样，我的 PHP-FPM 不是编译的，是直接从软件源安装的：

```bash
apt-get install -y php7.2-fpm php7.2-bz2 php7.2-curl php7.2-gd php7.2-json php7.2-mbstring php7.2-memcached php7.2-mysql php7.2-redis php7.2-sqlite3 php7.2-xml php7.2-xmlrpc php7.2-zip php7.2-intl
```

Alpine 的软件源也有 PHP-FPM，可以直接安装：

```bash
apk --no-cache add php7-fpm php7-bz2 php7-curl php7-gd php7-json php7-mbstring php7-memcached php7-mysqli php7-pdo_mysql php7-redis php7-sqlite3 php7-pdo_sqlite php7-xml php7-xmlrpc php7-zip php7-intl php7-ctype php7-tokenizer
```

其中注意 Alpine 软件源的 PHP 有点迷，默认不包含一些在其它发行版上有的包，例如 php7-ctype、php7-tokenizer，如果不装，Typecho 等程序就会报错。

换成 Alpine 后 Docker Hub 上显示的大小从 90 MB 降到了 25 MB，docker image 中的大小降到了原先的 1/4。

MariaDB 我也换成了基于 Alpine 的，不过这个镜像因为有现成的，我就没自己做，直接用了 [bianjp/mariadb-alpine][1]。它和官方基于 Debian 的镜像几乎完全兼容，我在 docker-compose.yml 里只改了 image 名就成功了，什么设置都不用动。

总结
----

这样操作后我的 VPS 里省了大概 1 GB 的空间，对于我的小硬盘 VPS 来说已经省出了很多的空间了。

而且以后更新程序时 push、pull 镜像的速度也大大加快了，尤其是香港 VPS 从 Docker Hub pull 镜像的速度一直不怎么样，更小的镜像意味着在更短的时间内可以 pull 下更多个版本进行测试，出现问题 pull 原来版本镜像恢复运行的速度也会更快。

  [1]: https://hub.docker.com/r/bianjp/mariadb-alpine/
