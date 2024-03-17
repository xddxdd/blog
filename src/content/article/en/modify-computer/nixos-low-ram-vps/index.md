---
title: 'NixOS Series 5: Creating Disk Image for Low RAM VPS'
categories: 'Computers and Clients'
tags: [NixOS]
date: 2023-12-16 02:30:58
image: /usr/uploads/202110/nixos-social-preview.png
---

@include "\_templates/nixos-series/toc-en.md"

Black friday has passed. Some readers, I believe, have perchased some VPSes or
cloud servers on sale, and want to install NixOS on them. However, since NixOS
is nowhere as famous as popular Linux distros, such as CentOS, Debian and
Ubuntu, almost no VPS provider will offer a disk image preinstalled with NixOS.
This lefts the user one of the following options to perform the installation
manually:

-   Mounting NixOS's installer ISO, and then partition and install manually.

Since you can operate on the VPS's hard drive as you wish in NixOS's
installation media, repartitioning the drive and specifying file system types,
this approach offers the maximum freedom. However, before you can use this
approach, your provider must satisfy one of the three prerequisites:

1. Provider provides a NixOS ISO (even if an older version) and allows you to
   mount it;
2. Provider allows user to upload custom ISO images, with which you can upload a
   copy of NixOS installation media;
3. Provider supports booting to [netboot.xyz](https://netboot.xyz/) (an utility
   to install various Linux distros over the Internet), and your VPS has more
   than 1GB RAM, so that netboot.xyz has enough space to extract NixOS's
   installation image into RAM.

In my case, I purchased a VPS with exactly 1GB of RAM, not enough for extracting
the image of NixOS 23.05. Therefore, I cannot boot into NixOS installation
environment with netboot.xyz. In addition, my provider doesn't support custom
ISOs, so I cannot boot into NixOS installer with that either.

