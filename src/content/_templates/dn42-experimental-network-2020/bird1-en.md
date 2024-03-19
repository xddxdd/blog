```bash
# Add to /etc/bird/peers4/dn42_lantian.conf
# Rename dn42_lantian to whatever you want
protocol bgp dn42_lantian from dnpeers {
    # Set to my (or your peer's) DN42 IPv4 address and ASN
    neighbor 172.22.76.185 as 4242421234;
    direct;
};

# Add to /etc/bird/peers4/dn42_lantian.conf
# Rename dn42_lantian to whatever you want
protocol bgp dn42_lantian from dnpeers {
    # Set to my (or your peer's) link-local IPv6, the tunnel's interface name, and ASN
    neighbor fe80::1234 % 'dn42-lantian' as 4242421234;
    direct;
};
```
