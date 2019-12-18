---
lang: zh
title: 'DN42'
label: dn42
weight: 4
typesuffix: "/"
---

Chinese comes after English / 中文信息在英文信息之后

Check out: [Looking glass][1], [alternative][2]

English: How to peer with me
----------------------------

Step 1: Choose a server from the list below with low latency (ping) to your server.

Step 2: Choose a type of VPN. Every server has a list of available and unavailable VPN types.

- I'm also willing to try new types of VPNs. If I didn't list the VPN you want to use, you can always communicate with me about it.

Step 3: Generate the information needed for the VPN connection, such as:

- OpenVPN static key, port number
- GRE/IPSec public key, key exchange algorithm, etc
- ZeroTier One network ID

Step 4: Send an email to me with these information:

- Your ASN
- Which server you choose to peer with
- Public IPv4 and DN42 IPv4 of your server
- (Optional) A link-local address, such as fe80::1234, if you need IPv6 peering.
- VPN connection information, listed above

Send the email to b980120@hotmail.com, I will respond ASAP.

PS: It's not recommended to contact me over IRC. Although I leave IRC client running, I don't often read messages, and I can't guarantee that I'll respond in time.

English: My network
-------------------

- ASN: 4242422547
- IPv4 Pool: 172.22.76.184/29 and 172.22.76.96/28
- IPv6 Pool: fdbc:f9dc:67ad::/48
- Looking glass: [https://lg.lantian.pub][3]

English: Servers
----------------

Server 1: Hong Kong, China, provider GigsGigsCloud

```bash
Public IPv4: 103.42.215.193
Public IPv6: 2001:470:19:10bb::1 (HE.NET tunnel broker)
DN42 IPv4: 172.22.76.186
DN42 IPv6: fdbc:f9dc:67ad::8b:c606:ba01
Link-local IPv6: fe80::2547
Available VPN: OpenVPN, GRE/IPSec, GRE/Plain, ZeroTier One, WireGuard
Unavailable VPN: None
```

Server 2: Los Angeles, United States, provider HostDare

```bash
Public IPv4: 185.186.147.110
Public IPv6: 2001:470:d:46e::1 (HE.NET tunnel broker)
DN42 IPv4: 172.22.76.185
DN42 IPv6: fdbc:f9dc:67ad::dd:c85a:8a93
Link-local IPv6: fe80::2547
Available VPN: OpenVPN, GRE/IPSec, GRE/Plain, ZeroTier One, WireGuard
Unavailable VPN: None
```

Server 3: New York, United States, provider VirMach

```bash
Public IPv4: 107.172.134.89
Public IPv6: None
DN42 IPv4: 172.22.76.190
DN42 IPv6: fdbc:f9dc:67ad::cc:433e:da3b
Link-local IPv6: fe80::2547
Available VPN: OpenVPN, GRE/IPSec, GRE/Plain, ZeroTier One, WireGuard
Unavailable VPN: None
```

Server 4: Roubaix, France, provider WisHosting (NAT VPS)

```bash
Public IPv4: 178.32.100.87
Public IPv6: 2001:41d0:1:777c:200:c0a8:6582:0
DN42 IPv4: 172.22.76.188
DN42 IPv6: fdbc:f9dc:67ad::88:3fc0:8122
Link-local IPv6: fe80::2547
Available VPN: OpenVPN, ZeroTier One
Unavailable VPN: GRE/IPSec, GRE/Plain, WireGuard
```

中文：如何与我 Peer
-----------------

第一步：在下面的服务器列表中，选择到你的服务器 Ping 值低的服务器。

第二步：确定一种 VPN 方式。每台服务器都会列出可用和不可用的 VPN 类型。

- 我也愿意尝试新的 VPN 方式。如果我没有列出你想用的 VPN 类型，你可以与我协商来使用这种 VPN。

第三步：生成 VPN 连接所需的信息，例如：

- OpenVPN 静态密钥和端口号
- GRE/IPSec 的公钥，加密算法等配置
- ZeroTier One 的网络 ID

第四步：发送邮件给我，邮件中要包含这些信息：

- 你的 ASN
- 你选择与我哪台服务器 Peer
- 你与我 Peer 的这台服务器的公网 IPv4 以及在 DN42 中的 IPv4
- （可选）如果你需要 IPv6 Peering，请提供一个 Link-local 地址，例如 fe80::1234
- 上述 VPN 连接所需的信息

将邮件发到 b980120@hotmail.com。我收到邮件后会尽快与你联系。

注：不建议与我在 DN42 的 IRC 上联系，虽然我一直开着 IRC 客户端，但是我很少上去看，不一定能及时回复。

中文：我的网络信息
---------------

- ASN：4242422547
- IPv4 地址池：172.22.76.184/29 和 172.22.76.96/28
- IPv6 地址池：fdbc:f9dc:67ad::/48
- Looking glass：[https://lg.lantian.pub][4]

中文：服务器列表
-------------

服务器 1，中国香港 GigsGigsCloud

```bash
公网 IPv4：103.42.215.193
公网 IPv6：2001:470:19:10bb::1（HE.NET 隧道）
DN42 IPv4：172.22.76.186
DN42 IPv6：fdbc:f9dc:67ad::8b:c606:ba01
Link-local IPv6：fe80::2547
可用的 VPN：OpenVPN，GRE/IPSec，GRE/Plain，ZeroTier One，WireGuard
不可用的 VPN：无
```

服务器 2，美国洛杉矶 HostDare

```bash
公网 IPv4：185.186.147.110
公网 IPv6：2001:470:d:46e::1（HE.NET 隧道）
DN42 IPv4：172.22.76.185
DN42 IPv6：fdbc:f9dc:67ad::dd:c85a:8a93
Link-local IPv6：fe80::2547
可用的 VPN：OpenVPN，GRE/IPSec，GRE/Plain，ZeroTier One，WireGuard
不可用的 VPN：无
```

服务器 3，美国纽约 VirMach

```bash
公网 IPv4：107.172.134.89
公网 IPv6：无
DN42 IPv4：172.22.76.190
DN42 IPv6：fdbc:f9dc:67ad::cc:433e:da3b
Link-local IPv6：fe80::2547
可用的 VPN：OpenVPN，GRE/IPSec，GRE/Plain，ZeroTier One，WireGuard
不可用的 VPN：无
```

服务器 4，法国鲁贝 WisHosting（NAT VPS）

```bash
公网 IPv4：178.32.100.87（NAT VPS 仅少量端口可用）
公网 IPv6：2001:41d0:1:777c:200:c0a8:6582:0
DN42 IPv4：172.22.76.188
DN42 IPv6：fdbc:f9dc:67ad::88:3fc0:8122
Link-local IPv6：fe80::2547
可用的 VPN：OpenVPN，ZeroTier One
不可用的 VPN：GRE/IPSec，GRE/Plain，WireGuard
```

  [1]: https://lg.lantian.pub/
  [2]: https://lg-alt.lantian.pub/
  [3]: https://lg.lantian.pub/
  [4]: https://lg.lantian.pub/