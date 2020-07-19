---
title: '树莓派 3B 折腾笔记：硬件随机数发生器'
categories: 计算机与客户端
tags: [随机数发生器,Raspberry Pi]
date: 2017-10-30 20:13:25
---
随机数在计算机中有着十分重要的应用，例如常用的 SSL 加密算法就非常依赖随机数。如果随机数不够随机，就很有可能被攻击者猜到，相应的加密验证体系也就土崩瓦解。但是由于计算机说零是零、说一是一的特点，它没有办法产生真正的随机数，只能通过复杂的算法去尽可能模拟随机数。

在 Linux 系统上，由于 Linux “万物皆文件”的特点，可以从 `/dev/random` 读取到由 Linux 内核综合大量数据生成的随机数。但是因为 Linux 基于“安全第一”的原则综合了大量数据，随机数的产生速度很慢。用 rng-tools 软件包中的 rngtest 工具就可以看到：

```bash
lantian@lantian-rpi3:~ $ cat /dev/random | rngtest -c 1000
rngtest 2-unofficial-mt.14
Copyright (c) 2004 by Henrique de Moraes Holschuh
This is free software; see the source for copying conditions.  There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

rngtest: starting FIPS tests...
rngtest: bits received from input: 20000032
rngtest: FIPS 140-2 successes: 999
rngtest: FIPS 140-2 failures: 1
rngtest: FIPS 140-2(2001-10-10) Monobit: 0
rngtest: FIPS 140-2(2001-10-10) Poker: 1
rngtest: FIPS 140-2(2001-10-10) Runs: 0
rngtest: FIPS 140-2(2001-10-10) Long run: 0
rngtest: FIPS 140-2(2001-10-10) Continuous run: 0
rngtest: input channel speed: (min=167.862; avg=361.389; max=4358.681)Kibits/s
rngtest: FIPS tests speed: (min=2.087; avg=13.116; max=14.309)Mibits/s
rngtest: Program run time: 55507560 microseconds
```

`/dev/random` 的读取速度仅仅 361.389 Kbit/s（注意不是千字节）。在需要大量随机数的场景，程序就不得不等待 Linux 产生更多的随机数，造成严重的延迟卡顿。

但是很多时候我们并不需要如此随机的随机数。Linux 内核还提供了 `/dev/urandom`，它的算法更加简单，相比 `/dev/random` 有几万倍的速度加成：

```bash
lantian@lantian-rpi3:~ $ cat /dev/urandom | rngtest -c 1000
rngtest 2-unofficial-mt.14
Copyright (c) 2004 by Henrique de Moraes Holschuh
This is free software; see the source for copying conditions.  There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

rngtest: starting FIPS tests...
rngtest: bits received from input: 20000032
rngtest: FIPS 140-2 successes: 1000
rngtest: FIPS 140-2 failures: 0
rngtest: FIPS 140-2(2001-10-10) Monobit: 0
rngtest: FIPS 140-2(2001-10-10) Poker: 0
rngtest: FIPS 140-2(2001-10-10) Runs: 0
rngtest: FIPS 140-2(2001-10-10) Long run: 0
rngtest: FIPS 140-2(2001-10-10) Continuous run: 0
rngtest: input channel speed: (min=334.623; avg=2492.940; max=9536.743)Mibits/s
rngtest: FIPS tests speed: (min=5.508; avg=12.871; max=14.245)Mibits/s
rngtest: Program run time: 1492273 microseconds
```

速度是 2492.940 Mbit/s，相比 `/dev/random` 不知高到哪里去了。但是这个随机数不够随机，存在被攻击者猜到的可能。

如果无法在软件上解决这个问题，那么就可以加入硬件来解决。现在的主板基本上都内置了硬件随机数产生器，它们一般是通过主板的电气信号来产生随机数。由于主板上数据流量很大，电气信号一般很难预测，因此硬件随机数一般被认为是安全的。

树莓派 3B 的 Broadcom 芯片组也有硬件随机数产生器，可以在 `/dev/hwrng` 看到。它的性能如下：

```bash
lantian@lantian-rpi3:~ $ cat /dev/hwrng | rngtest -c 1000
rngtest 2-unofficial-mt.14
Copyright (c) 2004 by Henrique de Moraes Holschuh
This is free software; see the source for copying conditions.  There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

rngtest: starting FIPS tests...
rngtest: bits received from input: 20000032
rngtest: FIPS 140-2 successes: 999
rngtest: FIPS 140-2 failures: 1
rngtest: FIPS 140-2(2001-10-10) Monobit: 0
rngtest: FIPS 140-2(2001-10-10) Poker: 0
rngtest: FIPS 140-2(2001-10-10) Runs: 0
rngtest: FIPS 140-2(2001-10-10) Long run: 1
rngtest: FIPS 140-2(2001-10-10) Continuous run: 0
rngtest: input channel speed: (min=18.251; avg=1103.150; max=9765625.000)Kibits/s
rngtest: FIPS tests speed: (min=2.416; avg=13.004; max=14.341)Mibits/s
rngtest: Program run time: 20213577 microseconds
```

1103.150 Kbit/s，是 `/dev/random` 的三倍，反映到需要随机数的程序上就有了很大的性能提升。但是一般程序只认 `/dev/random`，不会去管硬件随机数发生器，怎么办？

前面说到，`/dev/random` 的速度很慢。Linux 为了解决这个问题，引入了一个“随机数池”：在不需要随机数的时候，Linux 也在后台根据运行的指令等等慢慢地收集随机数，放入 `/dev/random` 这个“池子”里；在突然需要大量随机数的时候就从池子里取，以应付短时突发的需求而不会卡顿。因此我们只要把 `/dev/hwrng` 的随机数也放进 `/dev/random` 这个池子里就可以了。需要的程序在 rng-tools 软件包里就有：

```bash
sudo apt-get install rng-tools
sudo nano /etc/default/rng-tools
# 添加以下内容
HRNGDEVICE=/dev/hwrng
RNGDOPTIONS="--fill-watermark=50% --feed-interval=1"
# 保存，最后运行以下命令
sudo service rng-tools restart
```

HRNGDEVICE 一行的意思是设置额外随机数的来源，这里我们指定到硬件随机数发生器。有些教程建议设置成 `/dev/urandom`，但是如我们之前所说，urandom 不够安全，这样设置会影响系统的安全性。

RNGDOPTIONS 中 --fill-watermark 是在池子里随机数不足时，一口气将随机数补到给定的容量，这里设置成 50%。不设置成 100%，是因为各家硬件厂商实现随机数发生器的方式不同，并且一般均不公开，存在硬件随机数产生器中含有不为人知的后门的可能性。如果填满，相当于完全信任了硬件随机数发生器，可能会有安全隐患。

--feed-interval 是池子到达指定容量后，缓慢填充池子的间隔时间，一般设为 1 就好。

这样设置后 `/dev/random` 产生随机数的效率就会大幅提升了。
