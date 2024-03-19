---
title: '验证码：不做死就不会死'
categories: 闲聊
tags: [验证码]
date: 2014-06-27 22:22:05
image: /usr/uploads/54071403878812.png
---

众所周知，验证码是为了防止机器暴力破解密码或者发广告刷评论而产生的东西，一般的验
证码都是由4位数字组成，加上一些干扰线，从而尽可能防止机器暴力破解。

问题是……这世界上还有一种逗比的验证码。图片来自
[http://imbushuo.net/archives/58](http://imbushuo.net/archives/58"
\_src="http://imbushuo.net/archives/58) 。

<img src="/usr/uploads/54071403878812.png" title="Screenshot-171.png"/>

我只想说，这种验证码有什么用？随便写个程序都能把验证码直接抠出来填进去。据
imbushuo所说：

```bash
What’s more, the verification process is completed in the client side…(later I found that I could bypass the CAPTCHA by sending the HTTP request directly.)
```

他居然自己写了个程序，没有回传验证码，就登陆成功了！

这个验证码果然够吊。然后我在微信上看到乌云漏洞平台的推送消息：

<img src="/usr/uploads/20140627/1403878899112717.png" title="Screenshot_2014-06-27-22-15-57.png"/>

乌云你赢了。
