---
title: 'How to Achieve a Perfect Score on SSL Labs Test'
categories: Website and Servers
tags: [SSL]
date: 2018-01-02 22:44:00
image: /usr/uploads/2018/01/3124609482.png
autoTranslated: true
---


[Qualys SSL Labs][1] is a website for testing server SSL functionality, often used as a reference when configuring servers. Typically, we only consider its rating (A+, A, B, C, D, E, F, T), where achieving A+ is considered excellent server configuration. However, SSL Labs also displays sub-scores next to the rating, and my main site hasn't maxed out all of them. What would it take to achieve perfect scores across all SSL Labs subcategories, and what practical significance does it hold? I installed nginx on a VPS not hosting any website and configured it to successfully achieve a perfect score, as shown in the image or [here][4]:

![SSL Labs Perfect Score][5]

For comparison, here's this site's rating (also viewable [here][2]):

![SSL Labs A+ Rating][3]

All SSL Labs scoring criteria mentioned in this article are based on the [official SSL Labs scoring document][6] as of the writing date.

## Preparation

First, we need to install nginx. Since this VPS uses OpenVZ and can't run Docker, I couldn't deploy it as easily as my other VPS instances. However, since both my VPS and OS image are Debian, I directly copied instructions from my previous [Dockerfile][7].

## Certificate Requirements

SSL Labs requires certificates must NOT have:
- Domain name mismatch
- Certificate not yet valid or expired
- Self-signed or untrusted certificates
- Revoked certificates
- Insecure certificate signatures or keys

Essentially, if your certificate was recently issued and browsers can access your site normally, it should be fine.

## Protocol Support

Protocol support accounts for 30% of the rating, calculated as the average of the highest and lowest scores.

Protocol scoring:
- SSL 2.0: 0 points
- SSL 3.0: 80 points
- TLS 1.0: 90 points
- TLS 1.1: 95 points
- TLS 1.2: 100 points
- TLS 1.3: 100 points

(Note: TLS 1.3 scoring isn't specified in documentation but is practically counted as 100 points) (Refers to draft 18)

SSL 2.0 is full of vulnerabilities and must be disabled. SSL 3.0 isn't much better but may be needed for legacy browsers (yes, IE6).

TLS 1.0 also has issues, though major browser vendors have largely mitigated them. TLS 1.1, 1.2 and 1.3 are currently secure.

To achieve full points here, disable all protocols except TLS 1.2 (including TLS 1.3 – explained later). Configure in nginx:

    ssl_protocols TLSv1.2;

## Key Exchange

Key exchange verifies identities between server/client and generates symmetric session keys. Scoring uses the same high-low average method. Detailed scoring:
- Anonymous key exchange: 0 points (vulnerable to MITM attacks)
- Key strength 0-511 bit: 20 points
- Export-grade key exchange: 40 points (historically weakened algorithms)
- Key strength 512-1023 bit: 40 points
- Key strength 1024-2047 bit: 80 points
- Key strength 2048-4095 bit: 90 points
- Key strength 4096+ bit: 100 points

"Strength" refers to RSA equivalent strength. For RSA certificates (most common), use 4096-bit keys. For ECC certificates (newer format), 384-bit provides equivalent strength to 4096-bit RSA.

For Let's Encrypt via Certbot:

    certbot certonly --webroot -w /var/www/ -d vmbox.lantian.pub --rsa-key-size 4096

(ECC certificates require third-party clients, not covered here)

Even with a 4096-bit certificate, you might not get full points due to key exchange algorithms. Observe this algorithm list from my site:

![Key Exchange Algorithm List][8]

Algorithm annotations:
- ECDH secp256r1 (eq. 3072 bits RSA)
- ECDH secp384r1 (eq. 7680 bits RSA)
- DH 4096 bit

Key exchange strength depends on the weaker of the key or algorithm. For perfect scores, disable all algorithms below 4096-bit RSA equivalent.

TLS 1.3 algorithms only reach 3072-bit RSA equivalence, so we must disable them all – hence why TLS 1.3 was excluded earlier.

Additionally, ECDH algorithms require a DHparams file. Generate with:

    openssl dhparam -out dhparam.pem 4096

(This runs extremely slow – took nearly 1 hour on my i5-3210M laptop). Configure in nginx:

    ssl_dhparam /etc/dhparam.pem;

## Cipher Strength

Finally, the strength of the symmetric session keys. Scoring remains the high-low average:
- 0 bit (no encryption): 0 points
- 1-127 bit: 20 points
- 128-255 bit: 80 points
- 256+ bit: 100 points

Cipher strength is determined by the key exchange algorithm, so only retain 256-bit ciphers like CHACHA20-POLY1305 and AES-256. My configuration:

    ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:AES256-GCM-SHA384:AES256-SHA256:AES256-SHA:!DSS';

## Additional Tweaks

Enable HSTS (force SSL in browsers). Preferably enable HPKP (require browsers to trust specific CAs):

    add_header Strict-Transport-Security 'max-age=15768000;includeSubDomains;preload';

(HSTS: affects subdomains and allows submission to browser preload lists)

    add_header Public-Key-Pins 'pin-sha256="9uthMA8OzB/wVGSR3w5bzlt6jAFLWEI533bM+vNDkts=";pin-sha256="YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=";pin-sha256="sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis=";pin-sha256="58qRu/uxh4gFezqAcERupSkRYBlBAvfcw7mEjGPLnNU=";max-age=2592000';

(Pins include two Let's Encrypt intermediate certificates and two others, possibly TrustAsia/Comodo)

After these steps, SSL Labs will show a perfect score.

## Practical Value?

While impressive, what's the real-world value? We're using significantly slower 4096-bit keys and algorithms, whereas 2048-bit is already sufficient against modern computing power. This creates extra CPU overhead (encryption/decryption) and network overhead (key transmission). We've also sacrificed compatibility with older clients, some of which remain important:

- Android ≤4.3 (old phones, smart TVs/boxes)
- Baidu search crawler (2015 version per SSL Labs)
- IE ≤10 (unupdated Windows 7, Windows Phone 8.0)
- Java 6/7 (no TLS 1.2 support)
- Java 8 (incompatible with retained algorithms)
- Safari ≤6

Java 8 compatibility is particularly crucial. Most websites don't need such extreme security and can allow slightly weaker algorithms for better compatibility.

Demo site: [http://vmbox.lantian.pub/][9]  
Full report: [https://www.ssllabs.com/ssltest/analyze.html?d=vmbox.lantian.pub][10]

[1]: https://www.ssllabs.com/ssltest/
[2]:
  https://www.ssllabs.com/ssltest/analyze.html?d=lantian.pub&s=2402%3Ac480%3A8000%3A1%3A0%3A103%3Ab7b0%3Ad134&latest
[3]: /usr/uploads/2018/01/1101148042.png
[4]: https://www.ssllabs.com/ssltest/analyze.html?d=vmbox.lantian.pub
[5]: /usr/uploads/2018/01/3124609482.png
[6]: https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide
[7]: /en/article/modify-website/nginx-enable-tls-1-3-fastcgi-pass-version.lantian
[8]: /usr/uploads/2018/01/309246839.png
[9]: http://vmbox.lantian.pub/
[10]: https://www.ssllabs.com/ssltest/analyze.html?d=vmbox.lantian.pub
```
