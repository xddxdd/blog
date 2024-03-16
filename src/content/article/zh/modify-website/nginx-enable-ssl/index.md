---
title: 'nginx 启用 SSL 加密'
categories: 网站与服务端
tags: [网站,折腾]
date: 2013-01-27 01:09:00
---
用自己的VPS的一个好处就是可以开SSL加密，可以实现在公共场所管理博客的安全，以及减小某些自然因素导致连接异常中断的几率。Debian 6软件源里的nginx已经带了SSL模块，所以很简单就可以开启SSL。只要把/etc/nginx/sites-available/default复制一份成default-ssl，做下面的修改就行。

```nginx
server {
    listen              443;
    server_name         localhost;
    ssl                 on;
    ssl_certificate     lic.crt;
    ssl_certificate_key lic.key;
}
```

or（下面这种直接改default就行）

```nginx
server {
    listen              80;
    listen              443 ssl;
    server_name         localhost;
    ssl_certificate     lic.crt;
    ssl_certificate_key lic.key;
}
```

其中的lic.crt和lic.key记得改成自己的证书路径。

但是最难弄到的就是SSL证书，VeriSign和Thawte的证书每年没个五六百RMB是搞不到的。目前有以下几种途径可以获取免费的SSL：

1.自己生成证书，方法自行谷歌。

优点：方便。缺点：用任何浏览器浏览都会报证书不信任错误。

2.StartSSL

<blockquote>跟VeriSign一样，StartSSL（网址：http://www.startssl.com，公司名：StartCom）也是一家CA机构，它的根证书很久之前就被一些具有开源背景的浏览器支持（Firefox浏览器、谷歌Chrome浏览器、苹果Safari浏览器等）。

　　在今年9月份，StartSSL竟然搞定了微软：微软在升级补丁中，更新了通过Windows根证书认证程序（Windows Root Certificate Program）的厂商清单，并首次将StartCom公司列入了该认证清单，这是微软首次将提供免费数字验证技术的厂商加入根证书认证列表中。现在，在Windows 7或安装了升级补丁的Windows Vista或Windows XP操作系统中，系统会完全信任由StartCom这类免费数字认证机构认证的数字证书，从而使StartSSL也得到了IE浏览器的支持。

　　注册成为StartSSL（http://www.startssl.com）用户，并通过邮件验证后，就可以申请免费的可信任的SSL证书了。</blockquote>

以上摘自[http://blog.s135.com/startssl/](http://blog.s135.com/startssl/)。申请教程这篇文章里也有。

优点：可以被大多数浏览器（除Opera）信任。缺点：需要人工审核，而且免费的TK域名无法使用，还要一年续期一次。

3.CAcert，自己谷歌。

> CAcert.org 是一个社群推动的公共认证机构。它可以对个人发放免费公钥证书(其他证书颁发机构需要收费)。该机构目前已经有200,000名认证用户，以及接近800,000份证书。

摘自维基。CACert的证书是程序自动签发的，不会有人工审核，证书可信度也不高，所以别想让它和StartSSL一样搞定微软了。别想了。

优点：可以被大多数开源背景浏览器信任。缺点：<del>需要人工审核</del>，没有可信度，还要一年续期一次。
