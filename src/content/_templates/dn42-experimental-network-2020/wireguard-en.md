```bash
[Interface]
# Your WireGuard private key
PrivateKey = ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFA=
# Port number on your side
ListenPort = 22547
Table = off
# Add your link-local IPv6 (fe80::1234 in this case)
PostUp = ip addr add fe80::1234/64 dev %i
# Add your DN42 IPv6 address (fd12:3456:7890::1 in this case)
PostUp = ip addr add fd12:3456:7890::1/128 dev %i
# First IP is your DN42 IPv4, second is mine
PostUp = ip addr add 172.21.2.3 peer 172.22.76.185 dev %i
PostUp = sysctl -w net.ipv6.conf.%i.autoconf=0

[Peer]
# Set to my (or your peer's) public key
PublicKey = zyATu8FW392WFFNAz7ZH6+4TUutEYEooPPirwcoIiXo=
# Set to my (or your peer's) node IP and port, the port is last 5 digits of your ASN
Endpoint = hostdare.lantian.pub:21234
AllowedIPs = 10.0.0.0/8, 172.20.0.0/14, 172.31.0.0/16, fd00::/8, fe80::/64
```
