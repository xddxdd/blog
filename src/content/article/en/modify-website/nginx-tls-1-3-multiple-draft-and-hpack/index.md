---
title: 'nginx: TLS 1.3 Multi-Draft Support and HPACK'
categories: Website and Servers
tags: [OpenSSL, SSL, Docker, TLS 1.3]
date: 2018-07-07 00:28:00
autoTranslated: true
---


It has been 11 months since I last [enabled TLS 1.3][1] for nginx. After nearly a year, many nginx-related programs and patches have undergone significant changes:

1. OpenSSL has released beta versions of 1.1.1, with the latest being 1.1.1-pre8 (Beta 6) at the time of writing.
2. nginx has been updated to version 1.15.1.
3. Bugs in nginx's HPACK patch (HTTP header compression) have been fixed by subsequent patches. Using the original HPACK patch causes abnormal website access, manifesting as protocol errors when attempting to load subsequent pages after the first.
4. A developer has [released an OpenSSL patch][2] enabling the latest OpenSSL to simultaneously support TLS 1.3 draft versions 23, 26, and 28.
5. Lets Encrypt certificates now include Certificate Transparency information by default, eliminating the need for nginx-ct.
6. Since July 1, 2018, TLS 1.0 is no longer recommended.

Therefore, I have reconfigured nginx's compilation and runtime settings to meet the needs of the modern era.

## Dockerfile

I continue to deploy nginx using Docker. Compared to the previous Dockerfile, the new version mainly updates component versions and adds several patches, with no major structural changes.

To save space, I've uploaded the Dockerfile to [https://github.com/xddxdd/dockerfiles/blob/master/nginx/Dockerfile][3]. You can also use `docker pull xddxdd/nginx` directly.

This Dockerfile includes:

- nginx 1.15.1
- OpenSSL 1.1.1-pre8
- kn007's combined patch for SPDY, HPACK, and Dynamic TLS Record (project [here][4])
- Fix patch for kn007's HPACK patch
- Brotli compression algorithm
- hakasenyang's TLS 1.3 multi-draft support patch (project [here][5])
- nginx headers-more module

## Configuration Changes

First, disable TLS 1.0:

```nginx
#ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
```

Second, because OpenSSL has modified numerous cipher suite names, using the previous ssl_ciphers configuration would cause ERR_SSL_VERSION_OR_CIPHER_MISMATCH errors (indicating no mutually supported ciphers). Update ssl_ciphers as follows:

```nginx
#ssl_ciphers 'TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!DSS';
ssl_ciphers '[TLS13+AESGCM+AES128|TLS13+CHACHA20]:TLS13+AESGCM+AES256:[EECDH+ECDSA+AESGCM+AES128|EECDH+ECDSA+CHACHA20]:EECDH+ECDSA+AESGCM+AES256:EECDH+ECDSA+AES128+SHA:EECDH+ECDSA+AES256+SHA:[EECDH+aRSA+AESGCM+AES128|EECDH+aRSA+CHACHA20]:EECDH+aRSA+AESGCM+AES256:EECDH+aRSA+AES128+SHA:EECDH+aRSA+AES256+SHA:RSA+AES128+SHA:RSA+AES256+SHA';
```

## What's Next?

Restart nginx. You can now access the site using:
- TLS 1.3 draft 23 via the latest stable Chrome/Firefox
- TLS 1.3 draft 28 via the latest development Chrome/Firefox

[1]: /en/article/modify-website/nginx-enable-tls-1-3-fastcgi-pass-version.lantian
[2]: https://github.com/hakasenyang/openssl-patch
[3]: https://github.com/xddxdd/dockerfiles/blob/master/nginx/Dockerfile
[4]: https://github.com/kn007/patch
[5]: https://github.com/hakasenyang/openssl-patch
```
