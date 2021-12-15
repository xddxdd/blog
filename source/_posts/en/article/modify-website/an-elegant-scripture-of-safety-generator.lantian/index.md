---
title: 'An Elegant "Scripture of Safety" Generator'
categories: 'Website and Servers'
tags: ['Scripture of Safety', 'Elegant']
date: 2020-08-01 23:36:16
---

> This post is about a meme in China that may require some cultural background to understand.
>
> Since the content is related to the specific language used, there are minor differences between the Chinese and English versions.

What's "Scripture of Safety"?
-----------------------------

_The Scripture of Safety_ (平安经) is a book written by He Dian, the (now former) official of Jilin Public Security Department, China. The content in the book is simply a repetition of the phrase "Wish XXX safe" (XXX 平安), yet the book is sold at a high price. The public speculates that publishing and purchase of the book serves as a mean of bribe.

The content of _The Scripture of Safety_ is formatted as: (from [Wikipedia (Chinese)](https://zh.wikipedia.org/wiki/%E5%B9%B3%E5%AE%89%E7%BB%8F))

- “眼平安，耳平安，鼻平安”
  - "Wish eyes safe, ears safe, nose safe"
- “上海港平安、深圳港平安、宁波舟山港平安、广州港平安”
  - "Wish Shanghai harbor safe, Shenzhen harbor safe, Ningbo Zhoushan harbor safe, Guangzhou harbor safe"
- “初生平安、满月平安、百天平安、1岁平安、2岁平安、3岁平安”
  - "Wish newly-born babies safe, one-month-old babies safe, 100-days-old babies safe, 1-year-olds safe, 2-year-olds safe, 3-year-olds safe"
- “孟加拉湾平安、墨西哥湾平安、几内亚湾平安”
  - "Wish Bay of Bengal safe, Gulf of Mexico safe, Gulf of Guinea safe"

Upon seeing this format I immediately realized it is suitable for a tag cloud. So let's do it!

The Most Simple Version
-----------------------

Since I'm using the Hexo static site generator, I created a new template file `ping-an-jing.ejs` in the `layout` folder of my theme, and insert the following code at an appropriate position:

```javascript
<% site.tags.forEach(tag => { %>
    Wish <a href="<%- url_for(tag.path) %>"><%= tag.name %></a> safe,
<% }) %>
```

And we have the most simple _Scripture of Safety_! Isn't that easy?

But the result it provides is far from optimal:

> Wish OI safe, Wish 验证码 safe, Wish 物理 safe, Wish 学校 safe, Wish Bug safe, Wish 抢课 safe,

(The Chinese words are tags on my website; you may safely ignore them)

First Steps to Improvement
--------------------------

We can observe two problems:

- "Wish" is repeated multiple times; it should only appear at the beginning.
- The sentence ends with a comma; it should be a period.

What we need is some minor adjustments:

```javascript
<%
var total_tag_counter = 0;
%>
<p>
    <% site.tags.forEach(tag => { %>
        <%
            if(next_paragraph_counter == 0) {
                %>Wish <%
            }
        %><a href="<%- url_for(tag.path) %>"><%= tag.name %></a> safe<%
            total_tag_counter++;
            if(total_tag_counter == site.tags.length) {
                %>.<%
            } else {
                %>, <%
            }
        %>
    <% }) %>
</p>
```

Here we count the number of tags already displayed. If the tag to be shown is the first one, "Wish" is inserted. Similarly, if the tag is the last one, a period is used instead of a comma.

But that's not all. If your site has a lot of tags, all of them will be in a large block. For example this is what I get with my blog:

> Wish OI safe, 验证码 safe, 物理 safe, 学校 safe, Bug safe, 抢课 safe, 二中 safe, 魔塔 safe, 杭二中 safe, 看海 safe, 英语 safe, 中考 safe, 浙江 safe, 恶搞 safe, DNS safe, SAE safe, GoDaddy safe, 域名 safe, JS safe, 过热 safe, Mac safe, WordPress safe, 签到 safe, WoSign safe, GitHub safe, 网站 safe, LADSPA safe, 音效 safe, 爆吧 safe, 算法 safe, BumbleBee safe, 错误 safe, 冬奥会 safe, MH370 safe, 文澜 safe, 怀念 safe, iOS safe, 平板 safe, 安卓 safe, eBay safe, 朝鲜 safe, 编程 safe, 微信 safe, 手机 safe, 比赛 safe, Windows safe, 分区 safe, Recovery safe, Android safe, Steam safe, 贪玩蓝月 safe, 拨号上网 safe, PPP safe, Bad Apple safe, Pascal safe, Linux safe, Bash safe, Bilibili safe, 弹幕 safe, 过滤 safe, 歌词 safe, Docker safe, Raspberry Pi safe, Travis safe, ARM safe, FPGA safe, 踩坑 safe, ssh safe, gogoCLIENT safe, IPv6 safe, 华为c8815 safe, 折腾 safe, 互通 safe, IPv4 safe, flash safe, FTP safe, QQ safe, 笔记本 safe, 苹果 safe, 温度 safe, CPU safe, 风扇 safe, 散热 safe, 图片 safe, 视频 safe, H265 safe, HEIF safe, NAT64 safe, OpenVZ safe, Hurricane Electric safe, VPS safe, OS2 safe, Firefox safe, 随机数发生器 safe, 策略路由 safe, 串口 safe, ChibiOS safe, STM32 safe, RoboMaster safe, Rummy safe, 服务器 safe, 网页 safe, Tengine safe, 编译 safe, 音乐 safe, SliTaz safe, 启动 safe, eMule safe, 无线网络 safe, Azure safe, 虚拟机 safe, Traceroute safe, DN42 safe, ZeroTier One safe, BGP safe, Bird safe, Confederation safe, CDN safe, BAE safe, BuyPass GO safe, SSL safe, VLAN safe, SMTP safe, Typecho safe, sendmail safe, NTP safe, GPS safe, Anycast safe, 彩蛋 safe, fontawesome safe, 反欺诈 safe, GetIPIntel safe, Bird-lg safe, 50KVM safe, 愚人节 safe, GPP safe, Hitokoto safe, 吐槽 safe, Host1Free safe, IP safe, Hosts safe, 莆田系 safe, 向日葵8号 safe, IE safe, WebP safe, IE8 safe, CSS safe, HTML safe, 压缩 safe, Kimsufi safe, ESXi safe, 高德地图 safe, Leaflet safe, Google safe, 微软 safe, Mailgun safe, 特效 safe, jQuery safe, SPDY safe, nginx safe, StartSSL safe, OpenSSL safe, TLS 1.3 safe, LDAP safe, pfSense safe, Tunnelbroker safe, 优化 safe, PHP safe, PowerDNS safe, GeoDNS safe, Lua safe, Hexo safe, 静态网站 safe, Webpack safe, Sass safe, Telegram safe, Telnet safe, Redis safe, W3 Total Cache safe, 邮件 safe, Thunderbird safe, 域名邮箱 safe, x32 safe, 百度 safe, 美国签证 safe, Debian safe, OpenVPN safe, 摄像头 safe, Development Log safe, Himawari 8 safe, 传感器 safe, Sensors safe, 语录 safe, 显卡 safe, Intel safe, NVIDIA safe, MUXless safe, GPU safe, Virtual Machine safe.

(Again, the Chinese words are tags on my website; you may safely ignore them)

Splitting the Block
-------------------

We need to split the whole block into multiple paragraphs for aesthetics. So we need means to decide the number of tags in each paragraph and start a new one when the limit is reached.

Obviously, that number can be set randomly, with Javascript's `Math.random()` function for example. However, in this case the page layout will change every time we regenerate the page, even when the tags did not change. This is not what we want.

So we need some way to set the random seed, but Javascript doesn't support this. Therefore, we need to roll our own random number generator (RNG).

A most simple RNG is LCG (Linear congruential generator), which performs the following operation each time a new number is requested:

$$X \leftarrow (A \cdot X + B) \bmod M$$

A, B, and M are constants, and X is the seed or the last result. Common constant values are available on [Wikipedia](https://en.wikipedia.org/wiki/Linear_congruential_generator). I'm using the constants of glibc:

- $A = 1103515245$
- $B = 12345$
- $M = 2^{31}$
  - Later, I changed it to `32`, since a paragraph with 32 tags is already long enough. In addition, `32 = 2 ^ 5`, so it won't impact the randomness much.

Note that the results of this RNG still follow some form of rules, which means its results can be predicted, and is not appropriate for security related areas such as cryptography. But since we're only splitting paragraphs, we're fine.

For the seed, I'm using the number of tags in the site, `site.tags.length`, so it won't change when tags doesn't change. Of course you may replace it with more complicated operations, such as XORing each character in the name of each tag, etc.

And we have the following code:

```javascript
<%
var next_paragraph_slice = site.tags.length;
next_paragraph_slice = (next_paragraph_slice * 1103515245 + 12345) % 32;
var next_paragraph_counter = 0;
var total_tag_counter = 0;
%>
<p>
    <% site.tags.forEach(tag => { %>
        <%
            if(next_paragraph_counter == 0) {
                %>Wish <%
            }
        %><a href="<%- url_for(tag.path) %>"><%= tag.name %></a> safe<%
            next_paragraph_counter++;
            total_tag_counter++;
            if(next_paragraph_counter == next_paragraph_slice + 1 || total_tag_counter == site.tags.length) {
                %>.</p><p><%
                next_paragraph_counter = 0;
                next_paragraph_slice = (next_paragraph_slice * 1103515245 + 12345) % 32;
            } else {
                %>, <%
            }
        %>
    <% }) %>
</p>
```

And I added a small paragraph at the end to wish my whole site safe:

```javascript
<p>
    Wish <%= config.title %> safe.
</p>
```

The code above will split tags into multiple paragraphs with different lengths.

Conclusion
----------

The _Scripture of Safety_ generator seems simple, but requires some effort to be good:

- Using appropriate paragraph beginnings and punctuation marks.
- Splitting paragraphs for aesthetic purposes.

**The final result is available on [this page](/en/page/ping-an-jing).**

Since this is just a page for memes, I'm not adding it to the top navigation bar.
