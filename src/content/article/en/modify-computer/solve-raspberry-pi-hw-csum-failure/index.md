---
title: 'Solving the Raspberry Pi HW CSum Failure Issue'
categories: Computers and Clients
tags: [Raspberry Pi]
date: 2018-01-25 23:18:00
autoTranslated: true
---


Today when I logged into my Raspberry Pi and ran `df` to check disk space as usual, I discovered the TF card was almost full. Initially I thought I had misconfigured settings, causing download files to save to the TF card instead of the external hard drive. After troubleshooting, I found that log files under `/var/log` occupied a staggering 18G of space. Checking the logs revealed continuous error messages like:

```bash
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143274] eth0: hw csum failure
... [original log content unchanged] ...
Jan 25 22:51:15 lantian-rpi3 kernel: [   22.143755] 3fe0: 76f2ace4 7e9b5cc0 76b29dd4 0006ac00 60000010 ffffffff
```

That is, the Raspberry Pi's Ethernet interface was generating massive errors, causing the kernel to continuously output stack traces that bloated the log files. Since my Raspberry Pi was used for on-campus PT seeding with sustained 5MB/s+ upload/download traffic, the log volume was substantial.

The "HW CSum" error refers to "Hardware Checksum Offloading" – a feature that offloads packet checksum verification to the NIC to reduce CPU usage. To troubleshoot, I disabled this feature using ethtool:

```bash
apt-get install ethtool
ethtool --offload eth0 rx off tx off
```

After disabling, `dmesg` stopped showing these errors. Re-enabling the feature:

```bash
ethtool --offload eth0 rx on tx on
```

Immediately caused the errors to reappear in `dmesg`, confirming HW CSum as the culprit.

While disabling HW CSum is a temporary fix, this should ideally be resolved through kernel/driver updates. However, after running `raspi-update` to update the kernel and drivers, the issue persisted, forcing me to keep HW CSum disabled.

Edit `/etc/network/interfaces.d/eth0` (create it if missing) and add:

```bash
allow-hotplug eth0
iface eth0 inet dhcp
    offload-rx off
    offload-tx off
```

This will automatically disable HW CSum via ethtool during system startup.
```
