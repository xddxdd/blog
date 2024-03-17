---
title: 'GetIPIntel 的 Typecho 插件'
categories: 网站与服务端
tags: [反欺诈, GetIPIntel]
date: 2016-10-01 22:20:00
---

GetIPIntel 的介绍可以
在[刚刚这篇文章](/article/modify-website/getipintel-anti-fraud.lantian)看到。

我写了一个 Typecho 的插件，可以阻止使用代理的访客评论，或者把他们的评论丢进垃圾
箱。

功能：

1. 多种模式选择（仅黑名单，快速检查，全面检查）
2. 多种处理措施（人工审核，丢垃圾箱，提交失败）
3. 自定义阈值

插件可以在
[https://github.com/xddxdd/typecho-getipintel](https://github.com/xddxdd/typecho-getipintel)
下载到。把 GetIPIntel 文件夹丢到 usr/plugins 文件夹下面就行。
