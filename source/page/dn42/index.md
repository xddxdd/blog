---
title: 'DN42'
date: 1970-01-01 00:00:00
---

如果你需要 DN42 配置上的帮助，可以参见《[DN42 实验网络介绍（2020 版）](/article/modify-website/dn42-experimental-network-2020.lantian)》，以及浏览本站之前有关 DN42 的文章。

“1xRTT”（单次来回）对接（Peering）
------------------------------

我住在中国，而你有可能在地球的另一侧。此时我们的一轮邮件（你发一封，我在你睡着时回复，你醒来后查看）需要 24 小时甚至更多。

以下是进行 “1xRTT”（单次来回）对接（Peering）的说明，意味着我们可以只用两封邮件建立 Peering，一封来自你，一封来自我。即使没有时区差异，“1xRTT” Peering 仍然能减少很多麻烦。

1. 从下面的列表中选择一个服务器。一般你应该选择到你那边延迟（Ping）最低的服务器。
   - 如果你有多台服务器加入 DN42，并且愿意的话，我可以同时建立多个 Peering。
2. 选择一种 VPN 建立隧道。
   - 我偏好使用 WireGuard 和 OpenVPN，但 GRE/IPSec，明文 GRE 和 ZeroTier One 也可以。
   - **注意：我不**与中国大陆的服务器 Peer，以避免可能的法律问题。
   - 我也愿意尝试其它种类的 VPN，只要你询问就可以了。
3. 在你那边配置好 VPN 隧道和 BGP 客户端。你可以假设我会使用以下的配置：
   - 基础信息：
     - ASN：**4242422547**
     - 公网 IP：见以下列表
     - DN42 IPv4（隧道我这端的地址）：见以下列表
       - 如果你需要为隧道设置一个地址块（例如 /30），这个地址块将来自你的地址池（由你分配给我）。
       - 以上设置常见于 Mikrotik 等硬件路由器。
     - DN42 IPv6：**fe80::2547**，用于本地链路（Link-local）连接
       - 如果你需要为隧道设置一个地址块（例如 /64），这个地址块将来自你的地址池（由你分配给我）。
     - Multiprotocol BGP（MP-BGP）：
       - 虽然我支持 MP-BGP，但我默认仍会同时配置 v4、v6 两条 BGP 会话。
       - 如果你也支持 MP-BGP，只需要一条会话，直接告诉我就行。
   - 建立 VPN 隧道：
     - WireGuard/OpenVPN 我这端的端口号：**你的 ASN 的后五位**
       - 例如 4242420001 意味着我会使用 20001 端口
     - OpenVPN 预共享密钥：你来生成，之后发送给我
     - GRE/IPSec 公钥：见以下列表
     - OpenVPN/IPSec 默认设置：见下
       - 如果你无法使用我的默认参数，请设置好你可以接受的参数，然后发送给我。
     - ZeroTier One：我会申请加入你的网络
       - 如果可以的话，你可以尝试发送加入网络的邀请。
4. 将以下信息发邮件给 **b980120@hotmail.com**:
   - 基础信息：
     - ASN
     - 公网 IP
       - 我偏好 IPv4 地址，因为在我的一些服务器上，IPv6 是由隧道提供的（即 HE.NET Tunnelbroker）
     - DN42 IPv4 and IPv6（隧道你那端的地址）
       - 或者地址块，如果你需要的话
       - 对于 IPv6 Peering，需要包括本地链路（Link-local）地址
     - 你想和哪台服务器连接
   - 建立 VPN 隧道：
     - WireGuard/OpenVPN 你那端的端口号
       - 如果你不写明，我会假设你使用 22547 端口
     - OpenVPN 预共享密钥：由你生成
     - GRE/IPSec 公钥
     - ZeroTier One：你的网络 ID（我会申请加入）
     - OpenVPN/IPSec 设置参数（如果你无法使用我的默认参数）
