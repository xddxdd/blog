---
title: 'Bilibili Bottom Danmaku to LRC Tool'
categories: Computers and Clients
tags: [Lyrics, Danmaku, Bilibili]
date: 2016-10-22 18:56:00
autoTranslated: true
---


Bilibili is never short of amazing works from talented creators, including original music, covers, and captivating "guichu" remixes. Sometimes we want to save these to devices that can play music with lyrics but not video (like certain MP3 players), or use them as background music while displaying lyrics on our desktop.

The problem is, many excellent works can't be found in mainstream music apps. Even when available (e.g., on NetEase Cloud Music, rumored to have close ties with Bilibili), some tracks lack lyrics—especially new releases.

But when you turn on Bilibili's danmaku, you'll find many volunteer "subtitle masters" have created bottom-aligned danmaku. By extracting the timestamps and content of these danmaku, we can quickly generate lyric files (like LRC).

I wrote a small Python program to automate this. You can download it at:
[https://github.com/xddxdd/bilibili-danmaku2lrc][1]

Note: This tool requires the Python Requests module. Install it first with:

```bash
pip install requests # Python 2
pip3 install requests # Python 3
```

Example usage:

```bash
lantian-macbook:bilibili-danmaku2lrc lantian$ python3 danmaku2lrc.py
? 输入视频 av 号: av655385
i 视频标题: 【洛天依原创】战场之花2.0【重编曲调教版】
i 视频av号: 655385
i 弹幕池号: 962931
i 发现以下野生字幕君
- 1. 17adb281: 17 条字幕
- 2. 665d8c9c: 21 条字幕
- 3. c0f142f8: 44 条字幕
- 4. d02b6a85: 40 条字幕
? 您想要查看谁的字幕 #4
i 野生字幕君 d02b6a85 的字幕如下：
- [00:17.55]战场之花 绚烂开放
- [00:21.03]这一切都 无人欣赏
- [00:24.29]最后只能 见证所有的 悲伤
- [00:30.61]边境之上 孤独流浪
- [00:34.50]我想要的 幸福在哪
- [00:37.35]近在咫尺 结果却远在天涯
- [00:43.40]每天都说服自己要保持坚强
- [00:46.67]习惯了牺牲也不能感到彷徨
- [00:49.92]像机器那样 握住被夕阳染成红色的枪
- [00:55.66]冲上场
- [00:56.78]曾经心中有过许多许多迷茫
- [00:59.77]现在已经饱受风霜 坚定了信仰
- [01:03.09]不舍弃稚嫩的心 最后只有被打败的下场
- [01:10.16]无论明天是否还能看见阳光
- [01:13.28]也只能够舍弃所有私心向前闯
- [01:16.66]眼前的一切象征着生存还是会带来死亡
- [01:21.96]已没时间再想
- [01:41.68]昨日同窗 相隔阴阳 不是说好  来日方长
- [01:47.69]如今只在 照片上保留残像
- [01:54.57]血液流淌 战旗飘扬 紧握着的 是什么啊
- [02:01.53]曾经快乐 化为了碎片飞扬
- [02:07.54]牺牲的战士已永远不会说话
- [02:10.58]付出的努力也会渐渐被遗忘
- [02:13.83]逝去的生命就来由活着的心来报答
- [02:19.33]有机会吗
- [02:22.42]就算一次一次在危险中受伤
- [02:25.53]就算与死神擦肩而过又会怎样
- [02:29.12]完成再多再好也换不回大家曾经的微笑
- [02:35.80]舍弃不必要的欢乐愤怒恐慌
- [02:38.89]此时此刻收起破茧而出的锋芒
- [02:42.33]擦干眼角泛起的泪光 去把胜利号角吹响
- [02:47.78]一切都结束了啊
- [02:52.55]透过变得粉身碎骨的那扇窗
- [02:55.56]是否能看到明天世界的新希望
- [03:05.86]双手触碰不到放晴了的天空
- [03:09.17]意识离去感受不到周围的芬芳
- [03:12.38]请代替我在和平之后去感受久违的光芒
- [03:17.67]不再去想过往
- [03:20.88]我仿佛看到身下开满鲜花
- [03:28.11]在战场上怒放
? 您想要保存他的字幕吗 [y/N] y
i 字幕文件已保存到 av655385-P1.lrc
```

[1]: https://github.com/xddxdd/bilibili-danmaku2lrc
```
