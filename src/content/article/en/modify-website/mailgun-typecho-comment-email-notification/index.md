---
title: 'Typecho Comment Email Notification Plugin Based on Mailgun'
categories: Website and Servers
tags: [Typecho, Mailgun]
date: 2017-01-04 19:30:20
autoTranslated: true
---


Often, when replying on websites with self-hosted comment systems like WordPress or Typecho, one has to constantly check back to see if their comment has been replied to. However, for most people, this is very inconvenient.

A common solution for bloggers is to install an email notification plugin. When a commenter's comment receives a reply, an email notification is sent to alert them.

The most widely used plugin on Typecho is CommentToMail, initially developed by [DEFE][1] and later maintained by [Byends Upd][2]. This plugin sends emails using standard methods like PHP Mail, SendMail, or SMTP.

However, instead of registering dedicated email accounts for notifications, bloggers are now adopting email platforms like Mailgun. These platforms provide API-based email sending capabilities, eliminating the need for complex SMTP configurations or cumbersome processing code. I've modified this plugin to send emails through the Mailgun API instead of SMTP.

GitHub project address: [https://github.com/xddxdd/typecho-commentgun][3]

[1]: http://defe.me/
[2]: http://www.byends.com/
[3]: https://github.com/xddxdd/typecho-commentgun
```
