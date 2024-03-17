---
title: 'NixOS Series 4: "Stateless" Operating System'
categories: 'Computers and Clients'
tags: [NixOS]
date: 2023-01-14 01:55:12
image: /usr/uploads/202110/nixos-social-preview.png
---

@include "\_templates/nixos-series/toc-en.md"

> Changelog:
>
> 2023-02-18: Fix config not applied to the root user, in the "Move Temp
> Directory of Nix Daemon" section.

One of the most famous features of NixOS is that most software configurations on
the system are generated and managed exclusively by a Nix-language config file.
Even if such software modifies its config file while running, the config file
will still be overwritten on the next Nix config switch or the next reboot.

For example, if you run `ls -alh /etc` on a computer running NixOS, you can
observe that most config files are simply soft links to `/etc/static`:

```bash
# Unrelated lines omitted
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

`/etc/static` itself, by the way, is linked to `/nix/store` and managed by
NixOS:

```bash
lrwxrwxrwx 1 root root 51 Jan 13 03:02 /etc/static -> /nix/store/41plm7py84sp29w3bg4ahb41dpfxwf9l-etc/etc
```

Here's the question: is it really necessary to store the contents of `/etc` on
the disk drive? They're going to be regenerated on each reboot or config switch
anyway.

Similarly, it seems that most files on the NixOS root partition can be generated
with the config file:

- `/bin` folder only contains `/bin/sh`, which is soft linked to Bash in
  `/nix/store`;
- `/etc` folder contains mostly files managed by NixOS;
- `/usr` folder only contains `/usr/bin/env`, which is soft linked to Coreutils
  in `/nix/store`;
- `/mnt` and `/srv` are empty by default;
  - And instead of actual data, `/mnt` is usually used to store mount points for
    other partitions.
- `/dev`, `/proc` and `/sys` are virtual folders that store the state of
  hardware devices and the system itself;
- `/run` and `/tmp` are RAM-backed storages for temporary files.
  - Note: Nix Daemon stores its temporary files under `/tmp` while packaging. If
    `/tmp` is backed by RAM, the system may run out of memory while building
    large packages (such as the Linux kernel). Therefore, `/tmp` in NixOS is
    **NOT BACKED BY RAM BY DEFAULT**, and needs to be enabled with
    `boot.tmpOnTmpfs = true;`.

Excluding these folders, only a few folders store data that actually need
preserving on disk:

- `/boot` for the bootloader;
- `/home` and `/root` for home directories of users;
- `/nix` for all packages of NixOS;
- `/var` for data files of system-level software.

In fact, NixOS itself only requires `/boot` and `/nix` to boot. The ISO
downloaded from the
[Official NixOS download page](https://nixos.org/download.html) contains, in
addition to the ISOLinux bootloader, only a `nix-store.squashfs` containing data
in `/nix/store`:

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

Then, is it possible to modify NixOS to mimic the behavior of the installation
ISO, and only save the necessary folders of `/boot`, `/home`, `/nix`, `/root`,
`/var` to disk? Or to put it in a direct way, is it possible to set the root
directory `/` backed by RAM, and mount these folders to their expected
locations?

The answer is yes, and there's no modification needed. Except mounting
`nix-store.squashfs`, the NixOS on installation ISO uses the exact same boot
sequence as a regular NixOS on hard drive.

## Pros for going "Stateless"

Compared to a regular NixOS, such a "stateless" NixOS only stores the "states"
you designated onto your disk. Such state may contain files of your website,
contents of your database, or browsing history of your browser. The rest of the
states, which you did not designate to save, are discarded upon reboot.

This is the most significant "pro" for such a configuration: you only preserve
the states you want.

- If some software secretly changes its config file, or stores its data on a
  different location, such modifications are lost on reboot, and the software's
  configuration will be exactly the same as the expected value in your
  Nix-language config file.
- There will be no left over config files in your `/etc` folder. They are gone
  on the next reboot.
- You only need to backup those states not managed by Nix (such as `/home`,
  `/root` and `/var`), in addition to the Nix-language config file, to ensure
  that you can restore the system to the exact state.
- Since most files in the root directory are soft links generated according to
  the config file, it takes almost no space. On one of my servers, the root
  directory takes as small as 660KB of space:

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

## Preparation

To set up a NixOS following steps in this post, you need to prepare:

1. A NixOS installation, managing its configuration with Flake.
2. A LiveCD of NixOS or any other Linux distro, since we need to move critical
   files of NixOS.

## Convert Root to RAM Drive

With a regular NixOS installation, you usually have a config entry for the root
partition similar to this:

```nix
fileSystems."/" = {
  device = "/dev/vda1";
  fsType = "btrfs";
  options = [ "compress-force=zstd" ];
};

# You may also mounted other partitions, like /boot
fileSystems."/boot" = {};
```

The most important folder for NixOS is `/nix`, so we change the root folder `/`
to a RAM drive `tmpfs`, and mount the original partition onto `/nix`:

```nix
fileSystems."/" = {
  device = "tmpfs";
  fsType = "tmpfs";
  # You must set mode=755. The default is 777, and OpenSSH will complain and disallow logins
  options = [ "relatime" "mode=755" ];
};

fileSystems."/nix" = {
  device = "/dev/vda1";
  fsType = "btrfs";
  options = [ "compress-force=zstd" ];
};

