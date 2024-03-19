```bash
proto         udp
mode          p2p

# 我的（或者你的 Peer 的）服务器 IP
remote        185.186.147.110
# 我的（或者你的 Peer 的）隧道端口，一般是你的 ASN 的后五位
rport         21234
# 你的服务器 IP
local         12.34.56.78
# 你的隧道端口，一般是 22547（或者你的 Peer 的 ASN 的后五位）
lport         22547

dev-type      tun
resolv-retry  infinite
dev           dn42-lantian    # 随意修改
comp-lzo
persist-key
persist-tun
tun-ipv6
cipher        aes-256-cbc
# 第一个是你的 DN42 内的 IP，第二个是我的（或者你的 Peer 的）
ifconfig      172.21.2.3 172.22.76.185
# 第一个是你的 Link-local IPv6，第二个是我的（或者你的 Peer 的）
ifconfig-ipv6 fe80::1234 fe80::2547

# 隧道启动后运行的脚本：
# 1. 删除 Stable-privacy IPv6
# 2. 设置优先使用的对外连接的 IPv6 地址（例如 fd12:3456:7890::1）
script-security 2
up "/bin/sh -c '/sbin/sysctl -w net.ipv6.conf.$dev.autoconf=0 && /sbin/sysctl -w net.ipv6.conf.$dev.accept_ra=0 && /sbin/sysctl -w net.ipv6.conf.$dev.addr_gen_mode=1 && /sbin/ip addr add fd12:3456:7890::1/128 dev $dev'"

# 设置成我们的隧道的静态密钥
# 可以用 openvpn --genkey --secret static.key 生成
<secret>
-----BEGIN OpenVPN Static key V1-----
0123456789abcdef0123456789abcdef
# ...
# 密钥内容
# ...
0123456789abcdef0123456789abcdef
-----END OpenVPN Static key V1-----
</secret>
```
