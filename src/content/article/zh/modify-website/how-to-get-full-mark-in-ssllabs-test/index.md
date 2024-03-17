---
title: '如何在 SSLLabs 测试中冲满分'
categories: 网站与服务端
tags: [SSL]
date: 2018-01-02 22:44:00
image: /usr/uploads/2018/01/3124609482.png
---

[Qualys SSL Labs][1] 是一个测试服务器 SSL 功能的网站，我们在配置服务器时经常用它
作为参考。一般来说我们只参考它的评级（A+，A，B，C，D，E，F，T）等，达到 A+ 就认
为服务器的配置足够优秀。不过，SSLLabs 也在评级右侧给出了分项分数，而我的主站并没
有把它们全部冲到满分。如果把 SSLLabs 的各项分项分数全部达到满分，会是什么效果，
有什么实际意义吗？我用一台不运行网站的 VPS 安装了 nginx 并进行了一些配置，成功刷
到了全满分，如图或者[这里所示][4]：

![SSLLabs 全满分][5]

作为对比，这是本站的评分，除看图外也可[在此处看到][2]：

![SSLLabs A+ 等级][3]

本文有关 SSLLabs 评分标准全部来自于 [SSLLabs 官方的评分标准文档][6] 在本文写成之
日的版本。

## 准备工作

我们要先安装好 nginx。因为这台 VPS 是 OpenVZ 的，没法装 Docker，所以没法像我的其
它 VPS 一样一键部署。不过因为我的 VPS 和镜像都是 Debian，所以我就把之前写过的
[Dockerfile][7] 里的指令直接复制过来用了。

## 证书要求

SSL Labs 要求证书不能有以下情况：

-   域名不匹配
-   证书还未生效或者已到期
-   使用自签名证书等不被信任的证书
-   使用被注销（Revoked）的证书
-   不安全的证书签名或者密钥

基本上，只要你的证书是近期申请的，并且浏览器能正常打开你的网站，那么就没问题。

## 协议支持

协议支持在评级中占 30% 的比重，算法是根据服务器支持的协议打分，取最高分和最低分
的平均数。

各个协议评分如下：

-   SSL 2.0: 0 分
-   SSL 3.0: 80 分
-   TLS 1.0: 90 分
-   TLS 1.1: 95 分
-   TLS 1.2: 100 分
-   TLS 1.3: 100 分

（注：TLS 1.3 的得分在评分标准中未给出，但是实际按 100 分计）（此处指 TLS 1.3 草
案 18（draft 18））

SSL 2.0 现在看来是个筛子，必须严格禁止使用。SSL 3.0 也没好到哪去，但是有些网站需
要它来支持老旧的浏览器（对，我说的就是 IE6）。

TLS 1.0 也有点问题，不过在各大浏览器厂商的合作下，这个问题可以当成已经解决。TLS
1.1、1.2 和 1.3 目前来看没有问题。

为了在此项得到满分，必须关闭除 TLS 1.2 以外的全部协议（包括 TLS 1.3，原因等会
讲），在 nginx 中如此配置：

    ssl_protocols TLSv1.2;

## 密钥交换

密钥交换是服务器和客户端验证彼此身份，并且产生用于当前会话的对称加密密钥的方式。
其评分标准同样是最高和最低的平均数。详细分数如下：

-   匿名密钥交换：0 分（因为无法验证身份，极易被中间人攻击）
-   密钥强度 0 到 511 bit： 20 分
-   出口密钥交换：40 分（这些是早期美国限制出口密钥交换算法时的产物，都很弱，容
    易破解）
-   密钥强度 512 到 1023 bit：40 分
-   密钥强度 1024 到 2047 bit：80 分
-   密钥强度 2048 到 4095 bit：90 分
-   密钥强度 4096 bit 及以上：100分

此处的强度是指 RSA 的等效强度。如果你用的是 RSA 证书（一般都是这种），要将密钥强
度调成 4096 bit。如果你用的是 ECC 证书（比较新的证书格式），只需要 384 bit 就能
有 4096 bit 的 RSA 等效强度。

如果你用的是 Let's Encrypt 以及其官方客户端 Certbot，用以下命令生成密钥即可：

    certbot certonly --webroot -w /var/www/ -d vmbox.lantian.pub --rsa-key-size 4096

生成 ECC 证书需要第三方客户端，这里先不展开。（我比较懒就跳过了）

但是安装上 4096 bit 证书后，你这项的评分仍然可能没满。这就取决于 nginx 配置文件
中的密钥交换算法了。先来看下这张图，这是本站的加密算法列表：

![密钥交换算法列表][8]

算法后面有一些标记，其意义如下：

