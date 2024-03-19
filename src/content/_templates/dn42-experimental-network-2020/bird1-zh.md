```bash
# 在 /etc/bird/peers4/dn42_lantian.conf 中填写：
# dn42_lantian 可以被改为任意名字
protocol bgp dn42_lantian from dnpeers {
    # 设置成我的（或者你的 Peer 的）DN42 IPv4 地址以及 ASN
    neighbor 172.22.76.185 as 4242421234;
    direct;
};

# 在 /etc/bird/peers6/dn42_lantian.conf 中填写：
# dn42_lantian 可以被改为任意名字
protocol bgp dn42_lantian from dnpeers {
    # 设置成我的（或者你的 Peer 的）Link-local IPv6，隧道名称，以及 ASN
    neighbor fe80::1234 % 'dn42-lantian' as 4242421234;
    direct;
};
```
