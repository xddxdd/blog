---
title: '将网站迁移到 Docker'
categories: 网站与服务端
tags: [Docker]
date: 2016-12-29 13:55:00
---
Docker 是一个 Linux 下的容器管理软件。每个容器某种意义上相当于一个 OpenVZ VPS，可以将服务器上的各个应用隔离开来。这种隔离有助于同一软件不同版本，或是互相冲突的软件在同一服务器上运行，比如 MySQL 5.7，MySQL 5.6 和 MariaDB 10.1 可以在同一台服务器上的三个 Docker 容器中运行。

但是 Docker 比 OpenVZ 优秀的地方在于，它对 Linux 内核的版本要求要宽松的多。OpenVZ 的内核至今为止停留在 2.6.32（稳定版）和 3.10（开发版），但是 Docker 可以在 3.10 以上的任何版本 Linux 内核运行。我的服务器现在运行 Linux 4.9 内核（为了 BBR），明显不能运行 OpenVZ，但是可以运行 Docker。

Docker 另一个优点是提供了一套非常完整的镜像仓库和自动化工具。在 OpenVZ 上，我必须分别登录每台 VPS，设置网络，`apt-get`，还要定期去每台 VPS 上备份数据。但是在 Docker 上，我可以直接使用现有的软件镜像（不用再 `apt-get`），并将数据文件夹直接映射到主机上（不用分别备份）。

Docker 更是提供 Docker Compose，以配置文件的形式设置多个 Docker 容器，并且快速部署、删除。

安装 Docker 以及 Docker Compose
-------------------------------

我个人使用的系统是 Debian 8，可以直接从 Docker 官方的软件源安装。

```bash
apt-get install apt-transport-https ca-certificates gnupg2
apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
echo "deb https://apt.dockerproject.org/repo debian-jessie main" >> /etc/apt/sources.list
apt-get update
apt-get install docker-engine
curl -L "https://github.com/docker/compose/releases/download/1.9.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

使用现有镜像迁移
----------------

我服务器上原来运行的软件是：Nginx，PHP7.0-FPM，MariaDB，Memcached，Redis 和 SS。为了统一管理，我使用 Docker 镜像的方式部署。

我决定把数据全部存在 `/srv` 文件夹中，因此 cd 进这个文件夹，并创建 docker-compose.yml 文件。这个就是 Docker Compose 的配置文件。其基本格式如下：（#号后的内容为我添加的注释，在原文件中不存在）

```yaml
version: '2'
services:
  容器 1:
    image: 容器的镜像名称，如果本地没有这个镜像，Docker 会自动去镜像仓库下载
    container_name: 容器名称
    environment: # 环境变量
      - 环境变量名称=环境变量值
      - PASSWORD=123456
    restart: always # 容器崩了就立即重启
    volumes: # 将服务器上的文件夹映射到 Docker 容器中，用于存储和统一管理数据
      - "服务器上存储数据的文件夹:Docker 容器中对应的文件夹"
      - "/var/lib/mysql:/var/lib/mysql"
    ports: # 端口映射
      - "服务器上监听的端口:Docker 容器内的端口" # 此例为将端口开放供任何人访问
      - "80:80"
      - "服务器上监听的地址:服务器上监听的端口:Docker 容器内的端口" # 此例为该服务仅允许在服务器上访问
      - "127.0.0.1:11211:11211"
  容器2:
    ...（和容器 1 相同）
```

接下来我们就要写一个 docker-compose.yml，运行 MariaDB 的镜像并将数据导入。（#号后的内容为我添加的注释，在原文件中不存在）

```yaml
version: '2'
services:
  lantian-mariadb:
    image: mariadb:latest
    container_name: lantian-mariadb
    restart: always
    volumes:
      - "/srv/mysql:/var/lib/mysql"
      - "/etc/timezone:/etc/timezone" # 将服务器的时区设置应用到 Docker 容器中
      - "/etc/localtime:/etc/localtime"
    ports:
      - "127.0.0.1:3306:3306"
