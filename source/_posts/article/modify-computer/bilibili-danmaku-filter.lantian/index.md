---
title: 'Bilibili 弹幕过滤工具'
label: bilibili-danmaku-filter
categories: 计算机与客户端
tags: [Bilibili,弹幕,过滤]
date: 2016-11-20 17:05:00
---
随着 Bilibili 用户的增多，不少小学生也进入了 B 站，并且发布了大量不合弹幕礼仪的弹幕，对其他用户观看视频造成了极大的影响。不少用户甚至因此彻底关闭弹幕，但不看弹幕用什么 B 站？

我自己用 Python 3 写了个小程序以过滤掉小学生弹幕（同时这个程序也是最近编程课 Python 的练手）。程序可以在 [https://github.com/xddxdd/bilibili-dmshield](https://github.com/xddxdd/bilibili-dmshield) 看到。

可以通过将 comment.bilibili.com 的 IP 通过 hosts 文件指向 127.0.0.1，或者通过 FoxyProxy 或者 SwitchyOmega 等插件将 comment.bilibili.com 的代理指向程序的代理端口，来使用过滤功能。

程序功能如下：

1.顶端底端弹幕过滤：只保留科普君（短时间发送多条顶端底端弹幕）和字幕君（整个视频中发送多条顶端底端弹幕），其它全部重设为滚动弹幕。

2.智能关键词过滤：对于某些关键词（如金坷垃），仅当它在弹幕中大量出现时才会放心，不影响与这些关键词本身相关的视频观看。

3.长弹幕截断：对于23333、66666、hhhhh等包含连续重复字符的弹幕，重复字符减少到最多 5 个。

4.弹幕密度控制：满屏刷相同内容弹幕时减少到原数量的平方根条。

5.字体大小重设：滚动弹幕默认改为小号。
