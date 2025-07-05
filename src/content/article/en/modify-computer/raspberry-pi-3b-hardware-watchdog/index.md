---
title: 'Raspberry Pi 3B Tinkering Notes: Hardware Watchdog'
categories: Computers and Clients
tags: [Raspberry Pi]
date: 2018-02-12 22:46:18
autoTranslated: true
---


In computing, a "watchdog" refers to a hardware timer designed to restart a computer when it becomes unresponsive (crashes). The computer's operating system must run a program that continuously communicates with the watchdog hardware. When communication is interrupted for a preset duration, the watchdog will forcibly reboot the system by sending a RESET signal or cutting and restoring power, ensuring services running on the computer aren't disrupted for extended periods.

During my Raspberry Pi tinkering, I've crashed it multiple times, forcing manual power cycling to restart. Enabling the hardware watchdog feature on the Raspberry Pi can minimize such occurrences.

## Loading the Driver

Thanks to Linux's "everything is a file" philosophy, you can directly check the watchdog driver status using the ls command:

```bash
ls /dev/watchdog
```

If this file exists, proceed to the next section. If not, load the driver based on your Raspberry Pi model:

1. Raspberry Pi 1st gen driver: bcm2708_wdog
2. Raspberry Pi 2nd gen driver: bcm2709_wdog
3. Raspberry Pi 3rd gen driver: bcm2835_wdt

Load the driver using `modprobe -v [driver_name]`, then recheck with `ls /dev/watchdog`. If successful, configure the driver to load at boot by editing `/etc/modules` and adding the driver name on a new line.

## Installing Communication Software

As mentioned, the hardware watchdog requires software communication to monitor system status. On Raspbian, this software is `watchdog`, installable via apt-get:

```bash
apt-get install watchdog
```

Then, enable it to start at boot:

```bash
systemctl enable watchdog
```

Edit the configuration file `/etc/watchdog.conf` with these changes:

1. Uncomment `#max-load-1 = 24` (remove the leading `#`). This reboots the system if the 1-minute load average exceeds 24 (extremely high).
2. Uncomment `#watchdog-device = /dev/watchdog` to set the watchdog path.
3. Add `watchdog-timeout = 15` to reboot after 15 seconds of unresponsiveness. The maximum value for Raspberry Pi 3B is 15. Avoid setting it too low to prevent reboot loops.

Save changes and restart the service:

```bash
service watchdog restart
```

The watchdog feature is now active.

## Testing

Simulate a system crash by terminating the watchdog service:

```bash
pkill -9 watchdog
pkill -9 wd_keepalive
```

After 15 seconds, the Raspberry Pi will automatically reboot.
```
