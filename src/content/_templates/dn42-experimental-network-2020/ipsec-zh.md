```bash
conn dn42-lantian # 随意修改
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
    # 你的服务器 IP
    left=12.34.56.78
    # 我的（或者你的 Peer 的）服务器 IP
    right=185.186.147.110
    leftrsasigkey=/etc/ipsec.d/public/mykey.pem
    # 我的（或者你的 Peer 的）公钥
    rightrsasigkey=/etc/ipsec.d/public/lantian.pem
```
