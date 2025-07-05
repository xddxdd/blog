---
title: 'Building a GPS-based NTP Server'
categories: Website and Servers
tags: [NTP, GPS]
date: 2019-09-16 21:01:00
image: /usr/uploads/2019/09/61107773.png
autoTranslated: true
---


## What is NTP

NTP (Network Time Protocol) is the most widely used internet time synchronization protocol. Common operating systems like Windows, macOS, and Linux come with built-in NTP clients that connect to remote servers to obtain the current time. For example, Windows' Internet time synchronization feature is based on NTP:

![Windows Internet Time Synchronization][1]

(Image source: Internet)

By default, Windows connects to `time.windows.com`, an NTP server maintained by Microsoft. However, this server performs poorly in mainland China. Located in the US, it suffers from high and unstable latency, making it difficult for NTP clients to obtain accurate time.

Are there NTP servers in mainland China? Yes, but not many:

- cn.pool.ntp.org
  - An NTP server pool project maintained by [www.pool.ntp.org][2], with servers provided by volunteers. DNS load balancing distributes requests across different servers in various regions.
  - As of September 16, 2019, there are 63 servers in the CN pool (though not all are located domestically).
  - Additional servers can be accessed via `0.cn.pool.ntp.org`, `1.cn.pool.ntp.org`, etc.
- cn.ntp.org.cn
  - An NTP server pool maintained by V2EX user qiuai, with some servers self-hosted and others provided by volunteers.
  - The website [www.ntp.org.cn][3] is currently undergoing ICP filing, but the NTP service remains available.
- ntp.ntsc.ac.cn
  - NTP server operated by the National Time Service Center of the Chinese Academy of Sciences.
- ntp[1-7].aliyun.com
  - Alibaba Cloud's NTP servers, totaling 7 servers.
  - Previously used domains like `time.pool.aliyun.com` and `time[1-7].aliyun.com` may still work.
- time[1-5].cloud.tencent.com
  - Tencent Cloud's NTP servers, totaling 5 servers.

## Purposes of Building Your Own NTP Server

1. **Specialized environments requiring extreme time precision**:
   - Finance (e.g., high-frequency trading)
   - Aerospace
   - Scientific research
   - Cross-region data synchronization
2. **Ensuring time service availability**:
   - Self-hosted servers are more reliable than volunteer-maintained NTP servers
   - Avoid service disruptions due to server failures or attacks
   - Maintain device time synchronization during internet outages
3. **It's fun, isn't it?**

## Required Equipment and Materials

- A Linux computer with a serial port:
  - Raspberry Pi is a great choice (Raspberry Pi 0 costs ~¥60 on Taobao if only used for NTP)
  - Or a desktop computer with a USB-to-serial adapter (e.g., CH340 module, ~¥5 on Taobao)
  - I used a Tinker Board. For GPS module configuration (optional), a serial adapter was also used (see image below)
  - ![CH340 USB-to-Serial Adapter][4]
- A GPS module:
  - If you used smartphones (e.g., Nokia Symbian) or navigators (Windows CE) for navigation ~10 years ago, you might have a USB/Bluetooth GPS receiver that can be reused.
  - Otherwise, search Taobao for ATGM336H (tri-band GPS/BeiDou/GLONASS module, ~¥30):
    - Currently (Sept 2019) the cheapest tri-band module on Taobao
    - Some sellers label it as dual-band (GPS/BeiDou), but GLONASS can be enabled via configuration software
    - The model I purchased is shown below
    - ![ATGM336H Module][5]
- A high-gain active GPS antenna:
  - Not needed if you live on a rooftop or can place the module outdoors without obstructions
  - **Highly recommended** if placing near a window or indoors, as ceramic antennas struggle to acquire satellites
  - Costs ~¥10 on Taobao (see image below)
  - ![GPS Antenna][6]
  - For SMA connector antennas (like above) with ATGM336H's IPX port, buy an SMA-to-IPX adapter cable.
- Female-to-female Dupont wires for connecting GPS module to computer:
  - Available for a few yuan on Taobao.

## GPS Module Installation and Configuration

First, connect the GPS module's serial port. The ATGM336H operates at 3.3V, so it can connect directly to Tinker Board:
- Module VCC → Pin 17 (3.3V power)
- Module GND → Pin 20 (ground)
- Module RX → Pin 8 (UART1 TX)
- Module TX → Pin 10 (UART1 RX)
- Module PPS → Pin 22

![Tinker Board Pinout][7]

Log into Tinker Board (I used Armbian OS). Run `armbian-config`, enable all `uart` options under **System > Hardware**, then reboot.

Install gpsd to process GPS data:
```bash
apt-get install gpsd gpsd-clients
```

Edit `/etc/default/gpsd` with these settings:
```ini
START_DAEMON="true"
USBAUTO="false"
DEVICES="/dev/ttyS1"
GPSD_OPTIONS="-n -b"
```
This enables gpsd, specifies the serial port (`ttyS1`), starts positioning immediately, and prevents configuration changes.

Start gpsd:
```bash
systemctl enable gpsd
systemctl start gpsd
```
Run `cgps` to view location and satellite status:

![GPS Satellite Acquisition][8]

## NTP Server Configuration

Disable the basic systemd-timesyncd client:
```bash
systemctl disable systemd-timesyncd
systemctl stop systemd-timesyncd
```

Install the full-featured NTP server:
```bash
apt-get install ntp
```

Add GPS configuration to `/etc/ntp.conf`:
```conf
# GPS Serial data reference
server 127.127.28.0 minpoll 4 maxpoll 4
fudge 127.127.28.0 time1 0.0 refid GPS
```

Start the NTP service:
```bash
systemctl enable ntp
systemctl start ntp
```
Check status with `ntpq -pn`:

![NTP Status][9]

## Areas for Improvement

1. **Not utilizing high-precision PPS signal**:
   - Armbian kernel for Tinker Board lacks PPS support.
   - Requires kernel recompilation or user-space processing.

Update: This issue was resolved in a follow-up article. Click here: [/article/modify-website/diy-ntp-pps-on-tinker-board.lantian][10]

[1]: /usr/uploads/2019/09/51126337.jpg
[2]: http://www.pool.ntp.org
[3]: http://www.ntp.org.cn
[4]: /usr/uploads/2019/09/4242908871.jpg
[5]: /usr/uploads/2019/09/2614025970.jpg
[6]: /usr/uploads/2019/09/354608019.jpg
[7]: /usr/uploads/2019/09/2308734009.png
[8]: /usr/uploads/2019/09/32557744.png
[9]: /usr/uploads/2019/09/61107773.png
[10]: /en/article/modify-website/diy-ntp-pps-on-tinker-board.lantian
```
