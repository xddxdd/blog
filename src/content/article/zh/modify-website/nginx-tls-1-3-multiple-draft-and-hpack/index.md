---
title: 'nginx：TLS 1.3 多版本草案和 HPACK'
categories: 网站与服务端
tags: [OpenSSL, SSL, Docker, TLS 1.3]
date: 2018-07-07 00:28:00
---

距离我之前给 nginx [启用 TLS 1.3][1] 已经过了 11 个月了。快一年过后，许多与
nginx 相关的程序、补丁都有了很大的变化：

1. OpenSSL 已经在发布 1.1.1 的测试版，写本文时最新版本是 1.1.1-pre8（也就是 Beta
   6）。
2. nginx 已经更新到 1.15.1。
3. nginx 的 HPACK 补丁（HTTP 头压缩补丁）的 bug 已经有另外的补丁的补丁修复，使用
   原先的 HPACK 补丁会导致网站访问不正常，体现为每个网站只能打开一个页面，第二个
   页面开始就出现协议错误。
4. 有大佬[发布了 OpenSSL 的补丁][2]，可以让最新版 OpenSSL 同时支持 TLS 1.3 的
   draft 23，26，28 三个版本。
5. Lets Encrypt 证书已经自带 Certificate Transparency 信息了，不需要 nginx-ct
   了。
6. 2018 年 7 月 1 日起，TLS 1.0 不再被建议使用。

因此我重新调整了 nginx 的编译和运行配置，以适应 8102 年的需要。

## Dockerfile

我依然使用 Docker 部署 nginx。与之前的 Dockerfile 相比，新的 Dockerfile 只是改了
下版本号，添加了几个补丁，整体并没有大的变化。

为了节省篇幅，我将 Dockerfile 上传到了
[https://github.com/xddxdd/dockerfiles/blob/master/nginx/Dockerfile][3]。你也可
以直接 `docker pull xddxdd/nginx` 来使用。

这个 Dockerfile 包含了如下内容：

-   nginx 1.15.1
-   OpenSSL 1.1.1-pre8
-   kn007 大佬的 SPDY、HPACK、Dynamic TLS Record 三合一补丁，他的项目地址[在此访
    问][4]
-   kn007 大佬的 HPACK 补丁的修复补丁
-   Brotli 压缩算法
-   hakasenyang 大佬的 TLS 1.3 三版本草案补丁，他的项目地址[在此访问][5]
-   nginx headers-more 模块

## 配置改变

首先禁用 TLS 1.0。

```nginx
#ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
```

然后，因为 OpenSSL 修改了一大堆加密算法的名称，因此如果直接沿用之前的
ssl_ciphers 会出现 ERR_SSL_VERSION_OR_CIPHER_MISMATCH 错误，意思是没有服务器和客
户端同时支持的加密算法。因此修改 ssl_ciphers：

```nginx
#ssl_ciphers 'TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!DSS';
ssl_ciphers '[TLS13+AESGCM+AES128|TLS13+CHACHA20]:TLS13+AESGCM+AES256:[EECDH+ECDSA+AESGCM+AES128|EECDH+ECDSA+CHACHA20]:EECDH+ECDSA+AESGCM+AES256:EECDH+ECDSA+AES128+SHA:EECDH+ECDSA+AES256+SHA:[EECDH+aRSA+AESGCM+AES128|EECDH+aRSA+CHACHA20]:EECDH+aRSA+AESGCM+AES256:EECDH+aRSA+AES128+SHA:EECDH+aRSA+AES256+SHA:RSA+AES128+SHA:RSA+AES256+SHA';
```

## 然后？

重新启动 nginx，用最新稳定版的 Chrome 和 Firefox 就可以以 TLS 1.3 draft 23 访问
了，用最新开发版的 Chrome 和 Firefox 就可以以 TLS 1.3 draft 28 访问了。

[1]: /article/modify-website/nginx-enable-tls-1-3-fastcgi-pass-version.lantian
[2]: https://github.com/hakasenyang/openssl-patch
[3]: https://github.com/xddxdd/dockerfiles/blob/master/nginx/Dockerfile
[4]: https://github.com/kn007/patch
[5]: https://github.com/hakasenyang/openssl-patch
