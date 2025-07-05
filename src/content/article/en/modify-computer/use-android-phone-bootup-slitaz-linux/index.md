---
title: 'Booting SliTaz Linux Using an Android Phone'
categories: Computers and Clients
tags: [SliTaz, boot, Android, phone, Linux]
date: 2013-07-23 20:52:40
image: /usr/uploads/2013/07/3392244635.jpg
autoTranslated: true
---


For Android phone users, almost everyone knows that connecting your phone to a computer via USB allows it to function as a USB drive for file storage. But did you know that an Android phone can also be used to boot Linux on a computer?

First, let's discuss computer booting.  

When you press the power button, components like the CPU and memory receive power and begin executing a pre-installed program on the motherboard called BIOS. BIOS then starts your operating system in the following ways:  

1) It searches devices in the boot order sequence (optical drive, hard disk, network, etc.) as configured. If a bootable device is found, it executes the code on that device to start the system.  

2) If you press the boot menu key (usually Esc or F12) to manually select the hardware, BIOS executes the code on that hardware.  

3) If BIOS supports UEFI boot and has UEFI settings configured, it automatically invokes the UEFI bootloader saved with the settings or the specified UEFI boot file. This method is more advanced and won't be discussed here. However, if your computer came pre-installed with Windows 8 or is a Mac, you're likely booting via UEFI.  

In the first two methods, BIOS reads the device's MBR (a program code stored on the device, unrelated to partitions like C:, D:, E:). If no MBR exists, it searches for an active partition (marked as "active") or the only available partition, then boots from the PBR (partition boot record, invisible in File Explorer). If unsuccessful, BIOS displays a "no operating system" error.  

When an Android phone is connected to a computer:  
- If your phone supports a MicroSD card, it will be recognized as two removable drives (corresponding to internal storage and SD card, e.g., my G520).  
- If no SD card slot exists, it will be recognized as a single drive (internal storage).  

Thus, by writing an operating system along with MBR or PBR to the internal storage or SD card, booting becomes possible. However, during testing, Linux systems failed to load anything beyond the kernel (`bzImage` or `vmlinuz`) and initial RAM disk (`initrd.gz` or `lz`). It's unclear whether this is a system or phone issue.  

Therefore, we need a Linux distribution that requires only two files (kernel and initrd). This is where SliTaz comes in.  

> SliTaz is a free GNU/Linux distribution based on Busybox, the Linux kernel, and GNU free software. It can boot from CD/USB, run entirely in RAM, or be installed to a hard drive.  

SliTaz is distributed as a ~30MB ISO. It includes a complete package manager (`tazpkg`), but lacks a Chinese interface package. Hence, instead of the official version, we'll use a modified version by Chinese users called LinuxPE. This version adds Chinese UI, input methods, Firefox, and other popular software without altering core functionality.  

**Practical Steps:**  

0. **Software Preparation**:  
   - UltraISO (search online)  
   - LinuxPE: Download from [https://code.google.com/p/linux-pe/downloads/list](https://code.google.com/p/linux-pe/downloads/list)  
     - `base`: Minimal version  
     - `wireless`: Includes penetration tools (e.g., Beini, minidwep)  
     - `all`: Full-featured version  
     - `android-kitchen`: For creating Android ROMs (unnecessary for most users)  

1. Install UltraISO, connect your Android phone to the computer, and enable USB mass storage mode.  

2. Open UltraISO and load the downloaded LinuxPE/SliTaz ISO.  

3. Navigate to `Boot` > `Write Disk Image`. *(Image below is illustrative)*  
   ![/usr/uploads/2013/07/3392244635.jpg](/usr/uploads/2013/07/3392244635.jpg)  

4. In the pop-up window, select your phone's drive letter. If two drives appear (phone/SD card), choose your target.  

5. Click `Write` (labeled "便捷写入" in older versions).  
   - *Note: UltraISO won't format your phone, but backup is recommended.*  
   **Warning: Selecting "Write" directly may format your storage. After reconnection, the formatted phone/SD card may become unrecognizable. The only fix is reformatting on the phone.**  

6. Reboot the computer. At the boot screen (manufacturer logo), press the boot menu key (usually Esc/F12; test multiple keys).  

7. In the boot menu, select your phone using arrow keys and press Enter. LinuxPE will start.  
   - *If two drive options appear, match them to Windows drive letters. If the LinuxPE drive letter comes first alphabetically in Windows, choose the first option; otherwise, the second. Test if uncertain.*  

8. **Booting from a powered-off computer**:  
   (1) Connect the phone to the computer.  
   (2) Power on and press the **BIOS key (usually F2/Esc; sometimes accessible via boot menu)**.  
   (3) Enable USB storage mode on the phone.  
   (4) Navigate to "Save" in BIOS, press Enter, and confirm with "Y" if prompted.  
   (5) Reboot and press the boot menu key.  
   *Reason: Android phones activate USB mode only after detecting computer startup, requiring this workaround.*  
```
