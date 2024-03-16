---
title: '（自建 NTP）在 Tinker Board 上使用 PPS'
categories: 网站与服务端
tags: [NTP,GPS]
date: 2019-09-16 22:20:20
image: /usr/uploads/2019/09/2438465593.png
---
在[前一篇文章][1]中，我使用 Tinker Board 和 ATGM336H GPS/北斗模块自建了 NTP 服务器，以 GPS 作为时间基准。GPS 模块除了提供传统的串口输出 NMEA 语句之外，还额外提供了一个 PPS 信号，这个信号会每秒变化一次。原本 gpsd 需要不断解析 GPS 模块传来的 NMEA 语句，需要耗费不短的时间，并且容易被其它程序抢占运行时间，产生 delay（延迟）和 jitter（波动）。而 PPS 信号可以直接触发 CPU 的中断，运行一个简单的处理程序，让操作系统以高优先级处理，不会被其它程序影响。

一般而言，在 Linux 中，PPS 由内核直接提供驱动支持。但是在前文中，由于 Tinker Board 的 Armbian Linux 内核没有提供 PPS 支持，所以我们没法直接开启。

解决方法 1：重新编译内核
---------------------

如果内核没有对应支持，那就重新编译内核，加上功能就好。

[Tinker Board 论坛上的这篇帖子][2]中提供了一个内核补丁，为内核加上了 PPS 支持。打上补丁、编译内核后，将 PPS 信号连到第 22 针，就可以使用了。

但是由于 Armbian 重新编译内核的过程比较复杂（需要指定的操作系统（Ubuntu 18.04），交叉编译环境等等），而且似乎不能打成 deb 包（容易被后续系统更新覆盖），所以我不打算这么做。我选择了另一种方法：

解决方法 2：使用用户态程序
----------------------

如果内核中不提供支持，那就可以用用户态的程序解决。[https://github.com/flok99/rpi_gpio_ntpd][3] 这个程序就可以读取指定针脚上的信号，并且发送给 ntpd 用于授时。

但是用户态程序有一个问题：它和 gpsd 一样，容易被其它程序打断，影响准确度。为了解决这个问题，这个程序在启动时，会将自己设置成实时调度（SCHED_RR）。简单来说，实时调度下的程序拥有最高的优先级，永远第一时间响应事件，并且（几乎）永远不会被打断。

又有一个问题出现了：我在编译了这个程序尝试运行时，出现了 `sched_setscheduler() failed: Operation not permitted` 这个错误，而我已经是以 root 用户运行。经过查找，发现 Docker 会使用 cgroup 功能，而 cgroup 会与此处优先级设置出现冲突。具体信息可以查看 [StackOverflow 上的这篇帖子][4] 和 [RedHat Bugzilla 上的这篇讨论记录][5]。

总之，解决方案就是，让程序启动时不要自己将自己设置成实时调度。在程序启动后，将程序加入主要 cgroup 中，再修改优先级。具体的操作可以在 [https://github.com/xddxdd/rpi_gpio_ntpd/blob/master/systemd/rpi_gpio_ntp.service][6] 看到，修改后的程序也可以在 [https://github.com/xddxdd/rpi_gpio_ntpd][7] 这里获得。

如果你不用 Docker，也可以直接使用原版程序。

下载程序后，直接 `make && make install` 安装，然后在 `/etc/default/gps0` 中，将 ORIG_DEVICE 设置为对应的串口，我用的是 `ttyS1`：

    ORIG_DEVICE="ttyS1"

然后在 `/etc/default/rpi_gpio_ntp` 中设置 GPIO 针脚，此处 171 对应 Tinker Board 上的 22 针，具体对应关系可以运行 `gpio readall` 查看：

    # Configuration file for rpi_gpio_ntp.service
    
    # Shared memory segment to communicate on
    SHMSEG=1
    
    # GPIO pin to listen on
    # 4 for Adafruit Ultimate GPS HAT for Raspberry Pi
    GPIO=171
    
    # Other options, if any
    OPTS=

![Tinker Board GPIO][8]

随后启动 PPS 程序：

    systemctl enable gps0 rpi_gpio_ntp
    systemctl start gps0 rpi_gpio_ntp

在 `/etc/ntp.conf` 中加入 PPS 配置：

    # PPS reference
    server 127.127.28.1 minpoll 4 maxpoll 4 prefer
    fudge  127.127.28.1 refid PPS

重新启动 NTP 服务：

    systemctl restart ntp

然后运行 `ntpq -pn` 就可以看到 PPS 了，它的 jitter（波动）特别小：

![ntpq -pn 结果][9]


  [1]: /article/modify-website/diy-gps-based-ntp-server.lantian
  [2]: https://tinkerboarding.co.uk/forum/thread-594.html
  [3]: https://github.com/flok99/rpi_gpio_ntpd
  [4]: https://unix.stackexchange.com/questions/207762/why-sudo-user-can-use-sched-setscheduler-sched-rr-while-root-can-not/511261#511261
  [5]: https://bugzilla.redhat.com/show_bug.cgi?id=1467919
  [6]: https://github.com/xddxdd/rpi_gpio_ntpd/blob/master/systemd/rpi_gpio_ntp.service
  [7]: https://github.com/xddxdd/rpi_gpio_ntpd
  [8]: /usr/uploads/2019/09/901961425.png
  [9]: /usr/uploads/2019/09/2438465593.png