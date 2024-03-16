---
title: '用电驴断头档发现更多驴友，加快下载速度'
categories: 计算机与客户端
tags: [eMule]
date: 2013-03-15 22:18:55
---
电驴（eMule）是一个现在很有名的P2P协议，电驴下载软件用户可以在网上搜索其他电驴用户，并且获取自己需要的资源。

电驴协议分两部分：一部分是ED2K，它的原理和BT差不多。ED2K要求电驴客户端里保存有一个服务器列表，电驴下载时客户端连接到服务器，并从服务器上下载到其他用户的列表，然后进行连接、下载。这和BT协议里的Tracker服务器的作用是相似的。但是KAD网络部分是它特别的地方，在KAD网络中，电驴客户端可以不通过服务器，直接在网上搜索用户。

但是电驴的KAD搜索速度很慢，因为如果在网上一个个IP搜过来，是很累的事情。于是电驴就允许在ED2K网上交换KAD，也就是电驴通过ED2K查到客户端，交换KAD，再连接KAD，再交换，以此类推。但是反复连接也需要大量连接时间。

于是就有网友想出一个办法：如果让电驴不停下载一个文件，这样电驴客户端就可以通过这个文件不停交换KAD，搜源速度会快很多。但是又不能让它下完，而且文件又不能很大。然后他们研究了一下，发现电驴下载分块是按约9.28MB来分块的。于是他们想出了一个办法，建一个比9.28MB略大的文件，共享大出去的那一块，同时断掉前9.28MB的分享。

这样电驴就会不停搜索源，不停查找KAD用户尝试完成下载。同时利用电驴A4AF（Ask for another file，请求下载列表中另一个文件），可以找到你在下载的文件的其它下载源。这就是所谓的“断头档”，因为它的开头是没有源的。

于是，驴友们行动起来了，制作了多个不同的断头档，分享到了网上。

```bash
ed2k://|file|[eMuleFriend]Cyndi-Connect.tmp|9871476|9E3A905292B7AE6A2E2110DFC061779B|/
ed2k://|file|[eMuleFriend]PTT.tmp|23007826|CF52D1CAD8FFF93CF03DB26DF23260D2|/
ed2k://|file|[eMuleFriend]ShareGet.tmp|10564607|B494CC6DB8609C014858151CD7EA9193|/
ed2k://|file|[eMuleFriend][ieD2k]好友档.tmp|9728001|D932AC7C54FCA8B9288BDBBEEAECFE6A|/
ed2k://|file|[eMuleFriend][ieD2k]游戏.tmp|9728001|869F7191FE06034DC2D9725A21B91D7A|/
ed2k://|file|[eMuleFriend][ieD2k]音乐.tmp|9728001|CB5A1026E5510734BD2D6B4F6D586019|/
ed2k://|file|[eMuleFriend][ieD2k]软件.tmp|9728001|3C57D783F90789120B41B4DA2D187795|/
ed2k://|file|[eMuleFriend][ieD2k]剧集.tmp|9728001|D73C8E5B3A6B4C57A53DB59F59050F39|/
ed2k://|file|[eMuleFriend][ieD2k]动漫.tmp|9728001|A8942E7C70D93B99571D6C5056D09A86|/
ed2k://|file|[eMuleFriend][ieD2k]电影.tmp|9728001|FB8BDDFF25763A29940F84E1EF12A897|/
ed2k://|file|[eMuleFriend]教育网.tmp|11632894|BD67236968C287502E385DCCB6E3C8A9|/
```

使用方法很简单，把这些文件全部copy到电驴里下载即可。同时建议把这些文件的优先级设成低，以免电驴疯狂找源影响正常下载。
