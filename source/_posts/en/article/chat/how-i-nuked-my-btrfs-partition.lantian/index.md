---
title: 'I Moved My SSD to My New Laptop. This is What Happened To My Btrfs Data'
categories: Chat
tags: [Btrfs]
date: 2021-12-15 02:07:09
---

## What Happened

The quality of my previous laptop (Lenovo Legion R720) isn't great. After 4 years of use, it had its keyboard swapped once, its failed mechanical hard drive replaced with a SATA SSD, and every time I opened its back panel, some plastic residue or even screws would fall out from the back panel or the hinge. Since these were strong indications that the laptop already had its one foot in the grave, I took advatage of a special deal and got a new laptop, and planned to migrate my data over.

My daily driver Arch Linux (including the EFI boot partition and the Btrfs-formatted root partition) sits on a Western Digital SN550 1T SSD I bought half a year ago. The usual procedure is that I reinstall the operating system on the new laptop, but I had a second thought and, considering that I didn't do much hardware-specific configuration on the OS, apart from some tweaks to the touchpad and the NVIDIA GPU, I can simply adjust or remove these configuration and have a working system. Easy peasy.

So I took that drive and inserted it into the second M.2 slot on my new laptop. I turned on the computer and saw the EFI boot partition automatically picked up and listed on the BIOS boot menu. In no time I'm back to business.

As a regular Arch Linux user, the first thing I do at the desktop is of course `sudo pacman -Syu`. As the system update progresses smoothly, a "No space on left to device" error popped up and the update process was aborted. I ran `df -h` and saw I only used 600GB out of that 1TB drive. What?

I reran `sudo pacman -Syu` and saw another error: "Read-only Filesystem". I ran `mount` and found that the root partition is now `ro` read only.

Panic

I took a look at `dmesg` and saw a bunch of Btrfs error messages. Basically it said some data block had an incorrect checksum.

More panic

I turned off the computer, grabbed my USB drive and booted into the Arch Linux installation ISO on it. I first ran `smartctl -a /dev/nvme0n1` and saw that the drive was 100% healthy (percent of available spare blocks) with 0 data errors. Weird. I then ran `btrfs check /dev/nvme0n1p2` and after a 10-minute scan, it found 3 corrupted files. Two of them are packages downloaded by `pacman`, and the other one is from the Java OpenJFX component. I noted down the name of that component, preparing to reinstall the package later on. I removed the 3 corrupted files and reran `btrfs check`. Everything is back in order.

No big deal

While I was thinking "how did my Btrfs have bad data out of nowhere" and rebooting the computer, it had a Kernel Panic during the startup process, with dozens of Btrfs functions in the call stack.

Panic

As I was booting into my USB drive again, I suddenly recalled something. I DID have hardware-specific configuration on my previous laptop. To be specific, I used [Intel-Undervolt](https://github.com/kitsunyan/intel-undervolt) to undervolt the CPU by 0.1V. For 7th-Gen Intel laptop CPUs, like the i7-7700HQ on my previous laptop, 0.1V voltage doesn't have any stability impacts, bu写入时复制t can reduce the heat output and power consumption a lot. But starting from 8th-Gen CPUs, with the increasing competition from AMD, Intel was already pushing its CPUs to their limits, without much root for voltage reduction. Therefore, my configuration undervolted the CPU too much and made it unstable.

No big deal

I mounted the Btrfs partition, removed the configuration as well as binary of the Intel-Undervolt program, then did another reboot. This time I didn't have any panic, instead Btrfs printed a lot of helpful messages about how the metadata was damaged and it cannot mount my `/home` subvolume.

More panic

As a long time Btrfs user, I knew that Btrfs had an extremely complex on-disk format, and the chance of data recovery with damaged metadata was close to zero. To avoid such situation, I enabled the `-m dup` option a while back, to store two copies of metadata on the disk. Back to the installation environment, I ran `btrfs check` again. It found a damaged metadata block and declared that its checksum was incorrect. It then found the duplicate metadata block for backup, and printed the exact same checksum error.

Both metadata blocks are dead

I tried to copy my data away first. I plugged in my USB drive for backups and ran `cp -r /mnt/home /backup_usb/`, only to see the console covered with "Input/output error", and no file made its way to the backup drive. Out of desperation, I ran `btrfs check --repair`, which cleared my entire `/home` subvolume.

I'm DONE

I took a look at the backup drive. My last backup was from August this year. Thankfully I usually upload most of my files to GitHub or my private Git server, and most of the rest files can be obtained from other places (like my Steam library). Therefore, I didn't lost too much data over the 4 months.

All that's left is the boring reinstallation process.

## Recap

Most likely, the Btrfs metadata was corrupted on my second attempt to start the operating system, where it had a Btrfs Kernel Panic. The reason should be CPU undervolting, causing communication instabilities from CPU to RAM or SSD, or checksum computation errors.

The adjustments made by Intel-Undervolt will remain in function until the system is completely shut off. But since I turn off the computer by long-pressing the power button, the computer cold-booted every time, so the CPU voltage was normal in the installation environment from my USB drive, and the operations were executed correctly and stably.

## Lessons Learnt

1. Use 3-2-1 backup strategy on your important data. That is a minimum of 3 copies, with 2 stored locally (including the one you're currently using, and a backup) and 1 stored remotely (like a cloud storage service).
2. Whenever Btrfs has the most minor hiccup, the first thing to do should be to mount the partition read-only and copy the data elsewhere, before attempting any diagnosis or repair steps. I'd imagine that this applies to other CoW filesystems (like ZFS) as well.
