---
title: 'Bird 配置 BGP Confederation，及模拟 Confederation（2020-06-07 更新）'
categories: 网站与服务端
tags: [BGP, Bird, Confederation]
date: 2020-06-07 21:51:51
---

更新记录
-------

- 2020-10-01：添加警告，模拟 Confederation 时不能在内网滤掉内部 ASN
- 2020-06-07：添加 Bird Confederation 的局限，及模拟 Confederation 方法
- 2020-05-17：最初版本

ISP 内部 BGP 互联方案比较
----------------------

互联网中各个 ISP（互联网服务提供商）绝大多数都使用 BGP 协议互相交换自己的路由信息。每个 ISP 都会从所在区域的网络信息中心（NIC，例如 APNIC，RIPE）获得一个 ASN（自治域编号），例如中国电信的 ASN 是 4134。然后 ISP 之间通过物理连接（铜缆，光纤，卫星网络等）连接各自的边界路由器，然后在边界路由器上配置 BGP 协议，告诉对方：“我是 AS4134，我这里可以访问到 `202.101.0.0/18` 这个 IP 段”。与中国电信相连的 ISP 的路由器会接力把这条消息广播下去：“我是 ASXXXX，我距离 `202.101.0.0/18` 有一格距离”，以此类推。各个 ISP 的路由器就会根据到目标的距离等参数，把数据包发送到对这个路由器来说最优的目标。

（注：以上内容经过简化，实际世界中的 ISP 互联、数据包路径选择会有更加复杂的规则。）

而一个大型 AS 的内部也有可能需要使用 BGP 等路由协议，例如中国电信拥有覆盖整个中国大陆的网络，在各个城市都有核心路由器，每个核心路由器负责管理所有 IP 段的一小部分。要让这些路由器互相得知哪台路由器管理哪些 IP，有几种方法：

1. 手动设置静态路由。
   - 这是最简单粗暴的办法，直接人工告知路由器将某个 IP 段的数据包发给某个路由器。
   - 缺点也显而易见，对于中国电信这样大小的网络，人工设置的压力将非常大，很容易出错。
   - 另外，如果某两地之间的物理连接出现中断，静态路由就会失效，导致两地之间网络中断。此时就需要人工将数据包导向另一个地方进行中转。
2. 使用 iBGP
   - 就像和其它 ISP 建立邻居关系（Peer）一样，在路由器之间设置好 BGP 会话，两端使用同一 ASN。这种 BGP 连接被称做 iBGP，而两端 ASN 不同的被称为 eBGP。
   - 各台路由器上均只需要一次性配置好 BGP 会话即可，之后在网络中断等情况下，各台路由器会自动删除失效的路由信息，转而选择剩下可用路径中最佳的一条。
   - 但是 iBGP 有一个很严重的限制：所有路由器都应该两两相连。原因如下：
     - 假设我们有如下的网络拓扑：

       ```graphviz
       graph {
         rankdir=LR
         node[shape=box]

         subgraph cluster_1 {
           style=filled;
           color=lightgrey;
           label="AS1";
           node[style=filled,color=white]
           {rank=same; A -- "10.0.0.0/8"; }
           "10.0.0.0/8"[shape=oval]
         }

         subgraph cluster_2 {
           style=filled;
           color=lightgrey;
           label="AS2";
           node[style=filled,color=white]
           {rank=same; B -- C; }
           B -- D;
           C -- D;
         }

         A -- B
       }
       ```

       - 其中 A 属于 AS1, B、C、D 属于 AS2。
       - 此时 A 广播自己可以访问到 `10.0.0.0/8` 这个 IP 段。
       - B 收到 A 的广播，并向 C 和 D 宣布自己距离 `10.0.0.0/8` 有 1 格，路线是 `AS2 -> AS1`。
         - 注意 BGP 的路线信息中并没有标记它具体经过了哪台路由器，而只标记了它经过哪些 AS（即 ISP）。
       - C 收到 B 的广播，向 D 宣布自己距离目标 2 格，路线是 `AS2 -> AS2 -> AS1`。同时 D 也向 C 宣布同样的内容。
       - 由于 BGP 的选路并不是严格意义上的最短路线，可以通过人工或程序设置优先级的方式调整，因此 C 有可能选择将数据包导向 D，路线是 `AS2 -> AS2 -> AS2 -> AS1`。
       - 此时 B 看到的情况是，A 和 C 两台路由器都宣布自己可以到达目标。于是经过诡异的调整后，B 放弃了直接导向 A 的路径（虽然很蠢，但是这是可能的！）并选择将数据包导向 C。
       - 此时的路线就是 `B -> C -> D -> B -> A`，出现了环路，数据包将永远无法到达目标。
       - 更糟糕的是，B 会继续将这条环路宣布给 D，再是 C，再是 B……如此循环下去，各台路由器的内存将被路由信息迅速耗尽，导致系统崩溃、数据转发完全中断。
     - 为了避免以上情况的发生，iBGP 人为设置了一个限制：如果一条路由是同一个 AS 的路由器发来的，这条路由就不会被宣告给同一个 AS 下的其它路由器。此时：
       - B 将路由信息发送给 C 和 D。
       - C 和 D 都收到了路由信息，但是不会把路由信息发送给彼此。
       - 此时 C 和 D 到目标都只有唯一路径，就不会出现上述不断转发的情况了。
     - 但是此时天灾降临，B 和 D 之间的连接中断了。
       - 此时 C 不会把到 `10.0.0.0/8` 的路由信息发送给 D，D 就不知道如何到达这个目标了。
   - 这就意味着一件事：同一个 AS 内的所有路由器之间都必须两两连接，并设置 BGP 会话。
     - 实际部署中不需要两两物理连接，可以通过 OSPF、Babel 等协议处理 ISP 内部的路由。但是跨 ISP（AS）的路由必须由 BGP 处理，因此所有路由器之间仍然需要两两设置 BGP 会话。
     - 对于中国电信这个级别的 ISP 来说，这种配置是不现实的。因此我们需要更好的方法。
