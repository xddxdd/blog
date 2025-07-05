---
title: 'Huawei C8815 Internal Storage Partitioning'
categories: Computers and Clients
tags: [Partitioning, Huawei C8815]
date: 2014-07-25 16:00:30
autoTranslated: true
---


The Huawei C8815 smartphone comes with 4GB of internal storage, but not all of this space is available for user data - it also includes system files and other miscellaneous content.

Android device storage is generally divided into the following partitions:

- **Cache partition**: Stores temporary files for Android system operations, typically less than 10MB in total
- **System partition**: Contains Android OS files modified during flashing
- **Data partition**: Stores installed apps and their data
- **Internal storage (sdcard)**: The "built-in storage" visible in file managers

Carrier-customized devices like the C8815 also include a **cust partition** for carrier-specific modifications.

The factory partition layout isn't always optimal. The C8815's default partitioning is:

- **Cache**: ~190MB (excessive for actual needs of ~5MB usage)
- **Cust**: 80MB (carrier bloatware, removable)
- **System**: 1.1GB (oversized for typical custom ROMs)
- **Data**: 1.1GB (often needs expansion)
- **Internal storage**: 1GB (could be reduced with external SD card usage)

Recommended partitioning scheme:

- **Cache**: 10MB
- **Cust**: 10MB (required minimum)
- **System**: 500MB (adjust based on ROM size + 20MB buffer)
- **Internal storage**: 100MB (with external SD) or 800MB-1.5GB (without)
- **Remaining space** allocated to Data partition

### Partitioning Steps

1. Download [Aroma File Manager](/en/article/modify-computer/aroma-file-manager-recovery-mode.lantian) and boot into recovery mode
2. Access terminal via Menu > Terminal
3. Check current partitions:
```bash
fdisk -l /dev/block/mmcblk0
```
Sample output:
```bash
/dev/block/mmcblk0p16    50177    60416    81920
/dev/block/mmcblk0p17    60417    191488    1048576
/dev/block/mmcblk0p18    191489    338944    1179648
/dev/block/mmcblk0p19    338945    473088    1073152
```
(Partition numbers 15=cache, 16=cust, 17=system, 18=data, 19=sdcard)

4. Calculate new partition boundaries (1MB = 128 blocks):
```
Example conversion:
New 16th partition (10MB):
End = 50177 + (10*128) = 51457
Next partition starts at 51459
```

5. Modify partitions:
```bash
fdisk /dev/block/mmcblk0
```
Command sequence example:
```bash
d 19
d 18
d 17
d 16
n 50177 51457
n 51459 115459
n 115461 460286
n 460288 473088
```
6. Verify with `p` command, then write changes with `w`

7. Reboot to recovery, perform factory reset, format storage

8. Reflash ROM

**WARNING:**  
- DO NOT modify partitions 14 and earlier  
- Double-check calculations before writing changes  
- Original partition table can be restored using Huawei's official firmware (hold Volume Up+Down during power-on to flash)
