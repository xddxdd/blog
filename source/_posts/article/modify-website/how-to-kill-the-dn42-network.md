---
lang: zh
title: '如何引爆 DN42 网络（持续更新）'
label: how-to-kill-the-dn42-network
categories: 网站与服务端
tags: [DN42,BGP]
date: 2020-05-30 15:44:15
---

> DN42 是一个**测试网络**，所有人都在帮助所有人。即使你不小心搞砸了，也没有人会指责你。你可以在 DN42 的 [IRC 频道](https://wiki.dn42.us/services/IRC)，[邮件列表](https://wiki.dn42.us/contact#contact_mailing-list)或者[非官方 Telegram 群组](https://t.me/Dn42Chat)寻求帮助。

由于 DN42 是一个实验用网络，其中也有很多新手、小白参与，因此时不时会有新手配置出现错误，而对整个 DN42 网络造成影响，甚至炸掉整个网络。

现在，作为一名长者（x），我将教各位小白如何操作才能炸掉 DN42，以及如果你作为小白的邻居（指 Peer 关系），应该如何防止他炸到你。

> 注意：你不应该在 DN42 网络中实际执行这些操作，你应该更加注重对破坏的防御。
>
> 恶意破坏会导致你被踢出 DN42 网络。

本文信息根据 Telegram 群中的**真实惨案**改编。

更新记录
=======

- 2020-05-30：第一版，包含 OSPF、Babel、左右横跳

OSPF 真好玩
==========

错误操作
-------

你刚刚加入 DN42，并且准备把你手上的几台服务器都连接进去。你通过邮件，IRC 或者 Telegram 找了几个人分别和你的几台服务器 Peer，但是你还没有配置好你的内部路由分发。

于是你准备配置 OSPF，并打开 Bird 的配置文件加了一个 protocol：

```bash
protocol ospf {
  ipv4 {
    import all;
    export all;
  };
  area 0.0.0.0 {
    interface zt0 {
      type broadcast;
      # 略掉一些不重要的参数
    };
  };
};
```

你心满意足地把配置文件复制到每台服务器上，然后 `bird configure`，看到你的各台服务器都通过 OSPF 获取到了其它服务器的路由。

突然，你的 IRC / Telegram 弹出了一个提示框，你点开来一看：

```bash
<mc**> shit.... as424242**** is hijacking my prefixes, for example 172.23.*.*/27
<he**> yup, I see some roa fails for them as well
```

恭喜你，你成功劫持了 DN42 网络（的一部分）。

发生了什么
--------

当你的服务器通过 BGP 协议和其他人 Peer 时，每一条路由都包含了路径信息，包括它从哪里来，经过了哪些节点到达你这里。例如 `172.22.76.184/29` 这条路由可能就带有 `4242422547 -> 4242422601 -> 424242****` 这条路径，其中 `4242422547` 是路由来源（就是我），而 `4242422601` 是你的邻居（此处以 Burble 举例）。

但是，你的内网在传递路由时使用的是 OSPF 协议，而 OSPF 在传递路由信息时不会保留 BGP 的路径，因为它并不认识这些东西。此时你的另一台服务器通过 OSPF 获取到了 `172.22.76.184/29` 这条路由，但是不包含任何路径信息，它在与邻居的 BGP 宣告中就会将这条路由使用你自己的 ASN 播出去，造成劫持效果。

画成图大概是这样的：

```bash
[2547] -> [2601] -> [你的 A 节点] -> [你的 B 节点] -> [你的 B 节点的邻居]
 2547      2547      2547           没了！           你的 ASN（BOOM）
           2601      2601
                     你的 ASN
```

正确的操作
--------

- 永远记住一点原则：OSPF，Babel 等 IGP（内部路由协议）不应处理 BGP 路由信息，BGP 路由就应该让 BGP 协议自己处理。
  - 在网络内部配置 BGP 有多种方案，可以参考《[Bird 配置 BGP Confederation](/article/modify-website/bird-confederation.lantian/)》这篇文章。
- 同时，内部路由协议的路由也不应漏到 BGP 中，除非内部路由协议中处理的所有 IP 段都是你自己所有。
  - 将 BGP 的 `export filter` 写成这样：
  - ```bash
    export filter {
      # 只允许向外发送来自 STATIC（手动配置）和 BGP 协议的路由
      if source ~ [RTS_STATIC, RTS_BGP] then accept;
      # 拒绝掉其它路由协议的路由
      reject;
    }
    ```

如何防御
-------

- 最佳的方法是 ROA，即路由来源验证（`Route Origin Authorization`），限制每条路由的来源 ASN。
  - 对于 DN42，ROA 配置文件根据 Registry 的信息自动生成，可以在 [DN42 Wiki 的 Bird 配置页面](https://wiki.dn42.us/howto/Bird#route-origin-authorization)下载，并且可以设置 Cron 定时任务自动更新。
- 如果你不想配置 ROA，你可以尝试与尽量多的人 Peer。
  - 由于 BGP 默认选择经过的 AS 最少的路径，如果你和很多人直连，即使有人在劫持路由，你的网络仍然会优先选择这些直连路径。
  - 但注意这样**不能保证**防住路由劫持，例如以下情况：
    - 真实 AS 到你路径比劫持者的长；
    - 劫持者与真实 AS 到你的 AS 路径等长，此时会选择哪个看脸；
    - 你有配置 DN42 Community Filter，导致劫持者的路由优先级比较高。

Babel 也很好玩
============

错误操作
-------

Telegram 里的老哥说话很好听，一边帮助你修上面那个 Bug，一边向你推荐 Babel：

- Babel 可以自动根据延迟选择最短路线；
- Babel 配置非常简单。

但是，群友不推荐你使用 Bird 自带的 Babel 协议支持，因为 Bird 的 Babel 不能根据延迟选路。

你心动了，删掉了 OSPF 的配置文件，并装了一个 Babeld。很快你的每台机器上都出现了其它节点通过 Babel 发来的路由。你等了几分钟，似乎没有爆炸。

但是你注意到，你的 Bird 没有把这些路由通过 BGP 发出去。老哥们怂恿你开启 Bird Kernel Protocol 的 Learn：

```bash
protocol kernel sys_kernel_v4 {
  scan time 20;
  # 群友怂恿你添加这一行
  learn;
  # 不重要的略过
};
```

你照做了。几分钟后，你被 IRC 和 Telegram 里的人疯狂艾特。是的，你又把其他人的网络劫持了。

发生了什么
--------

这和上面 OSPF 一段其实是相同的问题，Babel 在传递路由时丢弃了 BGP 的路径信息。只不过默认情况下，Bird 会忽略其它路由软件写入内核路由表的路由信息，除非你开了 learn。


正确的操作
--------

与 OSPF 一段相同，配置 iBGP + 设置 Filter。

重复一遍：OSPF，Babel 等 IGP（内部路由协议）不应处理 BGP 路由信息，BGP 路由就应该让 BGP 协议自己处理。

如何防御
-------

与 OSPF 一段相同，ROA + 多 Peer 可解。

左右横跳
=======

左右横跳泛指多种错误，它们会造成 BGP 路由程序频繁切换获得的最优路径。由于最优路径会通过 Peering 传递给别人，这个切换过程就会造成大量的流量消耗。由于 DN42 内多数人用的是便宜的 VPS 做节点，因此长期下来结果只有以下两种：

1. 你的邻居发现了流量消耗异常，主动切断了和你的 Peering；
2. 你的主机商（可能还有你的邻居的主机商）发现你长期占用带宽（或者用完了流量），停掉了你的 VPS。

而且左右横跳错误可能会造成严重的影响：

- 如果出错的 AS 和其它多个 AS 建立了 Peering，即使你断开了和他的直接连接，路由切换仍然可能从其它 AS 传递到你的 AS。
  - 为了解决一个 AS 的问题，可能需要断开好几个 AS。

历史上有过这些爆炸事故：

- 某 Telegram 群友从 Fullmesh + Direct 转向 Multihop 时出现事故，造成了非常大量的路由切换。
  - 他在切换过程中没有断开 BGP，而 Babel 的配置错误导致大量路由被传递及撤销。
  - “thats like 1k updates every few seconds”（没过几秒就有 1000 条路由更新）。
  - 由于上述路由切换传递原因，多个较大 AS 被迫断开之间的连接。
- （该群友先前还有多次路由切换事故）

如何防御
-------

- 最理想的方案是 Route Dampening，也就是限制一段时间能收到的路由更新数量。
  - 但是 Bird 不支持这个，没救了，等死吧，告辞.webp
- 次优的方法是使用 Prometheus、Grafana 等工具对各个节点进行监控，在流量异常时收到提醒，上去手动处理。
  - 显而易见的是，如果你当时不在线，当你看到提醒时有可能已经几 G 的流量没了。
- 再次优的方法是对 Peering 的端口进行限速。
  - 由于 DN42 内目前几乎没有大流量应用，这种方法的确能保证安全。
  - 缺点显而易见：性能下降。
- 土豪的方法是买无限流量的服务器。
