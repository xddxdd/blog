---
title: '(Self-built NTP) Using PPS on Tinker Board'
categories: Website and Servers
tags: [NTP, GPS]
date: 2019-09-16 22:20:20
image: /usr/uploads/2019/09/2438465593.png
autoTranslated: true
---


In the [previous article][1], I built a self-hosted NTP server using Tinker Board and an ATGM336H GPS/BeiDou module, with GPS as the time reference. In addition to the traditional serial output of NMEA sentences, the GPS module also provides a PPS signal that changes once per second. Originally, gpsd needed to continuously parse NMEA sentences from the GPS module, which took considerable time and was prone to being preempted by other processes, causing delay and jitter. The PPS signal, however, can directly trigger a CPU interrupt to run a simple handler at high priority, unaffected by other programs.

Typically, Linux kernel provides native driver support for PPS. But in the previous setup, since Armbian Linux kernel on Tinker Board lacked PPS support, we couldn't enable it directly.

## Solution 1: Recompile the Kernel

If the kernel lacks support, recompile it with the required feature.

[This post on the Tinker Board forum][2] provides a kernel patch that adds PPS support. After applying the patch and compiling the kernel, connect the PPS signal to pin 22 to use it.

However, recompiling the Armbian kernel is complex (requiring a specific OS like Ubuntu 18.04, cross-compilation tools, etc.) and cannot be packaged as a deb file (which might be overwritten by system updates). Therefore, I opted for an alternative approach:

## Solution 2: Using User-Space Programs

Without kernel support, user-space programs can provide a solution. The program at [https://github.com/flok99/rpi_gpio_ntpd][3] reads signals from a specified GPIO pin and sends them to ntpd for time synchronization.

User-space programs face an issue: like gpsd, they can be interrupted by other processes, affecting accuracy. To address this, the program sets itself to real-time scheduling (`SCHED_RR`) during startup. Simply put, real-time scheduled programs have the highest priority, responding to events immediately and (almost) never being interrupted.

Another issue arose: when I compiled and ran this program, I encountered the error `sched_setscheduler() failed: Operation not permitted` even as root. Research revealed that Docker uses cgroup functionality, which conflicts with priority settings. Details can be found in [this StackOverflow post][4] and [this RedHat Bugzilla discussion][5].

The solution is to prevent the program from self-configuring real-time scheduling during startup. Instead, after launching, add the program to the main cgroup and then adjust its priority. The specific operations can be seen in [https://github.com/xddxdd/rpi_gpio_ntpd/blob/master/systemd/rpi_gpio_ntp.service][6]. The modified program is available at [https://github.com/xddxdd/rpi_gpio_ntpd][7].

If Docker isn't used, the original program can be used directly.

After downloading the program, install it with `make && make install`. Then in `/etc/default/gps0`, set ORIG_DEVICE to the corresponding serial port (I used `ttyS1`):

    ORIG_DEVICE="ttyS1"

In `/etc/default/rpi_gpio_ntp`, configure the GPIO pin. Here, 171 corresponds to pin 22 on Tinker Board (check with `gpio readall`):

    # Configuration file for rpi_gpio_ntp.service

    # Shared memory segment to communicate on
    SHMSEG=1

    # GPIO pin to listen on
    # 4 for Adafruit Ultimate GPS HAT for Raspberry Pi
    GPIO=171

    # Other options, if any
    OPTS=

![Tinker Board GPIO][8]

Start the PPS service:

    systemctl enable gps0 rpi_gpio_ntp
    systemctl start gps0 rpi_gpio_ntp

Add PPS configuration to `/etc/ntp.conf`:

    # PPS reference
    server 127.127.28.1 minpoll 4 maxpoll 4 prefer
    fudge  127.127.28.1 refid PPS

Restart NTP service:

    systemctl restart ntp

Run `ntpq -pn` to see PPS with minimal jitter:

![ntpq -pn Result][9]

[1]: /en/article/modify-website/diy-gps-based-ntp-server.lantian
[2]: https://tinkerboarding.co.uk/forum/thread-594.html
[3]: https://github.com/flok99/rpi_gpio_ntpd
[4]: https://unix.stackexchange.com/questions/207762/why-sudo-user-can-use-sched-setscheduler-sched-rr-while-root-can-not/511261#511261
[5]: https://bugzilla.redhat.com/show_bug.cgi?id=1467919
[6]: https://github.com/xddxdd/rpi_gpio_ntpd/blob/master/systemd/rpi_gpio_ntp.service
[7]: https://github.com/xddxdd/rpi_gpio_ntpd
[8]: /usr/uploads/2019/09/901961425.png
[9]: /usr/uploads/2019/09/2438465593.png
```
