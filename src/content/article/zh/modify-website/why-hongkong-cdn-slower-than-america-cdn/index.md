---
title: '为什么香港CDN会比美国CDN慢'
categories: 网站与服务端
tags: [CDN, 折腾, 网站]
date: 2013-02-16 22:21:09
---

CDN，也就是内容分发服务，可以为你的网站在某个位置建立一个分站，其内容与你的原始
站点相同。同时，这些分站还能保存你原有的一些静态资源，如JS、CSS、图片，让你的网
站访问更快。有时CDN还能优化某两地之间的网络状况。

比方说，我的网站在B地，我（以及我的访客）在A地，从A地到B地的宽带需要经过C地，但
是C地的宽带质量不好。这时，我Ping我的网站，就会出现不同程度的丢包，一旦数据包丢
失，客户端只能等待一段时间，见服务器无响应，再次发包，会导致网站打开速度变慢。而
此时，我使用了D地的CDN，此时CDN就会绕过宽带不好的C地，丢包率明显降低，就可以提高
网站的速度。

```bash
A---->C(X)-->B 这种走法就会丢包
|            |
+---->D------+ 这样绕过C地就能明显加速
```

但是有时CDN会适得其反，比如原先访问网站经过D，开启CDN后经过C，就会导致减速。再举
个极端的例子，比如我的网站在美国东海岸，我在西海岸，此时我的CDN却偏偏让我从东海
岸、亚洲、欧洲、西海岸这样绕一圈，就会导致减速。所以，选择CDN，不能只看CDN位置，
还要看CDN到你原始网站和到你的路径。之前我的博客使用安全宝CDN的时候，分配到美国洛
杉矶的ChinaCache节点，毕竟是中国人选的机房，速度非常给力（在美国服务器中），ping
一下子从250ms降到150ms。但是后来，我放弃安全宝DNS，将DNS解析商换成DNSPod，并重新
做了CNAME解析，这时安全宝就给我分配了香港新世界节点。从理论上来说，距离近了，速
度也会快。但是我反而觉得速度变慢了。以前我按刷新，Chrome的小圆圈转1/8圈就能开始
加载，现在却要转上1/2圈，甚至有转个3圈停不下来的。我马上就觉得我遇到了适得其反的
那种情况。

为了确定我的猜想，最好的方法就是Tracert路由追踪。Tracert可以跟踪你的数据包一路上
的所有节点，从而帮助你判断你的数据包的传输情况。但是我手头上没有香港节点的VPS之
类的东西，所以我就用了WebKaka。

WebKaka可以给你的网站提供测速服务，还可以在线ping和tracert。我现在暂时给国外的用
户解析了Incapsula CDN（国内还是安全宝），Incapsula CDN根据我估计有美国西海岸、美
国东海岸、以色列（？）3个节点，所以我在WebKaka里对应选择了美国加州HE、洛杉矶BN和
香港新世界，向我的源站IP发起Tracert。不一会儿，Tracert完成。

```bash
路由起z：71 ms    平均响应时间： 43 ms

路由起点：香港新世界            路由终点：美国            节点上限：30个
节点    IP地址    DNS名称    位置    响应时间
1    59.188.196.193        香港 新世界电讯    0 ms
2    58.64.160.241        香港 新世界电讯数据中心    4 ms
3    113.10.230.177        香港 新世界电信    0 ms
4    113.10.229.97    irb8.10g-tc1.wpc.nwtgigalink.com    香港 新世界电信    5 ms
5    113.10.229.178    ae2.10g-pp1.wpc.nwtgigalink.com    香港 新世界电信    1 ms
6    195.22.223.145    ge0-5-2-2.hongkong1.hok.seabone.net    意大利    3 ms
7    195.22.223.163    xe-11-0-1.singapore2.sin.seabone.net    意大利    32 ms
8    195.22.218.232    te0-14-1-0.palermo17.pal.seabone.net    意大利    435 ms
9    195.22.196.100    pos0-2-0-0.milano50.mil.seabone.net    意大利    457 ms
10    195.22.211.114    xe-2-1-1.franco31.fra.seabone.net    意大利    441 ms
11    213.248.68.189    ffm-b12-link.telia.net    瑞典 Teliasonera电信公司    481 ms
12    213.155.135.14    ffm-bb2-link.telia.net    英国 Teliasonera公司    480 ms
13    213.155.135.59    ash-bb4-link.telia.net    英国 Teliasonera公司    479 ms
14    213.155.132.179    cha-b1-link.telia.net    英国 Teliasonera公司    490 ms
15    213.248.68.138    giglinx-ic-156088-cha-b1.c.telia.net    瑞典 Teliasonera电信公司    490 ms
16    Request TimeOut             *
17    208.69.231.10    ashv1.main-hosting.com    美国    513 ms
18    31.170.166.141    31-170-166-141.main-hosting.com    美国    478 ms
总共响应时间：4789 ms    最长响应时间：513 ms    平均响应时间： 266 ms

路由起点：美国洛杉矶BN            路由终点：美国            节点上限：30个
节点    IP地址    DNS名称    位置    响应时间
1    184.82.255.233    184-82-255-233.static.hostnoc.net    美国 BurstNET网络公司    2 ms
2    64.120.246.77    ec0-60.gwy02.laca02.hostnoc.net    美国 BurstNET网络公司    0 ms
3    64.120.243.137    xe0-02.gwy01.laca02.hostnoc.net    美国 BurstNET网络公司    0 ms
4    38.104.83.53    te0-0-0-10.ccr22.lax04.atlas.cogentco.com    美国 华盛顿哥伦比亚特区Cogent通信公司    0 ms
5    154.54.88.18    te0-0-0-4.ccr22.lax01.atlas.cogentco.com    美国 华盛顿哥伦比亚特区Cogent通信公司    1 ms
6    154.54.5.193    te0-0-0-5.ccr22.iah01.atlas.cogentco.com    美国 华盛顿哥伦比亚特区Cogent通信公司    37 ms
7    154.54.7.237    te0-1-0-6.ccr22.atl01.atlas.cogentco.com    美国 华盛顿哥伦比亚特区Cogent通信公司    52 ms
8    154.54.6.122    te0-6-0-1.ccr21.atl04.atlas.cogentco.com    美国 华盛顿哥伦比亚特区Cogent通信公司    51 ms
9    38.122.47.6        美国 华盛顿哥伦比亚特区Cogent通信公司    55 ms
10    Request TimeOut             *
11    Request TimeOut             *
12    Request TimeOut             *
13    75.131.187.34    75-131-187-34.static.gwnt.ga.charter.com    美国 密苏里州圣路易斯市Charter通信公司    57 ms
14    Request TimeOut             *
15    Request TimeOut             *
16    208.69.231.10    ashv1.main-hosting.com    美国    138 ms
17    31.170.166.141    31-170-166-141.main-hosting.com    美国    62 ms
USBN:Trace completed
总共响应时间：455 ms    最长响应时间：138 ms    平均响应时间： 26 ms
```

所以我们可以看到，美国的两个节点都从美国本土走了过去，但是香港的数据包却从欧洲绕
了一圈。众所周知，美国的网络情况最好，所以相应的美国节点也最快。

现在由于怕Incapsula反应过于激烈，我对国外用户解析就是Incapsula原始解析，而国内用
户则被我手动指定到了美国西海岸节点。原先的速度就又回来了，HOHO~
