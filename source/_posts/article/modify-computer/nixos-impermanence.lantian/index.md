---
title: 'NixOS 系列（四）：“无状态”操作系统'
categories: 计算机与客户端
tags: [NixOS]
date: 2023-01-14 01:55:12
image: /usr/uploads/202110/nixos-social-preview.png
---

@include "\_templates/nixos-series/toc-zh.md"

NixOS 广为人知的一大特点是，系统大部分软件的设置都由 Nix 语言的配置文件统一生成并管理。即使这些软件在运行时修改了自己的配置文件，在下次切换 Nix 配置或者系统重启时，NixOS 也会将配置文件重新覆盖。

例如，在运行 NixOS 的电脑上运行 `ls -alh /etc`，可以看到大部分配置文件都只是到 `/etc/static` 的软链接：

```bash
# 省略部分不相关的行
lrwxrwxrwx  1 root root     18 Jan 13 03:02 bashrc -> /etc/static/bashrc
lrwxrwxrwx  1 root root     18 Jan 13 03:02 dbus-1 -> /etc/static/dbus-1
lrwxrwxrwx  1 root root     17 Jan 13 03:02 fonts -> /etc/static/fonts
lrwxrwxrwx  1 root root     17 Jan 13 03:02 fstab -> /etc/static/fstab
lrwxrwxrwx  1 root root     21 Jan 13 03:02 fuse.conf -> /etc/static/fuse.conf
-rw-r--r--  1 root root    913 Jan 13 03:02 group
lrwxrwxrwx  1 root root     21 Jan 13 03:02 host.conf -> /etc/static/host.conf
lrwxrwxrwx  1 root root     18 Jan 13 03:02 hostid -> /etc/static/hostid
lrwxrwxrwx  1 root root     20 Jan 13 03:02 hostname -> /etc/static/hostname
lrwxrwxrwx  1 root root     17 Jan 13 03:02 hosts -> /etc/static/hosts
# ...
```

而 `/etc/static` 本身则被链接到 `/nix/store`，被 NixOS 统一管理：

```bash
lrwxrwxrwx 1 root root 51 Jan 13 03:02 /etc/static -> /nix/store/41plm7py84sp29w3bg4ahb41dpfxwf9l-etc/etc
```

那么问题就来了：有必要把 `/etc` 的内容存在硬盘上吗？反正每次重启或切换配置时，这里的内容都会被重新生成一遍。

类似的，看起来 NixOS 根目录下大部分文件都是可以根据配置生成的：

- `/bin` 文件夹下只有一个 `/bin/sh`，被软链接到 `/nix/store` 里的 Bash；
- `/etc` 文件夹中的大部分文件都由 NixOS 的配置文件管理；
- `/usr` 文件夹下只有一个 `/usr/bin/env`，被软链接到 `/nix/store` 里的 Coreutils；
- `/mnt` 和 `/srv` 文件夹默认是空的；
  - 并且 `/mnt` 本身一般不存数据，只用来放其它分区的挂载点。
- `/dev`， `/proc` 和 `/sys` 本身就是存放硬件设备和系统状态的虚拟文件夹；
- `/run` 和 `/tmp` 本身都是存放临时文件的内存盘。
  - 注：在给软件打包时，Nix Daemon 会将临时文件存在 `/tmp` 目录下。如果 `/tmp` 是内存盘，打大型软件包（例如 Linux 内核）时容易爆内存。因此 NixOS 的 `/tmp` **默认不是内存盘**，需要手动用 `boot.tmpOnTmpfs = true;` 开启。

排除上面的文件夹，只有少数几个文件夹存放了需要真正写入硬盘的数据：

- `/boot` 存放启动引导器；
- `/home` 和 `/root` 存放各个用户的家目录；
- `/nix` 存放 NixOS 的所有软件包；
- `/var` 存放系统软件的数据文件。

