---
title: 'CommentToMail 修改版'
categories: 网站与服务端
tags: [SMTP, Typecho]
date: 2017-09-26 21:23:00
image: /usr/uploads/2017/09/354912383.png
---

最近突然发现本来每天一封的自建贴吧签到系统的邮件突然没有了，但是贴吧还是正常签
到。上 Mailgun 界面一看，状态全线飘红：

![Mailgun 状态][1]

日志里一大排发往我自己 Outlook 邮箱的退信，比如：

![Mailgun 日志][2]

看提示是 Mailgun 的整个 AS 都被 Outlook 拉黑了。这下子是完全没法用了。

好消息是，有许多和 Mailgun 提供类似服务的邮件服务商，例如 SendGrid。我很快在他们
网站上注册了一个账号，并且开启了 SMTP，把我的贴吧签到、NextCloud 等都接了进去，
非常顺利。

坏消息是，我的博客用的是我专门给 Mailgun 写的 [CommentGun][3]，需要修改一下才能
接到 SendGrid 上。

本来我可能修改一下插件，然后又能出一个 CommentGrid 之类的插件，但是每家邮件服务
商的 API 都不一样。如果这些服务商轮着被 Outlook 屏蔽……画美不看。

另一个好消息是，这些邮件服务商普遍支持 SMTP 发信。这意味着我可以用
CommentToMail。坏消息是，这个插件年久失修，在不少情况下会 GG（例如网站开了 SSL，
或者邮件服务商的 SSL 过期了）。

不过长痛不如短痛，比起做一大堆 Comment 开头的插件，我还是直接改好
CommentToMail，一劳永逸。基于[这里][4]和王忘杰的讨论以及我自己在 CommentGun 上的
修改，我终于修好了 CommentToMail。

改动列表：

1. 去除异步发送（许多情况下邮件发不出去就是它造成的）
2. 更新 PHPMailer，并关闭 SSL 证书验证（部分邮件商 SMTP 没配置好，开着验证会出问
   题）

因为去掉了异步发送，所以如果到 SMTP 服务器的连接很慢会卡网站访问速度。我的解决方
法是在 VPS 上装了个 Postfix 来中继邮件。

最后，GitHub 项目地址：[https://github.com/xddxdd/typecho-commenttomail][5]

[1]: /usr/uploads/2017/09/354912383.png
[2]: /usr/uploads/2017/09/984326858.png
[3]: /article/modify-website/mailgun-typecho-comment-email-notification.lantian
[4]: /article/modify-website/mailgun-typecho-comment-email-notification.lantian
[5]: https://github.com/xddxdd/typecho-commenttomail