```

首先停止原来的 MariaDB：`service mysql stop`（我不考虑无缝切换问题）

然后把数据文件夹移过来：`mv /var/lib/mysql /srv/mysql`

最后 `docker-compose up -d` 加载这个配置文件

MariaDB 就在 Docker 里运行起来了！

同理，Redis 和 Memcached 都有现成的镜像，可以如法炮制。

从 apt-get 安装软件的镜像
-------------------------

对于 PHP7.0-FPM，问题要复杂一些。镜像仓库里的官方 PHP-FPM 加了奇怪的编译参数，配置文件的放置方式和我从 DotDeb 安装的不同。为了防止以后出现奇怪的问题，我决定做一个简单的 Docker 镜像。

做 Docker 镜像不需要你有什么高深的编程技巧。相反，你只要会基本的 bash 命令就行。

首先新建一个文件夹，cd 进去，创建一个 Dockerfile，这就是你的新镜像的构建配置文件。

Dockerfile 的基本格式如下：(# 号后面的是我自己加的)

```bash
FROM debian:jessie # 引用官方的 Debian 8 镜像，在此基础上执行下面的操作
MAINTAINER Lan Tian "lantian@lantian.pub" # 说明 Dockerfile 作者，这行删掉没关系
ADD somefile.txt /somefile.txt # 把一个文件添加进镜像，此例将当前文件夹下的 somefile.txt 添加进去。
RUN apt-get update # 在容器构建时运行一条命令，此例为 apt-get update
EXPOSE 80 # 指示这个 Docker 容器要开放某个端口供其它容器访问
ENTRYPOINT ["php-fpm7.0"] # 以后启动这个容器执行的命令，这个命令执行完成（程序退出）容器即停止
```

在这个新镜像的构建过程中，需要在 Debian 8 的基础上，添加 DotDeb 软件源，apt-get，添加自己的配置文件，开放端口供其它容器访问，设置启动命令。我的 Dockerfile 是这样的：

```dockerfile
FROM debian:jessie
MAINTAINER Lan Tian "lantian@lantian.pub"
ADD dotdeb.gpg /dotdeb.gpg
RUN echo "deb http://packages.dotdeb.org jessie all" >> /etc/apt/sources.list \
    && echo "deb-src http://packages.dotdeb.org jessie all" >> /etc/apt/sources.list \
    && apt-key add /dotdeb.gpg \
    && apt-get update \
    && apt-get install -y php7.0-fpm php7.0-bz2 php7.0-curl php7.0-gd php7.0-json php7.0-mbstring php7.0-mcrypt php7.0-memcached php7.0-mysql php7.0-redis php7.0-sqlite3 php7.0-xml php7.0-xmlrpc php7.0-zip \
    && apt-get clean
ADD www.conf /etc/php/7.0/fpm/pool.d/www.conf
ADD php.ini /etc/php/7.0/fpm/php.ini
ADD php-fpm.conf /etc/php/7.0/fpm/php-fpm.conf
EXPOSE 9000
ENTRYPOINT ["php-fpm7.0"]
```

dotdeb.gpg 是 DotDeb 软件源的密钥，因为 Docker 官方的 Debian 镜像居然连 wget 都没有，我又不想浪费一次 `apt-get update`，就直接把密钥提前下载下来放在 Dockerfile 同文件夹里；www.conf，php.ini 和 php-fpm.conf 是我自己的配置文件，你在构建时，如果直接用默认配置，把对应的 ADD 行删掉即可；如果你要自定义配置，就把对应配置文件放在 Dockerfile 同文件夹里。

```bash
wget https://www.dotdeb.org/dotdeb.gpg
cp /etc/php/7.0/fpm/pool.d/www.conf ./
cp /etc/php/7.0/fpm/php.ini ./
cp /etc/php/7.0/fpm/php-fpm.conf ./
```

在当前文件夹开始构建：

```bash
docker build -t lt-php7-fpm .
```

docker-compose.yml 里加上这些内容：（注意空格，# 号后删掉）

```yaml
  lt-php-fpm:
    image: lt-php7-fpm
    container_name: lt-php-fpm
    restart: always
    volumes:
      - "./www:/srv/www" # 将你的 www 文件夹映射进去
      - "./owncloud:/srv/owncloud" # OwnCloud 数据文件夹，没有 OwnCloud 就删掉这行
      - "/etc/timezone:/etc/timezone" # 时区
      - "/etc/localtime:/etc/localtime" # 时区
```

自己编译软件镜像
----------------

我的 Nginx 要更麻烦一些，因为我给 Nginx 加了一堆奇怪的东西，包括 HTTP2+SPDY 补丁、Google PageSpeed、Certificate Transparency 补丁、Brotli 压缩格式之类的。很明显，我找不到现有的镜像，所以我只能自己编译了。

要把这些做成镜像，原理其实很简单：把你在编译过程中输的命令全部写进 Dockerfile 里。但是在你编译的时候，你是不是要输好几次软件的版本号，比如 `cd nginx-1.11.8` 之类的？在 Dockerfile 里，类似的版本号都可以写成变量，在以后升级时可以方便地修改。

在 Dockerfile 中可以如此使用变量：

```dockerfile
ENV NGINX_VERSION=1.11.8 # 设置一个名为 NGINX_VERSION 的变量，值是 1.11.8
RUN cd nginx-${NGINX_VERSION} # ${NGINX_VERSION} 就等同于 1.11.8，此例中相当于 cd nginx-1.11.8
```

我们要做的事情：安装编译环境，下载 Nginx 和各个补丁的源代码，编译安装。我的 Dockerfile 如下：

```dockerfile
FROM debian
MAINTAINER Lan Tian "lantian@lantian.pub"

