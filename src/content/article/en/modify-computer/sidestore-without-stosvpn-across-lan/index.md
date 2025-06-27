---
title: 'Using SideStore without StosVPN across your LAN'
categories: 'Computers and Clients'
tags: [SideStore, StosVPN, iOS]
date: 2025-06-27 00:47:31
---

## Foreword

[SideStore](https://github.com/SideStore/SideStore) is a commonly used iOS app sideloading tool that allows you to install third-party apps bypassing the App Store. It works by using your Apple ID to obtain a free Apple developer certificate, which is then used to sign the app you want to install, allowing it to run normally on your iOS device.

However, to maintain control over the iOS ecosystem, Apple prevents third-party app stores from using developer certificates to bypass restrictions on a large scale, setting a 7-day expiration period for developer certificates. Users need to regularly obtain new developer certificates and re-sign their apps to continue using the third-party apps they have installed.

Traditional sideloading tools, such as AltStore, rely on software like iTunes on a computer for the re-signing process. But unlike other sideloading tools, SideStore only requires computer assistance for the initial installation. After installation, SideStore can simulate a computer with iTunes installed, allowing the iOS system to communicate with it through a virtual network, thus achieving the effect of re-signing apps and even installing new third-party apps without a computer.

SideStore's virtual network can generally be implemented in the following two ways:

- WireGuard: SideStore can create a WireGuard server on the device itself. Users can install a WireGuard client and connect to this server, allowing the iOS system to communicate with the simulated computer over the network.
  - The disadvantage of this method is that due to iOS system limitations, when the iPhone/iPad is using cellular data, the WireGuard client cannot connect to the WireGuard server created locally by SideStore. Therefore, SideStore only works properly when the device is connected to Wi-Fi.
  - Also, since the iOS system only supports connecting to one VPN at a time, if the user needs to use another VPN software, they have to manually switch between VPNs, which is quite troublesome.
- [StosVPN](https://github.com/SideStore/StosVPN): A dedicated VPN client developed by the SideStore team that works exclusively for SideStore.
  - Compared to WireGuard, StosVPN is not affected by iOS restrictions and can work normally when the device is using cellular data. However, after trying it out, I found that StosVPN often disconnects automatically and cannot stay in the background for a long time. If the iOS device is not used for a while and StosVPN disconnects, and SideStore and other third-party apps fail to renew in time, you will have to find a computer to sign these apps again.
  - Also, since StosVPN is also a VPN, it is also subject to the iOS's limitation of only supporting one VPN connection at a time.

So I wanted to try to analyze the working principles of SideStore/StosVPN to see if I could integrate them into my home network or ZeroTier SDN network, allowing SideStore to refresh normally without extra VPN configuration.

## How StosVPN Works

According to [StosVPN's packet processing logic](https://github.com/SideStore/StosVPN/blob/main/TunnelProv/PacketTunnelProvider.swift), StosVPN roughly does the following:

- Assigns IP address `10.7.0.0` to the iOS device, and configure iOS to send packets for `10.7.0.0/24` to StosVPN.
- Defines an IP address `10.7.0.1`, where StosVPN will simulate a computer with iTunes installed.
- For each packet:
  - If the packet is sent from `10.7.0.0` to `10.7.0.1`, swap the source and destination IP addresses, to send the packet back to the iOS device.

This logic is quite simple. SideStore essentially opens some ports locally on the iOS device, simulating a computer with iTunes installed. Suppose iOS creates a connection like this when trying to connect to the simulated computer:

```bash
TCP 10.7.0.0:12345 -> 10.7.0.1:54321
```

Then WireGuard or StosVPN will swap the source and destination IP addresses (but not the port numbers), rewrite the packet as follows, and send it back to the iOS device:

```bash
TCP 10.7.0.1:12345 -> 10.7.0.0:54321
```

From the iOS device's perspective, this is a new TCP connection from `10.7.0.1`, unrelated to the previous connection sent to the computer. Since the port iOS is trying to connect to (`54321` in this case) should be an iTunes port, and SideStore simulates iTunes locally, SideStore should be listening on port `54321` at this time and receiving the data.

After SideStore's simulated iTunes logic processes the data and generates a reply:

```bash
TCP 10.7.0.0:54321 -> 10.7.0.1:12345
```

WireGuard or StosVPN will again swap the source and destination IP addresses:

```bash
TCP 10.7.0.1:54321 -> 10.7.0.0:12345
```

This reply packet matches the initial connection sent to the simulated computer. iOS therefore believes it has received a reply from iTunes on the computer, and thus continues updating the developer certificate.

## Simulating StosVPN's Working Logic with Nftables

Now understanding how StosVPN works, we just need to mimic its logic in our own network.

If you only have a few iOS devices, and they are all assigned static IP addresses, and you have a router running OpenWrt or another Linux system, you can simply use the following Nftables rules:

```bash
table inet sidestore {
  chain RAW_PREROUTING {
    type filter hook prerouting priority raw; policy accept;

    # Replace 192.168.0.xxx here with your iOS device's IP address
    ip saddr 192.168.0.123 ip daddr 10.7.0.1 ip saddr set 10.7.0.1 ip daddr set 192.168.0.123 notrack;
    ip saddr 192.168.0.234 ip daddr 10.7.0.1 ip saddr set 10.7.0.1 ip daddr set 192.168.0.234 notrack;
    # Add more rules as needed
  }
}
```

The purpose of the above rules is that if a packet is received from your iOS device (`192.168.0.123` or `192.168.0.234`) destined for `10.7.0.1` (the virtual computer), it changes the packet's source IP to `10.7.0.1` (the virtual computer) and the destination IP to your iOS device (`192.168.0.123` or `192.168.0.234`), and then sends it out. The `notrack` here disables connection tracking, which prevents Linux from matching these packets to previously received packets and connection tracking entries, which could make the rules ineffective.

Since Nftables does not support using packet source/destination IP addresses as variables, it's not possible to achieve the purpose of "swapping source and destination addresses" with a single set of rules. Therefore, we need to add a rule for each iOS device. If you have a small number of iOS devices, you can write a separate rule for each device's IP address. However, if you have many devices, or if they don't have static IP addresses, you will need to write a rule for every IP address in your home network segment, which can be very troublesome. Also, if your router does not support Nftables or similar firewall functions and cannot rewrite packets in a similar way, you cannot achieve this functionality.

## SideStore VPN Tool

If you cannot use the above method, I have also written a small program that implements the above logic: [SideStore VPN Tool](https://github.com/xddxdd/sidestore-vpn). It can create a TUN interface on a Linux device, listen for packets destined for `10.7.0.1`, and process these packets with the same logic as StosVPN.

To use this tool in your network, you need a device running Linux (such as a Raspberry Pi or a virtual machine), connect it to the same LAN as your iOS devices, and set a static IP address. Since the packets rewritten by the tool can be seen as a new connection from this Linux device to the iOS device, there should be no firewall or NAT between the iOS device and this Linux device, otherwise this new connection will be blocked, preventing SideStore's simulated computer from receiving requests normally.

Then, perform the following steps:

1. Enable IP Forwarding on the Linux device:

```bash
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. Install Rust and Cargo on the device.

3. Run the following commands to install and start the SideStore VPN Tool:

```bash
git clone https://github.com/xddxdd/sidestore-vpn.git
cd sidestore-vpn
cargo build --release
sudo target/release/sidestore-vpn
```

The SideStore VPN Tool will create a TUN device called `sidestore` and set up system routes to send all traffic destined for `10.7.0.1` to the tool for processing.

4. Add a static route on your main router:

```
Route: 10.7.0.1/32
Subnet Mask (if needed): 255.255.255.255
Gateway: The IP address of the Linux device mentioned earlier.
```

To minimize IP conflicts, this static route only affects a single IP address, `10.7.0.1`. However, if your router does not support creating /32 routes, you can adjust the subnet mask to expand the scope of this routing rule, as long as it does not conflict with other devices:

```
Route: 10.7.0.0/24
Subnet Mask (if needed): 255.255.255.0
Gateway: The IP address of the Linux device mentioned earlier.
```

5. Ping `10.7.0.1` from any device on the LAN. It should now be reachable.

6. Disconnect WireGuard or StosVPN on your iOS device, and then try refreshing apps with SideStore. SideStore should now be able to refresh certificates normally even without a VPN.
