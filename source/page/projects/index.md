---
lang: zh
title: '项目们'
label: projects
weight: 2
date: 1970-01-01 00:00:00
---

GitHub 主页：[https://github.com/xddxdd][1]

Go 语言实现的 Bird-lg（Bird Looking Glass）
--

> Bird-lg 基于 Python 2，提供了一个网页面板，显示各个服务器上的 BIRD 路由软件的状态。但 Bird-lg 占用内存较大，且不支持并行读取多个服务器状态。我用 Go 语言重写 Bird-lg，内存占用低达 6 MB，且支持并行读取，大大加快网页打开速度。

[项目介绍][2] | [GitHub 地址][3]

LT NoLitter 防止 Android 应用乱建文件夹的 Xposed 插件
--

> 某些软件也会在存储空间根目录直接建立大量的文件夹，影响了用户的文件管理，并对强迫症人群造成了极大的威胁。当有程序尝试用 File 类读取或写入根目录的文件或文件夹，插件会检测这个文件或文件夹是否存在，如果不存在则重定向操作。

[项目介绍][4] | [GitHub 地址][5]

GetIPIntel 的 Typecho 插件
--

> 有几位站长邮件地址泄露，有好事者就挂上 Go`^_^`Agent 用他们的常用网名和邮件地址辱骂其它博客的博主，闹得鸡飞狗跳。GetIPIntel 综合考虑一个 IP 的各项数据，从而判断来自某个 IP 的访客是不是开启了 VPN，TOR 一类代理。我写了一个 Typecho 的插件，可以阻止使用代理的访客评论，或者把他们的评论丢进垃圾箱。

[GetIPIntel 介绍][6] | [项目介绍][7] | [GitHub 地址][8]

Bilibili 底端弹幕转 LRC 工具
--

> Bilibili 上从来不乏各路大神的作品，问题是，许多优秀的作品是无法在主流音乐软件里找到的，一时也没有歌词可用。但是有许多野生字幕君已经做好了底端弹幕。我们只需要将这些弹幕的时间轴和内容提取出来，就可以快速生成歌词文件（如 LRC）了。

[项目介绍][9] | [GitHub 地址][10]

Bilibili 弹幕过滤工具
--

> 随着 Bilibili 用户的增多，不少小学生也进入了 B 站，并且发布了大量不合弹幕礼仪的弹幕，对其他用户观看视频造成了极大的影响。我自己用 Python 3 写了个小程序以过滤掉小学生弹幕（同时这个程序也是最近编程课 Python 的练手）。

[项目介绍][11] | [GitHub 地址][12]

基于 Mailgun 的 Typecho 评论邮件提醒插件
--

> Typecho 上使用最广泛的插件是 CommentToMail，通过常用的 PHP Mail，SendMail 或者 SMTP 来发送邮件。但是现在博主们也开始使用 Mailgun 之类的邮件平台。这类邮件平台提供 API 发信功能，不需要再进行复杂的 SMTP 发信设置，也不需要繁杂的处理代码。我就对这个插件进行修改，让它通过 Mailgun API 而不是 SMTP 发送邮件。

[项目介绍][13] | [GitHub 地址][14]

CommentToMail 修改版
--

> Mailgun 的整个 AS 都被 Outlook 拉黑了。我很快注册了 SendGrid，但 CommentGun 需要修改一下才能接上。如果这些服务商轮着被 Outlook 屏蔽……比起做一大堆 Comment 开头的插件，我还是直接改好年久失修的 CommentToMail，统一用 SMTP 发信，一劳永逸。

[项目介绍][15] | [GitHub 地址][16]


  [1]: https://github.com/xddxdd
  [2]: /article/modify-website/go-bird-looking-glass.lantian
  [3]: https://github.com/xddxdd/bird-lg-go
  [4]: /article/modify-computer/lt-nolitter-stop-android-app-litter-folder.lantian
  [5]: https://github.com/xddxdd/lantian-nolitter/blob/master/app/build.gradle
  [6]: /article/modify-website/getipintel-anti-fraud.lantian
  [7]: /article/modify-website/getintel-typecho-plugin.lantian
  [8]: https://github.com/xddxdd/typecho-getipintel
  [9]: /article/modify-computer/bilibili-danmaku2lrc.lantian
  [10]: https://github.com/xddxdd/bilibili-danmaku2lrc
  [11]: /article/modify-computer/bilibili-danmaku-filter.lantian
  [12]: https://github.com/xddxdd/bilibili-dmshield
  [13]: /article/modify-website/mailgun-typecho-comment-email-notification.lantian
  [14]: https://github.com/xddxdd/typecho-commentgun
  [15]: /article/modify-website/comment-to-mail-modified.lantian
  [16]: https://github.com/xddxdd/typecho-commenttomail
