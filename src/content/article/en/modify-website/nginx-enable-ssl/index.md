---
title: 'Enabling SSL Encryption for nginx'
categories: Website and Servers
tags: [Website, Tinkering]
date: 2013-01-27 01:09:00
autoTranslated: true
---


One advantage of using your own VPS is the ability to enable SSL encryption, which ensures secure blog management in public spaces and reduces the likelihood of connection interruptions due to environmental factors. The nginx package in Debian 6's software repository comes with the SSL module pre-installed, making SSL setup straightforward. Simply duplicate `/etc/nginx/sites-available/default` as `default-ssl` and apply the following modifications:

```nginx
server {
    listen              443;
    server_name         localhost;
    ssl                 on;
    ssl_certificate     lic.crt;
    ssl_certificate_key lic.key;
}
```

or (modify `default` directly as shown below):

```nginx
server {
    listen              80;
    listen              443 ssl;
    server_name         localhost;
    ssl_certificate     lic.crt;
    ssl_certificate_key lic.key;
}
```

Remember to replace `lic.crt` and `lic.key` with your actual certificate paths.

The real challenge lies in obtaining an SSL certificate. VeriSign and Thawte certificates typically cost at least 500-600 RMB annually. Currently, there are several ways to acquire free SSL certificates:

1. **Self-generated certificates** (search online for methods).  
   Pros: Convenient.  
   Cons: Triggers untrusted certificate warnings in all browsers.

2. **StartSSL**  
   > Like VeriSign, StartSSL (website: http://www.startssl.com, company: StartCom) is a Certificate Authority (CA). Its root certificate has long been supported by open-source browsers (Firefox, Chrome, Safari).  
   >  
   > In September [2012], StartSSL achieved a breakthrough with Microsoft: Windows update patches added StartCom to the Windows Root Certificate Program—marking Microsoft's first inclusion of a free certificate provider. Windows 7, Vista (patched), and XP now fully trust StartSSL certificates, extending support to IE browsers.  
   >  
   > Register at StartSSL (http://www.startssl.com), verify via email, and you can apply for a trusted free SSL certificate.  

   Excerpt from [http://blog.s135.com/startssl/](http://blog.s135.com/startssl/). The article also includes an application tutorial.  
   Pros: Trusted by most browsers (except Opera).  
   Cons: Manual approval required; free .tk domains ineligible; annual renewal needed.

3. **CAcert** (search online)  
   > CAcert.org is a community-driven public certificate authority. It issues free public key certificates (unlike paid CAs) and currently serves 200,000+ verified users with nearly 800,000 certificates.  

   Source: Wikipedia. CAcert certificates are auto-issued without manual review, resulting in low trust levels—don’t expect Microsoft support like StartSSL.  
   Pros: Trusted by most open-source browsers.  
   Cons: <del>Requires manual approval</del>, low credibility, annual renewal required.
```
