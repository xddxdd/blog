---
title: 'DN42 实验网络介绍及注册教程（2022-12 更新）'
categories: 网站与服务端
tags: [DN42, BGP]
date: 2021-05-02 12:21:45
---

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的
VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规
避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大
量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的
网络环境。

简而言之，DN42：

-   不适合单纯想要保护隐私、规避网络审查的用户
-   不适合在网内消耗大量流量，例如用于解锁流媒体服务的用户
-   适合想要研究网络技术，练习服务器、路由器等网络设备配置，甚至后续在真实互联网
    建立 AS 的用户
-   适合拥有真实 AS，但担心自
    己[配置错误广播出错误路由、干掉半个互联网](https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/)，
    希望有个地方测试的用户。

正因为此，使用 DN42 的门槛比较高。就像在真实互联网中一样，你要扮演一个 ISP（互联
网服务提供商），注册自己的个人信息，ASN 号码，IPv4 和 IPv6 的地址池，并且使用
BGP 在自己的服务器上广播它们。你还要和其它的用户联系，和他们做 Peering（对接），
一步步进入完整的 DN42 网络。

> 请注意：建立中国大陆到中国大陆以外的跨境 VPN 连接可能违反法律。请自行衡量其中
> 的风险。
>
> 我的所有 DN42 节点都在中国大陆以外。因此，我不与中国大陆的服务器 Peer，以避免
> 可能的法律问题。

DN42 在 172.20.0.0/14 和 fd00::/8 上运行，而这两个 IP 段都是分配给内网使用的。换
句话说，你在 DN42 上怎么折腾，都不会影响到服务器其它的互联网连接。

## 本文更新日志

-   2022-12：添加使用空闲 IPv4 地址块查找工具的内容。
-   2022-06：更新最新的注册流程。
-   2022-02：更新 `rp_filter` 相关内容，不要使用 `rp_filter=2`！
-   2021-06：提升一些配置文件的易读性，区分 `contact` 和 `e-mail`。
-   2021-05：添加《能力需求》一节；添加 iptables 防火墙配置。
-   2020-12：修正 BIRDv2 Peer 配置文件的路径。
-   2020-10：不再推荐添加 Debian Unstable 软件源安装 WireGuard（有更好的方法
    了）；推荐在 Windows 上使用 WSL 完成操作。
-   2020-09：更新最新的注册流程。
-   2020-08：由于 Burble 修改了他的 Peer 标准，不再向新用户推荐与他 Peer。
-   2020-07：DN42 Git 服务器地址从 `git.dn42.us` 更换成 `git.dn42.dev`。
-   2020-05：更新 `rp_filter` 相关内容，添加“关闭 UFW”的建议。
-   2020-04：添加内网配置的建议，“不要占用太多资源”的请求；更详细地解释一些配置
    选项。
-   2020-03：解释自选 IPv6 ULA 地址的风险；添加《非常重要的系统配置》一节；添加
    生成 GPG 密钥，签名 Git Commit 的相关内容。

## 能力需求

本文假定你已经学会以下内容：

