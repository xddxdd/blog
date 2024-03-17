---
title: 'I Moved My SSD to My New Laptop. This is What Happened To My Btrfs Data'
categories: Chat
tags: [Btrfs]
date: 2021-12-15 02:07:09
image: /usr/uploads/202112/chubbyemu.jpg
---

## What Happened

The quality of my previous laptop (Lenovo Legion R720) isn't great. After 4
years of use, I swapped its keyboard once and replaced its failed mechanical
hard drive with a SATA SSD. In addition, every time I opened its back panel,
some plastic residue or even screws would fall out from the back panel or the
hinge. These were strong indications that the laptop already had one foot in the
grave. So I took advantage of a special deal and got a new laptop for cheap, and
planned to migrate my data over to the new laptop.

The operating system I daily drive, Arch Linux, sits on a Western Digital SN550
1T SSD I bought half a year ago (including the EFI boot partition and the
Btrfs-formatted root partition). The usual procedure is to reinstall the
operating system on the new laptop. But I had a second thought. Apart from some
tweaks to the touchpad and the NVIDIA GPU, I didn't have much hardware-specific
configuration on the OS, so I can simply adjust or remove these configurations
and have a working system. Easy peasy.

So I took that drive and inserted it into the second M.2 slot on my new laptop.
I turned on the computer and saw the EFI boot partition automatically picked up
and listed on the BIOS boot menu. I'm back to business in no time.

As a regular Arch Linux user, of course the first thing to do when I log in is
`sudo pacman -Syu`. As the system update ran, a "No space left on device" error
popped up, and the update process was aborted. I ran `df -h` and saw I only used
600GB out of that 1TB drive. What?

I reran `sudo pacman -Syu` and saw another error: "Read-only Filesystem." I ran
`mount` and found that the root partition is now `ro` read only.

Panic

I took a look at `dmesg` and saw a bunch of Btrfs error messages. They said some
data blocks had incorrect checksums.

More panic

I turned off the computer, grabbed my USB drive, and booted into the Arch Linux
installation ISO on it. I first ran `smartctl -a /dev/nvme0n1` and saw that the
drive was 100% healthy (percent of available spare blocks) with 0 data errors.
Weird. I then ran `btrfs check /dev/nvme0n1p2` and after a 10-minute scan, it
found 3 corrupted files. Two of them are packages downloaded by `pacman`, and
the other one from the Java OpenJFX component. I noted down the name of that
component, preparing to reinstall the package later on. I removed the 3
corrupted files and reran `btrfs check`. Everything is back in order.

No big deal

While I was rebooting the computer, thinking to myself about how the Btrfs
partition had corrupted data out of nowhere, it had a Kernel Panic early in the
startup process, with dozens of Btrfs functions in the call stack.

Panic

As I booted to my USB drive again, I suddenly recalled something. I DID have
some hardware-specific configuration on my previous laptop. To be specific, I
used [Intel-Undervolt](https://github.com/kitsunyan/intel-undervolt) to
**undervolt the CPU by 0.1V**. For 7th-Gen Intel laptop CPUs, like the i7-7700HQ
on my previous laptop, 0.1V voltage doesn't impact stability. But this minor
tweak can reduce the heat output and power consumption by a lot. However,
starting from 8th-Gen CPUs, with the increasing competition from AMD, Intel was
pushing its CPUs to their limits, without much room left for undervolting.
Therefore, my configuration undervolted the CPU too much and made it unstable.

No big deal

I mounted the Btrfs partition, removed the configuration and the binary of the
Intel-Undervolt program, then rebooted again. This time, although I didn't see
another Kernel Panic, Btrfs printed many messages instead about how the metadata
was damaged, and it couldn't mount my `/home` subvolume.

More panic

As a long-time Btrfs user, I knew that Btrfs had an extremely complex on-disk
format, and the chance of data recovery with damaged metadata was close to zero.
To avoid such situations, I enabled the `-m dup` option a while back, to store
two copies of metadata on the disk. Back to the installation environment, I ran
`btrfs check` again. It found a damaged metadata block and declared that its
checksum was incorrect. It then found the duplicate metadata block for backup,
and printed the exact same checksum error.

Both metadata blocks are dead

I tried to copy my data away first. I plugged in my USB drive for backups and
ran `cp -r /mnt/home /backup_usb/`, only to see the console covered with
"Input/output error", and no file made its way to the backup drive. Out of
desperation, I ran `btrfs check --repair`, which cleared my entire `/home`
subvolume.

I'm DONE

I took a look at the backup drive. My last backup was from August this year.
Thankfully I usually upload most of my files to GitHub or my private Git server,
and most of the rest files can be obtained from other places (like my Steam
library). Therefore, I didn't lose too much data over the 4 months.

All that's left is the boring reinstallation process.

## Recap

Most likely, the Btrfs metadata was corrupted on my second attempt to start the
operating system, where it had a Btrfs Kernel Panic. The reason should be that
CPU undervolting, causing communication instabilities from CPU to RAM or SSD, or
checksum computation errors.

The adjustments made by Intel-Undervolt will remain effective until the system
is completely shut off. But since I turned off the computer by long-pressing the
power button, the computer cold-booted every time, so the CPU voltage was normal
in the installation environment from my USB drive, and the operations were
executed correctly and stably.

## Lessons Learnt

1. Practice 3-2-1 backup strategy on your important data. That is a minimum of 3
   copies, with 2 stored locally (including the one you're currently using, and
   a backup) and 1 stored remotely (like a cloud storage service).
2. Whenever Btrfs has the slightest hiccup, the first thing to do should always
   be mounting the partition read-only and copying the data elsewhere, before
   attempting further diagnosis or repair steps. I'd imagine that this applies
   to other CoW filesystems (like ZFS) as well.
