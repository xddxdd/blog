---
title: '用 nginx 搭建能查询任意公网 WHOIS 的服务器'
categories: 网站与服务端
tags: [nginx, WHOIS]
date: 2021-07-18 01:52:18
---

在[魔改 nginx，建立一个 DN42 的 WHOIS 服务器](/article/modify-website/serve-dn42-whois-with-nginx.lantian/)之后，我把我的 DN42 Looking Glass 接到了这个 WHOIS 服务器。由于我的 Looking Glass 可以作为一个 Telegram 机器人运行，群友们就用它来查询 IP 和域名的 WHOIS 信息。

很快，我们发现了一个问题。有相当一部分群友在接触 DN42 之后，又在公网上申请了自己的 ASN 和 IP 段，并且在各个 IX 进行 Peering。因此，群友们常常会查询一些公网的 IP、ASN 和域名，而群里的机器人都不支持这个。如果有一个 WHOIS 服务器可以把公网的查询代理到对应的注册局，就会极大的方便大家的查询。

而代理正是 nginx 擅长的事。只要魔改一下 nginx 让它支持向上游发送“一问一答”的协议，再加上 OpenResty 的 Lua 脚本支持，就可以很快地搭出一个 WHOIS 代理。

修改 nginx 代理逻辑
-----------------

nginx 向代理上游发送请求时，会调用 `ngx_http_proxy_create_request` 函数创建请求头部，也就是 `GET /url HTTP/1.1` 这部分。

这里的逻辑大概是这样的：

```python
def ngx_http_proxy_create_request():
    # 拼接请求的第一行（GET xxx）
    header = 'GET'
    header += url

    if http_version == '1.1':
        header += 'HTTP/1.1'
    else:
        header += 'HTTP/1.0'

    # 添加其它请求头
    for key, value in request_headers:
        header += key + ': ' + value

    # 发送给后端
    send(header)
```

nginx 本身已经支持了选择代理请求的 HTTP 版本，但可选值只有 HTTP/1.0（默认）和 HTTP/1.1。只需要添加一个选项对应“一问一答”模式（称作 `plain` 模式），然后把除了添加 URL 的部分都禁用掉就可以了：

```python
def ngx_http_proxy_create_request():
    # 拼接请求的第一行（GET xxx）
    if http_version != 'plain':
        header = 'GET'
    header += url

    if http_version == '1.1':
        header += 'HTTP/1.1'
    else if http_version == '1.0':
        header += 'HTTP/1.0'
    else:
        pass

    # 添加其它请求头
    if http_version != 'plain':
        for key, value in request_headers:
            header += key + ': ' + value

    # 发送给后端
    send(header)
```

实际的修改可以在 <https://gist.github.com/xddxdd/fed23d2fe5afa00bb609166886e3d206> 看到。指定 `proxy_http_version plain;` 就可以用一问一答的模式把请求发给上游的 WHOIS 服务器。

> 用相同的方法也可以代理 Gopher 服务器，Gopher 也是一问一答的协议。

找到对应的 WHOIS 服务器
---------------------

