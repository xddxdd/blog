---
title: 'Installing Ubuntu on a Macbook Pro'
categories: Computers and Clients
tags: [Mac, Linux]
date: 2014-10-04 19:27:05
autoTranslated: true
---


The macOS is indeed beautiful and smooth. However, VirtualBox runs terribly slow on it, and many functions that are simple to implement on Windows or Ubuntu require significant effort on Mac. Additionally, I've seen online articles showing that Ubuntu scores much higher than macOS in UnixBench tests. Therefore, I decided to install Ubuntu on my Macbook.

After researching, I found my Macbook is a mid-2012 model (Macbook 9-2). According to Ubuntu's official wiki, Ubuntu can only coexist with macOS on this model – it cannot be installed alone, otherwise boot issues will occur.

Seriously? Mac's bootloader and OS are separate!

GParted in Ubuntu's live environment shows macOS created three partitions: a 200MB FAT32 EFI boot partition, an HFS+ formatted system partition, and a ~600MB HFS+ recovery partition. Our task is to replace the macOS system and recovery partitions with Ubuntu partitions.

## 1. Installing the Boot Manager

Since the Macbook's default bootloader might not start Ubuntu (though I tested it could work directly), we need to install a third-party boot manager: rEFInd. rEFInd is a boot manager that enables EFI-based computers to boot various OSes – essentially designed for Macbooks, as other PCs' EFI can usually be disabled. Only Macbooks are this problematic.

- (In macOS) Download rEFInd and unzip: [http://sourceforge.net/projects/refind/files/0.8.3/refind-bin-0.8.3.zip/download](http://sourceforge.net/projects/refind/files/0.8.3/refind-bin-0.8.3.zip/download)
- Open Launchpad > Utilities > Terminal, type `cd "` (cd + space + double quote). Don't press Enter yet.
- Drag the unzipped rEFInd folder icon into the Terminal to auto-fill its path.
- Type a closing double quote and press Enter.
- Enter:
```bash
sudo ./install.sh --esp
```
- Enter your password (no visual feedback) and press Enter.
- Reboot; you should see a boot selector with rEFInd branding. Installation successful.

## 2. Creating Ubuntu Boot Media

Burn the Ubuntu ISO to a DVD, or use UltraISO on Windows/in a VM to write the ISO to a USB drive.

## 3. Repairing Partition Table

- In macOS Disk Utility, shrink your macOS partition and create a new partition in the freed space.
- Insert boot media, reboot, hold Alt (Option), select "Windows" and press Enter.
- Ubuntu installer will launch; select "Try Ubuntu".
- Search for GParted in Unity, format the new partition as ext4 and apply changes.
- Shut down, remove boot media, boot into macOS.
- Download GPT Fdisk: [http://sourceforge.net/projects/gptfdisk/](http://sourceforge.net/projects/gptfdisk/) and install.
- In Terminal:
```bash
sudo gdisk /dev/disk0
```
- Type `r` > Enter, then `p` > Enter to view partitions (typically partition 2 is macOS, 4 is Ubuntu's future partition).
- Type `h` > Enter. Input `2 4` (partition numbers) > Enter.
- Type `y` > Enter, then `AF` > Enter (set partition type). Then `n` to skip boot flag.
- Type `y` > Enter, then `83` > Enter, then `n` > Enter.
- rEFInd doesn't require boot flags, so no need to set.
- Type `w` > Enter to write changes. gdisk will exit automatically.
- Reboot holding Alt (Option), select "Windows" to start Ubuntu installation.

## 4. Beginning Installation

- In Ubuntu installer, choose "Try Ubuntu" again, then launch GParted.
- Delete all partitions except the 200MB EFI partition, then set up partitions as desired.
- Launch Ubuntu installer, follow normal steps. Select "Something else" for manual partitioning.
- After installation, Ubuntu should boot normally.

## 5. Configuring rEFInd

- In Ubuntu:
```bash
sudo mkdir /media/efi
sudo mount /dev/sda1 /media/efi
cd /media/efi/EFI/refind
sudo nano refind.conf
```
- Change `timeout` to `-1` to skip the 20-second boot menu delay.

That's it – installation complete!
```
