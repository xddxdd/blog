---
title: 'CommentToMail Modified Version'
categories: Website and Servers
tags: [SMTP, Typecho]
date: 2017-09-26 21:23:00
image: /usr/uploads/2017/09/354912383.png
autoTranslated: true
---


Recently, I suddenly noticed that the daily emails from my self-built Baidu Tieba check-in system had stopped, though the check-ins were still happening normally. When I checked the Mailgun interface, the status was all red:

![Mailgun Status][1]

The logs showed a long list of bounce messages sent to my Outlook mailbox, such as:

![Mailgun Logs][2]

The error indicated that Mailgun's entire AS (Autonomous System) had been blacklisted by Outlook. It was now completely unusable.

The good news is that many email service providers offer similar services to Mailgun, such as SendGrid. I quickly registered an account on their website, enabled SMTP, and connected my Tieba check-in system, NextCloud, and other services without any issues.

The bad news is that my blog uses [CommentGun][3], which I specifically developed for Mailgun, and it needed modifications to work with SendGrid.

Originally, I considered modifying the plugin to create something like "CommentGrid," but each email service provider has a different API. If these providers get blacklisted by Outlook one after another... the situation would be too chaotic to handle.

Another piece of good news is that these email providers generally support SMTP for sending emails. This means I could use CommentToMail. The downside is that this plugin is outdated and often fails in various scenarios (e.g., when the website uses SSL or when the email provider's SSL certificate expires).

However, enduring short-term pain is better than long-term suffering. Instead of creating multiple "Comment"-prefixed plugins, I decided to fix CommentToMail once and for all. Based on discussions [here][4] with Wang Wangjie and my own modifications from CommentGun, I finally patched CommentToMail.

List of changes:

1. Removed asynchronous sending (it caused many email delivery failures)
2. Updated PHPMailer and disabled SSL certificate verification (some email providers have misconfigured SMTP; enabling verification causes issues)

Since asynchronous sending was removed, slow connections to the SMTP server could delay website loading. My solution was to install Postfix on the VPS to relay emails.

Finally, the GitHub project address: [https://github.com/xddxdd/typecho-commenttomail][5]

[1]: /usr/uploads/2017/09/354912383.png
[2]: /usr/uploads/2017/09/984326858.png
[3]: /en/article/modify-website/mailgun-typecho-comment-email-notification.lantian
[4]: /en/article/modify-website/mailgun-typecho-comment-email-notification.lantian
[5]: https://github.com/xddxdd/typecho-commenttomail
```
