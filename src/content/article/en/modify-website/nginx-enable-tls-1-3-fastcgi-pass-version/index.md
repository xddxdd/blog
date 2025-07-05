---
title: 'Enabling TLS 1.3 for nginx and Passing to FastCGI Backends'
categories: Website and Servers
tags: [OpenSSL, nginx, TLS 1.3]
date: 2017-08-06 19:38:59
image: /usr/uploads/2017/08/3111686958.png
autoTranslated: true
---


OpenSSL provides experimental support for TLS 1.3 in its latest beta version, including a series of performance and security optimizations. The latest nginx 1.13 series has also added relevant options for TLS 1.3.

However, since TLS 1.3 is still in draft status, there are some challenges to overcome when using it now:

1. TLS 1.3 currently has three draft versions (18, 19, 20) implemented by OpenSSL and others, but they are mutually incompatible, and no SSL library combines all three.
2. Browsers like Chrome and Firefox widely use draft version 18, but this version of OpenSSL doesn't support TLS extensions, which are required for Certificate Transparency.
3. Although the latest [nginx-ct][1] plugin adds Certificate Transparency support for TLS 1.3, due to issue #2, it fails to compile when used with OpenSSL draft 18. Therefore, you must revert to version 1.3.2 from the nginx-ct project [releases][2], which doesn't support TLS 1.3.

## Dockerfile for my nginx deployment:

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

This Dockerfile compiles nginx with Brotli compression, Certificate Transparency (only for TLS 1.2 and below), OpenSSL 1.1.1 draft 18, and CloudFlare's SPDY support patch and Dynamic TLS Record patch.

If you're not using Docker but are on Debian or Ubuntu, you can directly run the lengthy command after `RUN` to install nginx.

## Modifying the configuration file

The nginx configuration also needs modification to enable TLS 1.3. In the server block of nginx.conf:

1. Modify `ssl_protocols` to add `TLSv1.3`
2. Modify `ssl_ciphers`, adding at the beginning:  
   `TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256`

Example after modification:

```nginx
ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
ssl_ciphers 'TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';
```

## Detecting TLS version in FastCGI

Since SSL connections aren't typically established directly with backend services like PHP FastCGI, these backends can't detect the TLS version or encryption method. However, nginx can obtain this information and store it as variables. By simply modifying the configuration, this information can be passed to FastCGI backends.

Open the `fastcgi_params` file in your nginx configuration directory and add two lines:

```nginx
fastcgi_param  SSL_CIPHER         $ssl_cipher;
fastcgi_param  SSL_PROTOCOL       $ssl_protocol;
```

Then reload the nginx configuration. For PHP, this information can be accessed via `$_SERVER['SSL_CIPHER']` and similar methods.

## Qualys SSL Labs test results after configuration

![Overview][3]

![Protocol Details][4]

[1]: https://github.com/grahamedgecombe/nginx-ct
[2]: https://github.com/grahamedgecombe/nginx-ct/releases
[3]: /usr/uploads/2017/08/3111686958.png
[4]: /usr/uploads/2017/08/1884892609.png
