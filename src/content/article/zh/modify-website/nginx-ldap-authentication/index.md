---
title: 'nginx 配置 LDAP 认证'
categories: 网站与服务端
tags: [nginx, LDAP]
date: 2018-10-14 12:34:17
---

我的各台服务器上安装了各种不同的服务，都有各自的用户名密码体系，难以统一管理。假
设未来某天我的密码泄露了，一个个修改就会非常累人。因此，我希望用一个服务来专门管
理用户名密码，其它服务都从它上面获取认证信息。

LDAP 是常用的认证协议之一，不仅有许多软件原生支持它的认证（包括 Jenkins，pfSense
等），而且通过插件可以使得 nginx 支持它，为任何基于网页的服务加上统一管理的认
证。

## 添加插件

如果你的 nginx 已经是源代码编译的，添加 nginx 的 LDAP 插件只需要三步：

1. `apk add openldap-dev`
2. `git clone https://github.com/kvspb/nginx-auth-ldap.git`
3. `./configure --add-module=/path/to/nginx-auth-ldap`

我依然使用 Docker 部署 nginx，Dockerfile 可以在
[https://github.com/xddxdd/dockerfiles/blob/210f0f82c7bc1c0c3697d329b73ea31abea6b14a/nginx/Dockerfile][1]
找到，其中的编译参数可以参考。

## 配置认证

安装插件后，先在 nginx.conf 的 http 配置块中添加 ldap_server 配置块。为了防止我
的单台服务器出问题导致认证服务全挂，我暂时先用了 JumpCloud 的 LDAP 服务，配置如
下：

```nginx
ldap_server jumpcloud {
    url ldap://ldap.jumpcloud.com/ou=Users,o=[你的 JumpCloud LDAP 编号],dc=jumpcloud,dc=com?uid?sub?(objectClass=posixAccount);
    binddn "uid=[LDAP 认证专用用户名],ou=Users,o=[你的 JumpCloud LDAP 编号],dc=jumpcloud,dc=com";
    binddn_passwd "[LDAP 认证专用用户密码]";
    group_attribute "memberOf";
    group_attribute_is_dn on;

    max_down_retries 3;
    connections 1;
    referral off;

    require valid_user;
    satisfy any;
}
```

然后在要保护的 server 块或 location 块中添加如下内容：

```nginx
location /private {
    auth_ldap "Forbidden";
    auth_ldap_servers jumpcloud;
}
```

即可使用指定的 LDAP 服务器进行认证。

不过要注意的是，LDAP 认证插件会和 http_addition 插件产生冲突，具体表现是如果同一
个 location 里开启了 auth_ldap 和 add_after_body，在输入用户名密码认证通过
后，nginx 似乎不会发送网页数据，体现为浏览器一直转圈直到超时。暂时的解决办法只能
是禁用 add_after_body：

```nginx
# LDAP auth doesn't work well with http_addition, disable it
add_after_body "";
```

如上操作之后，指定的地址就启用了 LDAP 认证。如果将 nginx 作为反向代理代理其它内
部服务，并屏蔽外网直接访问这些内部服务，就可以用 LDAP 统一保护认证这些服务。

[1]:
    https://github.com/xddxdd/dockerfiles/blob/210f0f82c7bc1c0c3697d329b73ea31abea6b14a/nginx/Dockerfile