ENV NGINX_VERSION=1.11.8 OPENSSL_VERSION=1.1.0c NPS_VERSION=1.12.34.2
RUN mkdir /tmp/build && cd /tmp/build \
    && apt-get update -q\
    && apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip \
    && wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
      && tar xvf nginx-${NGINX_VERSION}.tar.gz \
    && git clone https://github.com/bagder/libbrotli.git \
      && cd /tmp/build/libbrotli && ./autogen.sh && ./configure && make && make install && cd /tmp/build \
      && ln -s /usr/local/lib/libbrotlienc.so.1 /usr/lib/libbrotlienc.so.1 \
    && git clone https://github.com/google/ngx_brotli.git \
      && cd /tmp/build/ngx_brotli && git submodule update --init && cd /tmp/build/ \
    && git clone https://github.com/grahamedgecombe/nginx-ct.git \
    && wget https://www.openssl.org/source/openssl-${OPENSSL_VERSION}.tar.gz \
      && tar xvf openssl-${OPENSSL_VERSION}.tar.gz \
    && wget https://github.com/pagespeed/ngx_pagespeed/archive/v${NPS_VERSION}-beta.zip \
      && unzip v${NPS_VERSION}-beta.zip \
      && cd /tmp/build/ngx_pagespeed-${NPS_VERSION}-beta/ \
      && wget https://dl.google.com/dl/page-speed/psol/${NPS_VERSION}-x64.tar.gz \
      && tar -xvf ${NPS_VERSION}-x64.tar.gz \
      && cd /tmp/build \
    && wget https://raw.githubusercontent.com/cujanovic/nginx-http2-spdy-patch/master/nginx-spdy-1.11.5%2B.patch -O nginx-spdy.patch \
    && cd nginx-${NGINX_VERSION} \
    && patch -p1 < /tmp/build/nginx-spdy.patch \
    && ./configure \
       --with-threads \
       --with-file-aio \
       --with-ipv6 \
       --with-http_ssl_module \
       --with-http_spdy_module \
       --with-http_v2_module \
       --with-http_gzip_static_module \
       --with-http_gunzip_module \
       --with-http_stub_status_module \
       --with-http_sub_module \
       --add-module=/tmp/build/ngx_pagespeed-${NPS_VERSION}-beta \
       --add-module=/tmp/build/nginx-ct \
       --add-module=/tmp/build/ngx_brotli \
       --with-openssl=/tmp/build/openssl-${OPENSSL_VERSION} \
       --with-cc-opt="-O3 -fPIE -fstack-protector-strong -Wformat -Werror=format-security -Wno-deprecated-declarations" \
    && make \
    && make install \
    && cd / && rm -rf /tmp/build \
    && apt-get purge -y unzip git autoconf libtool wget automake build-essential \
    && apt-get autoremove -y --purge \
    && ln -sf /dev/stdout /usr/local/nginx/logs/access.log \
      && ln -sf /dev/stderr /usr/local/nginx/logs/error.log
EXPOSE 80 443
ADD start.sh /start.sh
ENTRYPOINT /bin/bash /start.sh
```

这里涉及到一个问题，就是 nginx 默认后台运行。但是，一旦它后台运行，Docker 就认为它的主进程已经结束了，就把这个容器停掉了！因此，我们要用点小技巧。

start.sh 的内容如下：

```bash
#!/bin/bash
/usr/local/nginx/sbin/nginx
tail -F /usr/local/nginx/logs/access.log
```

`tail -F` 会不断地加载这个文件，并显示它的新内容。这个 start.sh 就是启动 nginx 并不断显示它的内容。只要 start.sh 不停，容器就能一直保持运行。

另外一点，在编译完之后，最好把编译环境和源代码都删掉，否则会无谓地增大镜像的占用空间。

开始构建：

```bash
docker build -t lt-nginx .
```

向 docker-compose.yml 添加：

```yaml
  lt-nginx:
    image: lt-nginx
    container_name: lt-nginx
    restart: always
    volumes:
      - "./nginx:/usr/local/nginx/conf" # 配置文件
      - "./www:/srv/www" # www 文件夹
      - "/etc/timezone:/etc/timezone" # 时区
      - "/etc/localtime:/etc/localtime" # 时区
    ports:
      - "80:80"
      - "443:443"
```

结语
----

在上面，我们建立了 MariaDB、PHP-FPM、Nginx 三个容器。以后它们可以用 `docker-compose up -d` 统一启动，`docker-compose down` 统一关闭并删除，极大地方便了管理和部署。