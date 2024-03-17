```bash
proto         udp
mode          p2p

# my (or your peer's) server IP
remote        185.186.147.110
# my (or your peer's) tunnel port, last 5 digits of your ASN
rport         21234
# your server IP
local         12.34.56.78
# your tunnel port, usually 22547 (or last 5 digits of your peer's ASN)
lport         22547

dev-type      tun
resolv-retry  infinite
dev           dn42-lantian    # change to whatever you want
comp-lzo
persist-key
persist-tun
tun-ipv6
cipher        aes-256-cbc
# first is your DN42 IPv4, second is mine (or your peer's)
ifconfig      172.21.2.3 172.22.76.185
# first is your link-local IPv6, second is mine (or your peer's)
ifconfig-ipv6 fe80::1234 fe80::2547

# Post-up script that:
# 1. Remove stable-privacy IPv6 address
# 2. Assigns preferred outbound IPv6 address (fd12:3456:7890::1 in this case)
script-security 2
up "/bin/sh -c '/sbin/sysctl -w net.ipv6.conf.$dev.autoconf=0 && /sbin/sysctl -w net.ipv6.conf.$dev.accept_ra=0 && /sbin/sysctl -w net.ipv6.conf.$dev.addr_gen_mode=1 && /sbin/ip addr add fd12:3456:7890::1/128 dev $dev'"

# Set to static key for our tunnel
# Generated with openvpn --genkey --secret static.key
<secret>
-----BEGIN OpenVPN Static key V1-----
0123456789abcdef0123456789abcdef
# ...
# key contents
# ...
0123456789abcdef0123456789abcdef
-----END OpenVPN Static key V1-----
</secret>
```
