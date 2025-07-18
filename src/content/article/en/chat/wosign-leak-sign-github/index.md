---
title: "WoSign, Why Don't You Just Fly to the Sky!"
categories: Chat
tags: [WoSign, GitHub]
date: 2016-08-28 17:38:00
autoTranslated: true
---

Just saw on V2EX that someone exploited a vulnerability in WoSign's certificate
issuance system to successfully issue a certificate for GitHub's main domain.

[https://crt.sh/?id=29647048](https://crt.sh/?id=29647048)

```bash
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            5d:8f:2b:91:ef:b8:dd:65:af:4c:c1:2b:15:ef:4b:6e
    Signature Algorithm: sha256WithRSAEncryption
        Issuer:
            commonName                = WoSign CA Free SSL Certificate G2
            organizationName          = WoSign CA Limited
            countryName               = CN
        Validity
            Not Before: Jun 10 05:42:44 2015 GMT
            Not After : Jun 10 06:03:35 2018 GMT
        Subject:
            commonName                = schrauger.github.io
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (2048 bit)
                Modulus:
                    00:e4:3b:a1:76:73:3c:b1:62:8d:53:6d:ef:a8:e9:
                    5b:9e:0e:15:63:e6:57:ac:cc:31:b3:48:2b:01:74:
                    ae:d8:7d:1c:6b:ed:2a:40:45:36:62:83:ac:d7:a5:
                    80:9c:21:88:dc:ec:4d:ae:35:5d:65:e6:95:ee:81:
                    7a:1f:b5:a7:e9:19:f8:7a:42:ff:dc:b4:71:63:ce:
                    3c:70:6f:89:54:af:57:de:27:bb:79:07:54:44:68:
                    ee:1c:7e:14:d9:eb:bc:4e:99:52:f6:b5:34:30:2c:
                    38:63:7b:95:8a:ea:54:7e:d5:4b:f0:1d:73:3b:03:
                    ea:12:2d:8a:3c:ea:f2:f1:04:5a:1b:8b:cf:3e:c9:
                    98:e6:2a:69:53:67:61:d0:6b:79:33:b6:08:3a:be:
                    dd:16:d6:02:ab:f2:6d:e0:02:be:f2:d9:13:6b:08:
                    b7:f2:de:fa:79:d1:4c:39:f8:bb:e5:18:89:f2:2b:
                    b6:df:59:54:9e:8a:48:0e:06:fb:eb:ad:e0:2a:b5:
                    0a:e8:51:45:bc:ac:51:65:cf:69:de:64:8f:30:e0:
                    d7:c6:c1:fd:30:1d:99:ea:7c:3d:d4:f6:bb:87:c9:
                    dd:f0:e4:74:4e:92:2d:27:5e:8c:fc:42:79:7f:59:
                    7c:f4:40:71:de:c3:b8:6e:a9:21:7e:8f:8c:7d:2c:
                    2c:85
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Key Usage:
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage:
                TLS Web Client Authentication, TLS Web Server Authentication
            X509v3 Basic Constraints:
                CA:FALSE
            X509v3 Subject Key Identifier:
                F7:8A:D1:06:8A:4B:6F:1F:B2:BA:39:A6:03:D7:C7:61:E5:14:0C:05
            X509v3 Authority Key Identifier:
                keyid:D2:A7:16:20:7C:AF:D9:95:9E:EB:43:0A:19:F2:E0:B9:74:0E:A8:C7

            Authority Information Access:
                OCSP - URI:http://ocsp6.wosign.com/ca6/server1/free
                CA Issuers - URI:http://aia6.wosign.com/ca6.server1.free.cer

            X509v3 CRL Distribution Points:

                Full Name:
                  URI:http://crls6.wosign.com/ca6-server1-free.crl

            X509v3 Subject Alternative Name:
                DNS:schrauger.github.io
                DNS:schrauger.github.com
                DNS:github.io
                DNS:github.com
                DNS:www.github.io
            X509v3 Certificate Policies:
                Policy: 2.23.140.1.2.1
                Policy: 1.3.6.1.4.1.36305.6.1.2.2.1
                  CPS: http://www.wosign.com/policy/

    Signature Algorithm: sha256WithRSAEncryption
         36:1f:74:a6:b4:98:b6:95:b3:7e:d1:c7:91:0c:5a:35:bd:05:
         00:3f:93:c2:1d:72:e0:b9:36:32:a3:d8:0d:91:53:f5:f9:f6:
         30:38:d3:06:02:7a:30:aa:90:38:aa:b7:aa:06:c9:7b:9e:4c:
         21:67:70:fd:c2:16:a3:c1:b0:73:ae:e5:b9:a6:e8:d7:f1:76:
         ce:a4:71:be:f0:1a:81:3c:ee:7a:8e:7a:1e:b7:5d:28:89:bf:
         62:c2:1d:75:47:b1:e5:51:95:48:f1:d5:1a:a4:71:09:c5:59:
         79:dc:04:88:3e:40:c2:3d:b6:92:ee:4d:67:61:7a:c8:42:32:
         e2:83:6a:0d:98:a9:69:71:12:f3:d7:f2:36:d5:7f:fa:b3:fd:
         1e:97:16:ab:81:08:d1:f5:67:11:7a:73:3d:5d:79:35:f5:57:
         56:ed:52:5d:86:af:07:5b:af:bd:62:87:c7:4e:c5:4f:59:fe:
         1c:c6:35:ef:36:3c:b7:43:e8:b6:b1:b8:d9:1e:a2:fc:7c:a9:
         f2:98:ff:3d:76:f2:75:0d:13:e4:f8:cd:f8:c5:f6:c0:60:06:
         9c:3a:13:e0:ff:86:5a:14:a6:6e:2e:e6:ca:10:01:c0:d9:34:
         a2:07:ab:0a:ba:19:79:c0:9c:b0:c5:97:c4:b4:64:12:c3:ce:
         e4:c1:fd:ae
```
