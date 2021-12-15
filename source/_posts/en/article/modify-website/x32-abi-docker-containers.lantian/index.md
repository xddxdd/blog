---
title: 'x32 ABI and Docker Containers'
categories: 'Website and Servers'
tags: [x32, Docker]
date: 2020-05-15 00:20:26
---

History of x86 & x86_64, and x32 ABI
------------------------------------

Most of the personal computers and servers we use nowadays use the x86_64 architecture, whose specification was released by AMD in 2000 and the first processor released in 2003. Since x86_64 is a 64-bit architecture, in x86_64, each register in the CPU can hold 64 bits of data (or 8 bytes). Before x86_64 went popular, most computers used Intel processors, and the corresponding x86 architecture / ISA, a 32-bit architecture whose registers hold 32 bit of data (or 4 bytes).

One significant improvement of the 64-bit architecture is the improved memory addressing ability. Computers usually follow such a routine while accessing the memory: write the memory address to be accessed into a register, then send the content of that register onto the memory address bus. Because of this, 32-bit computers can only represent memory addresses up to 32 bits, or `2 ^ 32 = 4294967296` addresses (bytes) in total, or `4 GB`. 64-bit computers on the other hand can represent `2 ^ 64 = 18446744073709551616` bytes, or `16 EB = 16384 PB = 16777216 TB`. In order to simplify circuit design and increase maximum performance, only 48 bits are used in the current x86_64 architecture, so up to `2 ^ 48 = 281474976710656` bytes or `256 TB` can be accessed.

In addition, compared to x86, x86_64 also increased the number of available registers, from 8 in x86 (EAX, EBX, ECX, EDX, ESI, EDI, ESP, EBP) to 16 (RAX, RBX, RCX, RDX, RSI, RDI, RSP, RBP, R8, R9, R10, R11, R12, R13, R14, R15). Also, compared to x86, which passes function parameters in stacks, x86_64 will put the first 6 parameters in registers (RDI, RSI, RDX, RCX, R8, R9). The changes above mean that x86_64 decreased the number of memory accesses compared to x86, and since memory is much slower than CPU registers, while running the same program, x86_64 will have a performance advantage over x86.

But x86_64 does have its disadvantages. Since x86_64 represents memory addresses in 64 bits, memory pointers will consume more memory space compared to x86. Suppose we have a binary tree program with the following data structure:

```c
struct TreeNode {
    struct TreeNode* left;
    struct TreeNode* right;
    int data;
};
```

This structure will take only 12 bytes (2 x 4 byte pointers + 4 byte int) on x86, but 20 bytes (pointers are 8 bytes now) on x86_64, a 66.7% increase. Therefore, for database applications whose functionality relies on tree structures and pointers, their memory consumption will grow significantly. This is why people say "64 bit operating systems use more RAM" at the era of Vista and Windows 7.

But don't forget that x86_64 CPUs were first available in 2003 when DDR2 memory was first released, and people count memory in megabytes. The memory consumption increase in x86_64 is, therefore, a huge obstacle. When the memory space is less than 4 GB, and the problem of addressing limitation is not present, what if we can use the extra x86_64 registers for performance, yet with 320-it memory addresses in x86 to save memory?

And there comes the x32 ABI, with its relation to x86 and x86_64 below:

|                         | x86              | x32       | x86_64    |
| ----------------------- | ---------------- | --------- | --------- |
| Memory address bits     | 32               | 32        | 64        |
| Memory limit / process  | 4 GB             | 4 GB      | 128 TB    |
| Memory limit / OS       | 4 GB (excl. PAE) | 128 TB    | 128 TB    |
| Registers               | 8                | 16        | 16        |
| Passing Function Params | Stack            | Registers | Registers |

In Linux, the first discussion of x32 ABI went out on August 27, 2011. Developer Hans Peter Anvin posted on the mailing list that he was developing the x32 ABI for Linux. x32 ABI was merged into mainline kernel since Linux 3.4, released on May 20, 2012.

Linux's x32 implementation consists of a standard x86_64 Linux kernel and the x32 architecture applications running on top, and because of this, all processes accumulated can utilize more than 4 GB of memory, but not any one of the processes alone.

Linux's x32 architecture was not successful, perhaps caused by the following reasons:

1. It was released too late. In 2011 the popular memory capacity had greatly increased. Windows 7 has been released for 2 years (July 22, 2009), and Google Chrome, the memory hog, has been around for 3 years (September 2, 2008). There isn't much necessity going through all the hassle for a small amount of memory decrease.
2. Lack of support from giants. Since services from tech giants have to process a large number of requests, 4 GB per process was not enough for them. Compared to spending manpower on x32, they would rather purchase tons of memory sticks for their servers.
3. Lack of application optimization. Quite a few programs (ex. OpenSSL, Firefox) disabled their assembly optimizations to work normally on x32, whose extra CPU consumption canceled out the performance improvement of x32.

