---
title: 'Interoperability between IPv4 and IPv6'
categories: Computers and Clients
tags: [Interoperability, IPv6, IPv4, Tinkering]
date: 2013-04-20 18:25:37
autoTranslated: true
---


IPv4 is currently the most widely supported network protocol, where computers are identified by IP addresses. Theoretically, it can accommodate up to $2^{32}$ network devices (IPv4: 8 hexadecimal digits). Unfortunately, these addresses have been exhausted, and it's truly a mystery how major ISPs allocate limited IP addresses to an infinite number of computers.

IPv6 is far more impressive, with each address containing 32 hexadecimal digits, allowing for $2^{128}$ network devices. These IP addresses will be more than sufficient before humanity perishes due to Earth's inability to sustain us. This protocol is championed by major internet companies including Google, DNSPod, and others. However, currently in China, IPv6 seems to be used only in universities, while ordinary households are limited to IPv4.

(Note: Even universities have incomplete implementations. Internationally, IPv4 and IPv6 are generally supported simultaneously, but within China's education network, only IPv6 is available.)

As IPv6 resources become increasingly abundant, we can leverage software solutions to access IPv6 before Chinese ISPs take action.

### 1. Miredo (Teredo) Section
Miredo appears to be a program developed by an open-source organization to achieve IPv4-IPv6 interoperability. Later, the protocol was adopted by Microsoft and integrated into Windows 7, with Microsoft also donating a server. Miredo can enable basic IPv4-IPv6 interoperability, but due to its extremely limited nodes, speeds are painfully slow.

```bash
sudo apt-get install miredo
sudo gedit /etc/miredo/miredo.conf
```

Modify the content to the following:

```bash
InterfaceName teredo
#ServerAddress teredo.ipv6.microsoft.com
ServerAddress teredo-debian.remlab.net
#ServerAddress teredo.managemydedi.com
BindPort 3545
```

The three ServerAddresses listed are the only remaining available servers: the first is Microsoft's, the second is the default (maintained by the open-source community), and the third is of unknown origin.

These servers are geographically distant from China, resulting in slow speeds. They can barely open Google and struggle with Baidu, making them suitable only for demonstration purposes.

After modification, execute:

```bash
sudo service miredo restart
ifconfig
```

Look for a network device named "teredo" – that's the one.

### 2. gogoCLIENT Section
gogoCLIENT was developed by the gogo6 website, which specializes in selling IPv6-compatible devices. They created gogoCLIENT and made it open-source. The drawback is that nodes remain scarce. Another issue: the gogo6 package in Ubuntu's repositories doesn't work, and manual compilation consistently fails.

Therefore, I installed an XP virtual machine using QEMU:

```bash
sudo apt-get install kvm qemu
qemu-img create -f raw winxp.img 4G
qemu-kvm -hda winxp.img -cdrom winxp.iso -boot d -m 1024 # Install system
```

Then download gogoCLIENT (requires registration):  
[http://www.gogo6.com/profile/gogoCLIENT](http://www.gogo6.com/profile/gogoCLIENT)

Install it in the virtual machine. After installation, open gogoCLIENT, change the Server Address to "hg.tfn.net.tw", and click Connect. Soon, you'll be connected to the IPv6 network. I recommend this method because gogo6 has more servers than Miredo. The Taiwanese server above offers fast speeds. Official alternatives include montreal.freenet6.net (Montreal), amsterdam.freenet6.net (Amsterdam), and taiwan.freenet6.net (Taiwan, which I couldn't connect to). Note: The first two require a username/password, obtainable via gogo6 registration (separate from account credentials).

Next, we'll route IPv6 to the host. First, solve QEMU autostart. To avoid a large window on the screen, I chose a VNC background desktop:

```bash
sudo apt-get install vnc4server
vncpasswd
# Enter password twice
wget http://www.zhujis.com/myvps/vncserver
sudo cp vncserver /etc/init.d/
sudo chmod +x /etc/init.d/vncserver
sudo update-rc.d vncserver defaults
# Credits: www.freehao123.com
vncserver
vncserver -kill :1
leafpad ~/.vnc/xstartup
# Add at the end:
# qemu-kvm -hda /path/to/winxp.img -m 1024 -smp 4 -localtime -usbdevice tablet -vga std -redir tcp:3389::3389 -redir tcp:1080::1080 &
# Do not add the "#" at the beginning!
# Notes: -m 1024 = RAM (MB), -smp 4 = CPU cores,
# -localtime uses current timezone, -usbdevice tablet fixes mouse bugs,
# -vga std expands resolution range, -redir forwards ports
# I enabled remote desktop (3389) – remove this parameter if unneeded!
sudo service vncserver restart
```

Connect to the VM using Remmina and install the proxy software Apache. (CCProxy doesn't support IPv6.)

First, install Apache 1.3. Then stop Apache 1.3 via the service manager, delete all files in C:\Program Files\Apache Group\Apache, and replace them with the following:

Note: The original Apache version has poor IPv6 support. Download my modified Apache 1.3 version, preconfigured for HTTP proxy.

Download: [/usr/uploads/2013/04/1343548325.7z](/usr/uploads/2013/04/1343548325.7z)

Start the service via the service manager. It should work immediately.

Set your host browser's proxy to HTTP 127.0.0.1:1080 and visit www.kame.net. The turtle animation should move – if not, your configuration has issues.
```
