```bash
conn dn42-lantian # change to whatever you want
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
    # Your server IP
    left=12.34.56.78
    # My (or your peer's) server IP
    right=185.186.147.110
    leftrsasigkey=/etc/ipsec.d/public/mykey.pem
    # My (or your peer's) public key
    rightrsasigkey=/etc/ipsec.d/public/lantian.pem
```
