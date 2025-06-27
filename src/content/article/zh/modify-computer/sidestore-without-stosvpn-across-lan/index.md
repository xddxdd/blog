---
title: '在内网中免 StosVPN 使用 SideStore'
categories: 计算机与客户端
tags: [SideStore, StosVPN, iOS]
date: 2025-06-27 00:47:31
---

## 前言

[SideStore](https://github.com/SideStore/SideStore) 是一款常用的 iOS 应用侧载工具，可以绕过 App Store 安装第三方应用。它的工作原理是用你的 Apple ID 获取免费的苹果开发者证书，给你要安装的应用签名，从而让应用可以在 iOS 设备上正常运行。

然而，苹果为了维护其对 iOS 生态系统的控制，阻止第三方应用商店使用开发者证书大规模地绕过限制，对开发者证书设置了 7 天的过期时间。用户需要定期获取新的开发者证书，重新给应用签名，才能一直使用自己安装的第三方应用。

传统的侧载工具，例如 AltStore，都依赖电脑上的 iTunes 等软件进行重新签名的操作。但 SideStore 与其它侧载工具不同，它只有首次安装时需要电脑辅助。安装完成后，SideStore 可以自己模拟一台安装了 iTunes 的电脑，让 iOS 系统通过虚拟网络与其通信，从而实现无需电脑就能给应用重新签名，甚至安装新的第三方应用的效果。

SideStore 的虚拟网络一般可以用下面两种方式实现：

- WireGuard：SideStore 可以在本机上创建一个 WireGuard 服务器。用户可以自行安装 WireGuard 客户端，并连接到这个服务器上，从而让 iOS 系统可以通过网络和模拟出的电脑通信。
  - 这种方法的缺点是，受到 iOS 系统限制，当 iPhone/iPad 通过移动网络上网时，WireGuard 客户端是连不上 SideStore 本地创建的 WireGuard 服务器的。因此，SideStore 只有在设备连接到 Wi-Fi 时才能正常工作。
  - 同时，由于 iOS 系统只支持同时连接一个 VPN，如果用户需要使用别的 VPN 软件，就只能手动切换 VPN，操作比较麻烦。
- [StosVPN](https://github.com/SideStore/StosVPN)：是 SideStore 团队开发的专用 VPN 客户端，只能用于 SideStore。
  - 相比于 WireGuard，StosVPN 不会受到 iOS 的限制，可以在设备通过移动网络上网时正常工作。但是我试用后发现，StosVPN 无法长时间保持在后台运行，经常会自动断开。如果有一段时间没有使用 iOS 设备，同时 StosVPN 断开了连接，SideStore 以及其它第三方应用没能及时续期，就只能重新连接电脑，给这些应用签名了。
  - 同时，由于 StosVPN 也是 VPN，它同样受到 iOS 系统只支持同时连接一个 VPN 的限制。

于是我就想尝试分析 SideStore/StosVPN 的工作原理，看看能不能把它们集成到我的家庭网络或者 ZeroTier SDN 网络里，让 SideStore 无需额外的 VPN 配置就能正常刷新。

## StosVPN 的工作原理

根据 [StosVPN 的关键数据包处理逻辑](https://github.com/SideStore/StosVPN/blob/main/TunnelProv/PacketTunnelProvider.swift)，StosVPN 大致做了以下几件事：

- 给 iOS 设备分配 IP `10.7.0.0`，让 iOS 把 `10.7.0.0/24` 这个网段的数据包发送到 StosVPN。
- 定义了一个 IP `10.7.0.1`，StosVPN 将在这个 IP 上模拟装了 iTunes 的电脑。
- 对于每个数据包：
  - 如果数据包是从 `10.7.0.0` 发给 `10.7.0.1` 的，就交换数据包的来源和目标 IP，从而把数据包发回给 iOS 设备。

这个逻辑看起来很简单，实际上也一点都不复杂。实际上，SideStore 就是在 iOS 设备本地打开了一系列端口，模拟安装了 iTunes 的电脑。假设 iOS 在尝试连接模拟出的电脑时创建了这样一条连接：

```bash
TCP 10.7.0.0:12345 -> 10.7.0.1:54321
```

那么 WireGuard 或者 StosVPN 就会交换来源和目标 IP（但不交换端口号），将数据包改写成以下的样子并发回 iOS 设备：

```bash
TCP 10.7.0.1:12345 -> 10.7.0.0:54321
```

从 iOS 设备看来，这是一条从 `10.7.0.1` 发来的新 TCP 连接，与上一条发往电脑的连接没什么关系。由于 iOS 尝试连接到的端口（此处以 `54321` 示例）应当是 iTunes 的端口，而 SideStore 又在本地模拟了 iTunes，所以 SideStore 此时也应在监听 `54321` 端口，并收到了数据。

SideStore 模拟 iTunes 的逻辑处理完数据，并生成一个回复：

```bash
TCP 10.7.0.0:54321 -> 10.7.0.1:12345
```

WireGuard 或者 StosVPN 又会交换来源和目标 IP：

```bash
TCP 10.7.0.1:54321 -> 10.7.0.0:12345
```

这一个回复数据包就对上了最开始发往电脑的连接。iOS 因此认为自己收到了电脑上 iTunes 的回复，从而继续更新开发者证书。

## 用 Nftables 模拟 StosVPN 的工作逻辑

了解了 StosVPN 的工作原理，我们只需要在自己的网络里模仿它的工作逻辑就可以了。

如果你只有少量的 iOS 设备，并且给它们都分配了固定 IP，而且有一台运行 OpenWrt 或其它 Linux 系统的路由器，你直接用以下 Nftables 规则就可以了：

```bash
table inet sidestore {
  chain RAW_PREROUTING {
    type filter hook prerouting priority raw; policy accept;

    # 此处 192.168.0.xxx 改成你的 iOS 设备的 IP
    ip saddr 192.168.0.123 ip daddr 10.7.0.1 ip saddr set 10.7.0.1 ip daddr set 192.168.0.123 notrack;
    ip saddr 192.168.0.234 ip daddr 10.7.0.1 ip saddr set 10.7.0.1 ip daddr set 192.168.0.234 notrack;
    # 可以按需添加更多的规则
  }
}
```

上述规则的用途是，如果收到了来自你的 iOS 设备（`192.168.0.123` 或 `192.168.0.234`）发往 `10.7.0.1`（虚拟电脑）的数据包，就把数据包的源 IP 改成 `10.7.0.1`（虚拟电脑），目标 IP 改成你的 iOS 设备（`192.168.0.123` 或 `192.168.0.234`），然后发送出去。此处的 `notrack` 是关闭连接跟踪，防止 Linux 用这些数据包去匹配之前收到的数据包和连接跟踪条目，导致规则不生效。

由于 Nftables 不支持将数据包的来源/目标 IP 等信息用作变量，无法用一组规则实现“交换来源和目标地址”的目的，所以我们需要给每台 iOS 设备都添加一条规则。如果你的 iOS 设备比较少，可以给每个设备的 IP 都单独写一条规则。但如果你的设备很多，或者没有固定 IP，你就需要给家庭网段内的每一个 IP 都写一条规则，非常麻烦。同时，如果你的路由器不支持 Nftables 或类似的防火墙功能，无法用类似的方式改写数据包，也无法实现这样的功能。

## SideStore VPN 工具

如果你无法使用上面的方法，我也写了一个实现上述逻辑的小工具：[SideStore VPN 工具](https://github.com/xddxdd/sidestore-vpn)。它可以在 Linux 设备上创建一个 TUN 接口，监听发往 `10.7.0.1` 的数据包，并用和 StosVPN 相同的逻辑处理这些数据包。

要在你的网络内使用这个工具，你需要准备一台运行 Linux 的设备（例如树莓派或者虚拟机），将它连接到 iOS 设备所在的同一个内网中，并设置一个固定 IP。由于工具改写后的数据包可以看作是从这个 Linux 设备向 iOS 设备的一条新连接，所以 iOS 设备和这个 Linux 设备之间不能有防火墙或者 NAT，否则这条新连接会被拦截，导致 SideStore 的模拟电脑无法正常收到请求。

然后，执行以下操作：

1. 在 Linux 设备上开启 IP 转发（IP Forwarding）：

```bash
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. 在设备上安装 Rust 和 Cargo。

3. 运行以下命令，安装并启动 SideStore VPN 工具：

```bash
git clone https://github.com/xddxdd/sidestore-vpn.git
cd sidestore-vpn
cargo build --release
sudo target/release/sidestore-vpn
```

SideStore VPN 工具会创建一个名为 `sidestore` 的 TUN 设备，并设置系统路由将发往 `10.7.0.1` 的流量全部交给工具处理。

4. 在你的主路由器上添加一条静态路由：

```
路由: 10.7.0.1/32
子网掩码 (如果需要): 255.255.255.255
网关: 前文中 Linux 设备的 IP 地址。
```

为了最大限度地避免 IP 冲突，这条静态路由只影响 `10.7.0.1` 一个 IP 地址。但如果你的路由器不支持创建 /32 路由，你可以调整子网掩码，扩大这条路由规则的影响范围，只要不与其他设备冲突即可：

```
路由: 10.7.0.0/24
子网掩码 (如果需要): 255.255.255.0
网关: 前文中 Linux 设备的 IP 地址。
```

5. 用内网中的任何一个设备 Ping `10.7.0.1`，此时应该可以 Ping 通。

6. 在你的 iOS 设备上断开 WireGuard 或者 StosVPN，然后用 SideStore 尝试刷新应用。现在即使不开 VPN，SideStore 应该也可以正常刷新证书了。