实际上，NixOS 本身只需要 `/boot` 和 `/nix` 就可以正常启动。从 [NixOS 官网下载页面](https://nixos.org/download.html)下载的 ISO 里面除了 ISOLinux 启动引导器，就只有一个 `nix-store.squashfs` 文件，对应 `/nix/store` 里的数据：

```bash
# unsquashfs -l nix-store.squashfs | head
squashfs-root
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware/rtw88
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware/rtw88/rtl8822cu_fw.bin.xz
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware/rtw88/rtw8723d_fw.bin.xz
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware/rtw88/rtw8821c_fw.bin.xz
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware/rtw88/rtw8822b_fw.bin.xz
squashfs-root/01qm2r3cihmf4np82mim8vy9phzgc9cn-rtw88-firmware-unstable-2022-11-05-xz/lib/firmware/rtw88/rtw8822c_fw.bin.xz
# ...
```

那么，能不能改造 NixOS，模仿安装光盘的行为，在硬盘上只保留 `/boot`，`/home`，`/nix`，`/root`，`/var` 这几个必要文件夹的数据？更直接地说，能不能直接把 `/` 根目录配置成一个内存盘，再把这几个文件夹的数据挂载到对应位置？

答案是：可以，而且不用改造。安装光盘上的 NixOS 除了挂载 `nix-store.squashfs` 以外，其它的行为都与安装在硬盘上的 NixOS 相同。

## “无状态”的优点

相比普通的 NixOS，这样配置的“无状态”NixOS 只会把一部分你指定的“状态”保存在硬盘上。这些状态可能包括你的网站网页文件、数据库内容、浏览器的记录等。除此之外，剩余的、你没有指定保存的“状态”都会在重启之后被丢弃。

这就是这种配置的最大优点：只保留你想要的状态。

- 如果有的软件偷偷修改了它的配置文件，或者把数据存在了不该存的位置，重启后这些修改都会丢失，从而保证软件的配置与你在 Nix 配置文件中指定的完全相同。
- 你的 `/etc` 中不会有卸载软件后的残留。如果有的话，它们在下次重启后就消失了。
- 你只需要备份不被 Nix 管理的状态（例如 `/home`，`/root`，`/var`），再加上 Nix 配置文件，就能保证可以还原出一模一样的系统。
- 由于根目录中的大部分文件是根据配置生成的软链接，根目录的内存盘几乎不占空间。例如我的一台服务器上，根目录只占用了 660KB 空间：

```bash
# sudo du -h -d1 -x /
0       /srv
0       /mnt
0       /usr
0       /bin
0       /home
572K    /root
0       /tmp
84K     /etc
4.0K    /var
660K    /
```

## 准备工作

要根据本文对 NixOS 进行配置，你需要准备：

1. 一个安装完成的 NixOS，并且使用 Flake 管理配置。
2. 一个 NixOS 或其它 Linux 发行版的 LiveCD，我们需要移动 NixOS 的关键文件。

## 将根目录修改成内存盘

当你安装好一个普通的 NixOS，你的 Nix 配置中一般会有类似这样的根分区配置：

```nix
fileSystems."/" = {
  device = "/dev/vda1";
  fsType = "btrfs";
  options = [ "compress-force=zstd" ];
};

# 你可能还挂载了其它分区，例如 /boot
fileSystems."/boot" = {};
```

对 NixOS 来说最重要的文件夹是 `/nix`，因此我们把根目录 `/` 修改成内存盘 `tmpfs`，并把原来的分区挂载到 `/nix` 上：

```nix
fileSystems."/" = {
  device = "tmpfs";
  fsType = "tmpfs";
  # 必须设置 mode=755，否则默认的权限将是 777，导致 OpenSSH 报错并拒绝用户登录
  options = [ "relatime" "mode=755" ];
};

fileSystems."/nix" = {
  device = "/dev/vda1";
  fsType = "btrfs";
  options = [ "compress-force=zstd" ];
};

# 其它分区不用动
fileSystems."/boot" = {};
```

理论上来说，此时应用配置并关机，再到 LiveCD 里把文件移动到正确的位置，就可以获得一个**只保留了 Nix 配置中的状态**的 NixOS。这个状态可以满足临时使用的需要（例如 NixOS 安装光盘），但因为没有保存一些重要的、不由 Nix 配置文件管理的状态，不适合日常使用。

没有保存的重要状态包括：

- `/etc/machine-id`，SystemD 给每个系统随机生成的 ID，用于管理日志
- `/etc/NetworkManager/system-connections`，Network Manager 保存的连接
- `/etc/ssh/ssh_host_ed25519_key.pub`，OpenSSH 的公钥
- `/etc/ssh/ssh_host_rsa_key.pub`，OpenSSH 的公钥
- `/etc/ssh/ssh_host_ed25519_key`，OpenSSH 的私钥
- `/etc/ssh/ssh_host_rsa_key`，OpenSSH 的私钥
- 以及 `/home`，`/root`，`/var` 里的数据文件

所以，下一步操作就是单独指定这些文件/文件夹，把它们也保存到硬盘上。

## 保存重要的状态文件

由于已经挂载了 `/nix` 分区，所以我选择把状态文件放在 `/nix/persistent` 目录中。你也可以把这些状态文件放在其它的分区上。

然后，用 Bind mount 把状态文件映射回它们本该在的地方：

```nix
fileSystems."/etc/machine-id" = {
  device = "/nix/persistent/etc/machine-id";
  options = [ "bind" ];
};
# ...
```

如果你要保存的文件很多，你就需要给每一个文件或文件夹单独添加一个 mount，麻烦且容易出错。好消息是，Nix 社区针对这种使用场景提供了一个 NixOS 模块 [Impermanence](https://github.com/nix-community/impermanence)，可以方便地批量映射文件到另一个位置。

首先，在你的 `flake.nix` 中将 Impermanence 添加到 `inputs` 中：

```nix
{
  inputs = {
    impermanence.url = "github:nix-community/impermanence";
  };
}
```

然后把 Impermanence 添加到 NixOS 的模块列表中：

```nix
{
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations."nixos" = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # 添加下面这行
        inputs.impermanence.nixosModules.impermanence

        ./configuration.nix
      ];
    };
  };
}
```

你就可以用这样的格式批量映射文件，不用自己写一大堆 `fileSystems` 的 mount 了：

```nix
# /nix/persistent 是你实际保存文件的地方
environment.persistence."/nix/persistent" = {
  # 不让这些映射的 mount 出现在文件管理器的侧边栏中
  hideMounts = true;

  # 你要映射的文件夹
  directories = [
    "/home"
    "/root"
    "/var"
  ];

  # 你要映射的文件
  files = [
    "/etc/machine-id"
    "/etc/NetworkManager/system-connections"
    "/etc/ssh/ssh_host_ed25519_key.pub"
    "/etc/ssh/ssh_host_ed25519_key"
    "/etc/ssh/ssh_host_rsa_key.pub"
    "/etc/ssh/ssh_host_rsa_key"
  ];

  # 类似的，你还可以在用户的 home 目录中单独映射文件和文件夹
  users.lantian = {
    directories = [
      # 个人文件
      "Desktop"
      "Documents"
      "Downloads"
      "Music"
      "Pictures"
      "Videos"

      # 配置文件夹
      ".cache"
      ".config"
      ".gnupg"
      ".local"
      ".ssh"
    ];
    files = [ ];
  };
};
```

## 移动 Nix Daemon 的临时文件夹

在给软件打包时，Nix Daemon 会将临时文件存在 `/tmp` 目录下。如果 `/tmp` 是内存盘，打大型软件包（例如 Linux 内核）时容易爆内存。

NixOS 的 `/tmp` 默认不是内存盘，但随着我们的配置，`/tmp` 也将被存放在根目录的内存盘上。因此，我们可以将 Nix Daemon 的临时文件移动到硬盘上，例如我设置的是 `/var/cache/nix`：

```nix
systemd.services.nix-daemon = {
  environment = {
    # 指定临时文件的位置
    TMPDIR = "/var/cache/nix";
  };
  serviceConfig = {
    # 在 Nix Daemon 启动时自动创建 /var/cache/nix
    CacheDirectory = "nix";
  };
};
```

## 激活配置

上面的配置完成后，终于可以激活配置了。

首先用 `sudo nixos-rebuild boot --flake .`，在下次开机时激活新的配置。注意不要用 `sudo nixos-rebuild switch --flake .`，因为在真正激活配置前，我们需要先到 LiveCD 中把文件移动到正确的位置。

重新启动电脑到 LiveCD 中，挂载并 `cd` 进原来的根分区：

- **如果你不熟悉流程，做好数据备份！**
- 新建一个 `persistent` 文件夹，对应系统启动后的 `/nix/persistent`；
- 把上面列出的，要保存的路径都移动到 `persistent` 文件夹中；
- 删除除了 `nix` 和 `persistent` 以外的其它文件夹；
  - **删除前请做好数据备份！**
- 把 `nix` 中的所有文件夹移到当前目录下；
- 最后删除 `nix` 文件夹，重启。

如果你一切操作正确，就可以启动到“无状态”的 NixOS 中了。你选择保留的数据文件将全部映射到原来的位置，所以系统使用起来也应该没什么区别。但是此时，你的根分区已经变成了一个 `tmpfs` 内存盘，你不想要的状态数据将全部在重启后消失，你每次开机都将得到一个“全新”的操作系统。

## 资料来源

我的配置过程参考了以下资料：

- [Erase your darlings - Graham Christensen](https://grahamc.com/blog/erase-your-darlings)
  - 最早的无状态实现，使用 ZFS 快照在每次重启时恢复状态。
- [NixOS: tmpfs as root - Elis Hirwing](https://elis.nu/blog/2020/05/nixos-tmpfs-as-root/)
- [Impermanence](https://github.com/nix-community/impermanence)
  - NixOS 的无状态辅助模块。

我的相关配置可以在这里找到：

- Impermanence 模块的配置：<https://github.com/xddxdd/nixos-config/blob/f7cbc14f23a7d6bb21ca4edb153f704735fe5419/nixos/common-components/impermanence.nix>
- 用户 home 目录的配置：<https://github.com/xddxdd/nixos-config/blob/f7cbc14f23a7d6bb21ca4edb153f704735fe5419/nixos/client-components/impermanence.nix>