3. 使用 BGP Route Reflector
   - Route Reflector 是一台经过特殊配置的路由器。它从同一个 AS 内的所有其它路由器收集所有路由信息，再将它们分发给每台路由器。
   - 这样其它路由器上就只需要一个 BGP 会话，连接到 Route Reflector 就可以。
   - 但是这也意味着，一旦 Route Reflector 出现故障，其它路由器就无法获取到完整的路由信息，网络也会崩溃。
   - 当然也可以设置多个 Route Reflector 互为备份，但是不可否认的是 Route Reflector 的架构完全与互联网去中心化的宗旨相违背。
4. 直接找 NIC 申请一大堆 ASN，给每个路由器分配不同的 ASN，在所有路由器之间设置 eBGP
   - 这样的确可以实现完全去中心化的架构，每个路由器无论到其它路由器的连通状况如何，都能获取到完整的路由信息，可以避免单点故障影响整个网络。
   - 缺点显而易见：大量 ASN 大幅增加了 ISP 和 NIC 的工作量和信息管理成本，NIC 的手续费也不会便宜。
5. 使用 BGP Confederation
   - 在 BGP Confederation 中，每个路由器同样会获得不同的 ASN。但是与 4 不同的是，这些 ISP 内部使用的私有 ASN 没有必要找 NIC 申请。
     - ASN 4200000000 - 4294967295 这一段号码是预留作“内部使用”的，也就是 ISP 可以直接在其内部使用这些 ASN。当然，这些 ASN 也不被 NIC 承认，（一般）不能被广播到其它 ISP。
       - 例如 [DN42 实验网络](/article/modify-website/dn42-experimental-network-2020.lantian)就是占用了其中的一小段。
   - 于是 ISP 给每个路由器从这一段中分配了一个内部使用的 ASN。虽然 BGP 的路由信息只记录了经过的 ASN，但是因为每个路由器的 ASN 都不同，就相当于记录了经过哪些路由器，也就不怕环路了。
   - 但是这些私有 ASN 不被其它网络承认，甚至可能与其它网络产生冲突（其它 ISP 正在用它们做测试），因此在将路由信息发给其它 ISP 的路由器时，就需要把这一段私有 ASN 都删掉，换成这个 ISP 从 NIC 申请下来的 ASN。
   - 但是每台路由器的 ASN 都不同，如何知道哪些路由器是“友军”（属于自己这个 ISP），哪些是“敌军”（属于其它 ISP）？可以给 ISP 内部的所有路由器分配一个统一的编号（称为 Confederation Identifier），用它来识别敌我。
   - 假设我们有如下的网络拓扑：

       ```graphviz
       graph {
         rankdir=LR
         node[shape=box]

         subgraph cluster_1 {
           style=filled;
           color=lightgrey;
           label="AS1";
           node[style=filled,color=white]
           {rank=same; A -- "10.0.0.0/8"; }
           "10.0.0.0/8"[shape=oval]
         }

         subgraph cluster_2 {
           style=filled;
           color=lightgrey;
           label="AS2";
           node[style=filled,color=white]
           {rank=same; B -- C; }
           B -- D;
           C -- D;
         }

         subgraph cluster_3 {
           style=filled;
           color=lightgrey;
           label="AS3";
           node[style=filled,color=white]
           E
         }

         A -- B
         D -- E
       }
       ```

     - 其中 A 属于 AS1, B、C、D 属于 AS2，E 属于 AS3。
     - AS2 中设置了 BGP Confederation，B、C、D 的私有 ASN 分别是 21、22、23。
     - A 广播 `10.0.0.0/8`，B、C、D 接收后，各自获得以下路径：
       - B：`AS21 -> AS1`。
       - C：`AS22 -> AS21 -> AS1` 或者 `AS22 -> AS23 -> AS21 -> AS1`。
       - D：`AS23 -> AS21 -> AS1` 或者 `AS23 -> AS22 -> AS21 -> AS1`。
     - 此时 C 在发送给 E 路由信息时，删掉了 AS2 内部 Confederation 的路径，替换成 `AS2` 这样一个整体的编号。
       - E：`AS3 -> AS2 -> AS1`。
     - 如果天灾降临，B、D 之间的连接中断，D 仍然可以从 C 获得 `AS23 -> AS22 -> AS21 -> AS1` 这条路由，从而保证数据转发正常。
   - 这样既最大化保留了互联网去中心化的特点、避免了单点故障，同时也降低了 NIC 的信息处理压力。
   - 但是在 Bird 中，Confederation 有点问题：
     - Bird 在计算 BGP 路径长度时不会计入 Confederation 这一段的长度，这就会导致诡异的路由结果。
       - 例如 C 同时收到 `A -> B -> C` 和 `A -> B -> D -> C` 两条路由，同时两者优先级相同。此时 Bird 认为两条路由**等长**，于是**随机**选择路由，就有可能绕路。
     - 同时 Bird 也不提供变量，让 Filter 来计算 Confederation 的长度，从而手动调整优先级。
       - Bird 中的 `bgp_path.len` 不包含 Confederation 一段长度，如上所述；
       - Bird 提供的最接近的功能是 AIGP，也就是跨 AS 累积路径的 Cost。但是 AIGP 累计的值不能被 Filter 访问。
         - ~~`bgp_aigp` 变量居然是 void 类型，不知道开发者在干什么。~~
