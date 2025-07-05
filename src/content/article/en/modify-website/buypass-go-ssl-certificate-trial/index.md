---
title: 'BuyPass GO SSL Certificate Trial'
categories: Website and Servers
tags: [BuyPass GO, SSL]
date: 2019-01-04 11:17:00
image: /usr/uploads/2019/01/2050316809.png
autoTranslated: true
---


BuyPass is a Norwegian Certificate Authority (CA) that provides various services including digital certificates and security authentication products. Recently, BuyPass launched an ACME-based automated certificate issuance service called BuyPass GO, similar to Let's Encrypt. The main difference from Let's Encrypt is that their certificates have a 180-day validity period per issuance—twice as long as Let's Encrypt's. Therefore, if you need to manually replace certificates for your service, BuyPass certificates are more convenient. Additionally, BuyPass currently doesn't support issuing wildcard certificates (commonly called wildcard certs?), requiring all domain names to be listed individually.

(Though personally, if manual certificate replacement is needed, I think it's better to apply for a one-year validity certificate from TrustAsia or similar providers.)

## Applying for Certificates

I use the [acme.sh][1] tool to apply for certificates. The first step is account registration. Unlike Let's Encrypt, BuyPass requires providing a valid email during registration:

```bash
cd /root/.acme.sh
./acme.sh --server https://api.buypass.com/acme/directory --register-account --accountemail [your email address]
```

If your domain has CAA records restricting which CAs can issue certificates, add a `0 issue buypass.com` record to allow BuyPass to issue certificates for you.

Then proceed with the application. I used DNS validation with CloudXNS as the provider:

```bash
export CX_Key=[API Key from CloudXNS user center]
export CX_Secret=[API Secret from CloudXNS user center]
./acme.sh --server https://api.buypass.com/acme/directory --issue -d [domain1] -d [domain2] --days 150 --dns dns_cx
```

I encountered a strange issue where the server returned a 500 error at the "Getting new-authz" step. After re-running the account registration command, it worked...

The certificate is then ready for use.

## Results

The certificate appears in Chrome as follows:

![BuyPass Certificate in Chrome][2]

SSLLabs test results:

![BuyPass Certificate SSLLabs Results][3]

I applied for one RSA and one ECC certificate. For the ECC certificate, the intermediate certificate is still RSA. The RSA intermediate requires the web server to send more data to clients. Ideally, there should be an ECC intermediate certificate. However, since Let's Encrypt also uses RSA intermediates for ECC certificates, this is acceptable.

My test site is at [https://buypass-ssl.lantian.pub][4] for your reference.

## Summary

Beyond the longer validity period, BuyPass doesn't offer significant advantages over Let's Encrypt. Given that ACME certificates are auto-renewed, the extended validity isn't a major benefit. Its greater significance lies in serving as an emergency backup if Let's Encrypt experiences outages.

[1]: https://github.com/Neilpang/acme.sh
[2]: /usr/uploads/2019/01/2050316809.png
[3]: /usr/uploads/2019/01/2758220465.png
[4]: https://buypass-ssl.lantian.pub
```
