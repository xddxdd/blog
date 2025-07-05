---
title: 'Installing and Upgrading ESXi on Kimsufi Dedicated Server and Setting Up a Software Router'
categories: Website and Servers
tags: [Kimsufi, ESXi]
date: 2018-06-06 17:22:00
image: /usr/uploads/2018/06/4190919588.png
autoTranslated: true
---


Kimsufi is a budget brand under French company OVH, specializing in renting high-performance servers at extremely affordable prices. I personally rent the KS-4C model, featuring an i5-2400 processor, 16GB RAM, 2TB HDD, 100Mbps unmetered bandwidth, for just 13 euros/month. Its exceptional value makes it perfect for running virtual machines for experiments.

VMware ESXi (now also called vSphere Hypervisor) and Proxmox VE are two popular operating systems specifically designed for virtualization, both available for free. Crucially, Kimsufi's control panel offers one-click installations for both systems. However, during my usage, I found that Proxmox VE frequently suffered from unresponsive remote VM connections (VNC black screens) or keystroke loss (especially critical during password entry) under poor network conditions, so I switched to ESXi.

This led to another issue: ESXi isn't a full-fledged Linux/FreeBSD system and lacks comprehensive NAT functionality, meaning it can't run multiple VMs behind one IP address with port forwarding. However, since Kimsufi provides both IPv4 and IPv6 addresses, we can assign the IPv4 to a VM while configuring ESXi to use IPv6, then set up that VM to handle NAT.

This is precisely what we'll accomplish in this article.

## Why I Wrote This Article

Because I encountered numerous issues during configuration:

1. The command-line online upgrade method for ESXi 5.0 no longer works and throws errors;
2. While ESXi 6's web interface is convenient for daily VM management (no client required), it contains bugs when configuring ESXi network settings.

## Installing ESXi

The ESXi version provided by Kimsufi is extremely outdated (5.0), while the latest version at the time of writing was 6.7. Therefore, we must upgrade immediately after installation. However, due to VMware's policy changes, the following online upgrade method no longer works:

```bash
esxcli software profile update -p ESXi-6.5.0-20170702001-standard -d https://hostupdate.vmware.com/software/VUM/PRODUCTION/main/vmw-depot-index.xml
```

Running this command on ESXi 5.0 results in XML format errors. Thus, we must use an offline installation package for local upgrading. But ESXi's wget doesn't support HTTPS, requiring an intermediate VPS for transfer.

Detailed steps:

1. Connect via a proxy VPS (Shadowsocks) since VMware's download site verifies IP addresses.
2. Visit [https://my.vmware.com/group/vmware/patch#search][1], select ESXi 6.0.0 (5.0 cannot upgrade directly to 6.5), click search to view patches:  
   ![VMware Patch List][2]
3. Scroll down to find any patch with a filename like `update-from-esxi6.0-6.0_update03`:  
   ![Target Patch][3]
4. Copy the download link, wget it on the VPS. After downloading, start an HTTP server on the VPS, then wget again from ESXi.
5. Click the KBxxxxxx link in the third column (KB2148155 in the image above).
6. Scroll down to the Image Profiles section on the new page:  
   ![Image Profiles][4]  
   The name like `ESXi-6.0.0-20170202001-standard` is the target version name.
7. Run in ESXi's SSH:
```bash
esxcli software profile update -d [absolute_path_to_downloaded_zip] -p [version_name]
```
Example:
```bash
esxcli software profile update -d /vmfs/volumes/datastore1/update-from-esxi6.0-6.0_update03.zip -p ESXi-6.0.0-20170202001-standard
```
Press Enter to execute the upgrade, then reboot.
8. Return to Step 2, select version 6.5.0 (no 6.7 upgrade file available at writing time), repeat the process.

After completing these steps, we have ESXi version 6.5.

## Configuring IPv6

Our goal is to assign IPv6 to ESXi and IPv4 to VMs. However, ESXi's web interface fails to save network settings properly, requiring CLI operations:

1. Log into ESXi, enable IPv6 and reboot:
```bash
esxcli network ip set -e true
```
2. Enable IPv6 on the default NIC:
```bash
esxcli network ip interface ipv6 set -e true -r false -i vmk0
```
3. Assuming your server's IPv6 is `2001:41d0:1:234::1`, your gateway is `2001:41d0:1:2ff:ff:ff:ff:ff` (refer to Kimsufi's IPv6 tutorials). Add two IPv6 addresses: your assigned IP and a random address in the same /64 subnet to allow gateway recognition:
```bash
esxcli network ip interface ipv6 address add -i vmk0 -I 2001:41d0:1:234::1
esxcli network ip interface ipv6 address add -i vmk0 -I 2001:41d0:1:2ff:12:34:56:78
```
4. Set default gateway:
```bash
esxcli network ip route ipv6 add -g 2001:41d0:1:2ff:ff:ff:ff:ff -n default
```
5. Ping from another IPv6-enabled VPS to confirm connectivity before proceeding.
6. If your local network lacks IPv6, consider using Cloudflare to proxy the server's IPv6 address for easier management.

