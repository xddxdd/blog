---
title: '为 nginx 启用 TLS 1.3，并传递给 FastCGI 后端'
categories: 网站与服务端
tags: [OpenSSL, nginx, TLS 1.3]
date: 2017-08-06 19:38:59
image: /usr/uploads/2017/08/3111686958.png
---

OpenSSL 在最新的测试版中提供了 TLS 1.3 的实验性支持，包括了一系列的性能和安全性
优化。最新的 nginx 1.13 系列也相应的添加了 TLS 1.3 的相关选项。

不过由于 TLS 1.3 还处在草案状态，现在使用还是要踩一些坑的：

1. TLS 1.3 目前有 18、19、20 三个版本的草案已经被 OpenSSL 等实现，而且它们互不兼
   容，也没有一个 SSL 的库把它们三合一。
2. 目前 Chrome、Firefox 等浏览器广泛使用的是 18 版草案，但是这个版本的 OpenSSL
   不支持 TLS 扩展，而 Certificate Transparency 需要用到它。
3. 虽然最新的 [nginx-ct][1] 插件增加了 TLS 1.3 的 Certificate Transparency 支
   持，但是由于第二条，它无法与草案 18 的 OpenSSL 一同工作，会出现编译失败的情
   况。因此必须退回到 nginx-ct 项目 [release][2] 中的 1.3.2 版本，而这个版本对
   TLS 1.3 不生效。

## 我部署 nginx 使用的 Dockerfile 如下：

```docker
FROM debian:jessie-slim
MAINTAINER Lan Tian "lantian@lantian.pub"
ENV NGINX_VERSION=1.13.3 OPENSSL_VERSION=tls1.3-draft-18 NGINX_CT_VERSION=1.3.2
RUN cd /tmp \
  && apt-get update -q \
  && apt-get -y upgrade \
  && apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip libjemalloc-dev \
  && wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
    && tar xf nginx-${NGINX_VERSION}.tar.gz \
  && git clone https://github.com/bagder/libbrotli.git \
    && cd /tmp/libbrotli && ./autogen.sh && ./configure && make && make install && cd /tmp \
    && ln -s /usr/local/lib/libbrotlienc.so.1 /usr/lib/libbrotlienc.so.1 \
  && git clone https://github.com/google/ngx_brotli.git \
    && cd /tmp/ngx_brotli && git submodule update --init && cd /tmp/ \
  && wget https://github.com/grahamedgecombe/nginx-ct/archive/v${NGINX_CT_VERSION}.zip \
    && unzip v${NGINX_CT_VERSION}.zip \
  && wget https://github.com/openssl/openssl/archive/${OPENSSL_VERSION}.zip \
    && unzip ${OPENSSL_VERSION}.zip \
  && cd nginx-${NGINX_VERSION} \
  && wget https://github.com/cloudflare/sslconfig/raw/master/patches/nginx__1.13.0_http2_spdy.patch \
    && sh -c "cat nginx__1.13.0_http2_spdy.patch | patch -p1" \
  && wget https://github.com/cloudflare/sslconfig/raw/master/patches/nginx__1.11.5_dynamic_tls_records.patch \
    && sh -c "cat nginx__1.11.5_dynamic_tls_records.patch | patch -p1" \
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
     --add-module=/tmp/nginx-ct-${NGINX_CT_VERSION} \
     --add-module=/tmp/ngx_brotli \
     --with-openssl=/tmp/openssl-${OPENSSL_VERSION} \
     --with-openssl-opt='enable-ec_nistp_64_gcc_128 enable-weak-ssl-ciphers enable-tls1_3 -ljemalloc' \
     --with-ld-opt="-ljemalloc" \
     --with-cc-opt="-O3 -flto -fPIC -fPIE -fstack-protector-strong -Wformat -Werror=format-security -Wno-deprecated-declarations" \
  && make \
  && make install \
  && cd / && rm -rf /tmp/* \
  && apt-get purge -y unzip git autoconf libtool automake build-essential \
  && apt-get autoremove -y --purge \
  && apt-get clean \
  && ln -sf /usr/local/nginx/sbin/nginx /usr/local/nginx \
  && ln -sf /dev/stdout /usr/local/nginx/logs/access.log \
    && ln -sf /dev/stderr /usr/local/nginx/logs/error.log
#EXPOSE 80 443
ENTRYPOINT /usr/local/nginx
```

该 Dockerfile 编译的 nginx 包含了 Brotli 压缩算法，Certificate Transparency（仅
TLS 1.2 及以下），OpenSSL 1.1.1 draft 18，以及 CloudFlare 的 SPDY 支持补丁和
Dynamic TLS Record 补丁。

如果你不使用 Docker，但是使用 Debian 或者 Ubuntu，可以直接用 RUN 后面的一长串命
令来直接安装 nginx。

## 对配置文件的修改

nginx 的配置文件也需要修改，以开启 TLS 1.3 功能。在 nginx.conf 的 server 块里：

1. 修改 ssl_protocols，添加 TLSv1.3
2. 修改 ssl_ciphers，在最开头添加
   `TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256`

修改完成的示例如下：

```nginx
ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
ssl_ciphers 'TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';
```

## FastCGI 检测 TLS 版本

由于 SSL 连接往往并不直接建立到程序语言服务端上，例如 PHP 等 FastCGI 服务端，这
些服务端往往无法得知用户连接的 TLS 版本号和加密方式。但是，nginx 可以得知这些信
息，并且把它们作为变量存储起来。简单的修改配置文件，就能把这些信息传递到 FastCGI
后端。

打开你 nginx 配置目录下的 fastcgi_params 文件，并向里面加入两行：

```nginx
fastcgi_param  SSL_CIPHER         $ssl_cipher;
fastcgi_param  SSL_PROTOCOL       $ssl_protocol;
```

重新加载 nginx 配置即可。以 PHP 为例，这些信息可以通过类似
`$_SERVER['SSL_CIPHER']` 的方式来获取。

## 配置完成的 Qualys SSL Labs 检查结果

![概览][3]

![协议信息][4]

[1]: https://github.com/grahamedgecombe/nginx-ct
[2]: https://github.com/grahamedgecombe/nginx-ct/releases
[3]: /usr/uploads/2017/08/3111686958.png
[4]: /usr/uploads/2017/08/1884892609.png
