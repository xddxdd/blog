---
lang: zh
title: 'DN42 实验网络介绍及注册教程（2020 版）'
label: dn42-experimental-network-2020
categories: 网站与服务端
tags: [DN42, BGP]
date: 2020-03-14 20:32:16
---

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的网络环境。

简而言之，DN42：

- 不适合单纯想要保护隐私、解锁流媒体服务、规避网络审查的用户
- 适合想要研究网络技术，练习服务器、路由器等网络设备配置，甚至后续在真实互联网建立 AS 的用户
- 适合拥有真实 AS，但担心自己[配置错误广播出错误路由、干掉半个互联网](https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/)，希望有个地方测试的用户。

正因为此，使用 DN42 的门槛比较高。就像在真实互联网中一样，你要扮演一个 ISP（互联网服务提供商），注册自己的个人信息，ASN 号码，IPv4 和 IPv6 的地址池，并且使用 BGP 在自己的服务器上广播它们。你还要和其它的用户联系，和他们做 Peering（对接），一步步进入完整的 DN42 网络。

DN42 在 172.20.0.0/14 和 fd00::/8 上运行，而这两个 IP 段都是分配给内网使用的。换句话说，你在 DN42 上怎么折腾，都不会影响到服务器其它的互联网连接。

注册过程
-------

在我写下原先（2017 年）的《[加入 DN42 实验网络](/article/modify-website/join-dn42-experimental-network.lantian)》时，DN42 的账户、ASN、IP 等信息均由一个名为 Monotone 的系统完成。但是在 2018 年，DN42 放弃了 Monotone 系统，改用 Git 管理所有的信息。

预先警告：DN42 的注册流程比较繁琐，需要花费较多的时间。这是因为真实互联网中申请 ASN 和 IP 的流程也是相似的，而 DN42 的目标就是对真实互联网的尽可能真实的模拟。

大致注册流程如下：

