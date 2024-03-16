---
title: '基于 Mailgun 的 Typecho 评论邮件提醒插件'
categories: 网站与服务端
tags: [Typecho,Mailgun]
date: 2017-01-04 19:30:20
---
很多时候，在 WordPress、Typecho 等自建评论系统的网站中回复，只能靠自己不断访问来确定自己的评论有没有被别人回复。然而，对于大多数人来说这样做是非常麻烦的。

博主解决问题的常用方法，就是安装邮件提醒插件。当一名评论者的评论被回复，就会有邮件提醒评论者。

Typecho 上使用最广泛的插件是 CommentToMail，最早由 [DEFE][1] 开发，后来由 [Byends Upd][2] 接手。该插件通过常用的 PHP Mail，SendMail 或者 SMTP 来发送邮件。

但是，比起以前的注册一个邮箱来发提醒邮件，现在博主们也开始使用 Mailgun 之类的邮件平台。这类邮件平台提供 API 发信功能，不需要再进行复杂的 SMTP 发信设置，也不需要繁杂的处理代码。我就对这个插件进行修改，让它通过 Mailgun API 而不是 SMTP 发送邮件。

GitHub 项目地址：[https://github.com/xddxdd/typecho-commentgun][3]

  [1]: http://defe.me/
  [2]: http://www.byends.com/
  [3]: https://github.com/xddxdd/typecho-commentgun
