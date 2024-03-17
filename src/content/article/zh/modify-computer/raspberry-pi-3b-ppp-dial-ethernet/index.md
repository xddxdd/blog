---
title: '树莓派 3B 折腾笔记：串口拨号上网'
categories: 计算机与客户端
tags: [Raspberry Pi, 串口]
date: 2019-01-18 22:12:56
image: /usr/uploads/2019/01/3298649142.png
---

-   今年是 9102 年了吗？
-   是的。

## 为什么要这样做

我手上有一块树莓派 3B 和一块华硕的 Tinker Board。有的时候，因为 Wi-Fi 爆炸/配置
出错/`pacman -Syu` 滚挂系统之类的原因会导致其中一块板子断网。通过连接两块板子的
串口，再在上面建立拨号上网连接，就可以在一块板子 Wi-Fi 或有线网中断时，从另一块
板子上 SSH 上去解决问题。

（另外买树莓派不折腾 GPIO 的话，还不如买个 x86 的凌动小主机之类的玩）

## 怎么操作

硬件方面，将两端的串口连接起来。树莓派的串口是第 8 根针发送，第 10 根针接收，可
以在 [pinout.xyz][1] 网站查到。Tinker Board 的串口也是 8 发送 10 接收。用两根杜
邦线将树莓派的针 8 连接到 Tinker Board 的针 10，将树莓派的针 10 连接到 Tinker
Board 的针 8。

![pinout.xyz 网站截图][2]

如果两块板子使用不同的电源供电（比如我），需要第三根杜邦线将两块板的 GND 连起
来。原因是两侧的板子都将自己 GND 针上的电压作为标准电压，读取的是发送/接收针相对
于 GND 的电压差，而不同电源输出的 GND 会有较大的差别，可能导致双方对信号的“理解”
不同。所以将两块板子的 GND 连接后，标准电压被统一，两块板子对信号就能“达成共识
”。对于树莓派和 Tinker Board，连接两侧的针 6 即可。

软件方面，先在两端安装 pppd 软件：

    apt-get install ppp
    pacman -S ppp

然后启动 pppd：

    # 一侧运行这条
    pppd -detach noauth /dev/ttyS1 1000000 172.18.233.1:172.18.233.2 local nocrtscts xonxoff
    # 另一侧运行这条
    pppd -detach noauth /dev/ttyS1 1000000 172.18.233.2:172.18.233.1 local nocrtscts xonxoff

pppd 参数解释：

-   -detach：让程序保持在前台运行。
-   noauth：不验证用户名密码。
-   /dev/ttyS1：串口在 Linux 下的设备文件，树莓派 3B 和 Tinker Board 默认都是
    ttyS1。
-   1000000：波特率，每秒发送的比特数，理论上波特率越高速度越快，但硬件也有支持
    上限。常用的波特率有：9600，38400，115200 等。经我测试 1000000 是我这两块板
    子能稳定通信的最大波特率。
-   172.18.233.1:172.18.233.2：这一端的 IP 和对面的 IP。
-   local：禁用“modem control lines”（根据 [PPPD(8) manual page][3]），是硬件流
    控的一种。硬件流控可以告知对方自己是否准备好接收/发送数据。如果不加，pppd 会
    等待 modem 给出“准备好了”的信号，但因为树莓派和 Tinker Board 都不支持硬件流
    控，pppd 永远不会收到这个信号，所以禁用。
-   nocrtscts：也是禁用硬件流控。
-   xonxoff：启用软件流控，通过在串口上给出特定信号来告知对方准备好接收/发送数
    据。

随后两块板子就可以 ping 通对方了。

## 速度怎么样

1000000 波特率下：

![iperf 结果][4]

emmmm……也就够 SSH 用用了。

[1]: https://pinout.xyz/
[2]: /usr/uploads/2019/01/3018000827.png
[3]: https://ppp.samba.org/pppd.html
[4]: /usr/uploads/2019/01/3298649142.png