1. 首先去 [https://git.dn42.us](https://git.dn42.us) 注册一个账户，这相当于 DN42 内的 GitHub，账户信息就存放在其中的一个仓库里。
2. 打开 [dn42/registry](https://git.dn42.us/dn42/registry) 这个账户信息仓库，点右上角的 Fork，把仓库复制一份到你自己的账户。
3. 此时你应该已经进入了你自己账户里的那份复制，把它 Clone 下来。
4. 在 Clone 下的仓库里创建一系列的文件，包括：
   1. 在 `data/mntner` 文件夹下创建一个名为 `[昵称]-MNT` 的文件，这个文件代表你的账户，用来认证你以后的操作。例如我的 mntner 文件如下（也可以在 `data/mntner/LANTIAN-MNT` 看到）：

      - ```bash
        mntner:             LANTIAN-MNT
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        source:             DN42
        auth:               pgp-fingerprint 23067C13B6AEBDD7C0BB567327F31700E751EC22
        auth:               ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCulLscvKjEeroKdPE207W10MbZ3+ZYzWn34EnVeIG0GzfZ3zkjQJVfXFahu97P68Tw++N6zIk7htGic9SouQuAH8+8kzTB8/55Yjwp7W3bmqL7heTmznRmKehtKg6RVgcpvFfciyxQXV/bzOkyO+xKdmEw+fs92JLUFjd/rbUfVnhJKmrfnohdvKBfgA27szHOzLlESeOJf3PuXV7BLge1B+cO8TJMJXv8iG8P5Uu8UCr857HnfDyrJS82K541Scph3j+NXFBcELb2JSZcWeNJRVacIH3RzgLvp5NuWPBCt6KET1CCJZLsrcajyonkA5TqNhzumIYtUimEnAPoH51hoUD1BaL4wh2DRxqCWOoXn0HMrRmwx65nvWae6+C/7l1rFkWLBir4ABQiKoUb/MrNvoXb+Qw/ZRo6hVCL5rvlvFd35UF0/9wNu1nzZRSs9os2WLBMt00A4qgaU2/ux7G6KApb7shz1TXxkN1k+/EKkxPj/sQuXNvO6Bfxww1xEWFywMNZ8nswpSq/4Ml6nniS2OpkZVM2SQV1q/VdLEKYPrObtp2NgneQ4lzHmAa5MGnUCckES+qOrXFZAcpI126nv1uDXqA2aytN6WHGfN50K05MZ+jA8OM9CWFWIcglnT+rr3l+TI/FLAjE13t6fMTYlBH0C8q+RnQDiIncNwyidQ==
        remarks:            pin-sha256:o1lfYvcdcYy81UIuZMZO1CkCLX+vJOdD5GLw1cmeStU=
        ```

      - 其中各项的含义如下：
        - `mntner`：即 `maintainer（维护者）`，说明这个账户的名称，与文件名相同。
        - `admin-c`：即 `admin contact（管理员联系信息）`，需要指向后续创建的 person 文件，一般为 `[昵称]-DN42`。
        - `tech-c`：即 `tech contact（技术员联系信息）`，需要指向后续创建的 person 文件，一般也为 `[昵称]-DN42`。
        - `mnt-by`：即 `maintain by（由谁维护）`，指向这个账户本身，一般为 `[昵称]-MNT`。
        - `source`：固定为 `DN42`。
        - `auth`：你的个人认证信息。一般接受两种类型：PGP 公钥和 SSH 公钥。
          - 你**必须在此处添加一个 PGP 公钥**。如果你没有，你需要**立即创建一个**，例如参照 [GitHub 的这份教程](https://help.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key)操作。后续提交过程也会用到这个公钥。
            - 你还需要将你的 PGP 公钥上传到公共查询服务器，称为 Keyserver。目前使用最广泛的是 `SKS-Keyservers`。
            - 上传步骤请参考[阮一峰的这份教程](https://www.ruanyifeng.com/blog/2013/07/gpg.html)，并将 `keyserver` 参数替换成 `hkp://pool.sks-keyservers.net`，例如：

              - ```bash
                gpg --send-keys [密钥ID] --keyserver hkp://pool.sks-keyservers.net
                ```

          - 你可以添加一个 SSH 公钥，也可以不加。DN42 上有些服务会以此处的 SSH 公钥来验证你的身份。
        - `remarks`：备注信息，随便填写，也可以没有。
      - **注意：**各个项目的名称和值之间有一长串空格。这段空格的长度**不是自己可以随意修改的，也不能替换成 Tab**。名称 + 冒号 + 空格的长度**必须是 20 个字符**。

   2. 在 `data/person` 文件夹下创建一个 `[昵称]-DN42` 的文件，代表你的个人信息。说是个人信息，但其实只需要一个邮箱。例如我的 person 文件如下（`data/person/LANTIAN-DN42`）：

      - ```bash
        person:             Lan Tian
        contact:            b980120@hotmail.com
        nic-hdl:            LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

      - 各项含义如下：
        - `person`：你的昵称。
        - `contact`：你的联系方式，一般是你的邮箱。
        - `nic-hdl`：`NIC handle`，指向文件本身，与文件名相同，`[昵称]-DN42`。
        - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner 文件，`[昵称]-MNT`。
        - `source`：固定为 `DN42`。

   3. 接下来你要给自己选择一个 AS 编号，即 ASN。在国际互联网上，ASN 范围 4200000000 - 4294967294 是被保留作私下使用（private use）的，DN42 占用的就是其中的一块，424242**0000** - 424242**3999**。**（注意范围是 4000 个，不是 10000 个）** 在这 4000 个号码中挑选一个你喜欢的，并且没有被占用的，然后进入 `data/aut-num` 文件夹，创建文件。例如我是 AS4242422547, 文件就是 `data/aut-num/AS4242422547`：

      - ```bash
        aut-num:            AS4242422547
        as-name:            LANTIAN-AS
        descr:              Peer with me at b980120@hotmail.com
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

      - 各项含义如下：
        - `aut-num`：AS 号。
        - `as-name`：AS 的名称，一般只在 DN42 的一些网络结构示意图中看到。可以设置为 `[昵称]-AS`。
        - `descr`：AS 简介，一般只在结构图中看到，随意填写。
        - `admin-c`：`admin contact（管理员联系信息）`，指向你的 person 文件，`[昵称]-DN42`。
        - `tech-c`：`tech contact（技术员联系信息）`，指向你的 person 文件，`[昵称]-DN42`。
        - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner 文件，`[昵称]-MNT`。
        - `source`：固定为 `DN42`。
      - 如果你在真实互联网拥有自己的 ASN：
        - 首先大佬受我一拜；
        - 然后你**可以选择在 DN42 内使用自己的真实 ASN**，填入你自己的 ASN 即可。
        - 如果你这样做，你可能会在与其它人 Peer 的时候遇到一点小麻烦（但很容易解决），见后续内容。
        - 同时注册时可能会检查 AS 邮箱是否一致等。
        - 因此我一般建议**再在 DN42 注册一个 ASN 算了**，减少麻烦。

   4. 接下来就进入 IP 选择环节了。进入 `data/inetnum` 文件夹，里面是所有已被注册的 IPv4 地址块信息。你需要在其中挑选一块空闲的地址块占为己用。

      - DN42 的 IPv4 地址在 `172.20.0.0/14` 范围，即 `172.20.0.0 - 172.23.255.255`。
      - 你在 DN42 内能申请的最小地址块是 `/29`，即 8 个 IP，其中除去第一个 IP 标记地址块，最后一个 IP 作为地址块内广播（broadcast）不可用意外，可以分给 6 个服务器和设备。
      - 如果你满足下列一项，那么 `/29` 不够你用，需要申请更大的地址块：
        - 服务器、设备多，超过了 6 个
        - 你准备自己玩些 Anycast 之类的，需要占用更多的 IP
        - 你使用的一些设备（例如 Mikrotik 路由器），在 Peering（对接）阶段建立隧道时，只能使用 `/30` 地址块。
          - 在后续 Peering（对接）阶段，Linux 服务器可以配置单个 IP 到单个 IP 的隧道，例如 `172.22.76.185/32` 到 `172.21.2.3/32`。同时，我这端的地址 `172.22.76.185/32` 可以同时用在多个隧道中，意味着我可以设置任意多的隧道，与任意多的人 Peer，而不需要额外的 IP。
          - 但如果你的设备要求使用 `/30` 地址，意味着一个隧道就需要占用 4 个 IP 地址，并且你这端的地址无法重复使用，比较浪费。
          - 此时你需要预留较多的地址，因为 DN42 内物理路由器较少见，与你对接的另一位一般也没有预留这么多地址，这个 `/30` 地址块需要由你出。
      - DN42 一般建议申请 `/27`，你能直接申请的最大地址块是 `/26`。
      - 如果你的服务器**非常多**，连 `/26` 都不够用，那么：
        - 首先大佬受我一拜；
        - 然后你的注册申请不会立即被同意；
        - 此时你需要去 DN42 的 IRC 频道（服务器地址在[这个页面](https://wiki.dn42.us/services/IRC)可以看到，其中的 public internet 项），或者去 DN42 的邮件列表（地址在[这个页面](https://wiki.dn42.us/contact#contact_mailing-list)的 Mailing list 项），告诉大家你需要更大地址块的理由，请求大家的同意。

      - 选好地址块之后，在 `data/inetnum` 文件夹创建 IPv4 地址对应的文件。例如我的其中一个地址块是 `172.22.76.184/29`，对应的文件就是 `data/inetnum/172.22.76.184_29`：

      - ```bash
        inetnum:            172.22.76.184 - 172.22.76.191
        netname:            LANTIAN-IPV4
        remarks:            Peer with me at b980120@hotmail.com
        descr:              Peer with me at b980120@hotmail.com
        country:            CN
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        nserver:            ns1.lantian.dn42
        nserver:            ns2.lantian.dn42
        status:             ASSIGNED
        cidr:               172.22.76.184/29
        source:             DN42
        ```

      - 各项含义如下：
        - `inetnum`：你的这个地址块的范围，如果你不会算，那么可以根据你的地址块前后的用户推出，或者直接用 [IP 地址计算器](https://ipjisuanqi.com/)。
        - `netname`：你的这个地址块的名称，没什么用，随便取（但一般建议保持 `[昵称]-IPV4` 格式）。
        - `remarks`：简介，随意填写。
        - `descr`：简介，随意填写。
        - `country`：你的国家代号，填 CN 代表中国大陆。
        - `admin-c`：`admin contact（管理员联系信息）`，指向你的 person 文件，`[昵称]-DN42`。
        - `tech-c`：`tech contact（技术员联系信息）`，指向你的 person 文件，`[昵称]-DN42`。
        - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner 文件，`[昵称]-MNT`。
        - `nserver`：IP 地址反向解析的 DNS 服务器。如果你不知道这个是什么，或者不需要这个，可以去掉。
        - `status`：固定为 `ASSIGNED`。
        - `cidr`：你的地址块的范围，与 `inetnum` 相同，只是以 CIDR 方式表示。
        - `source`：固定为 `DN42`。

   5. 注册 IP 的过程还没结束，你还需要创建一个 route 对象，授权某个 AS 使用这个地址。在 `data/route` 文件夹创建对应文件，例如我的是 `data/route/172.22.76.184_29`：

      - ```bash
        route:              172.22.76.184/29
        descr:              Peer with me at b980120@hotmail.com
        origin:             AS4242422547
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

      - 各项含义如下：
        - `route`：你的这个地址块的范围。
        - `descr`：简介，随意填写。
        - `origin`：你授权哪个 AS 使用这个地址块，填写你的 AS 编号。
        - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner 文件，`[昵称]-MNT`。
        - `source`：固定为 `DN42`。

   6. 鉴于今年是 2020 年，你最好再注册一个 IPv6 的地址块，在 `data/inet6num` 中创建文件。

      - DN42 的 IPv6 地址在 `fd00::/8` 范围，位于私有 IPv6 地址段。
      - DN42 内 IPv6 地址块一般只以 `/48` 的大小存在，足够任何人使用。
        - 即使你的路由器要求 IPv6 隧道以 `/64` 的单位存在，一个 `/48` 内还可以划出 `2 ^ 16 = 65536` 个 `/64`，足够你对接完 DN42 内的所有人。
      - 你可能想自定义你的地址块的前缀，写一些 19260817 之类的内容进去。但 DN42 对于这样做的态度不一：有些人成功通过了注册，而有些人被拒绝了。
        - 这是因为 DN42 与一些性质类似的网络形成了相互 Peer（对接）的关系，与它们公用 IPv6 ULA 的地址段。由于 DN42 拿不到其它网络的完整地址分配信息，就要求所有人尽量随机生成 IPv6 前缀，避免后续产生冲突。
      - 最好的选择是随机生成一个地址块。你可以使用一些[随机生成前缀的工具](https://simpledns.plus/private-ipv6)。

      - 生成完地址块后，类似的在 `data/inet6num` 中创建文件，例如我的地址块是 `fdbc:f9dc:67ad::/48`，文件名就是 `data/inet6num/fdbc:f9dc:67ad::_48`：

      - ```bash
        inet6num:           fdbc:f9dc:67ad:0000:0000:0000:0000:0000 - fdbc:f9dc:67ad:ffff:ffff:ffff:ffff:ffff
        netname:            LANTIAN-IPV6
        descr:              Peer with me at b980120@hotmail.com
        country:            CN
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        nserver:            ns1.lantian.dn42
        nserver:            ns2.lantian.dn42
        status:             ASSIGNED
        cidr:               fdbc:f9dc:67ad::/48
        source:             DN42
        ```

      - 各项含义如下：
        - `inet6num`：你的这个地址块的范围。IPv6 的范围算起来很简单，从全 0 到全 f。
        - `netname`：你的这个地址块的名称，没什么用，随便取（但一般建议保持 `[昵称]-IPV6` 格式）。
        - `remarks`：简介，随意填写。
        - `descr`：简介，随意填写。
        - `country`：你的国家代号，填 CN 代表中国大陆。
        - `admin-c`：`admin contact（管理员联系信息）`，指向你的 person 文件，`[昵称]-DN42`。
        - `tech-c`：`tech contact（技术员联系信息）`，指向你的 person 文件，`[昵称]-DN42`。
        - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner 文件，`[昵称]-MNT`。
        - `nserver`：IP 地址反向解析的 DNS 服务器。如果你不知道这个是什么，或者不需要这个，可以去掉。
        - `status`：固定为 `ASSIGNED`。
        - `cidr`：你的地址块的范围，与 `inetnum` 相同，只是以 CIDR 方式表示。
        - `source`：固定为 `DN42`。

   7. 然后在 `data/route6` 创建一个 route6 对象，授权你自己的 AS 使用这个 IP 段，例如我的是 `data/route6/fdbc:f9dc:67ad::_48`：

      - ```bash
        route6:             fdbc:f9dc:67ad::/48
        descr:              Peer with me at b980120@hotmail.com
        origin:             AS4242422547
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

      - 各项含义如下：
        - `route6`：你的这个地址块的范围。
        - `descr`：简介，随意填写。
        - `origin`：你授权哪个 AS 使用这个地址块，填写你的 AS 编号。
        - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner 文件，`[昵称]-MNT`。
        - `source`：固定为 `DN42`。

5. 恭喜你创建完了所有需要的文件，接下来执行一次 `git add`，然后执行 `git commit -S`，使用你先前创建的 GPG 密钥，创建一份**带 GPG 签名的 commit**，这是 DN42 的强制要求。
   - 如果你操作快已经 commit 完了，你可以执行 `git commit --amend -S` 修改之前的 commit，将其签名。
6. 执行 `git push` 将修改上传到 Git 服务器。
7. 回到 [dn42/registry](https://git.dn42.us/dn42/registry)，发起 Pull Request，等待你的信息被合并。
   - 如果你的操作或者填写的内容有问题，管理员会回复你的 Pull Request，根据他们的要求修改即可。

在你的信息被合并之后，你就正式获得了自己的地址块，接下来就可以开始找人 Peer 了。

寻找 Peer 的节点
--------------

由于 DN42 是一个去中心化的网络，并没有一个官方服务器供你直接接入。你需要去联系其它和你一样在 DN42 注册的用户，建立隧道连接和 BGP 会话，从而建立 Peering。

以下推荐几个找到其它用户的方法：

1. 使用 [DN42 PingFinder](https://dn42.us/peers)。在这里提交你的 IP 地址，其它在 PingFinder 上注册的用户的服务器会测试与你的延迟。这些用户也会留下自己的邮箱，或者自己的 DN42 AS 信息的介绍页面，后续可以根据这些信息去联系他们。
2. 去 DN42 的 [IRC 频道](https://wiki.dn42.us/services/IRC)
3. 去这个[非官方 Telegram 群组](https://t.me/Dn42Chat)找人 Peer。
4. 直接去找 Burble。Burble 是 DN42 网络中一个非常活跃的用户，同时在全球各地都有节点。打开[他的 Peering 信息页面](https://dn42.burble.com/peering)，就可以看到他的服务器信息和联系方式。
5. 直接找我。点击[这个地方](/page/dn42/index.html)或者点击顶部导航栏的 DN42 项目，就可以看到我的服务器信息和联系方式。

注意你可以同时找很多个人 Peer，这可以增加你网络的稳定性，避免某个节点临时故障导致你和 DN42 完全失联。

选择几个离你的服务器近、延迟低的节点，然后继续往下看。

非常重要的系统配置
===============

- 首先，**千万 一定 绝对** 要打开 Linux 内核的数据包转发功能，即 `ip_forwarding`。
  - 在 DN42 内，没有绝对意义上的客户端，每个人的服务器都是其它人的路由器，都可能需要转发数据包。具体步骤如下：

  - ```bash
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
    echo "net.ipv6.conf.default.forwarding=1" >> /etc/sysctl.conf
    echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.conf
    sysctl -p
    ```

  - 同时，如果你配置过 `iptables` 等防火墙软件，请检查相关配置，确保放行数据包的转发。
- 然后，**千万 一定 绝对** 要关闭 Linux 内核的 `rp_filter` 功能，具体步骤如下：

  - ```bash
    echo "net.ipv4.conf.default.rp_filter=0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.rp_filter=0" >> /etc/sysctl.conf
    sysctl -p
    ```

  - `rp_filter` 是 Linux 内核针对网络的一项网络安全保护功能，对于数据包的来源地址和来源网络界面（网卡）进行检查：
    - 如果设置为 0（即禁用），放行所有数据包。
    - 如果设置为 1（严格模式），如果数据包来源网卡不是发送这个数据包的最优网卡（也就是如果你本机要回复这个地址的话，会选择一张不同的网卡），就把这个数据包**丢掉**。
      - 来源和回复在不同网卡是 DN42 内**非常常见的情况**，因此 **千万 一定 绝对** 不能把 `rp_filter` 设置成 1！
    - 如果设置为 2（宽松模式），如果数据包来源地址不在路由表内（也就是本机不知道要怎么回复这个地址），就把这个数据包丢掉。
      - 理论上 `rp_filter` 设置成 2 也可以，但因为我的所有节点都设置成 0，所以我没有测试过。

- 另外，如果你有多台 VPS 准备一同加入 DN42，放在同一个 ASN 下，**千万 一定 绝对** 要在几台 VPS 之间两两搭好隧道并设置好 BGP，步骤和普通 Peering 相同。
  - 你的 AS 外部的路由只负责把数据包发送进你的 AS，数据包可能从任何一个节点进入。你自己的节点需要负责在内部将数据包转发给目标节点。

选择你的隧道软件
-------------

DN42 中几乎每个 Peering 都是建立在隧道软件（即 VPN）之上的，原因如下：

- DN42 各个用户的节点分布在世界各地，隧道软件可以对数据进行基本的加密和保护；
- DN42 使用的是私有地址，如果直接在互联网上传输，会被防火墙直接丢弃，甚至可能会被主机商认为你在 `IP Spoofing`（伪造来源 IP 地址），违反服务条款，造成严重后果。

但有一部分例外情况存在，例如：

- 两个节点处在同一个内网中，可以直接通过内网联通。
  - 典型例子是经典网络的阿里云服务器，或者一些 NAT VPS。

对于隧道软件的推荐如下：

1. 如果你用的是 Linux 系统的 VPS 或独立服务器，并且你的 VPS 不是 OpenVZ 或者 LXC 虚拟化的，那么推荐使用 WireGuard。
   - WireGuard 的优点在于：
     - 配置极其简单
     - 占用资源少
     - 安全性不错
   - WireGuard 的缺点：
     - 功能少，只能点对点连接
     - 需要内核驱动支持
     - 是 L3 层隧道，难以进行桥接等操作
   - 如果你用的是 OpenVZ 或者 LXC 的 VPS，不建议使用 `wireguard-go` 代替内核驱动，该软件更新较慢且据其它用户称有稳定性问题。
   - 安装方式，以 Debian 10 (Buster) 为例：
     - 首先加入 Debian Unstable 的软件源：
       - 编辑 `/etc/apt/sources.list`，添加：

       - ```bash
         deb http://deb.debian.org/debian/ unstable main contrib non-free
         deb-src http://deb.debian.org/debian/ unstable main contrib non-free
         ```

     - 然后限制 Unstable 软件源的使用范围，避免把整个系统升级到 Unstable：
       - 添加文件 `/etc/apt/preferences.d/limit-unstable`：

       - ```bash
         Package: *
         Pin: release a=unstable
         Pin-Priority: 90
         ```

       - 添加文件 `/etc/apt/preferences.d/allow-unstable`：

       - ```bash
         Package: wireguard*
         Pin: release a=unstable
         Pin-Priority: 900
         ```

     - 然后使用 DKMS 安装 WireGuard 的内核驱动和管理工具：
       - `sudo apt update`
       - `sudo apt install wireguard-tools wireguard-dkms`

2. 如果你用的是 OpenVZ 或者 LXC 的 VPS，推荐使用 OpenVPN。
   - OpenVPN 的优点：
     - 极其广泛的使用
     - 配置教程一大堆
     - 无需内核驱动支持
     - L2、L3 层可选
   - OpenVPN 的缺点：
     - 配置有点复杂
     - 安全性不如 WireGuard
   - 安装方式：`sudo apt install openvpn supervisor`
   - 此处 Supervisor 用于进程管理。

3. 如果你用的是 Cisco、Mikrotik 等公司的硬件路由器，你一般只能使用 GRE/IPSec 或者 GRE；推荐带加密的 GRE/IPSec。
   - GRE/IPSec 的优点：
     - 在硬件路由器上使用广泛
   - GRE/IPSec 的缺点：
     - 配置复杂，往往需要双方反复交流才能配置完成

4. 或者你也可以使用纯 GRE：
   - GRE 的优点：
     - 配置相对简便
   - GRE 的缺点：
     - 完全没有加密！数据明文可读！
     - 完全没有加密！数据明文可读！
     - 完全没有加密！数据明文可读！

5. 如果你用的是 Linux 服务器，也可以选择 ZeroTier One。
   - ZeroTier One 的优点：
     - 直观的网页管理面板
     - 全自动的 IP 地址分配
   - ZeroTier One 的缺点：
     - 有时会占用大量 CPU 和内存
     - DN42 内接受程度不高
   - 安装方式：`curl -s https://install.zerotier.com | sudo bash`

选择你的 BGP 软件
---------------

DN42 中的用户之间使用 BGP 协议来交换路由信息。以下是常用的、支持 BGP 协议的路由软件：

1. BIRD Internet Routing Daemon **(v2)**
   - 支持 BGP、OSPF、RIP 等多种路由协议
   - 同时支持 IPv4 和 IPv6
   - 配置清晰明了，功能强大
   - 注意：此处指 BIRD2，即第二版本；与第一版本不兼容。
   - 由于 BIRD 配置较复杂，请直接参见 [DN42 Wiki 上的 Bird2 配置教程](https://wiki.dn42.us/howto/Bird2)，有现成的配置可以直接复制粘贴。
2. BIRD Internet Routing Daemon **(v1)**
   - 相比 v2，将 IPv4 与 IPv6 分到了两个进程
   - 参见 [DN42 Wiki 上的 Bird1 配置教程](https://wiki.dn42.us/howto/Bird)，有现成的配置可以直接复制粘贴。
3. Quagga / FRRouting
   - 配置语法接近 Cisco 路由器，如果你用过硬件路由器可能会喜欢
   - 某些软路由系统（例如 pfSense）只有 FRRouting 可选
   - 参见 [DN42 Wiki 上的 Quagga 配置教程](https://wiki.dn42.us/howto/Quagga)
4. 硬件路由器自带的 BGP 功能
   - 由路由器厂商提供技术支持，一般非常稳定
   - 但是 BGP 的一些扩展功能可能受到厂商限制
   - 同时每台路由器的配置方式都不同，你很可能得自己研究了

“1xRTT Peering”：更快速的对接
---------------------------

DN42 中多数用户处在美国或者欧洲，当我们从中国与他们联系时，受时差影响双方一轮通信时间可能会很长。因此，我们应根据对方在自己网站上公开的信息尽可能完整地配置自己一侧，方便对方的调试，也减少反复通信的时间消耗。

我在我的 [DN42 信息页面](/page/dn42/index.html)提供了一个列表，包括了我在配置与你的隧道和 BGP 会话时，你应该执行哪些步骤，我需要哪些信息。

我的配置没有什么特异之处，当你与其他用户建立隧道与 BGP 时，其他用户也需要同样的信息。因此，我建议你完整地按照以下步骤操作，提供完整的信息。

在此，我将步骤列表复制一遍：

1. 从下面的列表中选择一个服务器。一般你应该选择到你那边延迟（Ping）最低的服务器。
   - 如果你有多台服务器加入 DN42，并且愿意的话，我可以同时建立多个 Peering。
2. 选择一种 VPN 建立隧道。
   - 我偏好使用 WireGuard 和 OpenVPN，但 GRE/IPSec，明文 GRE 和 ZeroTier One 也可以。
   - 我也愿意尝试其它种类的 VPN，只要你询问就可以了。
3. 在你那边配置好 VPN 隧道和 BGP 客户端。你可以假设我会使用以下的配置：
   - 基础信息：
     - ASN：**4242422547**
     - 公网 IP：见以下列表
     - DN42 IPv4（隧道我这端的地址）：见以下列表
       - 如果你需要为隧道设置一个地址块（例如 /30），这个地址块将来自你的地址池（由你分配给我）。
       - 以上设置常见于 Mikrotik 等硬件路由器。
     - DN42 IPv6: **fe80::2547**，用于本地链路（Link-local）连接
       - 如果你需要为隧道设置一个地址块（例如 /64），这个地址块将来自你的地址池（由你分配给我）。
   - 建立 VPN 隧道：
     - WireGuard/OpenVPN 我这端的端口号：**你的 ASN 的后五位**
       - 例如 4242420001 意味着我会使用 20001 端口
     - OpenVPN 预共享密钥：你来生成，之后发送给我
     - GRE/IPSec 公钥：见以下列表
     - OpenVPN/IPSec 默认设置：见下
       - 如果你无法使用我的默认参数，请设置好你可以接受的参数，然后发送给我。
     - ZeroTier One：我会申请加入你的网络
       - 如果可以的话，你可以尝试发送加入网络的邀请。
4. 将以下信息发邮件给 **b980120@hotmail.com**:
   - 基础信息：
     - ASN
     - 公网 IP
       - 我偏好 IPv4 地址，因为在我的一些服务器上，IPv6 是由隧道提供的（即 HE.NET Tunnelbroker）
     - DN42 IPv4 and IPv6（隧道你那端的地址）
       - 或者地址块，如果你需要的话
       - 对于 IPv6 Peering，需要包括本地链路（Link-local）地址
     - 你想和哪台服务器连接
   - 建立 VPN 隧道：
     - WireGuard/OpenVPN 你那端的端口号
       - 如果你不写明，我会假设你使用 22547 端口
     - OpenVPN 预共享密钥：由你生成
     - GRE/IPSec 公钥
     - ZeroTier One：你的网络 ID（我会申请加入）
     - OpenVPN/IPSec 设置参数（如果你无法使用我的默认参数）
5. 等我设置好 VPN 隧道和 Peering，然后回复邮件。一般这时 Peering 就已经成功了。
   - 你可以使用[我的 looking glass](https://lg.lantian.pub/) 或者[我的另一个 looking glass](https://lg-alt.lantian.pub/) 来调试连接。

隧道搭建：WireGuard
-----------------

DN42 Wiki 有 WireGuard 的配置步骤，我在此进行少许修改以使其简单明了。

首先运行 `wg genkey | tee privatekey | wg pubkey > publickey` 产生一对公钥和私钥，这是 WireGuard 隧道中双方的唯一认证方式，务必保管好不要泄漏。

然后创建一个配置文件 `[PEER_NAME].conf`：

```bash
[Interface]
PrivateKey = [MY_PRIVATE_KEY]
ListenPort = [LAST_5_DIGITS_OF_YOUR_ASN]

[Peer]
PublicKey = [YOUR_PUBLIC_KEY]
Endpoint = [YOUR_IP]:[LAST_5_DIGITS_OF_MY_ASN]
AllowedIPs = 0.0.0.0/0,::/0
```

然后创建一个脚本 `[PEER_NAME].sh`，随后 `chmod +x [PEER_NAME].sh && ./[PEER_NAME].sh` 执行：

```bash
#/bin/sh
ip link add dev dn42-[PEER_NAME] type wireguard
wg setconf dn42-[PEER_NAME] [PEER_NAME].conf
ip addr add [MY_LINK_LOCAL_IP]/64 dev dn42-[PEER_NAME]
ip addr add [MY_DN42_IP] peer [YOUR_DN42_IP] dev dn42-[PEER_NAME]
ip link set dn42-[PEER_NAME] up
```

- MY 指的是你自己，而 YOUR 指的是你将要 Peer 的那个人。
- YOUR_IP 和 MY_IP 指双方的公网 IP。
- 端口选择方面，目前多数人默认使用对方 ASN 的后五位作为端口号。
  - 例如我（4242422547）和一个人（4242420001）建立隧道，我会使用 20001 端口，对方会使用 22547 端口。
  - 这种方法容易记忆、管理，并且不会重复。
  - 但如果你是公网 ASN 大佬，后 5 位就有可能和别人产生冲突。你就需要和别人协商决定使用哪一个端口。
- PEER_NAME 是对方的昵称，这里设置的是 Linux 下的网络设备名。注意整个网络设备名不能超过 15 个字符，否则会被截断。
- MY_DN42_IP 和 YOUR_DN42_IP 指双方在 DN42 内的 IP，具体而言指的是对接的这台服务器的 IP。
  - 例如我用服务器 A（172.22.76.185）去对接，MY_DN42_IP 就是 172.22.76.185；我换另一台服务器 B（172.22.76.186）对接，MY_DN42_IP 就是 172.22.76.186。
- MY_LINK_LOCAL_IP 用于交换 IPv6 路由，在 `fe80::/64` 段中任意选择，多台服务器可以重复（不会出大问题）。
  - 例如我的服务器 MY_LINK_LOCAL_IP 统一为 `fe80::2547`。
- STATIC_KEY 是 OpenVPN 使用的静态密钥，在 DN42 内很少有人会去建立一个 CA 给 OpenVPN，然后给每个 Peer 分发证书。
  - 使用 `openvpn --genkey --secret static.key` 生成。

隧道搭建：OpenVPN
----------------

DN42 Wiki 同样提供了 OpenVPN 的配置模板，我在此进行少许修改以使其简单明了，如下：

```bash
proto         udp
mode          p2p
remote        [YOUR_IP]
rport         [LAST_5_DIGITS_OF_MY_ASN]
local         [MY_IP]
lport         [LAST_5_DIGITS_OF_YOUR_ASN]
dev-type      tun
resolv-retry  infinite
dev           dn42-[PEER_NAME]
comp-lzo
persist-key
persist-tun
tun-ipv6
cipher        aes-256-cbc
ifconfig      [MY_DN42_IP] [YOUR_DN42_IP]
ifconfig-ipv6 [MY_LINK_LOCAL_IP] [YOUR_LINK_LOCAL_IP]
<secret>[STATIC_KEY]</secret>
```

在建立 OpenVPN 隧道时，绝大多数人都是直接照抄 Wiki 的模板的，因此把你的信息替换进去就可以了：

- MY 指的是你自己，而 YOUR 指的是你将要 Peer 的那个人。
- YOUR_IP 和 MY_IP 指双方的公网 IP。
- 端口选择方面，目前多数人默认使用对方 ASN 的后五位作为端口号。
  - 例如我（4242422547）和一个人（4242420001）建立隧道，我会使用 20001 端口，对方会使用 22547 端口。
  - 这种方法容易记忆、管理，并且不会重复。
  - 但如果你是公网 ASN 大佬，后 5 位就有可能和别人产生冲突。你就需要和别人协商决定使用哪一个端口。
- PEER_NAME 是对方的昵称，这里设置的是 Linux 下的网络设备名。注意整个网络设备名不能超过 15 个字符，否则会被截断。
- MY_DN42_IP 和 YOUR_DN42_IP 指双方在 DN42 内的 IP，具体而言指的是对接的这台服务器的 IP。
  - 例如我用服务器 A（172.22.76.185）去对接，MY_DN42_IP 就是 172.22.76.185；我换另一台服务器 B（172.22.76.186）对接，MY_DN42_IP 就是 172.22.76.186。
- MY_LINK_LOCAL_IP 用于交换 IPv6 路由，在 `fe80::/64` 段中任意选择，多台服务器可以重复（不会出大问题）。
  - 例如我的服务器 MY_LINK_LOCAL_IP 统一为 `fe80::2547`。
- STATIC_KEY 是 OpenVPN 使用的静态密钥，在 DN42 内很少有人会去建立一个 CA 给 OpenVPN，然后给每个 Peer 分发证书。
  - 使用 `openvpn --genkey --secret static.key` 生成。

BGP 会话配置：BIRD v1 和 v2
-------------------------

我这里只介绍 BIRD v1 和 v2 的配置，因为它们是使用最广泛的。我假设你已经按照 Wiki 上的步骤完成了基本的配置，只是还没接入任何 Peer。

对于 BIRD v1，需要的配置如下：

```bash
# 在 /etc/bird/peers4/[PEER_NAME].conf 中填写：
protocol bgp dn42_[PEER_NAME] from dnpeers {
    neighbor [YOUR_DN42_IP] as [YOUR_ASN];
    direct;
};

# 在 /etc/bird/peers6/[PEER_NAME].conf 中填写：
protocol bgp dn42_[PEER_NAME] from dnpeers {
    neighbor [YOUR_LINK_LOCAL_IP] % 'dn42-[PEER_NAME]' as [YOUR_ASN];
    direct;
};
```

对于 BIRD v2，配置如下：

```bash
# 在 /etc/bird/peers4/[PEER_NAME].conf 中填写：
protocol bgp dn42_[PEER_NAME]_v4 from dnpeers {
    neighbor [YOUR_DN42_IP] as [YOUR_ASN];
    direct;
    ipv6 {
        import none;
        export none;
    };
};

# 在 /etc/bird/peers6/[PEER_NAME].conf 中填写：
protocol bgp dn42_[PEER_NAME]_v6 from dnpeers {
    neighbor [YOUR_LINK_LOCAL_IP] % 'dn42-[PEER_NAME]' as [YOUR_ASN];
    direct;
    ipv4 {
        import none;
        export none;
    };
};
```

- MY 指的是你自己，而 YOUR 指的是你将要 Peer 的那个人。
- BIRD 中配置的是 DN42 内的 IP 而非公网 IP。
- 相比 DN42 Wiki 上的配置，我加了一行 `direct;`，原因是我发现如果缺少这行，路由信息有可能无法被正确的导入系统路由表。
- PEER_NAME 是对方的昵称，这里设置的是 Linux 下的网络设备名，与隧道保持一致。注意整个网络设备名不能超过 15 个字符，否则会被截断。
- 在 IPv6 Peering 时，我推荐使用 Link-local IP。直接使用对方整个节点的 IPv6 地址（指 `fd00::/8` 范围中的那个）可能会造成路由信息上的问题。
- 在 BIRDv2 中，你需要在 IPv4 BGP 会话中禁用 IPv6 的路由传递，在 IPv6 中亦然。原因是 BIRDv2 支持在一个 BGP 会话中同时传递 IPv4 和 IPv6 的路由。这里不禁用会造成诡异的问题！

网络测试及几个加分项
-----------------

上述配置完后，你就已经成功接入了 DN42 网络。此时，你可以进行一些测试：

- `ping 172.20.0.53`，这个地址是 DN42 网络内的 Anycast DNS。
- `ping 172.23.0.80`，这是 DN42 Wiki 在内部的 IP 地址。
- 尝试 [DN42 Wiki 上的内部服务](https://wiki.dn42.us/internal/Internal-Services)，或者 [Burble 的服务](https://dn42.burble.com/home/burble-dn42-services)。

你也可以挑战自己，继续修改你的隧道和 BGP 配置，添加更多功能，提高性能和/或安全性：

- ROA，即 Route Origin Authorization，指检查某条路由信息是否来自于该来的 AS，例如我的 `172.22.76.184/29` 就应当来自 `4242422547`，并拒绝不符合的路由信息。
  - DN42 Wiki 中有 BIRD 的 ROA 配置教程：见 [Bird2](https://wiki.dn42.us/howto/Bird2) 或者 [Bird1](https://wiki.dn42.us/howto/Bird)
- Community Filter，将 DN42 中的隧道链路按延迟、带宽、加密分成不同等级，优先选择更快速的路由
  - Bird1 参见 [DN42 Wiki 的 Bird Communities 页面](https://wiki.dn42.us/howto/Bird-communities)。Bird2 需要对这个配置做较大幅度的修改，可以自己尝试
- Anycast，指多台服务器同时广播一个 IP，外界访问会被导到最近的服务器上
  - 在真实互联网一般用于 DNS。在 DN42 内，Wiki（172.23.0.80）也是 Anycast 的。
  - 我在去年和今年各就此写过一篇文章：参见《[在 DN42 中使用 Docker 建立 Anycast DNS 服务](/article/modify-website/dn42-docker-anycast-dns.lantian)》和《[Docker 容器共享网络命名空间，集成 Bird 实现 Anycast 高可用](/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian)》。
- 建立自己的递归和权威 DNS 服务器
  - 你甚至可以申请加入 DN42 的 DNS Anycast，成为官方 DNS 中的一分子。
- 注册一个域名，建立网站
  - 参见我在 2018 年写的文章：《[在 DN42 中注册自己的域名](/article/modify-website/register-own-domain-in-dn42.lantian/#%E5%9C%A8-dn42-%E6%B3%A8%E5%86%8C%E5%9F%9F%E5%90%8D)》
- 或者直接在真实互联网中，找 RIPE 注册真实的 AS，租用公网的 IPv4 和 IPv6 地址池，开始玩真的。

需要帮助？
---------

记住：DN42 是一个**测试网络**，所有人都在帮助所有人。即使你不小心搞砸了，也没有人会指责你。你可以在 DN42 的 [IRC 频道](https://wiki.dn42.us/services/IRC)，[邮件列表](https://wiki.dn42.us/contact#contact_mailing-list)或者[非官方 Telegram 群组](https://t.me/Dn42Chat)寻求帮助。