互联网是分成很多块，由不同的组织机构管理的。例如，管理 ASN 和 IP 的机构就有 [APNIC、AfriNIC、RIPE、ARIN、LACNIC 五家 RIR（地区注册局）](https://zh.wikipedia.org/wiki/%E5%8C%BA%E5%9F%9F%E4%BA%92%E8%81%94%E7%BD%91%E6%B3%A8%E5%86%8C%E7%AE%A1%E7%90%86%E6%9C%BA%E6%9E%84)，根据大洲决定各自的管辖范围。管理域名的机构就更多了，有国际通用域名（`.com`，`.net`），国家/地区域名（`.us`，`.cn`），和由公司或独立机构注册的 New gTLD（`.ovh`，`.google`）等。不用说就知道，每个组织都有自己的 WHOIS 服务器。

好消息是，我们常用的 `whois` 命令内置了相应的列表，可以根据查询内容匹配到对应的 WHOIS 服务器，包括 [16 bit ASN 列表](https://github.com/rfc1036/whois/blob/next/as_del_list)，[32 bit ASN 列表](https://github.com/rfc1036/whois/blob/next/as32_del_list)，[IPv4 列表](https://github.com/rfc1036/whois/blob/next/ip_del_list)，[IPv6 列表](https://github.com/rfc1036/whois/blob/next/ip6_del_list)，[传统顶级域名列表](https://github.com/rfc1036/whois/blob/next/tld_serv_list)，[New gTLD 列表](https://github.com/rfc1036/whois/blob/next/new_gtlds_list)和 [NIC Handle（用户在 RIR 的注册信息）列表](https://github.com/rfc1036/whois/blob/next/nic_handles_list)，我们只需要直接拿来用就可以了。这些信息都是从 [IANA（互联网号码分配局，上面五家机构的老大）](https://zh.wikipedia.org/wiki/%E4%BA%92%E8%81%94%E7%BD%91%E5%8F%B7%E7%A0%81%E5%88%86%E9%85%8D%E5%B1%80)的网站上获取的。

编写 nginx 规则（正则表达式篇）
---------------------------

有了对应关系，我们就可以编写相应的 nginx 规则了。利用 nginx 的正则表达式，可以区分开不同种类的查询，并分别查询对应的列表。

```nginx
# ASN 查询
location ~* "^/[Aa][Ss]([0-9]+)$" {
    set $asn $1;
    set_by_lua_block $backend {
        local asn = tonumber(ngx.var.asn);
        if asn >= 248 and asn <= 251 then return "whois.ripe.net" end
        if asn >= 306 and asn <= 371 then return "whois.nic.mil" end
        -- 略过一大堆判断
        -- 默认回落到 ARIN
        return "whois.arin.net"
    }

    proxy_pass http://$backend:43/AS$1;
    proxy_http_version plain;
}

# NIC Handle 查询，以 ARIN 和 RIPE 为例
location ~* "^/(.*)(-[Aa][Rr][Ii][Nn])$" {
    set_by_lua $query_upper "return ngx.var.uri:upper():sub(2)";
    proxy_pass http://whois.arin.net:43/$query_upper;
    proxy_http_version plain;
}
location ~* "^/(.*)(-[Rr][Ii][Pp][Ee])$" {
    set_by_lua $query_upper "return ngx.var.uri:upper():sub(2)";
    proxy_pass http://whois.ripe.net:43/$query_upper;
    proxy_http_version plain;
}

# 域名查询，以 .com 为例
location ~* "^/(.*)(\.[Cc][Oo][Mm])$" {
    set_by_lua $query_lower "return ngx.var.uri:lower():sub(2)";
    proxy_pass http://whois.verisign-grs.com:43/$query_lower;
    proxy_http_version plain;
}

# IP查询……？
```

规则写入 nginx 后，再[让 nginx 以 plain 模式监听 43 端口](/article/modify-website/serve-dn42-whois-with-nginx.lantian/)，就可以查询 ASN、NIC Handle 和域名了。

但是有一个很重要的东西缺失了：IP 查询。OpenResty 的 Lua 语言没有自带 IP 段的解析功能，也不提供判断 IP 是否在某个地址段内的函数，需要自行编写代码，麻烦且容易出 Bug。此外，由于对每种域名和 NIC Handle 都添加了一个正则表达式用于匹配，nginx 的内存占用从每个 worker 30MB 涨到了惊人的 100MB，本是捉襟见肘的 VPS 更是雪上加霜。

但至少 Lua 调用动态链接库（也就是 Linux 的 `.so` 库）的函数非常方便，我们可以把匹配逻辑用 C 写一遍。

编写 nginx 规则（动态链接库篇）
---------------------------

于是我就写了一个简单的动态链接库，提供几个查询函数，输入 IP、ASN、域名或 NIC Handle，返回对应的 WHOIS 服务器地址。

这个动态链接库调用 libc 的函数解析 IP，用[第三方 LPM（最长前缀匹配）库 liblpm](https://github.com/rmind/liblpm) 快速查找对应 WHOIS 服务器，并且对于 ASN、域名和 NIC Handle 可以用简单的顺序查找，毕竟我们对性能的要求不是很高。这个库的占用内存很小，比起 nginx 大量正则表达式来说好得不止一点。

这个动态链接库在 <https://github.com/xddxdd/libltnginx>，提供四个查询函数：

```c
char* whois_ip_lookup(char* cidr);
const char* whois_nic_handle_lookup(char* name);
const char* whois_domain_lookup(char* name);
const char* whois_asn_lookup(uint32_t asn);
```

用 Lua 可以简单地调用它们：

```lua
local ffi       = require "ffi"
local ltnginx   = ffi.load("path/to/libltnginx.so")

ffi.cdef[[
    char* whois_ip_lookup(char* cidr);
    const char* whois_nic_handle_lookup(char* name);
    const char* whois_domain_lookup(char* name);
    const char* whois_asn_lookup(uint32_t asn);
]]

local lantian_nginx = {}

function lantian_nginx.whois_ip_lookup(target)
    local c_str = ffi.new("char[?]", #target)
    ffi.copy(c_str, target)
    return ffi.string(ltnginx.whois_ip_lookup(c_str))
end

function lantian_nginx.whois_nic_handle_lookup(target)
    local c_str = ffi.new("char[?]", #target)
    ffi.copy(c_str, target)
    return ffi.string(ltnginx.whois_nic_handle_lookup(c_str))
end

function lantian_nginx.whois_domain_lookup(target)
    local c_str = ffi.new("char[?]", #target)
    ffi.copy(c_str, target)
    return ffi.string(ltnginx.whois_domain_lookup(c_str))
end

function lantian_nginx.whois_asn_lookup(target)
    return ffi.string(ltnginx.whois_asn_lookup(tonumber(target)))
end

return lantian_nginx
```

nginx 的配置也可以大幅简化：

```nginx
server {
    listen 43 plain;
    listen [::]:43 plain;

    location / {
        rewrite "^/([0-9]+)$" /AS$1 last;
        rewrite "^/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$" /$1.$2.$3.$4/32 last;
        rewrite "^/([0-9a-fA-F:]+)$" /$1/128 last;
        return 200 "% Lan Tian Nginx-based WHOIS Server\n% GET $request_uri:\n% 404 Not Found\n";
    }

    location ~* "^/[Aa][Ss]([0-9]+)$" {
        set $asn $1;
        set_by_lua_block $backend {
            local lantian_nginx = require "lantian_nginx";
            return lantian_nginx.whois_asn_lookup(ngx.var.asn);
        }

        proxy_pass http://$backend:43/AS$1;
        proxy_http_version plain;
    }

    location ~* "^/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/([0-9]+)$" {
        set $ip $1;
        set_by_lua_block $backend {
            local lantian_nginx = require "lantian_nginx";
            return lantian_nginx.whois_ip_lookup(ngx.var.ip);
        }

        proxy_pass http://$backend:43/$ip;
        proxy_http_version plain;
    }

    location ~* "^/([0-9a-fA-F:]+)/([0-9]+)$" {
        set $ip $1;
        set_by_lua_block $backend {
            local lantian_nginx = require "lantian_nginx";
            return lantian_nginx.whois_ip_lookup(ngx.var.ip);
        }

        proxy_pass http://$backend:43/$ip;
        proxy_http_version plain;
    }

    location ~* "^/(.*)-([a-zA-Z0-9]+)$" {
        set_by_lua $query_upper "return ngx.var.uri:upper():sub(2)";
        set_by_lua_block $backend {
            local lantian_nginx = require "lantian_nginx";
            return lantian_nginx.whois_nic_handle_lookup(ngx.var.query_upper);
        }

        proxy_pass http://$backend:43/$query_upper;
        proxy_http_version plain;
    }

    location ~* "^/(.*)\.([a-zA-Z0-9]+)$" {
        set_by_lua $query_lower "return ngx.var.uri:lower():sub(2)";
        set_by_lua_block $backend {
            local lantian_nginx = require "lantian_nginx";
            return lantian_nginx.whois_domain_lookup(ngx.var.query_lower);
        }

        proxy_pass http://$backend:43/$query_lower;
        proxy_http_version plain;
    }
}
```

由于没有了一大堆正则表达式，动态库的占用内存也不大，nginx worker 的内存占用也回到了 30MB 的正常值。

总结
----

只要经过简单的修改，nginx 就可以变成一个 WHOIS 代理服务器，查询任意 WHOIS 信息。

现在这个 WHOIS 代理服务已经在本站运行，可以通过 `whois -h lantian.pub google.com` 来体验。
