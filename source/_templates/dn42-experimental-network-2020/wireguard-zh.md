```bash
[Interface]
# 你的 WireGuard 私钥
PrivateKey = ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFA=
# 你的端口号
ListenPort = 22547
Table = off
# 添加你的 Link-local IPv6（例如 fe80::1234）
PostUp = ip addr add fe80::1234/64 dev %i
# 添加你的 DN42 IPv6 地址（例如 fd12:3456:7890::1）
PostUp = ip addr add fd12:3456:7890::1/128 dev %i
# 第一个是你的 DN42 内的 IP，第二个是我的（或者你的 Peer 的）
PostUp = ip addr add 172.21.2.3 peer 172.22.76.185 dev %i
PostUp = sysctl -w net.ipv6.conf.%i.autoconf=0

[Peer]
# 我的（或者你的 Peer 的）公钥
PublicKey = zyATu8FW392WFFNAz7ZH6+4TUutEYEooPPirwcoIiXo=
# 我的（或者你的 Peer 的）服务器地址和端口号，端口号一般为你的 ASN 的后五位
Endpoint = hostdare.lantian.pub:21234
AllowedIPs = 10.0.0.0/8, 172.20.0.0/14, 172.31.0.0/16, fd00::/8, fe80::/64
```
