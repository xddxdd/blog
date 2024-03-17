---
title: '制作一个优雅的平安经生成器'
categories: 网站与服务端
tags: [平安经, 优雅]
date: 2020-08-01 23:36:16
---

> 由于本文内容与所用语言有关，中文、英文版内容有少许差异。

## 《平安经》简介

《平安经》由（前）吉林公安厅党委副书记、常务副厅长贺电所作，书中内容只是句式“XXX
平安”的简单重复，但书籍售价很高。因此公众质疑本书的出版和出售有索贿嫌疑。

《平安经》的内容格式如下：（来
自[维基百科](https://zh.wikipedia.org/wiki/%E5%B9%B3%E5%AE%89%E7%BB%8F)）

-   “眼平安，耳平安，鼻平安”
-   “上海港平安、深圳港平安、宁波舟山港平安、广州港平安”
-   “初生平安、满月平安、百天平安、1岁平安、2岁平安、3岁平安”
-   “孟加拉湾平安、墨西哥湾平安、几内亚湾平安”

我一看到这个格式，就发现它很适合做标签云。那么就让我们开始吧！

## 最简单的版本

我用的是 Hexo 静态网站系统，只要在主题的 `layout` 文件夹下新建一个
`ping-an-jing.ejs` 模板文件，然后在合适的地方插入如下代码：

```javascript
<% site.tags.forEach(tag => { %>
    <a href="<%- url_for(tag.path) %>"><%= tag.name %></a>平安、
<% }) %>
```

这样一个最原始的《平安经》就完成了！是不是很简单？

但是这样的效果很不好，输出格式类似：

> OI平安、验证码平安、物理平安、学校平安、Bug平安、抢课平安、

## 改进观感的第一步

我们可以注意到两个问题：

-   英文标签名和“平安”两字之间没有空格，影响观感；
-   整句话末尾仍然是顿号，没有替换成句号。

因此我们只需要做出一点小小的修改：

```javascript
<%
var total_tag_counter = 0;
%>
<p>
    <% site.tags.forEach(tag => { %>
        <a href="<%- url_for(tag.path) %>"><%= tag.name %></a><%
            if(tag.name.codePointAt(tag.name.length - 1) <= 0xff) {
                %>&nbsp;<%
            }
        %>平安<%
            total_tag_counter++;
            if(total_tag_counter == site.tags.length) {
                %>。<%
            } else {
                %>、<%
            }
        %>
    <% }) %>
</p>
```

这里我们加了两处判断：

1. 使用 `tag.name.codePointAt(tag.name.length - 1)` 这段代码获取标签名最末端的一
   个字符，判断它是否小于 255（即在 ASCII 范围内，为英文字母、数字或符号）。如果
   是的话就额外插入一个空格改善观感。
2. 记录总共显示的标签数量，如果所有标签都被显示了，那就用句号结尾。

但是问题还没完，如果网站标签数量很多，那么所有标签会被显示在一大块里。例如此时我
的博客就会显示如下的效果：

> OI 平安，验证码平安，物理平安，学校平安，Bug 平安，抢课平安，二中平安，魔塔平
> 安，杭二中平安，看海平安，英语平安，中考平安，浙江平安，恶搞平安，DNS 平
> 安，SAE 平安，GoDaddy 平安，域名平安，JS 平安，过热平安，Mac 平安，WordPress
> 平安，签到平安，WoSign 平安，GitHub 平安，网站平安，LADSPA 平安，音效平安，爆
> 吧平安，算法平安，BumbleBee 平安，错误平安，冬奥会平安，MH370 平安，文澜平安，
> 怀念平安，iOS 平安，平板平安，安卓平安，eBay 平安，朝鲜平安，编程平安，微信平
> 安，手机平安，比赛平安，Windows 平安，分区平安，Recovery 平安，Android 平
> 安，Steam 平安，贪玩蓝月平安，拨号上网平安，PPP 平安，Bad Apple 平安，Pascal
> 平安，Linux 平安，Bash 平安，Bilibili 平安，弹幕平安，过滤平安，歌词平
> 安，Docker 平安，Raspberry Pi 平安，Travis 平安，ARM 平安，FPGA 平安，踩坑平
> 安，ssh 平安，gogoCLIENT 平安，IPv6 平安，华为c8815 平安，折腾平安，互通平
> 安，IPv4 平安，flash 平安，FTP 平安，QQ 平安，笔记本平安，苹果平安，温度平
> 安，CPU 平安，风扇平安，散热平安，图片平安，视频平安，H265 平安，HEIF 平
> 安，NAT64 平安，OpenVZ 平安，Hurricane Electric 平安，VPS 平安，OS2 平
> 安，Firefox 平安，随机数发生器平安，策略路由平安，串口平安，ChibiOS 平
> 安，STM32 平安，RoboMaster 平安，Rummy 平安，服务器平安，网页平安，Tengine 平
> 安，编译平安，音乐平安，SliTaz 平安，启动平安，eMule 平安，无线网络平安，Azure
> 平安，虚拟机平安，Traceroute 平安，DN42 平安，ZeroTier One 平安，BGP 平
> 安，Bird 平安，Confederation 平安，CDN 平安，BAE 平安，BuyPass GO 平安，SSL 平
> 安，VLAN 平安，SMTP 平安，Typecho 平安，sendmail 平安，NTP 平安，GPS 平
> 安，Anycast 平安，彩蛋平安，fontawesome 平安，反欺诈平安，GetIPIntel 平
> 安，Bird-lg 平安，50KVM 平安，愚人节平安，GPP 平安，Hitokoto 平安，吐槽平
> 安，Host1Free 平安，IP 平安，Hosts 平安，莆田系平安，向日葵8号平安，IE 平
> 安，WebP 平安，IE8 平安，CSS 平安，HTML 平安，压缩平安，Kimsufi 平安，ESXi 平
> 安，高德地图平安，Leaflet 平安，Google 平安，微软平安，Mailgun 平安，特效平
> 安，jQuery 平安，SPDY 平安，nginx 平安，StartSSL 平安，OpenSSL 平安，TLS 1.3
> 平安，LDAP 平安，pfSense 平安，Tunnelbroker 平安，优化平安，PHP 平安，PowerDNS
> 平安，GeoDNS 平安，Lua 平安，Hexo 平安，静态网站平安，Webpack 平安，Sass 平
> 安，Telegram 平安，Telnet 平安，Redis 平安，W3 Total Cache 平安，邮件平
> 安，Thunderbird 平安，域名邮箱平安，x32 平安，百度平安，美国签证平安，Debian
> 平安，OpenVPN 平安，摄像头平安，Development Log 平安，Himawari 8 平安，传感器
> 平安，Sensors 平安，语录平安，显卡平安，Intel 平安，NVIDIA 平安，MUXless 平
> 安，GPU 平安，Virtual Machine 平安。

## 分拆豆腐块

为了美观我们需要把这个豆腐块拆分成几个小段。为此我们需要用某种方法决定每一段话显
示几个标签，在达到这个数量时开始新的一段。

显然这个数量可以随机指定，例如使用 Javascript 的 `Math.random()` 函数。但是这样
的话即使标签本身都不变，每次重新生成页面时分段都会变化，这不是我们想要的。

因此我们需要以某种方式固定随机数种子，但是 Javascript 并不支持这个。因此我们要自
己写一个随机数产生器。

一种最简单的随机数发生器是 LCG（Linear congruential generator，线性同余方法生成
器），其在每次产生随机数时执行如下操作：

$$X \leftarrow (A \cdot X + B) \bmod M$$

其中 A、B、M 为常数，X 为随机数种子或上次产生的结果。常用的常数可以
在[维基百科](https://en.wikipedia.org/wiki/Linear_congruential_generator)上查
到。我选用的是 glibc 的常数：

-   $A = 1103515245$
-   $B = 12345$
-   $M = 2^{31}$
    -   但我后续把它改成了 `32`，因为 32 个标签一段已经很长了，而且 `32 = 2 ^ 5`
        不会对随机性造成太大影响。

要注意这个随机数发生器的结果常常是有规律可循的，也就是它的结果可被预测，不适用于
密码学等安全相关领域，但我们只是在拆分段落所以没关系。

关于随机数种子，我选择的是站点标签的数量 `site.tags.length`，以做到在标签不改变
时页面不变化。当然你也可以做一些复杂的操作，例如 XOR 每个标签的名字的每个字，等
等。

于是就有了如下代码：

```javascript
<%
var next_paragraph_slice = site.tags.length;
next_paragraph_slice = (next_paragraph_slice * 1103515245 + 12345) % 32;
var next_paragraph_counter = 0;
var total_tag_counter = 0;
%>
<p>
    <% site.tags.forEach(tag => { %>
        <a href="<%- url_for(tag.path) %>"><%= tag.name %></a><%
            if(tag.name.codePointAt(tag.name.length - 1) <= 0xff) {
                %>&nbsp;<%
            }
        %>平安<%
            next_paragraph_counter++;
            total_tag_counter++;
            if(next_paragraph_counter == next_paragraph_slice + 1 || total_tag_counter == site.tags.length) {
                %>。</p><p><%
                next_paragraph_counter = 0;
                next_paragraph_slice = (next_paragraph_slice * 1103515245 + 12345) % 32;
            } else {
                %>、<%
            }
        %>
    <% }) %>
</p>
```

然后我在最后还加了一小段话，祝福整个网站平安：

```javascript
<p>
    <%= config.title %><%
        if(config.title.codePointAt(config.title.length - 1) <= 0xff) {
            %>&nbsp;<%
        }
    %>平安。
</p>
```

上述代码会把标签分在错落有致的几段话里面。

## 总结

《平安经》生成器看起来很简单，但要做得好也要花一点功夫：

-   判断 ASCII 码，在英文标签后加空格
-   把标签分段提升美观性
-   每段末尾加句号

**最终效果可以在[这个页面](/page/ping-an-jing)看到。**

由于只是娱乐性页面，我就不加进顶部导航栏了。