1. 你有一个 Linux 环境（双系统/虚拟机/VPS 都可以）。
2. 你知道如何使用常见的 Linux 命令（例如 `cd`，`ls` 等），知道在你的 Linux 上安
   装软件包（`apt`，`yum` 等），以及会使用至少一个编辑器（图形化的
   `gedit`、`vscode`，或者命令行的 `vim`、`nano` 都可以）。如果你不会，建议先阅
   读[这份教程](https://www.runoob.com/linux/linux-tutorial.html)。
3. 你知道 Git 版本管理工具的基本命令，例如 push/pull/commit。如果你不会，建议先
   阅读[这份教程](https://www.liaoxuefeng.com/wiki/896043488029600)。
4. 你有一定程度的网络知识，知道 IP、MAC 地址是什么，知道交换机、路由器的工作原
   理，会在 Linux 下进行基本的网络调试（`ping`，`traceroute` 等），听说过
   BGP/OSPF 等动态路由协议。如果你不会，建议先阅
   读[这份大纲](https://www.cnblogs.com/whenyd/p/8440843.html)，并搜索大纲中提到
   的关键词学习相关知识。
5. 你有基本的英语阅读能力（用翻译软件也可以）。

如果你不具备这些知识，你很有可能无法理解教程中的重要内容，从而在配置过程中出现错
误，给 DN42 内的其他用户造成麻烦。

## 注册过程

在我写下原先（2017 年）的
《[加入 DN42 实验网络](/article/modify-website/join-dn42-experimental-network.lantian)》
时，DN42 的账户、ASN、IP 等信息均由一个名为 Monotone 的系统完成。但是在 2018
年，DN42 放弃了 Monotone 系统，改用 Git 管理所有的信息。

**预先警告：**DN42 的注册流程比较繁琐，需要花费较多的时间。这是因为真实互联网中
申请 ASN 和 IP 的流程也是相似的，而 DN42 的目标就是对真实互联网的尽可能真实的模
拟。

**请注意：**

-   这里的注册流程随时可能因 DN42 的流程变动而过时。请优先参照 DN42 的官方注册流
    程，并将以下流程当作参考。
-   [DN42 官方 Wiki 的注册流程](https://dn42.dev/howto/Getting-Started)
-   [DN42 官方 Wiki 的 Git 操作流程（创建 Pull Request）](https://git.dn42.dev/dn42/registry/src/branch/master/README.md)

另外，由于注册流程中需要用到大量的 UNIX 工具，例如 Git、GnuPG 等：

-   最好使用 Linux 或 macOS 完成整个流程。
-   如果你使用 Windows，建议使用
    [Windows 的 Linux 子系统（WSL）](https://docs.microsoft.com/zh-cn/windows/wsl/install-win10)。

大致注册流程如下：

1. 首先去 [https://git.dn42.dev](https://git.dn42.dev) 注册一个账户，这相当于
   DN42 内的 GitHub，账户信息就存放在其中的一个仓库里。
2. 打开 [dn42/registry](https://git.dn42.dev/dn42/registry) 这个账户信息仓库，点
   右上角的 Fork，把仓库复制一份到你自己的账户。
    - 以前你可以直接在这个仓库里直接建一个分支，但现在你需要把仓库 Fork 一份，就
      像在 GitHub 等网站上提交变更一样。
3. 此时你应该已经进入了你自己账户里的那份复制，把它 Clone 下来。

4. 在 Clone 下的仓库里创建一系列的文件，包括：

    1. 在 `data/mntner` 文件夹下创建一个名为 `[昵称]-MNT` 的文件，这个文件代表你
       的账户，用来认证你以后的操作。例如我的 mntner 文件如下（也可以在
       `data/mntner/LANTIAN-MNT` 看到）：

        {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供参
        考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。code1|我确
        认我已阅读以上内容，查看代码。 {% endinteractive_buttons %}

        {% interactive code1 %}

        ```bash
        mntner:             LANTIAN-MNT
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        source:             DN42
        auth:               pgp-fingerprint 23067C13B6AEBDD7C0BB567327F31700E751EC22
        auth:               ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCulLscvKjEeroKdPE207W10MbZ3+ZYzWn34EnVeIG0GzfZ3zkjQJVfXFahu97P68Tw++N6zIk7htGic9SouQuAH8+8kzTB8/55Yjwp7W3bmqL7heTmznRmKehtKg6RVgcpvFfciyxQXV/bzOkyO+xKdmEw+fs92JLUFjd/rbUfVnhJKmrfnohdvKBfgA27szHOzLlESeOJf3PuXV7BLge1B+cO8TJMJXv8iG8P5Uu8UCr857HnfDyrJS82K541Scph3j+NXFBcELb2JSZcWeNJRVacIH3RzgLvp5NuWPBCt6KET1CCJZLsrcajyonkA5TqNhzumIYtUimEnAPoH51hoUD1BaL4wh2DRxqCWOoXn0HMrRmwx65nvWae6+C/7l1rFkWLBir4ABQiKoUb/MrNvoXb+Qw/ZRo6hVCL5rvlvFd35UF0/9wNu1nzZRSs9os2WLBMt00A4qgaU2/ux7G6KApb7shz1TXxkN1k+/EKkxPj/sQuXNvO6Bfxww1xEWFywMNZ8nswpSq/4Ml6nniS2OpkZVM2SQV1q/VdLEKYPrObtp2NgneQ4lzHmAa5MGnUCckES+qOrXFZAcpI126nv1uDXqA2aytN6WHGfN50K05MZ+jA8OM9CWFWIcglnT+rr3l+TI/FLAjE13t6fMTYlBH0C8q+RnQDiIncNwyidQ==
        remarks:            pin-sha256:o1lfYvcdcYy81UIuZMZO1CkCLX+vJOdD5GLw1cmeStU=
        ```

        {% endinteractive %}

        - 其中各项的含义如下：

            - `mntner`：即 `maintainer（维护者）`，说明这个账户的名称，与文件名
              相同。
            - `admin-c`：即 `admin contact（管理员联系信息）`，需要指向后续创建
              的 person 文件，一般为 `[昵称]-DN42`。
            - `tech-c`：即 `tech contact（技术员联系信息）`，需要指向后续创建的
              person 文件，一般也为 `[昵称]-DN42`。
            - `mnt-by`：即 `maintain by（由谁维护）`，指向这个账户本身，一般为
              `[昵称]-MNT`。
            - `source`：固定为 `DN42`。
            - `auth`：你的个人认证信息。一般接受两种类型：GPG 公钥和 SSH 公钥。

                - 你**必须**在 GPG 公钥和 SSH 公钥中添加至少一种。
                - 如果你准备添加 GPG 公钥，首先你需要创建一个（如果你之前没有的
                  话），例如参照
                  [GitHub 的这份教程](https://docs.github.com/cn/free-pro-team@latest/github/authenticating-to-github/generating-a-new-gpg-key)操
                  作。后续提交过程也会用到这个公钥。

                    - 你还需要将你的 GPG 公钥上传到公共查询服务器，称为
                      Keyserver。
                    - 上传步骤请参
                      考[阮一峰的这份教程](https://www.ruanyifeng.com/blog/2013/07/gpg.html)，
                      并将 `keyserver` 参数替换成 `hkp://keyserver.ubuntu.com`，
                      例如：

                        - `gpg --keyserver hkp://keyserver.ubuntu.com --send-key [密钥ID]`

                    - 然后将密钥 ID 填写到 `auth` 项中，格式如
                      `pgp-fingerprint [密钥 ID]`，例如上面例子中的
                      `pgp-fingerprint` 项。

                - 如果你准备添加 SSH 公钥，首先你需要创建一个（如果你之前没有的
                  话）。
                    - Mac 和 Linux 一般运行 `ssh-keygen -t ed25519` 即可，但如果
                      你的 SSH 版本特别老不支持 ED25519 密钥，也可以使用
                      RSA，`ssh-keygen -t rsa`。
                    - Windows 可
                      以[下载 PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)，
                      使用其中的 puttygen 工具生成。
                    - 生成完成后，将公钥（Mac 和 Linux 一般在 `~/.ssh` 目录下，
                      名为 `id_ed25519.pub` 或者 `id_rsa.pub`；Windows 下
                      puttygen 会直接在窗口上显示公钥）以 `ssh-ed25519 [公钥]`
                      或者 `ssh-rsa [公钥]` 格式添加到 `auth` 项中。
                    - 此外，DN42 上有些服务会以此处的 SSH 公钥来验证你的身份。
                - 可以阅读 DN42 官方
                  的[身份认证 Wiki 页面](https://dn42.dev/howto/Registry-Authentication)获
                  取更多信息。

            - `remarks`：备注信息，随便填写，也可以没有。

        - **注意：**各个项目的名称和值之间有一长串空格。这段空格的长度**不是自己
          可以随意修改的，也不能替换成 Tab**。名称 + 冒号 + 空格的长度**必须是
          20 个字符**。

    2. 在 `data/person` 文件夹下创建一个 `[昵称]-DN42` 的文件，代表你的个人信
       息。说是个人信息，但其实只需要一个邮箱。例如我的 person 文件如下
       （`data/person/LANTIAN-DN42`）：

        {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供参
        考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。code2|我确
        认我已阅读以上内容，查看代码。 {% endinteractive_buttons %}

        {% interactive code2 %}

        ```bash
        person:             Lan Tian
        e-mail:             b980120@hotmail.com
        contact:            telegram:lantian1998
        nic-hdl:            LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

        {% endinteractive %}

        - 各项含义如下：
            - `person`：你的昵称。
            - `e-mail`：你的邮箱。
            - `contact`：可选，你的其它联系方式，例如 IRC、Telegram 等。
            - `nic-hdl`：`NIC handle`，指向文件本身，与文件名相
              同，`[昵称]-DN42`。
            - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner
              文件，`[昵称]-MNT`。
            - `source`：固定为 `DN42`。

    3. 接下来你要给自己选择一个 AS 编号，即 ASN。在国际互联网上，ASN 范围
       4200000000 - 4294967294 是被保留作私下使用（private use）的，DN42 占用的
       就是其中的一块，424242**0000** - 424242**3999**。**（注意范围是 4000 个，
       不是 10000 个，剩下 6000 个暂未开放注册）** 在这 4000 个号码中挑选一个你
       喜欢的，并且没有被占用的，然后进入 `data/aut-num` 文件夹，创建文件。例如
       我是 AS4242422547, 文件就是 `data/aut-num/AS4242422547`：

        {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供参
        考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。code3|我确
        认我已阅读以上内容，查看代码。 {% endinteractive_buttons %}

        {% interactive code3 %}

        ```bash
        aut-num:            AS4242422547
        as-name:            LANTIAN-AS
        descr:              Peer with me at b980120@hotmail.com
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

        {% endinteractive %}

        - 各项含义如下：
            - `aut-num`：AS 号。
            - `as-name`：AS 的名称，一般只在 DN42 的一些网络结构示意图中看到。可
              以设置为 `[昵称]-AS`。
            - `descr`：AS 简介，一般只在结构图中看到，随意填写。
            - `admin-c`：`admin contact（管理员联系信息）`，指向你的 person 文
              件，`[昵称]-DN42`。
            - `tech-c`：`tech contact（技术员联系信息）`，指向你的 person 文
              件，`[昵称]-DN42`。
            - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner
              文件，`[昵称]-MNT`。
            - `source`：固定为 `DN42`。
        - 如果你在真实互联网拥有自己的 ASN：
            - 首先大佬受我一拜；
            - 然后你**可以选择在 DN42 内使用自己的真实 ASN**，填入你自己的 ASN
              即可。
            - 如果你这样做，你可能会在与其它人 Peer 的时候遇到一点小麻烦：
                - 在建立 VPN 隧道时，DN42 中很多人会使用 ASN 的后五位作为端口
                  号。你的公网 ASN 就有可能和 DN42 的内部 ASN 产生端口冲突。
                - 此时你就需要和对方协商换个端口了。
            - 同时注册时可能会检查 AS 邮箱是否一致等。
                - 我没经历过这个过程，上述是我的猜测。可能还需要更麻烦的验证流
                  程。
            - 因此我一般建议**再在 DN42 注册一个 ASN 算了**，减少麻烦。

    4. 接下来就进入 IP 选择环节了。进入 `data/inetnum` 文件夹，里面是所有已被注
       册的 IPv4 地址块信息。你需要在其中挑选一块空闲的地址块占为己用。

        - DN42 的 IPv4 地址在 `172.20.0.0/14` 范围，即
          `172.20.0.0 - 172.23.255.255`。
            - 但是，有很多 IPv4 地址块是被保留作其它用途的，你不能申请使用。因
              此，
            - **请使用下列工具选择地址块，而非手动在 `data/inetnum` 文件夹中挑
              选**。
            - **请使用下列工具选择地址块，而非手动在 `data/inetnum` 文件夹中挑
              选**。
            - **请使用下列工具选择地址块，而非手动在 `data/inetnum` 文件夹中挑
              选**。
                - <https://explorer.burble.com/free#/4>
                - <https://dn42.us/peers/free>
        - 你在 DN42 内能申请的最小地址块是 `/29`，即 8 个 IP，其中除去第一个 IP
          标记地址块，最后一个 IP 作为地址块内广播（broadcast）不可用以外，可以
          分给 6 个服务器和设备。
            - 对于“只想简单玩玩”的用户，`/29` 已经够了。
        - 如果你满足下列一项，那么 `/29` 不够你用，需要申请更大的地址块：
            - 服务器、设备多，超过了 6 个
            - 你准备自己配置些 Anycast 之类的，需要占用更多的 IP
            - 你使用的一些设备（例如 Mikrotik 路由器），在 Peering（对接）阶段建
              立隧道时，只能使用 `/30` 地址块。
                - 在后续 Peering（对接）阶段，Linux 服务器可以配置单个 IP 到单个
                  IP 的隧道，例如 `172.22.76.185/32` 到 `172.21.2.3/32`。同时，
                  我这端的地址 `172.22.76.185/32` 可以同时用在多个隧道中，意味着
                  我可以同时设置 `172.22.76.185/32` 到 `172.21.2.3/32` 的隧道，
                  以及`172.22.76.185/32` 到 `172.22.3.4/32` 的隧道，以及任意多的
                  隧道，与任意多的人 Peer，而不需要额外的 IP。
                - 但如果你的设备要求使用 `/30` 地址，意味着一个隧道就需要占用 4
                  个 IP 地址，并且你这端的地址无法重复使用，比较浪费。
                - 此时你需要预留较多的地址，因为 DN42 内物理路由器较少见，与你对
                  接的另一位一般也没有预留这么多地址，这个 `/30` 地址块需要由你
                  出。
        - DN42 一般建议申请 `/27`，你能直接申请的最大地址块是 `/26`。
        - 如果你的服务器**非常多（指超过 62 台）**，连 `/26` 都不够用，那么：
            - 首先大佬受我一拜；
            - 然后你的注册申请不会立即被同意。此时你需要去以下任何一个地方，告诉
              大家你需要更大地址块的理由，请求大家投票同意：
                - DN42 的 IRC 频道（服务器地址
                  在[这个页面](https://wiki.dn42.us/services/IRC)可以看到，其中
                  的 public internet 项）
                - DN42 的邮件列表（地址
                  在[这个页面](https://wiki.dn42.us/contact#contact_mailing-list)的
                  Mailing list 项）
        - **千万不要一上来就申请 `/24` 等巨大的地址块！**
        - **千万不要一上来就申请 `/24` 等巨大的地址块！**
        - **千万不要一上来就申请 `/24` 等巨大的地址块！**
            - 可以先找一块空闲的 `/24` 等较大的地址块，然后取其中的 `/27` 一小
              块。后续有需要时再将地址块扩大。
        - **尤其是千万不要占着 `/24` 不用！**
        - **尤其是千万不要占着 `/24` 不用！**
        - **尤其是千万不要占着 `/24` 不用！**

            - DN42 内的 IPv4 地址与公网的 IPv4 地址同样珍贵。

        - 选好地址块之后，在 `data/inetnum` 文件夹创建 IPv4 地址对应的文件。例如
          我的其中一个地址块是 `172.22.76.184/29`，对应的文件就是
          `data/inetnum/172.22.76.184_29`：

            {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供
            参考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。
            code4|我确认我已阅读以上内容，查看代码。
            {% endinteractive_buttons %}

            {% interactive code4 %}

            ```bash
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

            {% endinteractive %}

        - 各项含义如下：
            - `inetnum`：你的这个地址块的范围，如果你不会算，那么可以根据你的地
              址块前后的用户推出，或者直接用
              [IP 地址计算器](https://ipjisuanqi.com/)。
            - `netname`：你的这个地址块的名称，没什么用，随便取（但一般建议保持
              `[昵称]-IPV4` 格式）。
            - `remarks`：简介，随意填写。
            - `descr`：简介，随意填写。
            - `country`：你的国家代号，填 CN 代表中国大陆。
            - `admin-c`：`admin contact（管理员联系信息）`，指向你的 person 文
              件，`[昵称]-DN42`。
            - `tech-c`：`tech contact（技术员联系信息）`，指向你的 person 文
              件，`[昵称]-DN42`。
            - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner
              文件，`[昵称]-MNT`。
            - `nserver`：IP 地址反向解析的 DNS 服务器。如果你不知道这个是什么，
              或者不需要这个，可以去掉。
            - `status`：固定为 `ASSIGNED`。
            - `cidr`：你的地址块的范围，与 `inetnum` 相同，只是以 CIDR 方式表
              示。
            - `source`：固定为 `DN42`。

    5. 注册 IP 的过程还没结束，你还需要创建一个 route 对象，授权某个 AS 使用这个
       地址。在 `data/route` 文件夹创建对应文件，例如我的是
       `data/route/172.22.76.184_29`：

        {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供参
        考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。code5|我确
        认我已阅读以上内容，查看代码。 {% endinteractive_buttons %}

        {% interactive code5 %}

        ```bash
        route:              172.22.76.184/29
        descr:              Peer with me at b980120@hotmail.com
        origin:             AS4242422547
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

        {% endinteractive %}

        - 各项含义如下：
            - `route`：你的这个地址块的范围。
            - `descr`：简介，随意填写。
            - `origin`：你授权哪个 AS 使用这个地址块，填写你的 AS 编号。
            - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner
              文件，`[昵称]-MNT`。
            - `source`：固定为 `DN42`。

    6. 鉴于今年是 2020 年，你最好再注册一个 IPv6 的地址块，在 `data/inet6num` 中
       创建文件。

        - DN42 的 IPv6 地址在 `fd00::/8` 范围，位于私有 IPv6 地址段。
        - DN42 内 IPv6 地址块一般只以 `/48` 的大小存在，足够任何人使用。
            - 即使你的路由器要求 IPv6 隧道以 `/64` 的单位存在，一个 `/48` 内还可
              以划出 $2^{16} = 65536$ 个 `/64`，足够你对接完 DN42 内的所有人。
        - 你可能想自定义你的地址块的前缀，写一些 19260817 之类的内容进去。
            - 首先明确：我**非常不推荐你这样做**！
            - 首先明确：我**非常不推荐你这样做**！
            - 首先明确：我**非常不推荐你这样做**！
                - 与其找一个好记的 IPv6 地址，不
                  如[在 DN42 中注册一个好记的域名](/article/modify-website/register-own-domain-in-dn42.lantian/#%E5%9C%A8-dn42-%E6%B3%A8%E5%86%8C%E5%9F%9F%E5%90%8D)。
            - RFC4193 规定，IPv6 ULA 地址原则上应该全部随机生成，以做到**全球唯
              一**。
                - 假如你自定义了地址块，另一名用户在加入 DN42 时就可能会产生地址
                  块冲突，给双方都增加麻烦。
            - 此外，DN42 与一些性质类似的网络形成了相互 Peer（对接）的关系，与它
              们公用 IPv6 ULA 的地址段。
                - 由于 DN42 **拿不到其它网络的完整地址分配信息**，即使你找的
                  IPv6 地址块在 DN42 Registry 中还未被注册，仍然可能与其它网络产
                  生冲突。
            - 注意一旦产生冲突，**你有可能需要修改整个网络的 IPv6 地址**。
            - 此外，DN42 各个管理员对自定义 IPv6 地址块的态度不一。有些人成功注
              册了自定义的地址块，但有些人被拒绝了。
                - 所以如果你自定义了地址块，然后申请被拒绝了，**不要太惊讶，乖乖
                  改好**。
            - 当你**非常 一定 肯定 确定**你要自定义地址而非随机生成，提交时 DN42
              的管理员会回复类似这样的一条信息：
            - > Your inet6num violates RFC4193 section 3.2. Are you fully aware
              > of the consequences and do you really want to continue? Being
              > forced to renumber your whole network really isn't fun.
              >
              > 你的 IPv6 地址违反了 RFC4193 规范的第 3.2 条。你是否理解这样做的
              > 后果，并且真的想要继续？被迫给整个网络重新编排地址真的不好玩。
            - 如果你**非常 一定 肯定 确定**你想这样做，那就回复
              `Yes, I'm sure`。
            - 但注意，我个人以及 DN42 的一些管理员**比较反感这种行为**。
        - 最好的选择是随机生成一个地址块。你可以使用一
          些[随机生成前缀的工具](https://simpledns.plus/private-ipv6)。

        - 生成完地址块后，类似的在 `data/inet6num` 中创建文件，例如我的地址块是
          `fdbc:f9dc:67ad::/48`，文件名就是
          `data/inet6num/fdbc:f9dc:67ad::_48`：

            {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供
            参考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。
            code6|我确认我已阅读以上内容，查看代码。
            {% endinteractive_buttons %}

            {% interactive code6 %}

            ```bash
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

            {% endinteractive %}

        - 各项含义如下：
            - `inet6num`：你的这个地址块的范围。IPv6 的范围算起来很简单，从全 0
              到全 f。
            - `netname`：你的这个地址块的名称，没什么用，随便取（但一般建议保持
              `[昵称]-IPV6` 格式）。
            - `remarks`：简介，随意填写。
            - `descr`：简介，随意填写。
            - `country`：你的国家代号，填 CN 代表中国大陆。
            - `admin-c`：`admin contact（管理员联系信息）`，指向你的 person 文
              件，`[昵称]-DN42`。
            - `tech-c`：`tech contact（技术员联系信息）`，指向你的 person 文
              件，`[昵称]-DN42`。
            - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner
              文件，`[昵称]-MNT`。
            - `nserver`：IP 地址反向解析的 DNS 服务器。如果你不知道这个是什么，
              或者不需要这个，可以去掉。
            - `status`：固定为 `ASSIGNED`。
            - `cidr`：你的地址块的范围，与 `inetnum` 相同，只是以 CIDR 方式表
              示。
            - `source`：固定为 `DN42`。

    7. 然后在 `data/route6` 创建一个 route6 对象，授权你自己的 AS 使用这个 IP
       段，例如我的是 `data/route6/fdbc:f9dc:67ad::_48`：

        {% interactive_buttons vertical %} noop|以下代码是我的注册信息，仅供参
        考。noop|请仔细阅读文档，并将代码中的全部信息替换成你的信息。code7|我确
        认我已阅读以上内容，查看代码。 {% endinteractive_buttons %}

        {% interactive code7 %}

        ```bash
        route6:             fdbc:f9dc:67ad::/48
        descr:              Peer with me at b980120@hotmail.com
        origin:             AS4242422547
        mnt-by:             LANTIAN-MNT
        source:             DN42
        ```

        {% endinteractive %}

        - 各项含义如下：
            - `route6`：你的这个地址块的范围。
            - `descr`：简介，随意填写。
            - `origin`：你授权哪个 AS 使用这个地址块，填写你的 AS 编号。
            - `mnt-by`：`maintain by（由谁维护）`，由谁维护，指向你之前的 mntner
              文件，`[昵称]-MNT`。
            - `source`：固定为 `DN42`。

5. 恭喜你创建完了所有需要的文件，接下来 `cd` 到 Git 仓库的根目录，执行一次
   `git add .`，然后执行 `git commit -S`，使用你先前创建的 GPG 密钥，创建一
   份**带 GPG 签名的 commit**。

    - 如果你操作快已经 commit 完了，你可以执行 `git commit --amend -S` 修改之前
      的 commit，将其签名。
        - 如果你没有 GPG 密钥，把 -S 参数删掉，此时你需要使用 SSH 公钥验证，见后
          续步骤。
    - 根据反馈，在 Windows 下使用 Git Bash 时，此处 GPG 签名时会出问题。

        - 你可以尝试
          [Windows 的 Linux 子系统（WSL）](https://docs.microsoft.com/zh-cn/windows/wsl/install-win10)。
        - 你也可以尝试评论区提供的方法。运行这条命令，然后重试：

            ```bash
            export GPG_TTY=$(tty)
            ```

        - 你也可以选择不用 GPG，而用 SSH 公钥验证你的身份。见后续步骤。

6. 如果你先前 commit 了多次，你需要把所有变更合并到一次 commit 里，直接运行
   Registry 根目录下的 `./squash-my-commits` 脚本即可。
7. 由于你操作期间 Registry 可能有来自其他人的变更，你需要获取一下 Registry 的更
   新：

    ```bash
    # 获取更新
    git fetch origin master
    # 切换到你自己的分支
    git checkout lantian-20200901/register
    # Rebase 你的分支，实际上就是将你的修改在最新的 Registry 上重新应用一遍
    # 输入这行命令后会出现一个编辑器，你需要保留第一行的 pick，
    # 并将第二行开始（如果有的话）的 pick 全部改成 squash，然后保存并退出编辑器就可以了
    #
    # 如果你没有 GPG 密钥，把 -S 参数删掉
    git rebase -i -S origin/master
    ```

8. 执行 `git push -f` 将修改上传到 Git 服务器。
9. 回到 [dn42/registry](https://git.dn42.dev/dn42/registry)，发起 Pull Request，
   等待你的信息被合并。
    - 如果你使用 SSH 公钥来验证，首先 `git log` 查看你的 commit 的 hash，然后运
      行以下命令，把结果附在 Pull Request 里：
        - `echo [commit hash] | ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n dn42`
        - 注意替换你的 commit hash 和私钥位置。
    - 如果你的操作或者填写的内容有问题，管理员会回复你的 Pull Request，根据他们
      的要求修改即可。
    - 但注意，按照要求修改完成后，**不用关闭原先的 Pull Request 再重新开一
      个。**你只需要照常 `git commit` 和 `git push`，你后续的变更会被自动添加到
      原先这个 Pull Request 里。
        - 一次注册/修改信息行为只需要发一个 Pull Request 就够了。
    - 发 Pull Request **请用英文！**

在你的信息被合并之后，你就正式获得了自己的地址块，接下来就可以开始找人 Peer 了。

## 寻找 Peer 的节点

由于 DN42 是一个去中心化的网络，并没有一个官方服务器供你直接接入。你需要去联系其
它和你一样在 DN42 注册的用户，建立隧道连接和 BGP 会话，从而建立 Peering。

以下推荐几个找到其它用户的方法：

1. 使用 [DN42 PingFinder](https://dn42.us/peers)。在这里提交你的 IP 地址，其它在
   PingFinder 上注册的用户的服务器会测试与你的延迟。这些用户也会留下自己的邮箱，
   或者自己的 DN42 AS 信息的介绍页面，后续可以根据这些信息去联系他们。
2. 去 DN42 的 [IRC 频道](https://wiki.dn42.us/services/IRC)
3. 去这个[非官方 Telegram 群组](https://t.me/Dn42Chat)找人 Peer。
4. ~~直接去找 Burble。Burble 是 DN42 网络中一个非常活跃的用户，同时在全球各地都
   有节点。打开[他的 Peering 信息页面](https://dn42.burble.com/peering)，就可以
   看到他的服务器信息和联系方式。~~
    - 为了降低网络中心度、避免单点故障，Burble 目前只接受已有至少两个 Peer 的用
      户。
5. 直接找我。点击[这个地方](/page/dn42/index.html)或者点击顶部导航栏的 DN42 项
   目，就可以看到我的服务器信息和联系方式。

注意你可以同时找很多个人 Peer，这可以增加你网络的稳定性，避免某个节点临时故障导
致你和 DN42 完全失联。

选择几个离你的服务器近、延迟低的节点，然后继续往下看。

# 非常重要的系统配置

-   首先，**千万 一定 绝对** 要打开 Linux 内核的数据包转发功能，即
    `ip_forwarding`。

    -   在 DN42 内，没有绝对意义上的客户端，每个人的服务器都是其它人的路由器，都
        可能需要转发数据包。具体步骤如下：

        ```bash
        echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
        echo "net.ipv6.conf.default.forwarding=1" >> /etc/sysctl.conf
        echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.conf
        sysctl -p
        ```

    -   同时，如果你配置过 `iptables` 等防火墙软件，请检查相关配置，确保放行数据
        包的转发。

-   然后，**千万 一定 绝对** 要关闭 Linux 内核 `rp_filter` 的严格模式，具体步骤
    如下：

    ```bash
    echo "net.ipv4.conf.default.rp_filter=0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.rp_filter=0" >> /etc/sysctl.conf
    sysctl -p
    ```

    -   `rp_filter` 是 Linux 内核针对网络的一项网络安全保护功能，对于数据包的来
        源地址和来源网络界面（网卡）进行检查：
        -   如果设置为 0（即禁用），放行所有数据包。
            -   但是有些无法正常回复（路由表内没有对应项目）的数据包也会被发给应
                用程序处理，消耗额外的系统资源。
            -   不过额外消耗应该很小，因此上述两项设置为 0 也没问题。
        -   如果设置为 1（严格模式），如果数据包来源网卡不是发送这个数据包的最优
            网卡（也就是如果你本机要回复这个地址的话，会选择一张不同的网卡），就
            把这个数据包**丢掉**。
            -   来源和回复在不同网卡是 DN42 内**非常常见的情况**，因此 **千万 一
                定 绝对** 不能把 `rp_filter` 设置成 1！
        -   如果设置为 2（宽松模式），**从理论上来说**，如果数据包来源地址不在路
            由表内（也就是本机不知道要怎么回复这个地址），就把这个数据包丢掉。
            -   但是理论归理论，在新版本（5.0+）的内核中，实际使用中依然会有大量
                来源地址正确的正常数据包被丢弃。因此不要使用这个模式，请统一使用
                0。

-   然后，**千万 一定 绝对** 关掉你的 UFW 等帮你简单配置 iptables 防火墙的工具。
    -   这些简单配置防火墙的工具可能会使用一些适合个人用户，但是不适合 DN42 场景
        的功能，比如 Conntrack。
        -   Conntrack 会过滤掉它没见过的链接的数据包，造成和开了 `rp_filter` 严
            格模式一样的效果。
    -   我个人建议你手动配置 iptables。

## 选择你的隧道软件

DN42 中几乎每个 Peering 都是建立在隧道软件（即 VPN）之上的，原因如下：

-   DN42 各个用户的节点分布在世界各地，隧道软件可以对数据进行基本的加密和保护；
-   DN42 使用的是私有地址，如果直接在互联网上传输，会被防火墙直接丢弃，甚至可能
    会被主机商认为你在 `IP Spoofing`（伪造来源 IP 地址），违反服务条款，造成严重
    后果。

但有一部分例外情况存在，例如：

-   两个节点处在同一个内网中，可以直接通过内网联通。
    -   典型例子是经典网络的阿里云服务器，或者一些 NAT VPS。

对于隧道软件的推荐如下：

1. 如果你用的是 Linux 系统的 VPS 或独立服务器，并且你的 VPS 不是 OpenVZ 或者 LXC
   虚拟化的，那么推荐使用 WireGuard。

    - WireGuard 的优点在于：
        - 配置极其简单
        - 占用资源少
        - 安全性不错
    - WireGuard 的缺点：
        - 功能少，只能点对点连接
        - 需要内核驱动支持
        - 是 L3 层隧道，难以进行桥接等操作
    - 如果你用的是 OpenVZ 或者 LXC 的 VPS，不建议使用 `wireguard-go` 代替内核驱
      动，该软件更新较慢且据其它用户称有稳定性问题。
    - 安装方式，以 Debian 10 (Buster) 为例：

        - 首先加入 Debian Backports 软件源：

            - 编辑 `/etc/apt/sources.list`，添加：

                ```bash
                deb http://deb.debian.org/debian buster-backports main
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

3. 如果你用的是 Cisco、Mikrotik 等公司的硬件路由器，你一般只能使用 GRE/IPSec：

    - GRE/IPSec 的优点：
        - 在硬件路由器上使用广泛
    - GRE/IPSec 的缺点：
        - 配置复杂，往往需要双方反复交流才能配置完成

4. 或者你也可以使用纯 GRE：

    - GRE 的优点：
        - 硬件路由器上可用
        - 配置相对简便
    - GRE 的缺点：
        - **完全没有加密！数据明文可读！**
        - **完全没有加密！数据明文可读！**
        - **完全没有加密！数据明文可读！**

5. 如果你用的是 Linux 服务器，也可以选择 ZeroTier One，用于你自己的 AS 内部的互
   联，或者用于与他人 Peer。
    - ZeroTier One 的优点：
        - 直观的网页管理面板
        - 全自动的 IP 地址分配
    - ZeroTier One 的缺点：
        - 有时会占用大量 CPU 和内存
        - DN42 内接受程度不高
    - 安装方式：`curl -s https://install.zerotier.com | sudo bash`

## 选择你的 BGP 软件

DN42 中的用户之间使用 BGP 协议来交换路由信息。以下是常用的、支持 BGP 协议的路由
软件：

1. BIRD Internet Routing Daemon **(v2)**

    - 支持 BGP、OSPF、RIP 等多种路由协议
    - 同时支持 IPv4 和 IPv6
    - 配置清晰明了，功能强大
    - 注意：此处指 BIRD2，即第二版本；与第一版本不兼容。
    - 由于 BIRD 配置较复杂，请直接参见
      [DN42 Wiki 上的 Bird2 配置教程](https://wiki.dn42.us/howto/Bird2)，有现成
      的配置可以直接复制粘贴。
    - 在 Debian 中可以添加 BIRD 官方软件源安装：

        ```bash
        wget -O - http://bird.network.cz/debian/apt.key | apt-key add -
        apt-get install lsb-release
        echo "deb http://bird.network.cz/debian/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/bird.list
        apt-get update
        apt-get install bird2
        ```

        可以参考
        [BIRD 的下载页面](https://bird.network.cz/?download&tdir=debian/)。

2. BIRD Internet Routing Daemon **(v1)**

    - 相比 v2，将 IPv4 与 IPv6 分到了两个进程
    - 同时缺少一些功能，包括 Multiprotocol BGP（多协议 BGP，在一个 BGP 连接上同
      时传输 IPv4 和 IPv6 的路由信息），OSPFv3 等
        - 但不影响基础的 Peering 等操作
    - 参见 [DN42 Wiki 上的 Bird1 配置教程](https://wiki.dn42.us/howto/Bird)，有
      现成的配置可以直接复制粘贴。
    - 在 Debian 中可以添加 BIRD 官方软件源安装：

        ```bash
        wget -O - http://bird.network.cz/debian/apt.key | apt-key add -
        apt-get install lsb-release
        echo "deb http://bird.network.cz/debian/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/bird.list
        apt-get update
        apt-get install bird
        ```

        可以参考
        [BIRD 的下载页面](https://bird.network.cz/?download&tdir=debian/)。

3. Quagga / FRRouting
    - 配置语法接近 Cisco 路由器，如果你用过硬件路由器可能会喜欢
    - 某些软路由系统（例如 pfSense）只有 FRRouting 可选
    - 参见 [DN42 Wiki 上的 Quagga 配置教程](https://wiki.dn42.us/howto/Quagga)
4. 硬件路由器自带的 BGP 功能
    - 由路由器厂商提供技术支持，一般非常稳定
    - 但是 BGP 的一些扩展功能可能受到厂商限制
    - 同时每台路由器的配置方式都不同，你很可能得自己研究了

## 搭建你自己的内网

> “打扫干净屋子再请客。”
>
> —— 毛泽东

如果你有多台服务器同时加入 DN42，你需要先配置好自己的内网。内网需要满足以下条件
才能保证正常工作：

1. 任何两台服务器都可以互相沟通，即可以 Ping 通。
    - 这样做的原因是你的 AS 外部的路由只负责把数据包发送进你的 AS，数据包可能从
      任何一个节点进入。你自己的节点需要负责在内部将数据包转发给目标节点。
    - 你可以使用这些方案：
        1. 使用 Tinc，ZeroTier One 之类的软件建立 Full-Mesh VPN，使得每两台服务
           器之间都能直接连通。
        2. 使用 OpenVPN，WireGuard 等软件建立 $\frac{n (n-1)}{2}$ 条点对点隧道连
           接，使得每两台服务器之间都能直接连通。
        3. **（相对危险）** 使用 OpenVPN，WireGuard 等建立少于
           $\frac{n (n-1)}{2}$ 条点对点隧道连接，但需要保证每两台服务器之间能连
           通（可以间接连通），然后使用 Babel、OSPF、RIP 等协议在内部寻路。
        - 这种方案很容易配置出错，并造成严重后果。
            - 一些实例详见
              《[如何引爆 DN42 网络](/article/modify-website/how-to-kill-the-dn42-network.lantian/)》。
        - Babel、OSPF、RIP 等路由协议可以自动识别整个网络的拓扑结构，并设置好相
          应的路由。
        - 但注意，Babel、OSPF、RIP 等只应该处理你内部的路由，**不能用于转发由
          BGP 从外部收到的路由！**
            - 当 BGP 路由信息被 Babel、OSPF、RIP 等转发时，包括来源、路径长
              度、Community 等信息都会丢失。
            - 因此其它节点从 Babel、OSPF、RIP 收到路由时，会**认为它们来自你的网
              络**，并将你的 AS 作为源头，向外再次广播路由信息。
            - 简单的说：你会**劫持整个 DN42 的路由**。
        - Babel、OSPF、RIP 等应被严格限制，它们只应处理你自己拥有的 IP 段内，各
          个 IP 之间的连接关系。**来自外部的路由必须且只能由 BGP 处理**。
        - 如果有问题，请去[非官方 Telegram 群组](https://t.me/Dn42Chat)寻求帮
          助。
2. BGP 配置满足下列条件之一：
    1. 服务器两两之间建立了 BGP 连接。
        - 由于 BGP 的特性，在同一个 AS 内，一个 BGP 节点只会向其它节点广播**自己
          收到的路由信息**，而**不会转发**从 AS 内其它节点收到的路由信息，这样做
          是为了防止产生环路。因此，每台服务器都要与其它所有服务器建立 BGP，以保
          证自己收到完整的路由表。
        - 如果你服务器多，手动配置会非常麻烦。此时你可以考虑写个脚本，或者采取下
          面的方法。
    2. 将一台服务器设置为 `BGP Route Reflector`，其它服务器均与它建立 BGP 连接。
        - Route Reflector 服务器将管理并下发 AS 内所有的路由信息。
        - 相对于上一种方案，优点是配置量大大减少，而缺点是一旦 Route Reflector
          服务器出现故障，整个网络都会挂掉。
        - 注意我没有尝试过这种配置，因此无法为此提供任何技术支持。
          但[非官方 Telegram 群组](https://t.me/Dn42Chat)内有人使用这种方案，你
          可以在那里寻求帮助。
    3. 在每个节点配置一个不同的私有 ASN，并设置 Confederation。
        - ASN 需要在 4200000000 - 4294967294 的私有 ASN 范围内选择，但不要选择
          4242420000 - 4242429999 这个范围，以防止与其它 DN42 用户重复。
        - Confederation 使得多个服务器“抱团”，对外展示为同一个 AS。
        - 这种配置方法详见
          《[Bird 配置 BGP Confederation，及模拟 Confederation](/article/modify-website/bird-confederation.lantian)》。
        - 另外[非官方 Telegram 群组](https://t.me/Dn42Chat)内也有人使用这种方
          案，你可以在那里寻求帮助。
3. **所有服务器完成上一节的“非常重要的系统配置”。**

## “1xRTT Peering”：更快速的对接

DN42 中多数用户处在美国或者欧洲，当我们从中国与他们联系时，受时差影响双方一轮通
信时间可能会很长。因此，我们应根据对方在自己网站上公开的信息尽可能完整地配置自己
一侧，方便对方的调试，也减少反复通信的时间消耗。

我在我的 [DN42 信息页面](/page/dn42/index.html)提供了一个列表，包括了我在配置与
你的隧道和 BGP 会话时，你应该执行哪些步骤，我需要哪些信息。

我的配置没有什么特异之处，当你与其他用户建立隧道与 BGP 时，其他用户也需要同样的
信息。因此，我建议你完整地按照以下步骤操作，提供完整的信息。

在此，我将步骤列表复制一遍，以供参考：

@include "\_templates/dn42-experimental-network-2020/peer-zh.md"

## 隧道搭建：WireGuard

DN42 Wiki 有 WireGuard 的配置步骤，我在此进行少许修改以使其简单明了。

首先运行 `wg genkey | tee privatekey | wg pubkey > publickey` 产生一对公钥和私
钥，这是 WireGuard 隧道中双方的唯一认证方式，务必保管好不要泄漏。

然后创建一个配置文件 `[PEER_NAME].conf`：

@include "\_templates/dn42-experimental-network-2020/wireguard-zh.md"

然后运行 `wg-quick up [PEER_NAME].conf` 启动隧道。

## 隧道搭建：OpenVPN

DN42 Wiki 同样提供了 OpenVPN 的配置模板，我在此进行少许修改以使其简单明了，如
下：

@include "\_templates/dn42-experimental-network-2020/openvpn-zh.md"

## 限制 DN42 相关网卡上的流量

一般而言，进行 DN42 Peering 时双方建立的隧道可以承载任何 IP 的流量（除非你配置了
WireGuard 的 AllowedIPs），这就造成了风险：你的 Peer 可以向你的隧道传入目标地址
是公网 IP 的数据包，此时你的节点会把数据包以你的名义转发到公网。如果你的 Peer 利
用此进行网络攻击，你就有大麻烦了。

因此，建议你设置 iptables 防火墙规则，来拒绝转发 Peer 向公网发送的数据。

> 注：如果你只用 WireGuard 隧道就不用配置这些了，WireGuard 自带了 IP 限制功能。

下面的规则会在所有以 `dn42-` 开头的网卡上，只允许已有的 DN42 IP 段的流量：

```bash
iptables -N DN42_INPUT
iptables -A DN42_INPUT -s 172.20.0.0/14 -j ACCEPT
iptables -A DN42_INPUT -s 172.31.0.0/16 -j ACCEPT
iptables -A DN42_INPUT -s 10.0.0.0/8 -j ACCEPT
iptables -A DN42_INPUT -s 224.0.0.0/4 -j ACCEPT
iptables -A DN42_INPUT -j REJECT
iptables -A INPUT -i dn42+ -j DN42_INPUT

iptables -N DN42_OUTPUT
iptables -A DN42_OUTPUT -d 172.20.0.0/14 -j ACCEPT
iptables -A DN42_OUTPUT -d 172.31.0.0/16 -j ACCEPT
iptables -A DN42_OUTPUT -d 10.0.0.0/8 -j ACCEPT
iptables -A DN42_OUTPUT -d 224.0.0.0/4 -j ACCEPT
iptables -A DN42_OUTPUT -j REJECT
iptables -A OUTPUT -o dn42+ -j DN42_OUTPUT

ip6tables -N DN42_INPUT
ip6tables -A DN42_INPUT -s fd00::/8 -j ACCEPT
ip6tables -A DN42_INPUT -s fe80::/10 -j ACCEPT
ip6tables -A DN42_INPUT -s ff00::/8 -j ACCEPT
ip6tables -A DN42_INPUT -j REJECT
ip6tables -A INPUT -i dn42+ -j DN42_INPUT

ip6tables -N DN42_OUTPUT
ip6tables -A DN42_OUTPUT -d fd00::/8 -j ACCEPT
ip6tables -A DN42_OUTPUT -d fe80::/10 -j ACCEPT
ip6tables -A DN42_OUTPUT -d ff00::/8 -j ACCEPT
ip6tables -A DN42_OUTPUT -j REJECT
ip6tables -A OUTPUT -o dn42+ -j DN42_OUTPUT

iptables -A FORWARD -i dn42+ -j DN42_INPUT
iptables -A FORWARD -o dn42+ -j DN42_OUTPUT

ip6tables -A FORWARD -i dn42+ -j DN42_INPUT
ip6tables -A FORWARD -o dn42+ -j DN42_OUTPUT
```

## BGP 会话配置：BIRD v1 和 v2

我这里只介绍 BIRD v1 和 v2 的配置，因为它们是使用最广泛的。我假设你已经按照 Wiki
上的步骤完成了基本的配置，只是还没接入任何 Peer。

-   [DN42 Wiki 上的 Bird2 配置教程](https://wiki.dn42.us/howto/Bird2)
-   [DN42 Wiki 上的 Bird1 配置教程](https://wiki.dn42.us/howto/Bird)

对于 BIRD v1，需要的配置如下：

@include "\_templates/dn42-experimental-network-2020/bird1-zh.md"

对于 BIRD v2，配置如下：

@include "\_templates/dn42-experimental-network-2020/bird2-zh.md"

## 网络测试及几个加分项

上述配置完后，你就已经成功接入了 DN42 网络。此时，你可以进行一些测试：

-   `ping 172.20.0.53` 或者 `ping 172.23.0.53`，这个地址是 DN42 网络内的 Anycast
    DNS。
-   `ping 172.23.0.80`，这是 DN42 Wiki 在内部的 IP 地址。
-   尝试
    [DN42 Wiki 上的内部服务](https://wiki.dn42.us/internal/Internal-Services)，
    或者 [Burble 的服务](https://dn42.burble.com/home/burble-dn42-services)。

你也可以挑战自己，继续修改你的隧道和 BGP 配置，添加更多功能，提高性能和/或安全
性：

-   ROA，即 Route Origin Authorization，指检查某条路由信息是否来自于该来的 AS，
    例如我的 `172.22.76.184/29` 就应当来自 `4242422547`，并拒绝不符合的路由信
    息。
    -   DN42 Wiki 中有 BIRD 的 ROA 配置教程：见
        [Bird2](https://wiki.dn42.us/howto/Bird2) 或者
        [Bird1](https://wiki.dn42.us/howto/Bird)
-   Community Filter，将 DN42 中的隧道链路按延迟、带宽、加密分成不同等级，优先选
    择更快速的路由
    -   Bird1 参见
        [DN42 Wiki 的 Bird Communities 页面](https://wiki.dn42.us/howto/Bird-communities)。Bird2
        需要对这个配置做较大幅度的修改，可以自己尝试
-   Anycast，指多台服务器同时广播一个 IP，外界访问会被导到最近的服务器上
    -   在真实互联网一般用于 DNS。在 DN42 内，Wiki（172.23.0.80）也是 Anycast
        的。
    -   我在去年和今年各就此写过一篇文章：参见
        《[在 DN42 中使用 Docker 建立 Anycast DNS 服务](/article/modify-website/dn42-docker-anycast-dns.lantian)》
        和
        《[Docker 容器共享网络命名空间，集成 Bird 实现 Anycast 高可用](/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian)》。
-   建立自己的递归和权威 DNS 服务器
    -   你甚至可以申请加入 DN42 的 DNS Anycast，成为官方 DNS 中的一分子。
-   注册一个域名，建立网站
    -   参见我在 2018 年写的文章：
        《[在 DN42 中注册自己的域名](/article/modify-website/register-own-domain-in-dn42.lantian/#%E5%9C%A8-dn42-%E6%B3%A8%E5%86%8C%E5%9F%9F%E5%90%8D)》
-   或者直接在真实互联网中，找 RIPE 注册真实的 AS，租用公网的 IPv4 和 IPv6 地址
    池，开始玩真的。

## 需要帮助？

记住：DN42 是一个**测试网络**，所有人都在帮助所有人。即使你不小心搞砸了，也没有
人会指责你。你可以在 DN42 的
[IRC 频道](https://wiki.dn42.us/services/IRC)，[邮件列表](https://wiki.dn42.us/contact#contact_mailing-list)或
者[非官方 Telegram 群组](https://t.me/Dn42Chat)寻求帮助。