## Installing Software Router

I use pfSense as the software router. First download the pfSense ISO to ESXi (HTTP supported, no proxy needed):
```bash
cd /vmfs/volumes/datastore1
wget http://frafiles.pfsense.org/mirror/downloads/pfSense-CE-2.4.3-RELEASE-amd64.iso.gz
gunzip pfSense-CE-2.4.3-RELEASE-amd64.iso.gz
```
In the web panel:  
- Go to Networking > Virtual Switches, create a new vSwitch.  
- Under Port Groups, create a port group connected to this switch (this will be the internal network for VMs):  
  ![New Port Group][5]  
To allow ESXi to join the internal network:  
- Create another port group connected to the same switch:  
  ![Second New Port Group][6]  
- Under VMkernel NICs, create a virtual NIC connected to this port group with "Management" service:  
  ![ESXi Joining Internal Network][7]  
Copy the physical NIC's MAC address from the Physical NICs page. Since the datacenter binds IPs to MACs, we'll configure the VM to spoof the server's MAC address.

Create the VM normally. Note:  
- Set the first NIC's MAC to match the physical NIC, connecting it to "VM Network" (external network).  
- If connected via IPv4, ESXi management will disconnect briefly when the router boots (normal during IP conflict).  
- The router can now ping externally but TCP connections will reset. Next, disable ESXi's IPv4 to resolve the conflict.

## Disabling IPv4

⚠️ High-risk operation! If IPv6 isn't working and IPv4 is disabled, the server becomes inaccessible (requires reinstall)! Double-check IPv6 functionality first!

From an IPv6-enabled VPS, SSH into the server and run:
```bash
esxcli network ip interface ipv4 set -i vmk0 -t none
```
The software router should now have normal internet access.

To connect ESXi to the internal network:  
- In the web panel (VMkernel NICs), modify the manually created vNIC's IP to match the internal network:  
  ![Modifying vNIC Address][8]  
- Run in ESXi SSH:
```bash
esxcli network ip route ipv4 add -g [internal_gateway_ip] -n default
```
Example:
```bash
esxcli network ip route ipv4 add -g 172.18.254.1 -n default
```
ESXi can now access IPv4 sites through the software router.

[1]: https://my.vmware.com/group/vmware/patch#search
[2]: /usr/uploads/2018/06/4190919588.png
[3]: /usr/uploads/2018/06/162530643.png
[4]: /usr/uploads/2018/06/85829824.png
[5]: /usr/uploads/2018/06/1606507342.png
[6]: /usr/uploads/2018/06/4199878051.png
[7]: /usr/uploads/2018/06/1501702341.png
[8]: /usr/uploads/2018/06/3509596894.png
```
