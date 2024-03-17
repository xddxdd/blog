---
title: Notes on Setting Up NAS+Router on Old HP Workstation
categories: 'Random Notes'
tags: [HP, NAS, Router]
date: 2023-03-26 15:05:19
---

I purchased an old HP workstation to use as a NAS and router at my home. This
post is a short note of my process of setting it up.

## Hardware Choice

For a NAS, you usually have these hardware choices:

-   Ready-to-use NAS (e.g. Synology)
    -   Pros: ready to use out of the box.
    -   Cons:
        -   Expensive, to the extent of "free hardware for software purchase".
        -   Harder to customize, when comparing the stock operating system with
            various Linux distributions.
-   Second-hand servers
    -   Pros:
        -   Cheap. Most servers are thrown away by datacenters once their
            warranty ends, and are obtained at minimum cost, refurbished and
            then resold.
        -   Stable. These servers are built to last, and are used in a
            datacenter with controlled temperature, humidity and no dust.
    -   Cons：
        -   Noise. In order to lower the fan speed, you need to modify system
            settings, replace with quieter fans, and/or install a separate fan
            speed controller.
        -   Large (mainly concerning rack-mount servers).
        -   Proprietary parts. Server manufacturers customize their components
            only for specific models. You will need to purchase these parts at
            extra cost if you want to extend your system.
-   Second-hand workstations
    -   Pros:
        -   Cheap and stable, just like second-hand servers.
        -   Lower noise. After all, workstations are meant to be used near
            office desktops rather than datacenters.
    -   Cons:
        -   Proprietary parts, same as second-hand servers.\
-   DIY from regular PC parts
    -   Pros:
        -   Customize to your exact need.
    -   Cons:
        -   Worse performance-to-price ratio compared to second-hand servers and
            workstations.
        -   Stability of customer-facing parts may be worse than business-facing
            servers and workstations.

And I have these requirements for my NAS:

-   I want to use Jellyfin video transcoding, H265 if possible. This requires a
    6th gen (Skylake) or newer Intel CPU with integrated graphics, or an NVIDIA
    graphics card.
-   Other than that, I don't have any needs on performance (except very low
    power CPUs like Intel Atom series).
-   Low noise. I'm currently living in a studio apartment, and the NAS will be
    in the same room where I sleep.
-   I don't like ready-to-use NAS operating systems. I want to install NixOS and
    customize it.
-   As cheap as it can get.

Based on the requirements above, I chose to purchase a second-hand workstation.
Since I'm in the United States at the moment, I purchased a refurbushed HP
workstation on eBay for $50. It's key specifications are:

-   Model: HP Z220 SFF
-   CPU: Intel E3-1225 v2
-   RAM: 4GB DDR3
-   HDD: 250GB Spinning Disk
-   PSU: 240W
-   Three PCI-E slots, one x16, one x4, and one x1.
-   One PCI slot.

## Storage

The first thing to consider for a NAS is data storage.

This workstation has 4 SATA ports, two 3.5 inch HDD slots, and one 5 inch DVD
drive slot (with a DVD drive in it). I removed the original hard drive, and
installed two brand new 16TB drives as data storage. I plan to set them up in a
RAID-1 array first, and then expand to RAID-5 with an extra drive when I run out
of capacity. ZFS doesn't support conversion from RAID-1 to RAID-5, and ZFS's
kernel module often fails on kernel upgrades due to its out-of-mainline status.
Btrfs, on the other hand, has major stability issues with its RAID-5 feature,
and could easily cause a data loss. Therefore, I ended up with Btrfs + LVM
RAID-1, and chose the more flexible LVM for the RAID layer.

I also installed a 180GB Intel 520 SSD as the boot drive. Although it's an old
drive, it only costs $15, almost as cheap as it gets for SSDs on eBay. In
addition, it uses MLC NANDs which last longer than current TLC NANDs. This drive
will only hold NixOS's system files (in `/nix`), and some configuration files
that are backed up to cloud storage everyday. Therefore, I'm not worried of data
loss of this drive.

