---
title: 'Lookup Any Public WHOIS with this nginx-based Server'
categories: 'Website and Servers'
tags: [nginx, WHOIS]
date: 2021-07-18 01:52:18
---

After I [set up a DN42 WHOIS server with Nginx](/en/article/modify-website/serve-dn42-whois-with-nginx.lantian/), I configured my DN42 Looking Glass to use this service. As my Looking Glass is capable of running as a Telegram bot, fellow group members are looking up WHOIS information of IPs and domains with it.

But soon we noticed a problem. A significant part of members have applied for ASNs and IP ranges on the public Internet after they're familiar enough with DN42, and they're peering at Internet Exchange Points. Therefore, they often need to lookup some public Internet IPs, ASNs, and domains, yet none of the Telegram bots in our group can do so. It would be quite helpful for us if there exists a WHOIS server that proxies lookups to relevant registries.

Proxying is exactly what Nginx is good at. With some modifications to Nginx, so it speaks the "one-request-one-response" protocol to its upstream, and the help of Lua scripting in OpenResty, we can have a WHOIS proxy in a fairly short time.

Modifying Nginx Proxy Logic
---------------------------

Nginx calls the function `ngx_http_proxy_create_request` to create the request header, specifically the `GET /url HTTP/1.1` part, when it wants to send one to the upstream.

The logic behind that function can be abstracted as:

```python
def ngx_http_proxy_create_request():
    # Join the first line of request (GET xxx)
    header = 'GET'
    header += url

    if http_version == '1.1':
        header += 'HTTP/1.1'
    else:
        header += 'HTTP/1.0'

    # Add other request headers
    for key, value in request_headers:
        header += key + ': ' + value

    # Send the request to upstream
    send(header)
```

Nginx itself already supports selecting HTTP version for proxy requests, but the only options are HTTP/1.0 (the default) and HTTP/1.1. We simply need to add a "one-request-one-response" mode (called `plain` mode), where it disables everything but putting in the URL:

```python
def ngx_http_proxy_create_request():
    # Join the first line of request (GET xxx)
    if http_version != 'plain':
        header = 'GET'
    header += url

    if http_version == '1.1':
        header += 'HTTP/1.1'
    else if http_version == '1.0':
        header += 'HTTP/1.0'
    else:
        pass

    # Add other request headers
    if http_version != 'plain':
        for key, value in request_headers:
            header += key + ': ' + value

    # Send the request to upstream
    send(header)
```

The actual patch is available at <https://gist.github.com/xddxdd/fed23d2fe5afa00bb609166886e3d206>. Specify `proxy_http_version plain;` to send a `plain` request to the upstream WHOIS server.

> A Gopher server can be proxied in the same way since Gopher is also a one-request-one-response protocol.

Find Relevant WHOIS Server
--------------------------

The Internet is split and managed by many different organizations. For example, ASNs and IPs are managed by [APNIC, AfriNIC, RIPE, ARIN, and LACNIC, the 5 RIRs](https://en.wikipedia.org/wiki/Regional_Internet_registry), whose regions are divided by continents. Domains are managed by even more organizations, such as global top-level domains (`.com`, `.net`, etc.), country/region domains (`.us`, `.cn`), and new gTLDs by corporations or individual organizations (`.ovh`, `.google`, etc.). Needless to say, each organization runs its own WHOIS server.

Good news is that the common `whois` command has lists builtin to find the relevant WHOIS server, including [16 bit ASN list](https://github.com/rfc1036/whois/blob/next/as_del_list), [32 bit ASN list](https://github.com/rfc1036/whois/blob/next/as32_del_list), [IPv4 list](https://github.com/rfc1036/whois/blob/next/ip_del_list), [IPv6 list](https://github.com/rfc1036/whois/blob/next/ip6_del_list), [Traditional TLD list](https://github.com/rfc1036/whois/blob/next/tld_serv_list), [New gTLD list](https://github.com/rfc1036/whois/blob/next/new_gtlds_list) and [NIC Handle (Registration info at RIRs) list](https://github.com/rfc1036/whois/blob/next/nic_handles_list), and we can simply take them for our own use. All the information is collected from the website of [IANA (Internet Assigned Numbers Authority)](https://en.wikipedia.org/wiki/Internet_Assigned_Numbers_Authority).

Writing Nginx Rules (Regex)
---------------------------

With the lookup information available, we can write nginx matching rules for them. Thanks to Nginx's regular expressions, we can tell different kinds of lookups apart and lookup corresponding lists.

```nginx
# ASN Lookup
location ~* "^/[Aa][Ss]([0-9]+)$" {
    set $asn $1;
    set_by_lua_block $backend {
        local asn = tonumber(ngx.var.asn);
        if asn >= 248 and asn <= 251 then return "whois.ripe.net" end
        if asn >= 306 and asn <= 371 then return "whois.nic.mil" end
        -- Skipped over a lot of rules
        -- Fallback to ARIN by default
        return "whois.arin.net"
    }

    proxy_pass http://$backend:43/AS$1;
    proxy_http_version plain;
}

# NIC Handle lookup, take ARIN and RIPE for example
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

# Domain lookup, take .com for example
location ~* "^/(.*)(\.[Cc][Oo][Mm])$" {
    set_by_lua $query_lower "return ngx.var.uri:lower():sub(2)";
    proxy_pass http://whois.verisign-grs.com:43/$query_lower;
    proxy_http_version plain;
}

# IP Lookup...?
```

With the rules configured and [nginx listening on port 43 in plain mode](/en/article/modify-website/serve-dn42-whois-with-nginx.lantian/), we can lookup ASNs, NIC Handles and domains.

But one important piece is missing: IP lookups. Lua language that came with OpenResty doesn't have an IP parsing function built-in, nor does it provide any functionality to tell if an IP is within a range. That means we need to craft our own code, which is both troublesome and error-prone. In addition, with one regular expression for each type of domain and NIC Handle, the memory consumption of each nginx worker rise from 30MB to a whopping 100MB, which made the life of tiny VPSes even harder.

But at least Lua is good at calling functions in shared libraries (`.so` libraries on Linux), and we can rewrite the logic in C.

Writing Nginx Rules (Library)
-----------------------------

And here, I created a simple shared library, which provides a few lookup functions to convert IP, ASN, domain, or NIC Handle to their WHOIS server address.

The library uses libc functions to parse IPs, use [a third party LPM (Longest Prefix Matching) library called liblpm](https://github.com/rmind/liblpm) to lookup WHOIS server efficiently, and simply scan through lookup list sequentially for ASN, domain, and NIC Handle since we don't need THAT much performance anyway. The library only uses a tiny amount of memory, much better than a bunch of regular expressions in Nginx.

The library is available at <https://github.com/xddxdd/libltnginx>, providing 4 lookup functions:

```c
char* whois_ip_lookup(char* cidr);
const char* whois_nic_handle_lookup(char* name);
const char* whois_domain_lookup(char* name);
const char* whois_asn_lookup(uint32_t asn);
```

They can be easily called from Lua:

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

And the configuration of nginx can be greatly simplified:

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

Without all the regular expressions and the small memory requirement for the library, the memory usage of a worker went back to the normal value of 30MB.

Conclusion
----------

With simple modifications, Nginx can be converted to a WHOIS proxy that allows looking up literally anything.

The WHOIS proxy service is running on this site; run `whois -h lantian.pub google.com` to try it out.
