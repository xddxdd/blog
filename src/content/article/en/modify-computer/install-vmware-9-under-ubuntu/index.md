---
title: 'Installing VMware Workstation 9 on Ubuntu'
categories: Computers and Clients
tags: [Tinkering]
date: 2013-02-13 10:40:59
autoTranslated: true
---


The VirtualBox in Ubuntu's software repositories is becoming increasingly unreliable. Previously, it could at least be installed, but now it fails even to install. The version from the official source works, but it pulls down a massive bundle of KDE components—by the time VirtualBox finishes installing, KDE is practically installed too. So I decided to try VMware instead.

Download address:  
[http://download.pchome.net/system/sysenhance/download-10771.html](http://download.pchome.net/system/sysenhance/download-10771.html)

The downloaded file has a `.bundle` extension, which is VMware's installer. However, you can't run it directly—we first need to grant it execute permissions:

```bash
chmod +x VMware-Workstation-Full-9.0.0-812388.i386.bundle
sudo ./VMware-Workstation-Full-9.0.0-812388.i386.bundle
```

Remember to adjust the filename accordingly.

The installer will launch as a setup wizard—just click "Next" all the way through. After installation, it's not over yet. When I opened VMware via the shortcut, it immediately popped up an error: "Cannot find the header files matching your current Linux kernel. Please manually specify the directory..."

I promptly ran `apt-get install linux-headers` in the terminal, but it indicated they were already installed. I clicked "Browse"—the default directory was `/usr/src`, which seemed to have complete Linux header files. Why couldn't it find them? After some Googling, I discovered that the version file for Linux kernel 3.7 had been moved, so VMware couldn't locate it in the original path.

(Note: Ubuntu vanilla users shouldn't encounter this issue since the default kernel is 3.5. My Ubuntu was upgraded to 3.7 via PPA.)

The solution is simple: create a symbolic link back:

```bash
ln -s /usr/src/linux-headers-3.7.0-7/include/generated/uapi/linux/version.h /usr/src/linux-headers-3.7.0-7/include/linux/version.h
ln -s /usr/src/linux-headers-3.7.0-7-generic/include/generated/uapi/linux/version.h /usr/src/linux-headers-3.7.0-7-generic/include/linux/version.h
```

(Note: If your Linux kernel version updates later, remember to replace `3.7.0-7` with your actual kernel version.)

After reopening VMware, it started normally and prompted that it was compiling kernel modules. Two minutes later, the compilation completed. I created a virtual machine, loaded the Windows 8 ISO, and clicked "Start". Suddenly, my screen went black, filled with a wall of VMware kernel driver debug messages...

I pressed Ctrl+Alt+F8, then Ctrl+Alt+F7 to return to the X session. VMware showed an error: "Cannot find a valid peer process to connect to." Most likely, the peer process had crashed—definitely a kernel compatibility issue.

Another Google search led me to:  
[Solution for VMware Workstation 9 causing kernel 3.5 (including latest Ubuntu) to crash](http://forum.ubuntu.org.cn/viewtopic.php?f=65&t=391262).  
It provided a patch.

The described symptoms matched mine closely, so I gave it a try. After downloading the patch:

```bash
tar xjfv vmware9_kernel35_patch.tar.bz2
cd vmware9_kernel3.5_patch
sudo ./patch-modules_3.5.0.sh
```

During patching, the VMware drivers recompiled. After completion, I reopened VMware and clicked "Start"—the issue was resolved. The Windows 8 flag appeared on my screen.
```