6. 手动模拟一个 BGP Confederation
   - 方案与 Confederation 相同，只不过不把所有路由器设置同一个 Confederation 编号，让它们仍然独立运行。
   - 然后在对外广播路由时，用 Filter 删除掉内网一段的 ASN 来模拟 Confederation 的效果。
     - **注意：**在你的网络内部，不能滤掉内网段 ASN！否则网络会形成环路。
   - 优点是保留了 Confederation 的所有好处，同时可以正常计算路径长度（不会绕路）；
   - 缺点是容易配置出错，例如内网 ASN 没删干净就广播了出去。

下面先介绍 Bird 自带的 Confederation 的配置方法，再介绍模拟 Confederation 的方法。

在 Bird 中配置 Confederation
---------------------------

此处以我的 DN42 网络为例。除了[公开放出的、接受 Peering 的 4 个节点](/page/dn42)之外，我还有 14 个节点因为地区重复、稳定性不佳、系统配置未完成等原因暂时不开放 Peering，但仍然连接在 DN42 网络内，并安装了 Bird 交换 BGP 路由信息。

之前我不使用 Confederation 时，监控并维护 18 个节点之间的 BGP 会话是一件非常麻烦的事。我使用的 ZeroTier One VPN 偶尔会出现稳定性问题，此时就会有 BGP 会话中断，导致节点获取不到完整的路由信息。

我此前的配置文件大致如下：

```bash
template bgp lantian_internal {
  local as DN42_AS;
  path metric 1;
  direct;
  enable extended messages on;
  ipv4 {
    next hop self yes;
    import filter { ltnet_filter_v4(); };
    export filter { ltnet_filter_v4(); };
  };
  ipv6 {
    next hop self yes;
    import filter { ltnet_filter_v6(); };
    export filter { ltnet_filter_v6(); };
  };
};

protocol bgp ltnet_other_server from lantian_internal {
  neighbor NEIGHBOR_IP as DN42_AS;
};
```

这就是一个标准的 iBGP 配置（除了我开了 extended messages 和 next hop self 等功能）。

为了使用 Confederation，我需要给每个节点分配一个私有 ASN。我的节点加入了 DN42 和 NeoNetwork 网络，分别占用了 `424242XXXX` 和 `420127XXXX` 两个范围。于是我选择了 `422547XXXX` 这个范围用作我的私有 ASN 范围，以防止今后和其它网络发生冲突。

（不会有网络占用 2547 这个名字吧？不会吧？不会吧？）