# No need to change config for other partitions
fileSystems."/boot" = {};
```

Theoretically, if you apply this config, shutdown, move the files to the correct
location in LiveCD, you will get a NixOS that **only persists whatever is in
your Nix configuration**. This is good for using temporarily (like the NixOS
installation ISO), but since other important states not managed by Nix is not
persisted, this is not ideal for everyday usage.

Such important states not preserved include:

- `/etc/machine-id`, random ID generated by SystemD, used for log management
- `/etc/NetworkManager/system-connections`, connections stored by Network
  Manager
- `/etc/ssh/ssh_host_ed25519_key.pub`, OpenSSH public key
- `/etc/ssh/ssh_host_rsa_key.pub`, OpenSSH public key
- `/etc/ssh/ssh_host_ed25519_key`, OpenSSH private key
- `/etc/ssh/ssh_host_rsa_key`, OpenSSH private key
- and data files in `/home`, `/root`, `/var`

Our next step is to add rules for each of these files/folders, to persist them
on disk.

## Persisting Important State Files

Since `/nix` partition is already mounted, I elected to store the states in
`/nix/persistent`. You can store them on another partition at your discretion.

Then, use bind mounts to map the files back to where they should be:

```nix
fileSystems."/etc/machine-id" = {
  device = "/nix/persistent/etc/machine-id";
  options = [ "bind" ];
};
# ...
```

If you need to persist lots of files, you need one mount for each file or
folder, which is cumbersome and error-prone. The good news is that the Nix
community provided a NixOS module
[Impermanence](https://github.com/nix-community/impermanence) for such scenario,
which provides a convenient way to map files to another location.

First, add Impermanence to `inputs` in your `flake.nix`:

```nix
{
  inputs = {
    impermanence.url = "github:nix-community/impermanence";
  };
}
```

Then add Impermanence to the module list of NixOS:

```nix
{
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations."nixos" = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # Add the following line
        inputs.impermanence.nixosModules.impermanence

        ./configuration.nix
      ];
    };
  };
}
```

You will be able to map files in batch with the following format, no longer
needing a lot of mounts in `fileSystems`:

```nix
# /nix/persistent is the location you plan to store the files
environment.persistence."/nix/persistent" = {
  # Hide these mount from the sidebar of file managers
  hideMounts = true;

  # Folders you want to map
  directories = [
    "/etc/NetworkManager/system-connections"
    "/home"
    "/root"
    "/var"
  ];

  # Files you want to map
  files = [
    "/etc/machine-id"
    "/etc/ssh/ssh_host_ed25519_key.pub"
    "/etc/ssh/ssh_host_ed25519_key"
    "/etc/ssh/ssh_host_rsa_key.pub"
    "/etc/ssh/ssh_host_rsa_key"
  ];

  # Similarly, you can map files and folders in users' home directories
  users.lantian = {
    directories = [
      # Personal files
      "Desktop"
      "Documents"
      "Downloads"
      "Music"
      "Pictures"
      "Videos"

      # Config folders
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

## Move Temp Directory of Nix Daemon

Nix Daemon stores its temporary files under `/tmp` while packaging. If `/tmp` is
backed by RAM, the system may run out of memory while building large packages
(such as the Linux kernel).

`/tmp` in NixOS is not backed by RAM by default, but with our configuration,
`/tmp` will be placed on root folder's RAM drive. Therefore, we can move Nix
Daemon's temp files onto the disk. I'm moving it to `/var/cache/nix` for
example:

```nix
systemd.services.nix-daemon = {
  environment = {
    # Location for temporary files
    TMPDIR = "/var/cache/nix";
  };
  serviceConfig = {
    # Create /var/cache/nix automatically on Nix Daemon start
    CacheDirectory = "nix";
  };
};
```

However, this option does not apply to the root user. This is caused by the nix
command handling the build request itself under root user, rather than passing
it to the Nix Daemon. Therefore, we need to add an environment variable
`NIX_REMOTE=daemon`, to force the nix command to call the daemon:

```nix
environment.variables.NIX_REMOTE = "daemon";
```

> Thanks for NixOS CN Telegram group user "洗白白" for pointing out the problem,
> and "Nick Cao" for providing a fix.

## Activate Config

With the configuration complete, it's finally time to activate it.

First, run `sudo nixos-rebuild boot --flake .` to activate the config on next
reboot. Remember not to use `sudo nixos-rebuild switch --flake .`, since we need
to move the files to their correct locations in LiveCD before we can use that
config.

Reboot the computer into the LiveCD, and mount and `cd` into the original root
partition:

- **BACK UP YOUR DATA if you're unfamiliar with the process!**
- Create a `persistent` folder, correspondong to `/nix/persistent` after system
  starts;
- Move all preserved paths listed above into the `persistent` folder;
- Remove all folders except `nix` and `persistent`;
  - **BACK UP YOUR DATA BEFORE REMOVAL!**
- Move all folders in `nix` to the current directory;
- Finally, remove the `nix` directory and reboot.

If you did everything correctly, you will boot into a "stateless" NixOS.
Everything you elected to persist will be mounted back to their original
location, so the system should behave exactly the same. However, your root
partition has become a `tmpfs` RAM disk, all states you don't intend to keep
will disappear after a reboot, and you will get a "brand new" operating system
each time you start your computer.

## References

During my configuration process, I referenced the following resources:

- [Erase your darlings - Graham Christensen](https://grahamc.com/blog/erase-your-darlings)
  - The earliest "stateless" implementation, restoring states with ZFS
    snapshots.
- [NixOS: tmpfs as root - Elis Hirwing](https://elis.nu/blog/2020/05/nixos-tmpfs-as-root/)
- [Impermanence](https://github.com/nix-community/impermanence)
  - NixOS helper module for going stateless.

You can find my relate configuration in these links:

- Impermanence module config:
  <https://github.com/xddxdd/nixos-config/blob/f7cbc14f23a7d6bb21ca4edb153f704735fe5419/nixos/common-components/impermanence.nix>
- User home directory config:
  <https://github.com/xddxdd/nixos-config/blob/f7cbc14f23a7d6bb21ca4edb153f704735fe5419/nixos/client-components/impermanence.nix>