-   Replace the running operating system on VPS with
    [NixOS-Infect](https://github.com/elitak/nixos-infect) or
    [NixOS-Anywhere](https://github.com/nix-community/nixos-anywhere), etc.

NixOS-Infect works by installating a Nix daemon on the local OS, build a
complete NixOS installation on it, and finally replace the bootloader entries
with those for NixOS. Since this approach doesn't require extracting the full
installer image, it is more suitable for VPSes with low RAM. The downside of
this approach though, is that you cannot customize partitions and filesystem
types. You are left with the default partition schemes and filesystems
configured by the provider. For users who depends on non-standard partition or
filesystem schemes, including Btrfs/ZFS or
[Impermanence](/en/article/modify-computer/nixos-impermanence.lantian/), this
approach is not suitable.

NixOS-Anywhere, on the other hand, works by replacing the current running kernel
with `kexec`, and booting straight into NixOS installation image stored in RAM.
Since it works in almost the same way as netboot.xyz, it also requires a large
chunk of RAM, just like netboot.xyz.

-   Use NixOS-Infect first, and then manually adjust partitions in rescue
    environment

I used to setup similar low RAM VPSes by setting up a normal NixOS with
NixOS-Infect first, and then deploy a configuration with Btrfs and Impermanence
enabled, reboot into rescue environment, and finally adjust partitions and
convert filesystems. It works, but takes many steps to complete. In addition, if
I did any of the steps incorrectly, I'm left with an unfixable system, and will
need to start over.

-   ...Any other possibilities?

Recently, the NixOS community released a tool,
[Disko](https://github.com/nix-community/disko). It is originally used for
automatically partitioning hard drives in the NixOS installation environment, so
that user can declaratively partition the drive with a Nix config file. However,
the tool also supports generating a disk image based on a given partition table
and NixOS config. Therefore, we can set up Btrfs/ZFS/Impermanence, generate the
corresponding disk image, and `dd` the image into the VPS's hard drive, to
easily install NixOS on there.

Since this method requires next to nothing for the rescue environment on VPS (as
long as there is network and `dd` command), we can boot into Alpine Linux, a
distro known for minimal RAM usage, and transfer the disk image over the
Internet into the hard drive of VPS.

## Prepare NixOS Configuration

Before using this method, we need to prepare a simple NixOS configuration,
including the basic config for bootloader, networking, root password and SSH
keys, so that you can deploy the full configuration later. Of course, you can
simply use your full NixOS configuration, at the cost of larger disk image.

Here is the configuration file I prepared, stored as `configuration.nix`:

```nix
{
  config,
  pkgs,
  lib,
  ...
}: {
  # Kernel parameters I use
  boot.kernelParams = [
    # Disable auditing
    "audit=0"
    # Do not generate NIC names based on PCIe addresses (e.g. enp1s0, useless for VPS)
    # Generate names based on orders (e.g. eth0)
    "net.ifnames=0"
  ];

  # My Initrd config, enable ZSTD compression and use systemd-based stage 1 boot
  boot.initrd = {
    compressor = "zstd";
    compressorArgs = ["-19" "-T0"];
    systemd.enable = true;
  };

  # Install Grub
  boot.loader.grub = {
    enable = !config.boot.isContainer;
    default = "saved";
    devices = ["/dev/vda"];
  };

  # Timezone, change based on your location
  time.timeZone = "America/Los_Angeles";

  # Root password and SSH keys. If network config is incorrect, use this password
  # to manually adjust network config on serial console/VNC.
  users.mutableUsers = false;
  users.users.root = {
    hashedPassword = "$6$9iybgF./X/RNsRrQ$h7Zlk//loJDPg7yCCPT/9jVU0Tvep6vEA1FvPBT.kqJUA5qlzhDJEYnBFlpBZmTXuUXjF0qgmDWmGkXIMC9JD/";
    openssh.authorizedKeys.keys = [
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMcWoEQ4Mh27AV3ixcn9CMaUK/R+y4y5TqHmn2wJoN6i lantian@lantian-lenovo-archlinux"
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCulLscvKjEeroKdPE207W10MbZ3+ZYzWn34EnVeIG0GzfZ3zkjQJVfXFahu97P68Tw++N6zIk7htGic9SouQuAH8+8kzTB8/55Yjwp7W3bmqL7heTmznRmKehtKg6RVgcpvFfciyxQXV/bzOkyO+xKdmEw+fs92JLUFjd/rbUfVnhJKmrfnohdvKBfgA27szHOzLlESeOJf3PuXV7BLge1B+cO8TJMJXv8iG8P5Uu8UCr857HnfDyrJS82K541Scph3j+NXFBcELb2JSZcWeNJRVacIH3RzgLvp5NuWPBCt6KET1CCJZLsrcajyonkA5TqNhzumIYtUimEnAPoH51hoUD1BaL4wh2DRxqCWOoXn0HMrRmwx65nvWae6+C/7l1rFkWLBir4ABQiKoUb/MrNvoXb+Qw/ZRo6hVCL5rvlvFd35UF0/9wNu1nzZRSs9os2WLBMt00A4qgaU2/ux7G6KApb7shz1TXxkN1k+/EKkxPj/sQuXNvO6Bfxww1xEWFywMNZ8nswpSq/4Ml6nniS2OpkZVM2SQV1q/VdLEKYPrObtp2NgneQ4lzHmAa5MGnUCckES+qOrXFZAcpI126nv1uDXqA2aytN6WHGfN50K05MZ+jA8OM9CWFWIcglnT+rr3l+TI/FLAjE13t6fMTYlBH0C8q+RnQDiIncNwyidQ== lantian@LandeMacBook-Pro.local"
    ];
  };

  # Manage networking with systemd-networkd
  systemd.network.enable = true;
  services.resolved.enable = false;

  # Configure network IP and DNS
  systemd.network.networks.eth0 = {
    address = ["123.45.678.90/24"];
    gateway = ["123.45.678.1"];
    matchConfig.Name = "eth0";
  };
  networking.nameservers = [
    "8.8.8.8"
  ];

  # Enable SSH server and listen on port 2222
  services.openssh = {
    enable = true;
    ports = [2222];
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = lib.mkForce "prohibit-password";
    };
  };

  # Disable NixOS's builtin firewall
  networking.firewall.enable = false;

  # Disable DHCP and configure IP manually
  networking.useDHCP = false;

  # Hostname, can be set as you wish
  networking.hostName = "bootstrap";

  # Latest NixOS version on your first install. Used to prevent backward
  # incompatibilities on major upgrades
  system.stateVersion = "23.05";

  # Kernel modules required by QEMU (KVM) virtual machine
  boot.initrd.postDeviceCommands = lib.mkIf (!config.boot.initrd.systemd.enable) ''
    # Set the system time from the hardware clock to work around a
    # bug in qemu-kvm > 1.5.2 (where the VM clock is initialised
    # to the *boot time* of the host).
    hwclock -s
  '';

  boot.initrd.availableKernelModules = [
    "virtio_net"
    "virtio_pci"
    "virtio_mmio"
    "virtio_blk"
    "virtio_scsi"
  ];
  boot.initrd.kernelModules = [
    "virtio_balloon"
    "virtio_console"
    "virtio_rng"
  ];
}
```

Then, prepare `flake.nix` to manage nixpkgs versions in the Flake way, as well
as introduce other modules I use, such as Impermanence:

```nix
{
  description = "Lan Tian's NixOS Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    impermanence.url = "github:nix-community/impermanence";
  };

  outputs = {
    self,
    nixpkgs,
    ...
  } @ inputs: let
    lib = nixpkgs.lib;
  in rec {
    nixosConfigurations.bootstrap = lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        inputs.impermanence.nixosModules.impermanence
        ./configuration.nix
      ];
    };
  };
}
```

Right now, this system config will not build, as we haven't configured
filesystems yet. If you try to build it with
`nixos-rebuild build --flake .#bootstrap` now, you will see the following
errors:

```bash
error:
Failed assertions:
- The ‘fileSystems’ option does not specify your root file system.
```

Therefore, our next step is adding the Disko module, and the configuration for
partition tables and filesystems.

## Partitioning Disk Image (with Impermanence)

> If you don't use Impermanence, or other mechanisms that use tmpfs as the root
> partition, please skip to the next section.

Change your `flake.nix` to add the Disko module:

```nix
{
  description = "Lan Tian's NixOS Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    impermanence.url = "github:nix-community/impermanence";
    # Add the following lines
    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ...
  } @ inputs: let
    lib = nixpkgs.lib;
  in rec {
    nixosConfigurations.bootstrap = lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        inputs.impermanence.nixosModules.impermanence

        # Add the next line
        inputs.disko.nixosModules.disko

        ./configuration.nix
      ];
    };
  };
}
```

Then, we need to set up partitioning in the disk image with options provided by
Disko. Modify `configuration.nix` and add the following config:

```nix
{
  config,
  pkgs,
  lib,
  ...
}: {
  # Other configurations omitted

  disko = {
    # Do not let Disko manage fileSystems.* config for NixOS.
    # Reason is that Disko mounts partitions by GPT partition names, which are
    # easily overwritten with tools like fdisk. When you fail to deploy a new
    # config in this case, the old config that comes with the disk image will
    # not boot either.
    enableConfig = false;

    devices = {
      # Define a disk
      disk.main = {
        # Size for generated disk image. 2GB is enough for me. Adjust per your need.
        imageSize = "2G";
        # Path to disk. When Disko generates disk images, it actually runs a QEMU
        # virtual machine and runs the installation steps. Whether your VPS
        # recognizes its hard disk as "sda" or "vda" doesn't matter. We abide to
        # Disko's QEMU VM and use "vda" here.
        device = "/dev/vda";
        type = "disk";
        # Parititon table for this disk
        content = {
          # Use GPT partition table. There seems to be some issues with MBR support
          # from Disko.
          type = "gpt";
          # Partition list
          partitions = {
            # Compared to MBR, GPT partition table doesn't reserve space for MBR
            # boot record. We need to reserve the first 1MB for MBR boot record,
            # so Grub can be installed here.
            boot = {
              size = "1M";
              type = "EF02"; # for grub MBR
              # Use the highest priority to ensure it's at the beginning
              priority = 0;
            };

            # ESP partition, or "boot" partition as you may call it. In theory,
            # this config will support VPSes with both EFI and BIOS boot modes.
            ESP = {
              name = "ESP";
              # Reserve 512MB of space per my own need. If you use more/less
              # on your boot partition, adjust accordingly.
              size = "512M";
              type = "EF00";
              # Use the second highest priority so it's before the remaining space
              priority = 1;
              # Format as FAT32
              content = {
                type = "filesystem";
                format = "vfat";
                # Use as boot partition. Disko use the information here to mount
                # partitions on disk image generation. Use the same settings as
                # fileSystems.*
                mountpoint = "/boot";
                mountOptions = ["fmask=0077" "dmask=0077"];
              };
            };

            # Parition to store the NixOS system, use all remaining space.
            nix = {
              size = "100%";
              # Format as Btrfs. Change per your needs.
              content = {
                type = "filesystem";
                format = "btrfs";
                # Use as the Nix partition. Disko use the information here to mount
                # partitions on disk image generation. Use the same settings as
                # fileSystems.*
                mountpoint = "/nix";
                mountOptions = ["compress-force=zstd" "nosuid" "nodev"];
              };
            };
          };
        };
      };

      # Since I enabled Impermanence, I need to declare the root partition as tmpfs,
      # so Disko can mount the partitions when generating disk images
      nodev."/" = {
        fsType = "tmpfs";
        mountOptions = ["relatime" "mode=755" "nosuid" "nodev"];
      };
    };
  };

  # Since we aren't letting Disko manage fileSystems.*, we need to configure it ourselves
  # Root partition, is tmpfs because I enabled impermanence.
  fileSystems."/" = {
    device = "tmpfs";
    fsType = "tmpfs";
    options = ["relatime" "mode=755" "nosuid" "nodev"];
  };

  # /nix partition, third partition on the disk image. Since my VPS recognizes
  # hard drive as "sda", I specify "sda3" here. If your VPS recognizes the drive
  # differently, change accordingly
  fileSystems."/nix" = {
    device = "/dev/sda3";
    fsType = "btrfs";
    options = ["compress-force=zstd" "nosuid" "nodev"];
  };

  # /boot partition, second partition on the disk image. Since my VPS recognizes
  # hard drive as "sda", I specify "sda2" here. If your VPS recognizes the drive
  # differently, change accordingly
  fileSystems."/boot" = {
    device = "/dev/sda2";
    fsType = "vfat";
    options = ["fmask=0077" "dmask=0077"];
  };
}
```

## Partitioning Disk Image (Regular Install)

> If you use Impermanence, or other mechanisms that use tmpfs as the root
> partition, read the last section and skip this section.

Same as the last section, change your `flake.nix` to add the Disko module:

```nix
{
  description = "Lan Tian's NixOS Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    impermanence.url = "github:nix-community/impermanence";
    # Add the following lines
    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ...
  } @ inputs: let
    lib = nixpkgs.lib;
  in rec {
    nixosConfigurations.bootstrap = lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        inputs.impermanence.nixosModules.impermanence

        # Add the next line
        inputs.disko.nixosModules.disko

        ./configuration.nix
      ];
    };
  };
}
```

Then, we need to set up partitioning in the disk image with options provided by
Disko. Modify `configuration.nix` and add the following config:

```nix
{
  config,
  pkgs,
  lib,
  ...
}: {
  # Other configurations omitted

  disko = {
    # Do not let Disko manage fileSystems.* config for NixOS.
    # Reason is that Disko mounts partitions by GPT partition names, which are
    # easily overwritten with tools like fdisk. When you fail to deploy a new
    # config in this case, the old config that comes with the disk image will
    # not boot either.
    enableConfig = false;

    devices = {
      # Define a disk
      disk.main = {
        # Size for generated disk image. 2GB is enough for me. Adjust per your need.
        imageSize = "2G";
        # Path to disk. When Disko generates disk images, it actually runs a QEMU
        # virtual machine and runs the installation steps. Whether your VPS
        # recognizes its hard disk as "sda" or "vda" doesn't matter. We abide to
        # Disko's QEMU VM and use "vda" here.
        device = "/dev/vda";
        type = "disk";
        # Parititon table for this disk
        content = {
          # Use GPT partition table. There seems to be some issues with MBR support
          # from Disko.
          type = "gpt";
          # Partition list
          partitions = {
            # Compared to MBR, GPT partition table doesn't reserve space for MBR
            # boot record. We need to reserve the first 1MB for MBR boot record,
            # so Grub can be installed here.
            boot = {
              size = "1M";
              type = "EF02"; # for grub MBR
              # Use the highest priority to ensure it's at the beginning
              priority = 0;
            };

            # ESP partition, or "boot" partition as you may call it. In theory,
            # this config will support VPSes with both EFI and BIOS boot modes.
            ESP = {
              name = "ESP";
              # Reserve 512MB of space per my own need. If you use more/less
              # on your boot partition, adjust accordingly.
              size = "512M";
              type = "EF00";
              # Use the second highest priority so it's before the remaining space
              priority = 1;
              # Format as FAT32
              content = {
                type = "filesystem";
                format = "vfat";
                # Use as boot partition. Disko use the information here to mount
                # partitions on disk image generation. Use the same settings as
                # fileSystems.*
                mountpoint = "/boot";
                mountOptions = ["fmask=0077" "dmask=0077"];
              };
            };

            # Parition to store the NixOS system, use all remaining space.
            nix = {
              size = "100%";
              # Format as Btrfs. Change per your needs.
              content = {
                type = "filesystem";
                format = "btrfs";
                # Use as the root partition. Disko use the information here to mount
                # partitions on disk image generation. Use the same settings as
                # fileSystems.*
                mountpoint = "/";
                mountOptions = ["compress-force=zstd" "nosuid" "nodev"];
              };
            };
          };
        };
      };
    };
  };

  # Since we aren't letting Disko manage fileSystems.*, we need to configure it ourselves
  # Root partition, third partition on the disk image. Since my VPS recognizes
  # hard drive as "sda", I specify "sda3" here. If your VPS recognizes the drive
  # differently, change accordingly
  fileSystems."/" = {
    device = "/dev/sda3";
    fsType = "btrfs";
    options = ["compress-force=zstd" "nosuid" "nodev"];
  };

  # /boot partition, second partition on the disk image. Since my VPS recognizes
  # hard drive as "sda", I specify "sda2" here. If your VPS recognizes the drive
  # differently, change accordingly
  fileSystems."/boot" = {
    device = "/dev/sda2";
    fsType = "vfat";
    options = ["fmask=0077" "dmask=0077"];
  };
}
```

## Generate Disk Image

Change `flake.nix` to add a "package" that calls the generate disk image
function from Disko:

```nix
{
  description = "Lan Tian's NixOS Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    impermanence.url = "github:nix-community/impermanence";
    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ...
  } @ inputs: let
    lib = nixpkgs.lib;
  in rec {
    nixosConfigurations.bootstrap = lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        inputs.impermanence.nixosModules.impermanence
        inputs.disko.nixosModules.disko
        ./configuration.nix
      ];
    };

    # Add the following lines
    packages.x86_64-linux = {
      image = self.nixosConfigurations.bootstrap.config.system.build.diskoImages;
    };
  };
}
```

Finally, run `nix build .#image`. After a short while, you will see the
generated disk image at `result/main.raw`.

## Upload Disk Image to VPS

Boot into rescue environment, or a lightweight Linux distro like Alpine Linux,
on your VPS.

If your rescue environment has a SSH server, use the following command to upload
your image:

```bash
# Change to sda/vda based on how your VPS recognizes its hard drive
cat result/main.raw | ssh root@123.45.678.90 "dd of=/dev/sda"
```

If your rescue environment doesn't have SSH, use the following command:
**(ATTENTION: NO ENCRYPTION!)**

```bash
# Change to sda/vda based on how your VPS recognizes its hard drive
# Run this on VPS
nc -l 1234 | dd of=/dev/sda
# Run this on local computer
cat result/main.raw | nc 123.45.678.89 1234
```

Reboot your VPS after the command finishes. Now you should be booting into the
freshly installed NixOS.

## Expand Partition Size

Since the disk image we created is only 2GB large, the image written into VPS's
hard drive doesn't consume all spaces on the hard drive. You will need to
manually expand the partition.

Run `fdisk /dev/sda`, remove the third partition for `/nix` (or `/`), and
recreate the partition with the same start position, and extend the end position
to the end of the hard drive. Do not erase the filesystem header when prompted!

Finally, run the filesystem resize command for your filesystem. For ext4
partitions, use `resize2fs /dev/sda3`. For Btrfs, use
`btrfs filesystem resize max /nix` (or '/').