由于我使用 ZeroTier One 建立内网，每个节点都在 `172.18.0.0/24` 中自动分配了一个 IP，我就简单用了 `4225470000 + IP 尾数` 的方式编好了每个节点的 AS。

下一步是修改 Bird 配置，首先需要设置 Confederation Identifier，开启“敌我识别”：

```bash
confederation DN42_AS;
confederation member yes;
```

我直接用了我的 DN42 ASN（4242422547）来做 Confederation Identifier，同时开启 `confederation member` 选项向 Bird 强调对面是友军。

然后将自己这一侧的 ASN 从 DN42 分配的 ASN 修改成自己私有范围内的 ASN：

```bash
local as LTNET_AS;
```

下一个问题是，如何配置邻居（Peer 的对端节点）的 ASN。我当然可以把对方的 ASN 一条一条填进去，但是这样太麻烦了。幸运的是，Bird 支持把邻居设置为 External（外部）并不指定 ASN，此时只要对方 ASN 与自己不同就可以正常建立 BGP 会话：

```bash
neighbor NEIGHBOR_IP external;
```

修改后的配置文件长这样：

```bash
template bgp lantian_internal {
  local as LTNET_AS;
  confederation DN42_AS;
  confederation member yes;
  path metric 1;
  direct;
  enable extended messages on;
  ipv4 {
    next hop self yes;
    import filter { ltnet_filter_v4(); };
    export filter { ltnet_filter_v4(); };
  };
  ipv6 {
    next hop self yes;
    import filter { ltnet_filter_v6(); };
    export filter { ltnet_filter_v6(); };
  };
};

protocol bgp ltnet_other_server from lantian_internal {
  neighbor NEIGHBOR_IP external;
};
```

确认 Confederation 状态
----------------------

在所有节点修改完配置并 `birdc configure` 后，在其中一台节点上查看路由：

```bash
# birdc show route for 172.23.0.53 all
# 只选择一条路由，以简短长度
BIRD 2.0.7 ready.
Table master4:
172.23.0.53/32       unicast [ltnet_hostdare 20:16:32.922 from fcf9:a876:eddd:c85a:8a93::1] * (100) [AS4242422601i]
        via 172.18.0.65 on ztppir7etp
        Type: BGP univ
        BGP.origin: IGP
        BGP.as_path: (4225470065) 4242422601
        BGP.next_hop: 172.18.0.65
        BGP.med: 0
        BGP.local_pref: 9103
        BGP.community: (64511,6) (64511,24) (64511,33) (64511,44)
        BGP.large_community: (4242422601, 120, 26)

```

此时 `BGP.as_path` 中，有一个 ASN 被打上了括号，就是 Confederation 中的私有 ASN。从另一个 ASN 的视角看这条路由是这样的：

```bash
# birdc show route for 172.23.0.53 all
# 只选择一条路由，以简短长度
BIRD 2.0.7 ready.
Table master4:
172.23.0.53/32       unicast [ltnet_gigsgigscloud 16:39:43.377 from fcf9:a876:ed8b:c606:ba01::1] * (100) [AS4242422601i]
        via 172.18.0.1 on zt0
        Type: BGP univ
        BGP.origin: IGP
        BGP.as_path: 4242422547 4242422601
        BGP.next_hop: 172.18.0.1
        BGP.local_pref: 9103
        BGP.community: (64511,6) (64511,24) (64511,33) (64511,44)
        BGP.large_community: (4242422601, 120, 26)
```

可以看到括号里的私有 ASN 被自动替换成了 4242422547 这个由 DN42 分配的 ASN，这样从外部看起来，整个 AS 仍然是一个整体。

模拟 Confederation
-----------------

内网部分的配置方法大致与 Bird Confederation 相同，将每个服务器设置不同的 ASN，并相应地修改邻居设置：

```bash
# 详细操作见 Bird Confederation 配置
local as LTNET_AS;
neighbor NEIGHBOR_IP external;
```

但是**不加**以下两行，即不启用 Bird 自带的 Confederation：

```bash
confederation DN42_AS;
confederation member yes;
```

然后修改所有对外的 BGP 会话，设置如下的 Filter：

```bash
export filter {
  # 添加这一行，删除 BGP 路径中的所有内部 ASN
  # 记得改成你自己的范围！
  bgp_path.delete([4225470000..4225479999]);
  # 此处省略你可能有的其它过滤规则
  accept;
}
```

**再次警告：**在你的网络内部，不能滤掉内网段 ASN！否则网络会形成环路。

一定要注意把**所有**对外 BGP 都设置好，否则就会发生人民群众喜闻乐见的剧情。