But for personal users with a 512 MB or 1GB memory VPS, who care more on RAM usage rather than CPU, the benefit of x32 is what they need.

Using x32 ABI and Docker Images
-------------------------------

To use x32 ABI, you practically have to use Debian. Debian is the only Linux distribution that still supports x32, as far as I know. I will assume you are running Debian 10.

First you need a kernel that supports x32 ABI, or the latest **standard** x86_64 kernel (not the "cloud" variant) from Debian Unstable. Run the following commands:

```bash
# Add Unstable Repository
cat >/etc/apt/sources.list.d/unstable.list <<EOF
deb http://deb.debian.org/debian/ unstable main contrib non-free
deb-src http://deb.debian.org/debian/ unstable main contrib non-free
EOF

# Limit Unstable repository, avoid upgrading whole system to Unstable
cat >/etc/apt/preferences.d/limit-unstable <<EOF
Package: *
Pin: release a=unstable
Pin-Priority: 90
EOF

# Allow installing latest kernel from Unstable, and Debootstrap we will use afterwards
cat >/etc/apt/preferences.d/allow-unstable <<EOF
Package: linux-*
Pin: release a=unstable
Pin-Priority: 900

Package: debootstrap*
Pin: release a=unstable
Pin-Priority: 900
EOF

# Manually tell apt to install the latest kernel from Unstable once,
#   since the unstable kernel rely on a few other things
# If unstable isn't manually specified, a dependency error will pop up
apt update
apt install -t unstable linux-image-amd64 linux-headers-amd64

# You don't have to specify unstable anymore on future kernel updates
apt upgrade

# Don't reboot yet as there's still configuration to change
```

Then you need to enable the x32 ABI support of the kernel, so it can understand system calls with 32-bit pointer length from x32 applications. Edit `/etc/default/grub` and add `syscall.x32=y` to the kernel startup command-line:

```bash
# If you change this file, run 'update-grub' afterward to update
# /boot/grub/grub.cfg.
# For full documentation of the options in this file, see:
#   info -f grub -n 'Simple configuration'

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX="syscall.x32=y"

# Contents below omitted
```

Then run `update-grub` to update `/boot/grub/grub.cfg` the boot configuration, then `reboot`.

After reboot run `cat /proc/cmdline` and check that `syscall.x32=y` is there.

Next, you will need a runtime environment for x32, including basic Linux commands and apt-get. In fact, what you need is a Debian Linux with x32 architecture. You may simply use my Docker image, which updates every week:

```bash
docker run -it --rm xddxdd/debian-x32
```

Manually Packing x32 Docker Image
---------------------------------

The Docker image above is created with the following steps, which you may follow yourself and manage your own updates:

```bash
# Install Debootstrap, a Debian installer
apt install debootstrap

# Install GPG keys of Debian Ports repo so x32 packages can be verified
# Debian Ports is responsible for porting Debian to other architectures
#   (like x32, ARM, and RISC-V)
apt install debian-ports-archive-keyring

# Run Debootstrap, which will install an x32 Debian to folder debian-x32
# Note the parameters:
# - arch set to x32
# - variant set to minbase, or the minimally installed system,
#   since we're creating a Docker image, we can add other stuff as needed
# - keyring set to GPG key of Debian Ports, which isn't included by default
# - include set to Debian Ports
# - version set to unstable, since x32 never had a "stable" version
debootstrap --arch=x32 --variant=minbase --keyring=/usr/share/keyrings/debian-ports-archive-keyring.gpg --include=debian-ports-archive-keyring unstable debian-x32 http://deb.debian.org/debian-ports

# Remove junks such as logs and caches, save 60MB+
rm -rf debian-x32/var/log/*.log
rm -rf debian-x32/var/cache/apt/*
rm -rf debian-x32/var/lib/apt/lists/*

# Create an extremely simple Dockerfile, who copies all contents from debian-x32
cat >Dockerfile <<EOF
FROM scratch
COPY debian-x32/ /
CMD ["bash"]
EOF

# Feed everything to Docker
docker build -t xddxdd/debian-x32 .

# Finally try to run it
docker run -it --rm xddxdd/debian-x32
```

Then you can do `FROM xddxdd/debian-x32` and add other stuff on top.

I have some x32 Docker images in my [multi-architecture Dockerfile project](https://github.com/xddxdd/dockerfiles) that can either serve as an example or be directly used.

Do I Recommend x32?
-------------------

Realistically speaking, I don't recommend using the x32 ABI for the following reasons:

1. Lack of software support
   - Take Debian x32 as an example, a lot of programs (such as MariaDB) is not available in the repository, and you have to compile your own
   - Once you met a strange problem or bug (although I haven't), don't expect any tech support available
2. No guaranteed performance improvement
   - Like what I said, OpenSSL disabled assembly optimizations for x32, which slowed down encryption and decryption and canceled out the benefits of x32
   - To save memory, you'd better directly use an x86 32-bit program or Docker image

But x32 is worth trying for tinkering purposes.
