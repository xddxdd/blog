---
title: 'Building a VLAN in School Network: Low-Cost High-Speed Private Intranet'
categories: Website and Servers
tags: [VLAN]
date: 2020-01-13 22:31:07
image: /usr/uploads/202001/linux-network-manager-vlan.png
autoTranslated: true
---


Like most universities across the country, my university provides network access with a "one person, one account" policy. When connecting via wired network or Wi-Fi, all requests are temporarily redirected to a login page (i.e., Captive Portal), and only after entering the username and password can one access the internet. This practice is standard in most public places (such as airports, coffee shops) and is relatively friendly to devices like computers and smartphones. However, devices without a display (such as Raspberry Pi, ESP8266, etc.) have difficulty accessing the network.

For systems like Raspberry Pi and ESP8266 that can run custom code, it is possible to simulate form submissions to log into the network. However, if the program that simulates the form submission encounters an issue, you have to manually disconnect the device, connect it to your computer, and upload a new login program, which is a very cumbersome process. As for other smart devices that can only run predetermined programs, they are completely unable to connect to the network. Since I do not have devices like smart lamps, this article will only consider smart devices that can run one of the three major operating systems: Windows, macOS, or Linux, including computers and single-board computers (SBC).

Additionally, there are a few minor issues:

- There is only one network port in my dorm room for me to use, and I need to share it among my various devices.
- My university allows one account to log in to multiple devices, and the bandwidth is calculated independently for each device.
  - Suppose my account has a speed limit of 10 Mbps; then if I connect three devices, each device can get 10 Mbps of bandwidth.

I eventually purchased a gigabit switch and set up a VLAN by configuring each device, creating an intranet. This intranet is not subject to the school network's login requirement; as long as the device is configured for the VLAN, it can immediately communicate with other devices in the same VLAN upon connection. If a device has issues and cannot log into the school network, I can manage it via this VLAN.

- Why not buy a router?
  - Because it's **expensive**. I bought a Mercury mini 5-port gigabit switch for only 39 yuan; a 5-port gigabit router would cost over a hundred yuan.
  - Moreover, a router cannot achieve **independent bandwidth for each device**. The network topology below the router is not transparent to the upper-layer gateway; it is generally considered as a single device, sharing the aforementioned 10 Mbps bandwidth. In contrast, a switch only forwards packets and exposes each device to the upper-layer gateway, allowing each device to log in independently and enjoy dedicated bandwidth.
  - However, if you need to connect non-programmable smart devices (like smart lamps), spending more on a router is the **most convenient** option.
- Will it interfere with the school network?
  - The switch may forward VLAN-tagged packets to the school's gateway. However, without special configuration, since packets from the end network port should not carry VLAN tags, the school gateway will generally discard these packets directly, without interfering with any device.
  - It cannot be ruled out that some abnormal network behavior management systems might detect VLAN packets and ban your account. You can only try it yourself or consult your school's IT department.

## Required Materials

1. A 5-port gigabit switch.
   - As mentioned, the Mercury 5-port gigabit switch I used costs 39 yuan, purchased from Tmall.
   - If you want to save more money, there are 19 yuan 5-port 100Mbps switches on Taobao. But since it's already 2020, **it is not recommended at all** to buy 100Mbps network products.
2. Sufficient network cables to connect the switch to the school's network interface and to each device.
   - For gigabit speeds, you can buy any Cat 6 network cable on Taobao.
   - For 100Mbps speeds, any Cat 5e network cable on Taobao will do.
   - In theory, Cat 5e cables can also handle gigabit bandwidth, but they suffer from more severe signal interference. Coupled with possible corner-cutting in manufacturing, Cat 5e cables may become unstable at gigabit speeds after some time, even downgrading to 100Mbps.
     - I have a Cat 5e cable that initially supported gigabit. After prolonged use, although a cable tester shows all 8 wires are connected, the network cards take half a minute to negotiate and then only stabilize at 100Mbps.
