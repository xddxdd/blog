---
title: 'Discover More eMule Users with Headless Files to Speed Up Downloads'
categories: Computers and Clients
tags: [eMule]
date: 2013-03-15 22:18:55
autoTranslated: true
---


eMule is a well-known P2P protocol where users can search for other eMule users online and access desired resources.

The eMule protocol consists of two parts: ED2K and KAD. ED2K operates similarly to BitTorrent, requiring clients to maintain a server list. During downloads, clients connect to servers to obtain lists of other users before establishing connections - much like Tracker servers in BitTorrent. The unique aspect is the KAD network, which allows direct user searches without servers.

However, KAD searches are slow due to the inefficiency of scanning IPs individually. eMule addresses this by allowing KAD exchange through ED2K: clients discover peers via ED2K, exchange KAD contacts, connect through KAD, and repeat. But repeated connections still consume significant time.

A clever solution emerged: continuously downloading a specific file allows constant KAD exchange, accelerating source discovery. The trick is preventing completion while keeping the file small. Research revealed eMule divides files into ~9.28MB blocks. Users then created files slightly larger than 9.28MB, sharing only the excess portion while blocking access to the first block.

This forces eMule to persistently search for sources and KAD users to complete the download. Simultaneously, leveraging A4AF (Ask for Another File) reveals additional sources for your downloads. This technique creates "headless files" - so named because their initial segment lacks sources.

Thus, eMule users created and shared various headless files:

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

Usage is simple: add all files to eMule for downloading. Set their priority to low to prevent excessive source-searching from interfering with normal downloads.
```
