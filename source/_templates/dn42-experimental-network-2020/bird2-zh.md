```bash
# 在 /etc/bird/peers/dn42_lantian.conf 中填写
# lantian 可以被改为任意名字
protocol bgp dn42_lantian_v4 from dnpeers {
    # 设置成我的（或者你的 Peer 的）DN42 IPv4 地址以及 ASN
    neighbor 172.22.76.185 as 4242421234;
    direct;
    # 在 IPv4 BGP 中禁用 IPv6 路由传递，强烈推荐保留
    ipv6 {
        import none;
        export none;
    };
};

# lantian 可以被改为任意名字
protocol bgp dn42_lantian_v6 from dnpeers {
    # 设置成我的（或者你的 Peer 的）Link-local IPv6，隧道名称，以及 ASN
    neighbor fe80::1234 % 'dn42-lantian' as 4242421234;
    direct;
    # 在 IPv6 BGP 中禁用 IPv4 路由传递
    # 如果你想用 Multiprotocol BGP（MP-BGP），可以删除
    ipv4 {
        import none;
        export none;
    };
};
```
