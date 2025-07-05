---
title: 'Bilibili Danmaku Filter Tool'
categories: Computers and Clients
tags: [Bilibili, Danmaku, Filter]
date: 2016-11-20 17:05:00
autoTranslated: true
---


With the growing number of Bilibili users, many elementary school students have joined the platform and posted a large volume of danmaku that violates etiquette, significantly impacting other users' viewing experience. Many users have even turned off danmaku entirely because of this, but what's the point of using Bilibili without danmaku?

I wrote a small program in Python 3 to filter out elementary school-level danmaku (this program also served as practice for a recent Python programming class). The code can be found at [https://github.com/xddxdd/bilibili-dmshield](https://github.com/xddxdd/bilibili-dmshield).

To use the filtering feature, you can either:
- Point the IP of comment.bilibili.com to 127.0.0.1 via the hosts file, or
- Use browser extensions like FoxyProxy or SwitchyOmega to route comment.bilibili.com traffic through the program's proxy port.

The program's features include:

1. **Top/Bottom Danmaku Filtering**: Only retains "Science Populizers" (users posting multiple top/bottom danmaku in a short time) and "Subtitle Providers" (users posting multiple top/bottom danmaku throughout the video). All others are reset to scrolling danmaku.

2. **Intelligent Keyword Filtering**: For certain keywords (e.g., "Jinkela"), they are only allowed when appearing frequently in danmaku, avoiding interference with videos related to these keywords.

3. **Repetitive Text Truncation**: For danmaku with consecutive repeated characters (e.g., "23333", "66666", "hhhhh"), reduces repetitions to a maximum of 5 characters.

4. **Danmaku Density Control**: When the screen floods with identical danmaku, reduces the quantity to the square root of the original count.

5. **Font Size Reset**: Default scrolling danmaku are set to a small font size.
```
