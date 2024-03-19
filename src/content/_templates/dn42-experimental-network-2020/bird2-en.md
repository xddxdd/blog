```bash
# Add to /etc/bird/peers/dn42_lantian.conf
# Rename dn42_lantian_v4 to whatever you want
protocol bgp dn42_lantian_v4 from dnpeers {
    # Set to my (or your peer's) DN42 IPv4 address and ASN
    neighbor 172.22.76.185 as 4242421234;
    direct;
    # Disable IPv6 route exchange in IPv4 BGP, strongly recommended
    ipv6 {
        import none;
        export none;
    };
};

# Rename dn42_lantian_v6 to whatever you want
protocol bgp dn42_lantian_v6 from dnpeers {
    # Set to my (or your peer's) link-local IPv6, the tunnel's interface name, and ASN
    neighbor fe80::1234 % 'dn42-lantian' as 4242421234;
    direct;
    # Disable IPv4 route exchange in IPv6 BGP
    # You may remove these statements if you want to use "multiprotocol BGP" (MP-BGP)
    ipv4 {
        import none;
        export none;
    };
};
```
