---
title: 'x32 ABI 及相应 Docker 容器使用'
categories: 网站与服务端
tags: [x32, Docker]
date: 2020-05-15 00:20:26
---

> x32 架构是怎么回事呢？x86、x86_64 架构相信大家都很熟悉，但是 x32 是怎么回事
> 呢，下面就让小编带大家一起了解吧。
>
> x32 架构，其实就是 x86 和 x86_64 架构拼在一起，大家可能会很惊讶 x86 和 x86_64
> 架构怎么会拼在一起呢？但事实就是这样，小编也感到非常惊讶。

## x86 及 x86_64 的历史，以及 x32 ABI

我们现在使用的个人计算机及服务器绝大多数都使用 x86_64 架构，该架构由 AMD 于 2000
年发布规范，2003 年发布第一块处理器。x86_64 是一个 64 位的架构，意味着在 x86_64
中，CPU 的每个寄存器都能保存 64 bit 的数据（即 8 个字节）。在 x86_64 流行之前，
多数电脑都使用 Intel 处理器以及相应的 x86 架构/指令集，这是一个 32 位的架构，每
个寄存器可以保存 32 bit 的数据（即 4 个字节）。

64 位架构的一个显著好处是内存寻址能力的提升。计算机在访问内存时通常按照这样一个
流程：将要访问的内存地址写入寄存器，然后将这个寄存器的内容发送到内存地址总线上。
也正因此，32 位架构计算机只能使用 32 bit 表示内存地址，总共能够表示
$2^{32} = 4294967296$ 个地址（字节），也就是 `4 GB`。而 64 位计算机可以表示到
$2^{64} = 18446744073709551616$ 个字节，即 `16 EB = 16384 PB = 16777216 TB`。而
目前的 x86_64 架构为了简化电路设计和提高 CPU 极限频率，只使用了其中的 48 bit，因
此可以寻址 $2^{48} = 281474976710656$ 个字节，即 `256 TB`。

此外，x86_64 架构相比 x86，还增加了寄存器的数量，由 x86 的 8 个
（EAX，EBX，ECX，EDX，ESI，EDI，ESP，EBP）增加到了 16 个
（RAX，RBX，RCX，RDX，RSI，RDI，RSP，RBP，R8，R9，R10，R11，R12，R13，R14，R15）。
同时，相比于 x86 将参数放在栈中进行传递，x86_64 会将前 6 个参数放在寄存器
（RDI，RSI，RDX，RCX，R8，R9）中进行传递。以上两点使得 x86_64 相比 x86 减少了访
问内存的次数，而由于内存比 CPU 寄存器慢得多，x86_64 在运行相同程序时的性能也会相
比 x86 更好。

但是 x86_64 也不是没有缺点。由于 x86_64 中内存地址使用 64 bit 表示，内存指针就相
比 x86 更耗内存。假设我们有一个二叉树的程序，其基本数据结构是这样：

```c
struct TreeNode {
    struct TreeNode* left;
    struct TreeNode* right;
    int data;
};
```

这个结构在 x86 下只需要占用 12 字节（两个 4 字节的指针和一个 4 字节的 int 数
据），但在 x86_64 下需要 20 字节（指针变成了 8 字节），66.7% 的提升。而对于数据
库等应用，树结构及指针是其功能的基础，因此它们的内存占用也会大幅上涨。这也就是
Vista、Windows 7 时代，人们常说的“64 位操作系统更占内存”的原因。

但是别忘了，x86_64 CPU 是在 2003 年上市的，那时 DDR2 内存才刚刚发布，大家的内存
都是以 MB 计算，x86_64 的内存占用增加就成了不小的障碍。在内存小于 4 GB、不会遇上
寻址限制时，如果能用上 x86_64 多出来的寄存器提速，再加上 x86 的 32 位内存地址来
省内存，那不是更好？

于是就有了 x32 ABI，它与 x86 和 x86_64 的关系如下表：

|              | x86                | x32    | x86_64 |
| ------------ | ------------------ | ------ | ------ |
| 内存地址位数 | 32                 | 32     | 64     |
| 进程内存限制 | 4 GB               | 4 GB   | 128 TB |
| 系统内存限制 | 4 GB（不考虑 PAE） | 128 TB | 128 TB |
| 寄存器个数   | 8                  | 16     | 16     |
| 参数传递方式 | 栈                 | 寄存器 | 寄存器 |

在 Linux 中，最早的有关 x32 的信息出现在 2011 年 8 月 27 日，开发者 Hans Peter
Anvin 在邮件列表上发布信息说明他正在开发 Linux 的 x32 ABI。x32 ABI 在 2012 年 5
月 20 日发布的 Linux 3.4 中被合并入主线内核。

Linux 的 x32 实现由一个标准的 x86_64 Linux 内核和上面运行的 x32 架构程序组成，也
正因为此系统上的所有进程可以占用超过 4G 内存，但单个进程不行。

Linux 中的 x32 架构实际上并不成功，可能是以下原因导致的：

1. 它发布得太晚了。在 2011 年，流行的电脑内存容量已经大幅提升，Windows 7 都已经
   发布两年（2009 年 7 月 22 日），内存毁灭者 Google Chrome 也已经发布三年（2008
   年 9 月 2 日）。此时为了节省少量内存而大费周章已经没有什么必要。
2. 缺乏大公司的支持。大公司的服务都要处理海量的请求，单进程 4 GB 内存根本不够他
   们使用。相比于耗费人力在 x32 上，他们更愿意买下一车一车的内存条给自己的服务器
   使用。
3. 缺乏应用程序优化。不少程序（例如 OpenSSL、Firefox）为了在 x32 下运行不得不禁
   用了汇编优化，带来的额外 CPU 开销完全抵消了 x32 的性能提升。

