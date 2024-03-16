---
title: '解决树莓派 HW CSum Failure 问题'
categories: 计算机与客户端
tags: [Raspberry Pi]
date: 2018-01-25 23:18:00
---
今天登录上树莓派，习惯性 df 查看磁盘空间，发现树莓派 TF 卡上的空间所剩无几。最开始我以为我设置错误，把要挂机下载的文件下载到了 TF 卡里而不是移动硬盘里。结果排查下来，/var/log 下的日志文件居然占据了整整 18G 的空间。查看了一下日志，基本上都是类似如下的报错：

```bash
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143274] eth0: hw csum failure
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143281] CPU: 0 PID: 1075 Comm: vncagent Not tainted 4.9.77-v7+ #1081
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143283] Hardware name: BCM2835
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143294] [<8010fa48>] (unwind_backtrace) from [<8010c058>] (show_stack+0x20/0x24)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143303] [<8010c058>] (show_stack) from [<804578e4>] (dump_stack+0xd4/0x118)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143312] [<804578e4>] (dump_stack) from [<80629704>] (netdev_rx_csum_fault+0x44/0x48)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143320] [<80629704>] (netdev_rx_csum_fault) from [<8061c2c4>] (__skb_checksum_complete+0xb4/0xb8)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143328] [<8061c2c4>] (__skb_checksum_complete) from [<806c0be8>] (nf_ip_checksum+0xd4/0x130)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143376] [<806c0be8>] (nf_ip_checksum) from [<7f5b8de0>] (tcp_error+0x1d0/0x21c [nf_conntrack])
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143463] [<7f5b8de0>] (tcp_error [nf_conntrack]) from [<7f5b3674>] (nf_conntrack_in+0xd4/0x984 [nf_conntrack])
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143515] [<7f5b3674>] (nf_conntrack_in [nf_conntrack]) from [<7f5e1488>] (ipv4_conntrack_in+0x28/0x2c [nf_conntrack_ipv4])
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143527] [<7f5e1488>] (ipv4_conntrack_in [nf_conntrack_ipv4]) from [<80663c40>] (nf_iterate+0x74/0x90)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143534] [<80663c40>] (nf_iterate) from [<80663cc4>] (nf_hook_slow+0x68/0xc0)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143541] [<80663cc4>] (nf_hook_slow) from [<8066bac8>] (ip_rcv+0x468/0x55c)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143549] [<8066bac8>] (ip_rcv) from [<806271a4>] (__netif_receive_skb_core+0x2b4/0xbc0)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143556] [<806271a4>] (__netif_receive_skb_core) from [<80629a54>] (__netif_receive_skb+0x20/0x7c)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143564] [<80629a54>] (__netif_receive_skb) from [<80629adc>] (netif_receive_skb_internal+0x2c/0xa4)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143571] [<80629adc>] (netif_receive_skb_internal) from [<80629b78>] (netif_receive_skb+0x24/0x98)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143581] [<80629b78>] (netif_receive_skb) from [<7f618514>] (ifb_ri_tasklet+0xf4/0x29c [ifb])
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143591] [<7f618514>] (ifb_ri_tasklet [ifb]) from [<80123244>] (tasklet_action+0x74/0x10c)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143599] [<80123244>] (tasklet_action) from [<8010169c>] (__do_softirq+0x18c/0x3cc)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143605] [<8010169c>] (__do_softirq) from [<80122ccc>] (irq_exit+0x10c/0x168)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143613] [<80122ccc>] (irq_exit) from [<801738f8>] (__handle_domain_irq+0x70/0xc4)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143622] [<801738f8>] (__handle_domain_irq) from [<8010150c>] (bcm2836_arm_irqchip_handle_irq+0xa8/0xac)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143630] [<8010150c>] (bcm2836_arm_irqchip_handle_irq) from [<8071c13c>] (__irq_svc+0x5c/0x7c)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143633] Exception stack(0xb13b3b60 to 0xb13b3ba8)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143639] 3b60: 00000001 39f65000 20000113 00000001 baae6a4c 80b81a3c 39f65000 00000002
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143645] 3b80: b21cbe20 80c6f440 baefcb74 b13b3c44 80c040a4 b13b3bb0 80214ae0 80214700
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143649] 3ba0: a0000113 ffffffff
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143658] [<8071c13c>] (__irq_svc) from [<80214700>] (get_page_from_freelist+0x258/0xb0c)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143668] [<80214700>] (get_page_from_freelist) from [<8021578c>] (__alloc_pages_nodemask+0xf0/0xe58)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143678] [<8021578c>] (__alloc_pages_nodemask) from [<8021c3f8>] (__do_page_cache_readahead+0xf8/0x270)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143688] [<8021c3f8>] (__do_page_cache_readahead) from [<8020efe4>] (filemap_fault+0x338/0x674)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143696] [<8020efe4>] (filemap_fault) from [<8030db3c>] (ext4_filemap_fault+0x3c/0x50)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143707] [<8030db3c>] (ext4_filemap_fault) from [<8023e2f4>] (__do_fault+0x7c/0x100)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143715] [<8023e2f4>] (__do_fault) from [<80242638>] (handle_mm_fault+0x614/0xd98)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143723] [<80242638>] (handle_mm_fault) from [<8071cbf0>] (do_page_fault+0x338/0x3bc)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143730] [<8071cbf0>] (do_page_fault) from [<801012a8>] (do_PrefetchAbort+0x44/0xa8)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143737] [<801012a8>] (do_PrefetchAbort) from [<8071c6a4>] (ret_from_exception+0x0/0x1c)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143740] Exception stack(0xb13b3fb0 to 0xb13b3ff8)
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143744] 3fa0:                                     0011ff6c 00000001 a63dc0de 0006ac00
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143750] 3fc0: 76c37000 00000001 76c374ac 00000001 00675cd8 00000000 76f2b000 00000000
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143755] 3fe0: 76f2ace4 7e9b5cc0 76b29dd4 0006ac00 60000010 ffffffff
```

即，树莓派的有线网卡部分出现了大面积的报错，内核不断的打 Stacktrace 导致日志文件暴涨。而我的树莓派因为用来挂校内 PT 站，常常有 5MB/S 以上的上传下载，日志量可想而知。

报错的“HW CSum”功能全称为“Hardware Checksum Offloading”，即将网络数据包的校验转交给网卡芯片，从而降低 CPU 占用的功能。为了排查问题，我尝试用 ethtool 关闭该功能：

```bash
apt-get install ethtool
ethtool --offload eth0 rx off tx off
```

关闭后 dmesg 中不再出现类似报错。再尝试打开该功能：

```bash
ethtool --offload eth0 rx on tx on
```

dmesg 中再次出现大面积报错，证明该问题由 HW CSum 产生。

当然，关闭 HW CSum 仅是权宜之计，这个问题应该通过更新内核和/或驱动的方式解决。但是我尝试 raspi-update，更新内核和驱动后问题仍未解决，因此只能继续停用 HW CSum。

编辑 `/etc/network/interfaces.d/eth0`（如果没有就创建），加入以下代码：

```bash
allow-hotplug eth0
iface eth0 inet dhcp
    offload-rx off
    offload-tx off
```

这样之后系统启动时就会自动调用 ethtool 禁用 HW CSum 功能。
