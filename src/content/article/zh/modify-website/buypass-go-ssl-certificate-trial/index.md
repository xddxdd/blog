---
title: 'BuyPass GO SSL 证书试用'
categories: 网站与服务端
tags: [BuyPass GO, SSL]
date: 2019-01-04 11:17:00
image: /usr/uploads/2019/01/2050316809.png
---

BuyPass 是挪威的一家 CA，提供数字证书、安全认证产品等多种服务。最近 BuyPass 上线
了基于 ACME 的自动签发证书服务，类似于 Let's Encrypt，这项服务称为 BuyPass GO。
与 Let's Encrypt 主要的不同点在于他们的证书每次签发有效期是 180 天，比 Let's
Encrypt 的长一倍。所以如果你需要给你的服务手动换证书，BuyPass 的证书会好一些。另
外 BuyPass 暂不支持签发泛域名证书（俗称野卡？），只能将需要的域名一个个列出来。

（不过我觉得如果需要手动换证书，还是申请 TrustAsia 之类的一年有效期的好一点）

## 申请证书

我使用 [acme.sh][1] 这个工具来申请证书。第一步是注册用户。与 Let's Encrypt 不
同，BuyPass 要求在注册时提供一个有效的邮箱：

```bash
cd /root/.acme.sh
./acme.sh --server https://api.buypass.com/acme/directory --register-account --accountemail [你的邮件地址]
```

如果你的域名有 CAA 记录，限制哪些 CA 能签发证书，那就添加一条
`0 issue buypass.com`，允许 BuyPass 给你签发证书。

然后申请，我这里使用的是 DNS 验证，服务商是 CloudXNS：

```bash
export CX_Key=[CloudXNS 用户中心内的 API Key]
export CX_Secret=[CloudXNS 用户中心内的 API Secret]
./acme.sh --server https://api.buypass.com/acme/directory --issue -d [域名1] -d [域名2] --days 150 --dns dns_cx
```

我之前在这里遇到了诡异的问题，在 Getting new-authz 这一步服务器返回了 500 错误。
结果我试着重新运行了注册账户的命令就可以了……

然后证书就申请完成可以用了。

## 效果

证书在 Chrome 里显示如下：

![BuyPass 证书 Chrome 效果][2]

SSLLabs 测出来的结果如下：

![BuyPass 证书 SSLLabs 效果][3]

我申请了一张 RSA 和一张 ECC 证书，其中 ECC 证书的中级证书还是 RSA。RSA 中级证书
需要由网站服务器发给客户端，意味着网站服务器要发送更多的数据，理想状态下应该有
ECC 的中级证书。不过 Let's Encrypt 也给 ECC 证书加 RSA 中级证书，所以还算可以接
受。

我自己的测试站点在 [https://buypass-ssl.lantian.pub][4]，可以自行查看效果。

## 总结

BuyPass 除了有效期长以外相比 Let's Encrypt 没有很大的优点，而由于 ACME 证书都是
自动续期，有效期长不能算是很大的优点。它更大的意义在于如果有一天 Let's Encrypt
挂了，我们可以用 BuyPass 来救急。

[1]: https://github.com/Neilpang/acme.sh
[2]: /usr/uploads/2019/01/2050316809.png
[3]: /usr/uploads/2019/01/2758220465.png
[4]: https://buypass-ssl.lantian.pub