3. Choose a number between 1 and 4094 (inclusive) as your VLAN ID (Tag).

## How to Connect

Connect any port of the switch to the school's network interface, then connect the remaining ports to each device.

Unlike a router, a (dumb) switch requires no configuration at all, and all ports are completely equivalent; you can swap them in any order.

## VLAN Configuration for Windows Devices

Windows itself does not support VLANs, but some network cards provide their own configuration utilities to create virtual network adapters.

My Windows computer uses a Realtek network card and can be configured using the `Realtek Ethernet Diagnostic Utility`. This tool can be found on [Realtek's download page (English)](https://www.realtek.com/en/component/zoo/category/network-interface-controllers-10-100-1000m-gigabit-ethernet-pci-express-software); download the `Diagnostic Program for Win7/Win8/Win10` item.

This tool has a VLAN option; simply add your previously chosen VLAN ID:

![Realtek Ethernet Diagnostic Utility VLAN Interface](/usr/uploads/202001/rtl8168-vlan.png)

(Image from [this article on Gough's Tech Zone](https://goughlui.com/2018/10/01/note-multiple-vlan-operation-on-realtek-rtl8111d-nic-others/))

Afterwards, a virtual network card will appear in the system's network options; just configure the IP address.

## VLAN Configuration for macOS

macOS allows adding VLAN virtual network cards directly in the network options.

Go to `Network Preferences`, click the gear icon at the bottom left, and select `Manage Virtual Interfaces`:

![macOS Manage Virtual Interfaces](/usr/uploads/202001/macos-manage-virtual-interfaces.png)

Then click the plus sign at the bottom left to create a new VLAN (`New VLAN`):

![macOS Create VLAN](/usr/uploads/202001/macos-new-vlan.png)

Then enter your VLAN ID (Tag), select the corresponding network card, and save:

![macOS VLAN Configuration](/usr/uploads/202001/macos-vlan-config.png)

Finally, configure the IP for the new virtual network card to use it.

## VLAN Configuration with Linux Network Manager

Network Manager is the network management software used by most Linux systems with a graphical interface, such as Ubuntu and Debian. It can manage various connection types, including wired, Wi-Fi, VPN, etc.

Network Manager has native support for VLANs, and the configuration is extremely simple. Go to `Edit Connections`, create a new network connection, and select VLAN as the type:

![Linux Network Manager Creating VLAN Network](/usr/uploads/202001/linux-network-manager-new-vlan.png)

Then, as usual, select the physical network card and VLAN ID (Tag):

![Linux Network Manager VLAN Details](/usr/uploads/202001/linux-network-manager-vlan.png)

## Configuration for Linux Systemd-networkd

Systemd-networkd is a network management program that comes with Systemd, typically used on devices with fixed network conditions, such as servers. Network Manager is rarely used on these devices.

Assuming your physical network card is `eth0`, first modify the configuration file for `eth0`, usually `/etc/systemd/network/20-eth0.network`:

```ini
[Network]
...
VLAN=eth0-vlan (add this line)
...
```

Then create the network device definition file `/etc/systemd/network/30-eth0-vlan.netdev` with the following content:

```ini
[NetDev]
Name=eth0-vlan
Kind=vlan

[VLAN]
Id=1234 (replace with your VLAN ID)
[Match]
Name=eth0-vlan
```

Then create `/etc/systemd/network/30-eth0-vlan.network` to specify the IP:

```ini
[Network]
DHCP=no

[Address]
Address=192.168.0.1/24
```

Finally, restart Systemd-networkd:

```bash
systemctl restart systemd-networkd
```

The VLAN network is now configured.

## After Configuration

After configuring each device, as long as they are connected to this switch, they can directly access each other using the VLAN's IP addresses.

If your school's network isolation is poorly implemented, it might be possible to access your VLAN from a network interface in another dorm room or even another building. However, such cases are rare, and if they occur, it indicates a certain security vulnerability in the school's network.
```