-   ECDH secp256r1 (eq. 3072 bits RSA)：ECDH 256 bit 算法，等效 3072 bit RSA
-   ECDH secp384r1 (eq. 7680 bits RSA)：ECDH 384 bit 算法，等效 7680 bit RSA
-   DH 4096 bit：RSA 4096 bit 算法

密钥交换算法的强度取决于密钥本身和交换算法两者中的较弱者。为了满分，就只好把所有
小于 4096 bit RSA 的算法都关了。

再看一下 TLS 1.3 的算法们，它们都是等效 3072 bit RSA 的，只能把它们全禁了。全禁
了之后，TLS 1.3 也就没用了，因此我刚刚不保留开启 TLS 1.3。

等等，还没完。ECDH 系列交换算法依赖一个叫 DHparams 的文件，需要运行这条命令生
成：

    openssl dhparam -out dhparam.pem 4096

这条命令运行奇慢，在我的 i5-3210M 的笔记本上运行了快 1 个小时。生成完后在 nginx
里如下配置：

    ssl_dhparam /etc/dhparam.pem;

## 密钥强度

最后，就是双方交换得到的密钥本身的强度。评分同样是最大和最小的平均值，细则如下：

-   0 bit（无加密）：0 分
-   1-127 bit：20 分
-   128-255 bit：80 分
-   256 bit 及以上：100 分

密钥强度由密钥交换算法确定，因此只留 256 bit 密钥强度的交换算法即可。符合条件的
算法是 CHACHA20-POLY1305 和 AES-256。我的配置如下：

    ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:AES256-GCM-SHA384:AES256-SHA256:AES256-SHA:!DSS';

## 其它调整

另外还要打开 HSTS（强制浏览器走 SSL）。最好还要打开 HPKP（要求浏览器只认某几家的
证书）。配置如下：

    add_header Strict-Transport-Security 'max-age=15768000;includeSubDomains;preload';

（HSTS，注意会对子域名生效，并且允许你的网站提交到 HSTS Preload 列表，也就是浏览
器永远走 SSL，即使没访问过你的网站）

    add_header Public-Key-Pins 'pin-sha256="9uthMA8OzB/wVGSR3w5bzlt6jAFLWEI533bM+vNDkts=";pin-sha256="YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=";pin-sha256="sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis=";pin-sha256="58qRu/uxh4gFezqAcERupSkRYBlBAvfcw7mEjGPLnNU=";max-age=2592000';

（放行了 Let's Encrypt 的两张中级证书，另两张貌似是 TrustAsia 和 Comodo 的，记不
清了）

完成以上这些后，SSL Labs 就会显示你的 SSL 满分了。

## 实用性？

满分固然好看，但是其提供的意义又有多少？在这个过程中，我们使用了明显更慢的 4096
bit 密钥和交换算法，而 2048 bit 对于现在的算力来说已经足够。这就造成了额外的 CPU
开销（加密解密）和网络开销（传输密钥）。同时，我们放弃了很多旧客户端的支持，其中
有些我们一般不考虑支持了（例如 IE8），但是根据 SSLLabs 显示的测试结果，有些客户
端却很重要：

-   Android 4.3 及之前版本的设备（旧手机，旧智能电视及盒子）
-   百度搜索索引机器人（根据 SSL Labs 页面上显示，2015 年 1 月的版本）
-   IE 10 及之前的浏览器（一些还没升上级的 Windows 7，以及 Windows Phone 8.0）
-   Java 6、7（不支持 TLS 1.2）
-   Java 8（不支持留下的这些密钥交换算法）
-   Safari 6 及之前版本

其中以 Java 8 最为重要。绝大多数网站完全不需要这么注重安全的配置，大可以允许一些
稍微弱一些的算法来提高兼容性。

最后，满分演示站在此：[http://vmbox.lantian.pub/][9]

满分报告地
址：[https://www.ssllabs.com/ssltest/analyze.html?d=vmbox.lantian.pub][10]

[1]: https://www.ssllabs.com/ssltest/
[2]:
    https://www.ssllabs.com/ssltest/analyze.html?d=lantian.pub&s=2402%3Ac480%3A8000%3A1%3A0%3A103%3Ab7b0%3Ad134&latest
[3]: /usr/uploads/2018/01/1101148042.png
[4]: https://www.ssllabs.com/ssltest/analyze.html?d=vmbox.lantian.pub
[5]: /usr/uploads/2018/01/3124609482.png
[6]: https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide
[7]: /article/modify-website/nginx-enable-tls-1-3-fastcgi-pass-version.lantian
[8]: /usr/uploads/2018/01/309246839.png
[9]: http://vmbox.lantian.pub/
[10]: https://www.ssllabs.com/ssltest/analyze.html?d=vmbox.lantian.pub
