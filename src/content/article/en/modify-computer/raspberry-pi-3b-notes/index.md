---
title: 'Raspberry Pi 3B Tinkering Notes'  
categories: Computers and Clients
tags: [Raspberry Pi]  
date: 2017-10-13 19:39:00  
image: /usr/uploads/2017/10/1043578273.jpg
autoTranslated: true
---


During the National Day holiday, I purchased a Raspberry Pi 3B and a bunch of sensors from Taobao to start some projects. Due to holiday shipping delays, all components arrived piecemeal days after the vacation ended.

First, a photo of the completed setup:

![Final Setup][1]

I ordered from five different stores:

1. Raspberry Pi 3B (with case, fan, heatsinks, power supply)
2. SanDisk 32GB TF card  
3. Raspberry Pi sensor kit (3.3V compatible, 16 sensors total)  
4. 5-inch 800x480 touchscreen  
5. DS3231 RTC module and GPIO pin labels (purchased later)  

## Raspberry Pi Unit

The Pi 3B arrived first. However, the TF card hadn't arrived yet, leaving the Pi unusable. I proceeded to assemble the case and cooling system.

Encountered an issue: The case's internal support pillars were misaligned. I resolved this by cutting off two obstructing pillars with scissors:

![Modified Case][2]

The heatsinks used double-sided tape, which I suspect might hinder heat dissipation. The fan (connected to 5V and GND pins) felt more like a placebo effect.

## TF Card Setup

The TF card arrived the next day. Flashed Raspbian Lite using:

```bash
sudo dd bs=1m if=raspbian.img of=/dev/rdisk2 conv=sync
```

Inserted into Pi and powered on.

## School Network Challenges

Faced three hurdles:
1. Campus wired/WiFi required web login
2. Eduroam WiFi used WPA2-EAP enterprise auth
3. No display/keyboard for initial setup

Workaround: Shared internet from Windows PC via Ethernet. Used `arp -a` to find Pi's IP (192.168.137.xxx) and connected via PuTTY.

## Eduroam Configuration

Copied Android's wpa_supplicant configuration for Eduroam:

```json
network={
    ssid="eduroam"
    key_mgmt=WPA-EAP IEEE8021X
    eap=PEAP
    identity="username"
    password="password"
    phase2=""
}
```

## Port Forwarding

Used free ngrok services initially, then switched to self-hosted frp on Tencent Cloud for stable SSH access. Also deployed ZeroTier One for VPN connectivity.

## Sensor Integration

First test with DHT11 temp/humidity sensor:
- VCC: Pin 1 (3.3V)
- GND: Pin 9  
- DATA: GPIO7 (wPi pin 7)

Used pre-built Python library from [szazo/DHT11_Python][6]:

```bash
Last valid input: 2017-10-13 18:37:13.232685
Temperature: 22 C
Humidity: 63 %
```

## Touchscreen Setup

5" 800x480 display required config tweaks:

**/boot/config.txt**
```ini
disable_overscan=1
framebuffer_width=800
framebuffer_height=480
hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=87
hdmi_cvt=800 480 60 6 0 0 0
dtoverlay=ads7846,penirq=22,speed=100000,xohms=150
dtparam=spi=on
```

**/etc/lightdm/lightdm.conf**
```bash
display-setup-script=xrandr --output default --mode 800x480
```

Installed touch drivers and configured long-press right-click:

```ini
Section "InputClass"
    Identifier    "calibration"
    MatchProduct    "ADS7846 Touchscreen"
    Option    "Calibration"    "254 3911 153 3962"
    Option    "SwapAxes"    "0"
    Option "EmulateThirdButton" "1"
    Option "EmulateThirdButtonTimeout" "700"
    Option "EmulateThirdButtonMoveThreshold" "100"
EndSection
```

## Wired Network Automation

Script for campus network login:

```bash
#!/bin/bash
ping -c 1 -W 1 114.114.114.114 >/dev/null 2>/dev/null
if [ $? -eq 1 ]
then
    curl http://login-page --connect-timeout 1 -F "key1=value1" -F "key2=value2"
fi
```

Added to crontab for periodic checks.

## NAS Implementation

Mounted external HDD and configured Netatalk for Time Machine:

**/etc/netatalk/afp.conf**
```ini
[Global]
vol preset = default_for_all
log file = /var/log/netatalk.log
uam list = uams_dhx2.so,uams_clrtxt.so
save password = no

[TimeMachine]
time machine = yes
spotlight = no
path = /mnt/timemachine
```

Mac configuration:
```bash
defaults write com.apple.systempreferences TMShowUnsupportedNetworkVolumes 1
sudo tmutil setdestination "afp://user:pass@pi/Time Machine"
```

## DS3231 RTC Module

Replaced fake-hwclock with hardware RTC:

**/boot/config.txt**
```ini
dtoverlay=i2c-rtc,ds3231
```

Commands:
```bash
sudo hwclock -w  # Write system time to RTC
sudo hwclock -r  # Read RTC time
```

## Conclusion

Current setup includes basic environmental monitoring and NAS functionality. Future plans include expanding sensor integration and building a monitoring dashboard. While fun for tinkering, the Pi's hardware limitations (USB 2.0, 100Mbps Ethernet) make it unsuitable for serious NAS use.

[1]: /usr/uploads/2017/10/1043578273.jpg  
[2]: /usr/uploads/2017/10/2196120410.jpg  
[3]: https://www.raspberrypi.org/downloads/raspbian/  
[4]: /usr/uploads/2017/10/3108261224.jpg  
[5]: https://github.com/fatedier/frp/blob/master/README_zh.md  
[6]: https://github.com/szazo/DHT11_Python  
[7]: https://monal.im/netatalk/  
[8]: https://samuelhewitt.com/blog/2015-09-12-debian-linux-server-mac-os-time-machine-backups-how-to  
[9]: /usr/uploads/2017/10/972854234.jpg
