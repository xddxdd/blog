---
title: '在 Macbook Pro 上安装 Ubuntu 操作系统'
categories: 计算机与客户端
tags: [Mac,Linux]
date: 2014-10-04 19:27:05
---
Mac 系统的确非常漂亮，非常流畅。但是 VirtualBox 虚拟机在上面的运行速度惨不忍睹，而且一大堆在 Windows 或者 Ubuntu 上可以非常简单实现的功能在 Mac 上就要大费周折。再加上我看到网上的文章，Ubuntu 系统的 UnixBench 分数比 Mac 要高得多。因此我决定在 Macbook 上安装 Ubuntu。

经过查询，我的 Macbook 是2012年中款，即 Macbook 9-2，在Ubuntu的官方维基上标明，在这款 Macbook 上 Ubuntu 只能和 Mac 共存，不能单独存在，否则引导会出现问题。

拜托，Mac 的引导和系统是分开的好不好？

在 Ubuntu 演示环境中的 GParted 上显示，Mac 系统共创建了三个分区：一个 200M 的 FAT32 分区，作为 EFI 启动分区，一个 HFS 格式系统区，还有一个 600M 左右，HFS 格式的恢复区。我们要干的事情，就是把 Mac 系统区和恢复区干掉，换成 Ubuntu 的分区就可以了。

一。安装引导工具
-------------

因为 Macbook 默认的引导可能无法启动 Ubuntu（不过我测试可以直接启动），我们需要安装第三方引导工具，rEFInd。rEFInd 是让使用 EFI 启动的电脑能够启动各类操作系统的一个引导工具，说白了就是给 Macbook 设计的，因为其它电脑的 EFI 大都可以关闭，如果碰到无法关闭 EFI 的电脑也可以安装 Ubuntu，只有 Macbook 比较奇葩。

- （在 Mac 下）下载 rEFInd，解压。[http://sourceforge.net/projects/refind/files/0.8.3/refind-bin-0.8.3.zip/download](http://sourceforge.net/projects/refind/files/0.8.3/refind-bin-0.8.3.zip/download)
- 打开 Launchpad - 实用工具 - 终端，输入“cd "”，也就是cd然后一个空格然后一个英文双引号。不要回车。
- 把刚才解压出的文件夹窗口上面的那个文件夹图标拖进终端，此时终端上就出现了你解压开的 rEFInd 文件夹路径。
- 再输入一个英文双引号，回车。
- 输入：

```bash
sudo ./install.sh --esp
```

- 输入你的密码，回车。输入密码时屏幕上不会有显示。
- 重启电脑，应该可以看到一个选择器，上面有着 rEFInd 字样。安装成功。

二。创建 Ubuntu 启动盘
--------------------

你可以把 Ubuntu 的 iso 刻盘，也可以在 Windows 电脑上或者在虚拟机里用 UltraISO 把 iso 写入U盘。

三。修复分区表
------------

- 在 Mac 的磁盘工具里，把你当前的 Mac 分区缩小，把剩下区域划成一个新分区。
- 插入你的U盘或光盘，重启电脑，开机时按住 Alt（Option），选择“Windows”回车。
- 此时将会自动进入 Ubuntu 安装向导，选择试用 Ubuntu 。
- 在 Unity 里搜索 GParted 并启动，把新的分区格式化成 ext4 ，应用。
- 关闭电脑，拔掉U盘，进入 Mac。
- 下载 GPT Fdisk [http://sourceforge.net/projects/gptfdisk/](http://sourceforge.net/projects/gptfdisk/) 并安装。
- 打开终端，输入：

```bash
sudo gdisk /dev/disk0
```

- 输入r回车，再输入p回车，此时屏幕上会列出你的分区表，一般第二个是你的 Mac ，第四个是准备给 Ubuntu 的分区。
- 输入h回车。然后输入2 4（也就是 Mac 和 Ubuntu 的分区号）回车。
- 输入y回车，然后输入AF回车。这是设置分区类型。然后输入n，表示不设置成启动分区。
- 输入y回车，然后输入83回车，然后输入n回车。
- rEFInd 的启动不依赖启动分区的设置，所以没必要设置启动分区。
- 输入w回车，此时gdisk应该自动退出。
- 重启电脑，按住 Alt（Option），选择 Windows，开始安装 Ubuntu 操作系统。

四。开始安装
----------

- 进入 Ubuntu 安装向导时，再次选择试用，然后启动 GParted。
- 把除了第一个200M EFI 分区以外的所有分区删除，然后按照你的喜好设置分区。
- 启动 Ubuntu 安装程序，按照正常步骤安装。注意不要选择清除整台电脑的数据，选择自定义分区设置。
- 安装完成后，就可以正常进入 Ubuntu 了。

五。rEFInd 设置
--------------

- 进入 Ubuntu 后，输入：

```bash
sudo mkdir /media/efi
sudo mount /dev/sda1 /media/efi
cd /media/efi/EFI/refind
sudo nano refind.conf
```

- 把 timeout 改成 -1，这样就不用在启动菜单处等20秒进入系统了。

以上，整个安装完成。
