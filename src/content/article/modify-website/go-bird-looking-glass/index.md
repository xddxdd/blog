---
title: 'Go 语言实现的 Bird-lg（Bird Looking Glass）'
categories: 网站与服务端
tags: [Bird-lg]
date: 2019-01-08 23:40:00
image: /usr/uploads/2019/01/2163803638.png
---
什么是 BIRD？什么是 Bird-lg？
--------------------------

BIRD 是 Linux 上常用的一款 BGP 路由软件。我主要[在 DN42 网络内使用 Bird][1]，与其它用户建立连接。

[Bird-lg][2] 是 GitHub 用户 sileht 开发的一款基于 Python 2 的程序。它提供了一个网页面板，可以显示各个服务器上的 BIRD 路由软件的状态，以及查询到指定 IP 的路由。

为什么我要用 Go 语言重写？
----------------------

- Bird-lg 基于 Python 2 以及 Flask，因此占用内存较大（20-30 MB）。

  Bird-lgproxy 内存占用量也差不多 20 MB，并且每台服务器上都要运行一个。本站所在的 512 MB 内存的 VPS 已经出现过多次由于内存耗尽外加 SWAP 所在硬盘读写缓慢，导致 Docker、nginx、MySQL、PHP 轮流崩的情况，只能重启解决。

- Go 重写版本只消耗 6 MB 内存。

- Bird-lg 读取多个服务器的状态是**按顺序**进行的，而非并行进行。有时某台服务器网络状态不好，或者 ZeroTier One 抽风，会导致读取时卡较长时间。

- Go 重写版本使用 Goroutine **并行**请求多台服务器，在服务器多、网络差的情况下成倍地加快页面加载速度。

- 这也是我学 Go 语言的一个练手作。

实现了什么功能？
-------------

对于 Bird-lgproxy，实现了以下功能：

- 向 Bird 发送指令
- 执行 Traceroute 并返回结果

对于 Bird-lg，实现了以下功能：

- 基本的状态显示，如图：

  ![基本的状态显示][3]

- 查询到指定 IP 的路由信息：

  ![查询到指定 IP 的路由信息][4]

- 查询信息内 IP 及 ASN 的高亮，以及相应的 WHOIS 查询：

  ![WHOIS 查询域名][5]

  ![WHOIS 查询 ASN][6]

- Traceroute（下图中可见我的网络到 DN42 DNS 的路由出现了问题）：

  ![Traceroute 输出][7]

什么没实现？
----------

相比 [Python 版的 Bird-lg][8]，Bird-lgproxy 缺少如下功能：

- IP 来源限制

Bird-lg 缺少如下功能：

- 网页右侧的查询历史记录

缺少这些功能完全是因为我用不到，例如我通过将 Bird-lgproxy 绑定到指定网卡来起到 IP 限制的作用。

演示地址
-------

项目地址及源代码：[https://github.com/xddxdd/bird-lg-go][9]

直接进入相应文件夹 `go build` 获得可执行文件。用 `-h` 参数来查看可用参数。程序没有配置文件，所有设置通过参数完成。

演示地址：[https://lg.lantian.pub][10]

我还自己修改了 Python 的 bird-lg，用 `grequests` 加上了并行请求功能，项目地址在此：[https://github.com/xddxdd/bird-lg][11]

另外 Go 版本的 Bird-lgproxy 可以直接代替 Python 版的 Bird-lgproxy，可以和 Python 版的 Bird-lg 配合使用。

  [1]: /article/modify-website/join-dn42-experimental-network.lantian
  [2]: https://github.com/sileht/bird-lg
  [3]: /usr/uploads/2019/01/2163803638.png
  [4]: /usr/uploads/2019/01/3361004803.png
  [5]: /usr/uploads/2019/01/2074591260.png
  [6]: /usr/uploads/2019/01/1327536764.png
  [7]: /usr/uploads/2019/01/408903664.png
  [8]: https://github.com/sileht/bird-lg
  [9]: https://github.com/xddxdd/bird-lg-go
  [10]: https://lg.lantian.pub
  [11]: https://github.com/xddxdd/bird-lg