In addition, I set up [Bees](https://github.com/Zygo/bees) to deduplicate data
on Btrfs. After RAID-1 of my two drives, I have a usable storage space of
approximately 14.6TB. To effectly deduplicate them, Bees needs 2GB RAM to create
a hash table of data on drive. With some additional services running, I quickly
ran out of memory with the original 4GB RAM. Therefore, I spent an additional
$40 on 16GB of DDR3 ECC-UDIMM RAM sticks.

## Router

This workstation will directly connect to the ISP modem, and act as the main
router at my home. I don't plan to use OpenWRT, or other Linux distributions
designed for routers. Instead, I want to set up packet forwarding and NAT
directly on NixOS. Enabling packet forwarding is just a few lines of sysctl
settings:

```nix
{
  boot.kernel.sysctl = {
    "net.ipv4.conf.all.forwarding" = lib.mkForce 1;
    "net.ipv4.conf.default.forwarding" = lib.mkForce 1;
    "net.ipv4.conf.*.forwarding" = lib.mkForce 1;
    "net.ipv6.conf.all.forwarding" = lib.mkForce 1;
    "net.ipv6.conf.default.forwarding" = lib.mkForce 1;
    "net.ipv6.conf.*.forwarding" = lib.mkForce 1;
  };
}
```

NAT, on the other hand, requires setting up the firewall. I used Nftables for
the purpose, and my (simplified) configuration is:

```bash
table inet lantian {
  # LAN IPv4 address range
  set RESERVED_IPV4 {
    type ipv4_addr
    flags constant,interval
    elements = { 10.0.0.0/8, 172.16.0.0/12,
                 192.0.0.0/24, 192.0.2.0/24,
                 192.168.0.0/16, 198.18.0.0/15,
                 198.51.100.0/24, 203.0.113.0/24,
                 233.252.0.0/24, 240.0.0.0/4 }
  }

  # LAN IPv6 address range
  set RESERVED_IPV6 {
    type ipv6_addr
    flags constant,interval
    elements = { 64:ff9b::/96,
                 64:ff9b:1::/48,
                 2001:2::/48,
                 2001:20::/28,
                 2001:db8::/32,
                 fc00::/7 }
  }

  chain NAT_POSTROUTING {
    type nat hook postrouting priority srcnat + 5; policy accept;
    # NAT all packets from LAN IPv4 addresses to WAN
    ip saddr @RESERVED_IPV4 oifname @INTERFACE_WAN masquerade
    # NAT all packets from LAN IPv6 addresses to WAN
    # This only handles packets with a private source IP, not affecting devices with public IPv6
    ip6 saddr @RESERVED_IPV6 oifname @INTERFACE_WAN masquerade
  }
}
```

Then, enable MiniUPnPd to allow clients to set up port forwarding as needed:

```nix
{
  services.miniupnpd = {
    enable = true;
    upnp = true;
    natpmp = true;
    internalIPs = ["192.168.0.1"];
    externalInterface = "eth-wan";
  };
}
```

Finally, set up IP addressing and DHCP server on the LAN port:

```nix
{
  systemd.network.networks.eth-lan = {
    matchConfig.PermanentMACAddress = "12:34:56:12:34:56";
    address = ["192.168.0.1/24"];
    networkConfig = {
      DHCP = "no";
      DHCPServer = "yes";
    };
    dhcpServerConfig = {
      PoolOffset = 10;
      PoolSize = 200;
      EmitDNS = "yes";
      DNS = ["8.8.8.8"];
    };
  };
}
```

Apply the config, run `networkctl reload`, and the clients can now access the
Internet.

## Video Transcoding

As a SFF (small form factor) workstation, HP Z220 SFF can only use low profile
PCI-E expansion cards (with a height of 8cm) rather than standard expansion
cards (with a height of 12cm). In addition, the power supply with a mere 240W
output has no extra wiring for GPU power supply, meaning that I cannot use GPUs
with high performance and high power consumption.

Initially I purchased a NVIDIA Quadro P400 for $40, with a TDP of 30W. The
performance of this card is extremely weak, similar to the NVIDIA GT 1010 which
few have heard off. It's even worse than a GT 1030! However, it comes with the
same video encoding/decoding circuits as the entire 10 series GPUs,
[and has support for H265 10-bit video encoding](https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new).
Other than different GPU core frequency, Quadro P400 has the exact same video
transcoding performance as other 10 series GPUs. Therefore, Quadro P400 is the
choice of many NAS DIYers on Reddit.

After obtaining the GPU and testing it, I found that it can, indeed, transcode
4K HEVC videos, at a speed of 60 FPS. But once I enable Jellyfin's tone-mapping
feature, the transcoding speed lowers to 10-20 FPS, causing stuttery video
playback. Tone-mapping is used to convert the special color space (like HDR or
Dolby Vision) to the standard SDR color space, so they can be correctly
displayed on devices without HDR support. Jellyfin's tone-mapping implementation
relies on GPU's 3D processing units, and the Quadro P400 is quite lacking in 3D
performance, causing the bottleneck.

I later replaced the GPU with a NVIDIA Tesla P4, with a TDP of 50W. Although
it's a Tesla series card geared towards science computations, it still has
support for video transcoding, with the same circuits as 10 series GPUs. This
card sells on eBay for around $100, but since it's passively cooled, you need to
spend an extra $20 on fans and shrouds to cool it in a regular workstation.

Testing shows that this GPU can transcode videos to 4K 80Mbps at around 60 FPS,
with tone-mapping enabled. This completely satisfies my requirement on video
transcoding. The only downside is that, with no standard computer fan pinouts on
the HP Z220 SFF motherboard, I have to power the fan with a USB 5V to 12V
voltage step-up cable, and run the fan at maximum speed at all time. This
creates a bit of noise, but I personally find it acceptable.

As a bonus, NVIDIA Tesla P4 also supports NVIDIA GRID, creating virtual GPUs for
virtual machines. But NVIDIA GRID requires a special host driver lacking 3D and
video transcoding support, causing my Jellyfin video transcodes to fail.
Therefore, I went with the regular GPU driver for now.