5. 等我设置好 VPN 隧道和 Peering，然后回复邮件。一般这时 Peering 就已经成功了。
   - 你可以使用[我的 Looking Glass](https://lg.lantian.pub/) 来调试连接。

注：我不建议通过 IRC 联系我。虽然我开着 IRC 客户端，但我每月只会去看一两次信息，除非你主动在邮件中要求。

基本信息
-------

- ASN：4242422547
- IPv4 地址池：172.22.76.184/29 和 172.22.76.96/27
- IPv6 地址池：fdbc:f9dc:67ad::/48
- 我这边的默认端口号：你的 ASN 的后五位
- 服务状态：[https://lg.lantian.pub](https://lg.lantian.pub/)

服务器列表
--------

- 服务器 1：中国香港，微基主机（idc.wiki，原 50KVM）服务商
  - 域名：`50kvm.lantian.pub`
  - 公网 IPv4：`23.226.61.104`
  - 公网 IPv6：`2001:470:19:10bd::1`
  - DN42 IPv4：`172.22.76.186`
  - DN42 IPv6：`fdbc:f9dc:67ad:1::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`xelzwt1j0aoKjsQnnq8jMjZNLbLucBPwPTvHgFH/czs=`
  - IPSec 公钥：

    ```bash
    -----BEGIN PUBLIC KEY-----
    MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzy8ZqMazr2Ur6jiEoVdr
    1d8WJaWTySaSwQqhkMnWKNv9Zuk4aITyBxHmtNfVexJGploAeby0zCqLS8CiNbor
    odPgOPjJdVzkgu6nS+mq1mrjMtrUYJE+GkoILpFoz3z5zS40q2eLh1TJUGQdhSai
    dTkLiAB6XbBXUBZUPDdBGeKQ72EYBck2oJKpe8B/gXXGwyZqlM7h3h4w8XkOYcrF
    CI6wbpusiPKaSOW1TkgHHBlIo0qje+Hbax+HcBlrRiftWl5cgVxyS5G7FvNgFVj5
    H3Tlvhh+wnhdaYQcsaWvcUDHZhOGqeIO1OJMXZ1oi55Mhr7/gFEw1ELk9VWVM+Mj
    KmAY/7X7l2fupt7QqFHh453kT1P6v75GnLyGLcbgIkAFJyqWiGUT0/TcTEtXimDn
    +e4Tt5XBYr6YoKsF2YZtcQbQp0UyUGECvKbU1JAmpJoZl+6nUdv89RCOTxvyxpv9
    0cSX2NLt05nA93BBKm5wwjClIrablF6nnvuWY3pQrneZFgz9iDaBRqQJWpcfw8Qa
    v1Oi/Uug7kl/v/OZEV7xMV71e5OnQlWjwp5dhmIgmkUMEsEviFoVwUPnDsgamzF4
    p1iBnYAPBVbJm2pTv/AerKdCBOj6XwGu2N12bZNtSuDFbZR7tOTytB+/tcQBXaPu
    2DslNqlf/ddRj0Avj5pV/5UCAwEAAQ==
    -----END PUBLIC KEY-----
    ```

- 服务器 2：美国洛杉矶，HostDare 服务商
  - 域名：`hostdare.lantian.pub`
  - 公网 IPv4：`185.186.147.110`
  - 公网 IPv6：`2607:fcd0:100:b100::198a:b7f6`
  - DN42 IPv4：`172.22.76.185`
  - DN42 IPv6：`fdbc:f9dc:67ad:3::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`zyATu8FW392WFFNAz7ZH6+4TUutEYEooPPirwcoIiXo=`
  - IPSec 公钥：

    ```bash
    -----BEGIN PUBLIC KEY-----
    MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAw5uRE2augI9l4pCKG6Kh
    qFTXGIcxtp367yLnKb5SPlYt3p2evpo58KNYMZtB50/iaUy/jkBDWEYPuwXMmKc1
    hjWC3C1/ZS5KLlM8zY3S7LCc+GhJw5DuC7dQpeadLzpKpIOqzcIOUh0qe0mkOXCS
    f+ulgCYTH1nh5xENvfV0ulxv37SjdZFjORGwIYpARvdJ6DsyEbyNyDsm8Va8XLen
    DQrVZjQM0Dw8BcFqIysVpPsjGzddO58KUCln02Y+l9OUXuH46z5i4SdpqpAS60q3
    hhJNzSSZCvfs38/fEelq3rAn+73lXBJKKtBgmYku+t2/stfQuV3Jem7EcM21nnWJ
    aKBem8+WRmWvYbr1eJZBYSbIQNaPgN8kcnapUq0VPS8jS2vmx63uATnetc0ZN5yG
    1t8HMmkAN2QB9+Hl28iVvYCgwK3R0wRfZNlIMLechMjHlyi2Pp9+0hMB1yRH6+tq
    isYGJtm2ZqQ+1+Z17FLb1zNBoMniV+rdkMXxJT7sac5dFv3J4nbxdDYQzdK2gUq+
    6ZOtBjgJF66GogwaclL0XdU8PANwfzOSapsnjeo3O7EOteEc/1Tf2sFU0KzcxY2B
    3rKqHX/sThD3xaBbF1sS/JvN9yTrPcCOIzAePlKA+3+n7JabtKRtVvJXUwmidwja
    OLIBFYyHNksKOBYLkeFhrAMCAwEAAQ==
    -----END PUBLIC KEY-----
    ```

- 服务器 3：美国纽约，VirMach 服务商
  - 域名：`virmach-ny1g.lantian.pub`
  - 公网 IPv4：`107.172.134.89`
  - 公网 IPv6：`2001:470:1f07:54d::1`
  - DN42 IPv4：`172.22.76.190`
  - DN42 IPv6：`fdbc:f9dc:67ad:8::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`a+zL2tDWjwxBXd2bho2OjR/BEmRe2tJF9DHFmZIE+Rk=`
  - IPSec 公钥：

    ```bash
    -----BEGIN PUBLIC KEY-----
    MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvi/9B2Ms73OqyITx7fmF
    euImT7rHexwQ8Xz6Hdn8O6FfPK9XLBYRnxYxOT616PNfwHxZpddQgE9ilgmCmGH/
    W/7+gF+Ub0WfPPsmCjQ0XoYB32bEv9FTuF0Z94A2HGB4DW7b4zRcwC63NgTWLZ1t
    S+josno+1Q4pwmffNipPm/Z3jH+DMoJep8ShqANG3JKnzAR40X1XHv9KpYIgyIgZ
    QGChXK55rY7zprQQ+Hab2sHZ1vAlsfQ0OitgIYqc770Tewfz9AWbOLqz6WIPifKg
    9Mhzli1dsO5rBG3VG3KAuJOejiEZKrG1EteWW24Zv5iRCh2qTbiyZmHHlKpwukOw
    UwLyE3k8b8ZnAF0rpZ3Amq0W1zZXI6M9VXtcyHUPUCFICdTluE9UHHpFDCQvolqO
    UuEzqJ6FyAXMhH14JG19uM+uGcbLEtFOQR13iQK8LnVWVl3nF3AqHUthdXCmWqb/
    IjfcThEFvno4qE95ByOzIW3/AR+IWSU1XDEQZieIztQqJvUADUl60j4lbM5+SbLw
    uBcAjWSK8wLeUqy8CLeIv41olKnpPXTNbouu+E/7qxOLEfjkx6QZ3DhN1UGtPFQS
    Xt1p+DuItBlcE2vJzADHTCb3LsdhMQ3q3reH9DVbDxyIxrKxpcVJHHI37rboBDl9
    BWxEF0pSRIaVU2DExNVLz6ECAwEAAQ==
    -----END PUBLIC KEY-----
    ```

- 服务器 4：德国法兰克福，Virtono 服务商
  - 域名：`virtono.lantian.pub`
  - 公网 IPv4：`45.138.97.165`
  - 公网 IPv6：`2001:ac8:20:3::433a:a05d`
  - DN42 IPv4：`172.22.76.187`
  - DN42 IPv6：`fdbc:f9dc:67ad:2::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`DkmSBCIgrxPPZmT07DraoCSD/jSByjPkYqHJWfVZ5hM=`
  - IPSec 公钥：暂无（等有人需要 IPSec 再生成）

- 服务器 5：罗马尼亚，HostSolutions 服务商
  - 域名：`hostsolutions.lantian.pub`
  - 公网 IPv4：`193.148.70.208`
  - 公网 IPv6：`2001:470:1f1b:bb::1`
    - 该节点到 HE 的隧道服务器**延迟较高**（约 50 ms），所以推荐使用 IPv4 地址连接，除非你只有 IPv6。
  - DN42 IPv4：`172.22.76.188`
  - DN42 IPv6：`fdbc:f9dc:67ad:9::1`
  - Link-local IPv6：`fe80::2547`
  - WireGuard 公钥：`o1khch2IZ5IbVgEm8kIKyCtqj1hfkRb+OP51tOBrwSk=`
  - IPSec 公钥：

    ```bash
    -----BEGIN PUBLIC KEY-----
    MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAs1pxDctgxMG6oxVOPgO7
    LXDTBf8V4H2CJAGUBkJaFo5hi6seWDjmyhbtPU6Sop0Bpq/cKoHkWgN5RLpdeeHm
    y1Hh+75jacjvyZG+KcReRerAzGjwizgeq7te9HySo1vncYnPnU4piJgMl/A2g52/
    irv/FHP46RPGjky3joUW5Bt35qSQuvBJJB2G2LW2spgUxcBBtviLbHVfFY/Suj8R
    qYaIP/DV56hggkFEmrxVC5rOc4CIWijYIS5pYxyCk1yZqsH6uCpFLXyOUMt/k8ut
    5fb/KLdt1HcGTUqfBsJNZzhSEq058YalvWdhz+QFQMELcQe0CB8nRbNH5c4qZAyQ
    nxiV07Aexa+LYFWIPfbDJZqTwqOTmeRzSXkQt5FTVHuiWihJs7nhGDYtMRWLKGAO
    xnBkz+O0bwl1HKJ2ddi4h2UAz2pJTruqp8B72Z3VtISdxi7qkUcItsEHZAvY0Hc0
    uFhDg1ZEgm4ER75b4/GIogZiba7euXWn/jYbDpXy6EkfrVgA7oqMFdY+4/zWQ9wV
    BwuMCa5KPW3LydVQARPFDs1K59qGrs6JLnv0juM9rtW14YYHF0/wj6syjE5QDcY+
    4bjsVSByB2ZhMUMLdKusS/oA6CDyF3doGvlzbo70BgKYifagBbw+l3wD0CUzH3Zn
    bl9kuJhvIz++kAAj7VCLYUECAwEAAQ==
    -----END PUBLIC KEY-----
    ```

我的配置模板（默认参数）
-------------------

> 如果你准备在自己那端使用这些模板，记得交换两边的 IP 地址等信息。

OpenVPN:

```bash
proto         udp
mode          p2p
remote        [你的 IP]
rport         22547
local         [我的 IP]
lport         [你的 ASN 后五位]
dev-type      tun
resolv-retry  infinite
dev           dn42-[昵称]
comp-lzo
persist-key
persist-tun
tun-ipv6
cipher        aes-256-cbc
ifconfig      [我的 DN42 IPv4 地址] [你的 DN42 IPv4 地址]
ifconfig-ipv6 fe80::2547 [你的 Link-local IPv6 地址]

# 去除自动生成的隐私保护 IPv6 地址（干扰 Link-local 连接）
script-security 2
up "/bin/sh -c '/sbin/sysctl -w net.ipv6.conf.$dev.autoconf=0 && /sbin/sysctl -w net.ipv6.conf.$dev.accept_ra=0 && /sbin/sysctl -w net.ipv6.conf.$dev.addr_gen_mode=1'"

<secret>[静态密钥]</secret>
```

ipsec.conf:

```bash
conn dn42-[昵称]
    keyexchange=ikev1
    ike=aes128-sha384-ecp384!
    esp=aes128gcm16-ecp384!
    ikelifetime=28800s
    authby=pubkey
    dpdaction=restart
    lifetime=3600s
    type=transport
    auto=start
    keyingtries=%forever
    left=[我的 IP]
    right=[你的 IP]
    leftrsasigkey=/etc/ipsec.d/public/mykey.pem
    rightrsasigkey=/etc/ipsec.d/public/[你的 IPSec 公钥].pem	
```