但是对于用着 512 MB、1 GB 内存 VPS，相比 CPU 占用更在意内存的个人用户来说，x32
节省内存的好处就能表现出来。

## 使用 x32 ABI 与 Docker 镜像

要使用 x32 ABI，你基本上只有 Debian 可选。Debian 是我所知的唯一一个还在支持 x32
架构的 Linux 发行版。我假设你正在运行的系统是 Debian 10。

首先你需要一个支持 x32 ABI 的内核，也就是 Debian Unstable 的最新**标准** x86_64
内核（不是 Cloud 内核）。运行如下命令安装：

```bash
# 添加 Unstable 的软件源
cat >/etc/apt/sources.list.d/unstable.list <<EOF
deb http://deb.debian.org/debian/ unstable main contrib non-free
deb-src http://deb.debian.org/debian/ unstable main contrib non-free
EOF

# 限制 Unstable 软件源的范围，防止把整个系统升级上 Unstable
cat >/etc/apt/preferences.d/limit-unstable <<EOF
Package: *
Pin: release a=unstable
Pin-Priority: 90
EOF

# 允许从 Unstable 安装最新的内核，和后面要用到的 Debootstrap
cat >/etc/apt/preferences.d/allow-unstable <<EOF
Package: linux-*
Pin: release a=unstable
Pin-Priority: 900

Package: debootstrap*
Pin: release a=unstable
Pin-Priority: 900
EOF

# 手动指定 Unstable 安装一次最新内核，因为 Unstable 里的内核还依赖少量其它东西
# 如果不指定 Unstable 安装的话会提示依赖错误
apt update
apt install -t unstable linux-image-amd64 linux-headers-amd64

# 以后升级内核时不用指定 Unstable，直接升级就可以了
apt upgrade

# 先不要重启，还有配置要改
```

然后你需要开启 Linux 内核的 x32 ABI 支持，让内核能够理解 x32 程序发来的、32 bit
指针长度的系统调用。编辑 `/etc/default/grub` 文件，在 Linux 内核的启动命令中加上
`syscall.x32=y`：

```bash
# If you change this file, run 'update-grub' afterwards to update
# /boot/grub/grub.cfg.
# For full documentation of the options in this file, see:
#   info -f grub -n 'Simple configuration'

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX="syscall.x32=y"

# 下略
```

然后运行 `update-grub` 更新 `/boot/grub/grub.cfg` 启动配置，最后 `reboot` 重启。

重启后运行 `cat /proc/cmdline`，其中应该有 `syscall.x32=y` 字样。

接下来，你还需要一个 x32 的运行环境，包括基本的 Linux 命令、apt-get 等。实际上，
你就是需要安装一个 x32 的 Debian Linux。你可以直接使用我构建的、每周自动更新的
Docker 镜像：

```bash
docker run -it --rm xddxdd/debian-x32
```

## 手动打包 x32 Docker 镜像

上面的 Docker 镜像是使用以下步骤打包出来的，你也可以自己打包、自己管理更新频率：

```bash
# 安装 Debootstrap，Debian 的安装工具
apt install debootstrap

# 安装 Debian Ports 的 GPG 密钥，以校验 x32 软件包
# Debian Ports 项目负责把 Debian 系统移植到其它架构上（例如 x32，ARM 和 RISC-V）
apt install debian-ports-archive-keyring

# 运行 Debootstrap，把一个 x32 Debian 系统安装到 debian-x32 文件夹下
# 注意此处的参数设置：
# - arch 指定 x32（废话）
# - variant 指定 minbase，即最小化安装的系统，毕竟是在打包 Docker 镜像；后续有需要再加东西
# - keyring 参数要指定 Debian Ports 的 GPG 密钥，默认是不包括的
# - include 也要指定 Debian Ports
# - 版本选择 unstable，因为 x32 从来就没有成为一个“稳定”的版本
debootstrap --arch=x32 --variant=minbase --keyring=/usr/share/keyrings/debian-ports-archive-keyring.gpg --include=debian-ports-archive-keyring unstable debian-x32 http://deb.debian.org/debian-ports

# 删掉占空间的日志、下载缓存等东西，立省 60M+
rm -rf debian-x32/var/log/*.log
rm -rf debian-x32/var/cache/apt/*
rm -rf debian-x32/var/lib/apt/lists/*

# 创建一个非常简单的 Dockerfile，作用就是把 debian-x32 文件夹的内容都拷进去
cat >Dockerfile <<EOF
FROM scratch
COPY debian-x32/ /
CMD ["bash"]
EOF

# 然后把所有东西喂给 Docker 就行了
docker build -t xddxdd/debian-x32 .

# 最后运行一下
docker run -it --rm xddxdd/debian-x32
```

然后你就可以 `FROM xddxdd/debian-x32`，以这个镜像为基准添加其它东西了。

我的[多架构 Dockerfile 项目](https://github.com/xddxdd/dockerfiles) 中就有不少
x32 的镜像，可以作为参考或者直接拿去用。

## 我推荐使用 x32 吗

说实话，我不是很推荐使用 x32 ABI，原因如下：

1. 软件支持较差
    - 以 Debian x32 为例，很多软件（例如 MariaDB）都不在软件源里，你还需要自己去
      编译
    - 一旦遇到莫名其妙的问题（虽然我现在还没有），不要指望获得任何技术支持
2. 性能不一定有提升
    - 例如上文说过的 OpenSSL 禁用了 x32 的汇编优化，使得加解密性能降低，抵消了
      x32 的好处
    - 此时如果要省内存的话，或许直接使用 x86 32 位的程序/镜像会好一点

但是从折腾的角度，x32 值得一试。

> 这就是关于 x32 架构的事情了，大家有什么想法呢，欢迎在评论区告诉小编一起讨论
> 哦！
