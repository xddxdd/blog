---
title: 'Building Custom Android Kernel with Nix'
categories: 'Computers and Clients'
tags: [Nix, Android, Kernel, KernelSU, SusFS]
date: 2025-02-10 00:44:06
---

# Preface

The mobile phone I'm using today is Motorola Edge+ 2023, an Android phone. To
better customize my phone's functionalities, I unlocked its bootloader, and
obtained root privileges, in order to install LSPosed and various LSPosed based
plugins.

The root mechanism I'm using is [KernelSU](https://kernelsu.org/), which works
by modifying the Linux kernel to grant and only grant root permissions to
certain apps. Although KernelSU provides official GKI kernel images that work on
most phones, I also flashed LineageOS onto my phone, which is not compatible
with GKI images. Therefore, I have to compile my own kernel.

Since modifying the kernel's binary image is difficult, we usually obtain the
kernel source code under the GPLv2 license from the phone manufacturer, modify
it according to
[KernelSU's official guide](https://kernelsu.org/guide/how-to-integrate-for-non-gki.html),
and compile it into a full kernel.

> Note: There is a new root mechanism [APatch](https://apatch.dev/) that works
> by modifying kernel binary image directly, and achieves similar effects to
> KernelSU. I never use APatch, but it's worth a try if you don't want to
> compile your own kernel.

Since KernelSU is widely used, some developers created GitHub Actions Workflows,
such as <https://github.com/xiaoleGun/KernelSU_Action>. They can automatically
patch the kernel source code and compile the kernel. However, as I tried some of
these workflows, I found a few problems:

- These workflows will install multiple compilers alongside each other,
  including the GCC that comes with GitHub Actions, Android-specific
  [ARM32 GCC](https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/arm/arm-linux-androideabi-4.9/)
  and
  [ARM64 GCC](https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/aarch64/aarch64-linux-android-4.9)
  provided by Google, and
  [Clang](https://android.googlesource.com/platform/prebuilts/clang/host/linux-x86/).
  If the compilation parameters are not set correctly, different parts of the
  kernel may be compiled with different compilers, creating a kernel that is
  unstable or wouldn't boot at all.
- These workflows only run on GitHub Actions and are difficult to debug locally.
- These workflows usually run on schedule or are manually triggered by users. If
  they run on schedule, they recompile kernels even if there are no source code
  changes, wasting compute resources. If they are manually triggered, users may
  not get the latest kernel updates in time.

Since I have been using NixOS recently, I naturally thought of using the Nix
package manager to solve these problems:

- Nix creates an isolated environment when building packages, with only the
  compilers I specified. This prevents issues caused by mixing compilers.
- Nix package manager can run either locally on Linux, or on GitHub Actions.
  Since it creates the same isolated environment anywhere, I can test the flow
  locally first, and then upload it to GitHub, and confidently have Actions
  automatically compile updated kernels.
- Nix also records all source code versions (actually source code SHA256s) and
  the compilation commands when building packages. If neither the source code
  nor the compilation command changes, Nix can reuse the last compilation
  results without repeating the work.

Therefore, I created a set of Nix-based scripts (actually Nix Derivations), to
compile the kernel for my phone.

# Usage

I uploaded the script to GitHub:
<https://github.com/xddxdd/nix-kernelsu-builder>

This script can automatically apply KernelSU and SusFS patches to your kernel
source code, compile it, and generate an AnyKernel-based package you can flash
in Recovery.

After installing the Nix package manager, you can fork the repository, modify
`kernel.nix` to contain kernel of your phone, and build the kernel with
`nix build .#[Kernel name]`. The configuration details are listed in the README
of the repo.

If you're using [Flake.parts](https://flake.parts/), you can also use my repo as
a Flake.parts module:

```nix
{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nix-kernelsu-builder.url = "github:xddxdd/nix-kernelsu-builder";
  };
  outputs =
    { flake-parts, ... }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        inputs.nix-kernelsu-builder.flakeModules.default
      ];
      systems = [ "x86_64-linux" ];
      perSystem =
        { pkgs, ... }:
        {
          kernelsu = {
            # Add your own kernel definition here
            example-kernel = {
              anyKernelVariant = "kernelsu";
              clangVersion = "latest";

              kernelSU.variant = "next";
              susfs = {
                enable = true;
                src = path/to/sufs/source;
                kernelsuPatch = ./patches/susfs-for-kernelsu-next.patch;
              };

              kernelDefconfigs = [
                "gki_defconfig"
                "vendor/kalama_GKI.config"
                "vendor/ext_config/moto-kalama.config"
                "vendor/ext_config/moto-kalama-gki.config"
                "vendor/ext_config/moto-kalama-rtwo.config"
              ];
              kernelImageName = "Image";
              kernelMakeFlags = [
                "KCFLAGS=\"-w\""
                "KCPPFLAGS=\"-w\""
              ];
              kernelSrc = path/to/kernel/source;
            };
          };
        };
    };
}
```

# Key Details

Next, I wll explain some key parts of the compilation scripts.

## Preparing a Compiler

The first thing to prepare for compiling kernel is to get a compiler. The usual
compiler for Android kernels is Clang, but the kernel for some older devices
might be too old for Clang, and GCC must be used in this case.

Clang compiler is easy to get. Nixpkgs already has Clang packaged in it, and you
can run `nix run nixpkgs#clang -- --version` to see the latest Clang version:

```bash
# nix run nixpkgs#clang -- --version
clang version 19.1.6
Target: x86_64-unknown-linux-gnu
Thread model: posix
InstalledDir: /nix/store/2d1r5kvz7plg24bwb316972knqmiyf2p-clang-19.1.6/bin
```

Clang itself supports cross compilation, and can produce ARM32 and ARM64
binaries directly on x86_64 devices, without additional toolchains. Therefore,
the Clang compiler in Nixpkgs can be used directly.

Things get more complicated with GCC for older kernels. Nixpkgs already removed
older GCCs, and as of now (Feb 2025) the oldest GCC in Nixpkgs is 9.5.0. In
addition, GCC by default only supports compiling programs to the same platform.
A special GCC and toolchains is needed for cross compiling ARM32/ARM64 kernels.

Here I decided to take a short cut: I directly packaged Google's GCC compiler
into Nix packages, so that they can be provided to the compilation environment.
Although Google has deleted the older GCC compilers from their servers, there
are backups available on GitHub

Here is the package for ARM32 GCC:

```nix
{
  stdenv,
  lib,
  fetchFromGitHub,
  autoPatchelfHook,
  python3,
}:
stdenv.mkDerivation rec {
  pname = "gcc-arm-linux-androideabi";
  version = "3ecb542702c2ca0e502533c3f6d02f0f06f584f1";
  src = fetchFromGitHub {
    owner = "KudProject";
    repo = "arm-linux-androideabi-4.9";
    rev = "3ecb542702c2ca0e502533c3f6d02f0f06f584f1";
    fetchSubmodules = false;
    sha256 = "sha256-5aF2Pl+h6J8/5TfQf2ojp3FCnoKakWH6KBCkWdy5ho8=";
  };

  nativeBuildInputs = [ autoPatchelfHook ];
  buildInputs = [ python3 ];

  installPhase = ''
    mkdir -p $out
    cp -r * $out/
  '';

  meta = {
    maintainers = with lib.maintainers; [ xddxdd ];
    license = lib.licenses.gpl3Plus;
    description = "ARM32 GCC for building Android kernels";
    platforms = [ "x86_64-linux" ];
  };
}
```

And here is the package for ARM64 GCC:

```nix
{
  stdenv,
  lib,
  fetchFromGitHub,
  autoPatchelfHook,
  python3,
}:
stdenv.mkDerivation rec {
  pname = "gcc-aarch64-linux-android";
  version = "5797d7f622321e734558bd3372a9ab5ad6e6a48e";
  src = fetchFromGitHub {
    owner = "kindle4jerry";
    repo = "aarch64-linux-android-4.9-bakup";
    rev = "5797d7f622321e734558bd3372a9ab5ad6e6a48e";
    fetchSubmodules = false;
    sha256 = "sha256-ZrQmFyiDOKg+qcgdpZqtz+LgDDaao2W27kdZZ2As8XU=";
  };

  nativeBuildInputs = [ autoPatchelfHook ];
  buildInputs = [ python3 ];

  installPhase = ''
    mkdir -p $out
    cp -r * $out/
  '';

  meta = {
    maintainers = with lib.maintainers; [ xddxdd ];
    license = lib.licenses.gpl3Plus;
    description = "ARM64 GCC for building Android kernels";
    platforms = [ "x86_64-linux" ];
  };
}
```

## Obtain Kernel and KernelSU Sources

With the compiler ready, the next step is to obtain source code for both the
kernel and KernelSU. Since I'm using LineageOS, I can directly download kernel
source code from LineageOS's GitHub repository:
<https://github.com/LineageOS/android_kernel_motorola_sm8550>

> You can also look for kernel source code from the manufacturer's website.
> Since the Linux kernel is licensed under GPLv2, all phone manufacturers must
> open source their modified kernel source code.

In the Nix package manager, you can use `fetchFromGitHub` to download kernel
source code from GitHub:

```nix
fetchFromGitHub {
  owner = "LineageOS";
  repo = "android_kernel_motorola_sm8550";
  rev = "1bdeb4f5c8d2b98ef5f2bedaa5d704032dffd676";
  fetchSubmodules = false;
  sha256 = "sha256-ZK/DH5N5LdkLe48cANESjw1x74aXoZLFoMAwEDvzEk4=";
};
```

But this gives you the kernel source code at the commit specified by `rev`
argument, with no automatic updates. To fix this, we can use
[Nvfetcher](https://github.com/berberman/nvfetcher) to automatically get the
latest commit. First create a `nvfetcher.toml` file:

```toml
[linux-moto-rtwo-lineageos-22_1]
src.git = "https://github.com/LineageOS/android_kernel_motorola_sm8550.git"
src.branch = "lineage-22.1"
fetch.github = "LineageOS/android_kernel_motorola_sm8550"
```

And then run Nvfetcher: `nix run github:berberman/nvfetcher`

Nvfetcher will download the latest commit based on your configuration, and write
it to `_sources/generated.nix`. Now you can use the kernel source code from this
file:

```nix
let
  sources = callPackage ../_sources/generated.nix { };
in
  sources.linux-moto-rtwo-lineageos-22_1.src
```

We can use the same approach for KernelSU, but since KernelSU only supports GKI
kernels starting from 1.0, we can only use the last version 0.9.5 still has
support for other kernels:

```toml
# nvfetcher.toml

[kernelsu-stable]
src.manual = "v0.9.5"
fetch.git = "https://github.com/tiann/KernelSU.git"

# We also need to get the revision code (commit count). For 0.9.5 just hardcode it
[kernelsu-stable-revision-code]
src.manual = "11872"
# Download URL doesn't matter, we only need the version code
fetch.url = "https://example.com"
```

But now there is a KernelSU Fork
[KernelSU-Next](https://github.com/rifsxd/KernelSU-Next) that supports both GKI
and non-GKI kernels, so we can use it for the latest features:

```toml
# nvfetcher.toml

[kernelsu-next]
src.github = "rifsxd/KernelSU-Next"
fetch.git = "https://github.com/rifsxd/KernelSU-Next.git"

# Extract commit count from the manager APK filename released by KernelSU-Next
[kernelsu-next-revision-code]
src.webpage = "https://api.github.com/repos/rifsxd/KernelSU-Next/releases?per_page=1"
src.regex = "download\\/v[0-9\\._]+\\/KernelSU[^\"]*_([0-9]+)-release\\.apk"
# Download URL doesn't matter, we only need the version code
fetch.url = "https://example.com"
```

## Patch Kernel Source Code

With kernel source code and KernelSU ready, the next step is to follow
[KernelSU's official guide](https://kernelsu.org/guide/how-to-integrate-for-non-gki.html)
to modify the kernel. What I did is just converting the steps into Bash scripts
and put them in the Nix files.

The only thing worth mentioning is that KernelSU will try to obtain the commit
count with Git, which is the version number you see in KernelSU manager. But
because of a limitation by Nix package manager, there is no Git-related
information in the downloaded source code. Therefore, we need to modify
KernelSU's scripts to use the commit count we obtained earlier:

```nix
let
  # Create a fake git command to prevent "command not found" errors
  fakeGit = writeShellScriptBin "git" ''
    exit 0
  '';
in
stdenv.mkDerivation {
  # ...

  nativeBuildInputs = [
    fakeGit
  ];

  postPatch = ''
    export HOME=$(pwd)

    # Copy KernelSU to the kernel source folder
    cp -r ${kernelSU.src} ${kernelSU.subdirectory}
    chmod -R +w ${kernelSU.subdirectory}

    # Override KernelSU version and prevent it from getting version from Git
    sed -i "/ version:/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "/KSU_GIT_VERSION not defined/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "s|ccflags-y += -DKSU_VERSION=|ccflags-y += -DKSU_VERSION=\"${kernelSU.revision}\"\n#|g" ${kernelSU.subdirectory}/kernel/Makefile

    # Replace shebangs like #!/bin/sh in compilation scripts to paths in isolated environment
    patchShebangs .

    # Call KernelSU's script to apply patches
    bash ${kernelSU.subdirectory}/kernel/setup.sh
  '';

  # ...
}
```

The full source code can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/patch-kernel-src.nix>.

## (Optional) SusFS Patches

[SusFS](https://gitlab.com/simonpunk/susfs4ksu) is an additional set of kernel
patches. It hides certain system file changes after obtaining root permission,
and make them only visible to apps with root permission and the system itself,
making it difficult for apps to detect root existence and refuse to start.

Again, following [SusFS's README](https://gitlab.com/simonpunk/susfs4ksu) is
enough:

```nix
stdenv.mkDerivation {
  # ...

  postPatch = ''
    export HOME=$(pwd)

    # Copy KernelSU to the kernel source folder
    cp -r ${kernelSU.src} ${kernelSU.subdirectory}
    chmod -R +w ${kernelSU.subdirectory}

    # Override KernelSU version and prevent it from getting version from Git
    sed -i "/ version:/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "/KSU_GIT_VERSION not defined/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "s|ccflags-y += -DKSU_VERSION=|ccflags-y += -DKSU_VERSION=\"${kernelSU.revision}\"\n#|g" ${kernelSU.subdirectory}/kernel/Makefile

    # Copy SusFS to the kernel source folder
    cp -r ${susfs.src}/kernel_patches/fs/* fs/
    cp -r ${susfs.src}/kernel_patches/include/linux/* include/linux/
    chmod -R +w fs include/linux

    # Apply SusFS patches to the kernel
    patch -p1 < ${susfs.kernelPatch}

    # Apply SusFS patches to KernelSU
    pushd ${kernelSU.subdirectory}
    patch -p1 < ${susfs.kernelsuPatch}
    popd

    # Replace shebangs like #!/bin/sh in compilation scripts to paths in isolated environment
    patchShebangs .

    # Call KernelSU's script to apply patches
    bash ${kernelSU.subdirectory}/kernel/setup.sh
  '';

  # ...
}
```

The full source code can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/patch-kernel-src.nix>.

## Enable KernelSU Related Options

After adding KernelSU patches, we als need to enable the relevant options in
`defconfig`, so that we make sure KernelSU functionalities are actually added to
the compiled kernel:

```bash
# Specify path to defconfig file
export CFG_PATH=arch/${arch}/configs/${defconfig}

# If KernelSU is enabled
echo "CONFIG_MODULES=y" >> $CFG_PATH
echo "CONFIG_KPROBES=y" >> $CFG_PATH
echo "CONFIG_HAVE_KPROBES=y" >> $CFG_PATH
echo "CONFIG_KPROBE_EVENTS=y" >> $CFG_PATH
echo "CONFIG_OVERLAY_FS=y" >> $CFG_PATH
echo "CONFIG_KSU=y" >> $CFG_PATH

# If SusFS is enabled
echo "CONFIG_KSU_SUSFS=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_HAS_MAGIC_MOUNT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SUS_PATH=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SUS_MOUNT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_AUTO_ADD_SUS_KSU_DEFAULT_MOUNT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_AUTO_ADD_SUS_BIND_MOUNT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SUS_KSTAT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SUS_OVERLAYFS=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_TRY_UMOUNT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_AUTO_ADD_TRY_UMOUNT_FOR_BIND_MOUNT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SPOOF_UNAME=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_ENABLE_LOG=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_HIDE_KSU_SUSFS_SYMBOLS=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SPOOF_CMDLINE_OR_BOOTCONFIG=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_OPEN_REDIRECT=y" >> $CFG_PATH
echo "CONFIG_KSU_SUSFS_SUS_SU=y" >> $CFG_PATH
echo "CONFIG_TMPFS_XATTR=y" >> $CFG_PATH
```

The full command can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/kernel-config-cmd.nix>.

## Compiling the Kernel

Next step is to compile the kernel image based on the patched source code.

If you're using GCC as the compiler, you will need to add the Google-provided
compilers to the compilation environment, and specify the compiler prefix in the
flags:

```nix
let
  gcc-aarch64-linux-android = pkgs.callPackage ../pkgs/gcc-aarch64-linux-android.nix { };
  gcc-arm-linux-androideabi = pkgs.callPackage ../pkgs/gcc-arm-linux-androideabi.nix { };

  # Passed to make command later
  finalMakeFlags = [
    "ARCH=${arch}"
    "CROSS_COMPILE=aarch64-linux-android-"
    "CROSS_COMPILE_ARM32=arm-linux-androideabi-"
    "O=$out"
  ];
in
stdenv.mkDerivation {
  # ...
  nativeBuildInputs = [
    gcc-aarch64-linux-android
    gcc-arm-linux-androideabi
  ];
  # ...
}
```

The full command can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-kernel-gcc.nix>.

If you're using Clang as the compiler, you can directly use the Clang `stdenv`
in Nixpkgs, and specify using LLVM and `lld` in compilation flags:

```nix
let
  # Passed to make command later
  finalMakeFlags = [
    "ARCH=${arch}"
    "CC=clang"
    "O=$out"
    "LD=ld.lld"
    "LLVM=1"
    "LLVM_IAS=1"
    "CLANG_TRIPLE=aarch64-linux-gnu-"
  ] ++ makeFlags;

  # Use user-specified Clang/LLVM version
  usedLLVMPackages = pkgs."llvmPackages_${builtins.toString clangVersion}";
in
# Use Clang/LLVM stdenv which comes with Clang/LLVM toolchains
usedLLVMPackages.stdenv.mkDerivation {
  # ...
  nativeBuildInputs = [
    # Add ld.lld command
    usedLLVMPackages.bintools
  ];
  # ...
}
```

The full command can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-kernel-clang.nix>.

## Generating AnyKernel Flashable Package

[AnyKernel](https://github.com/osm0sis/AnyKernel3) is an Android flashable
package template that can flash the given kernel image into the phone. One
advantage of AnyKernel is that it only modifies the kernel image, while leaving
other startup commands in Initramfs intact, including startup commands of the
Android system itself and Magisk (if installed).

Using AnyKernel itself is very simple: Just modify the parameters in
`anykernel.sh` based on your phone's situation, and package the kernel files
along with AnyKernel files into a `zip` compressed archive.

The only thing to note is that the original AnyKernel only supports non-GKI
devices, and will fail on GKI devices. The KernelSU team provides a
[modified AnyKernel](https://github.com/Kernel-SU/AnyKernel3) that is the exact
opposite: It only supports GKI devices, and will fail on non-GKI devices. Use
the one according to your need.

I added both AnyKernel variants to `nvfetcher.toml` to be used later"

```toml
[anykernel-kernelsu]
src.git = "https://github.com/Kernel-SU/AnyKernel3.git"
fetch.github = "Kernel-SU/AnyKernel3"

[anykernel-osm0sis]
src.git = "https://github.com/osm0sis/AnyKernel3.git"
fetch.github = "osm0sis/AnyKernel3"
```

The full packaging code can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-anykernel-zip.nix>.

## (Optional) Generating boot.img

If you can't or don't want to use AnyKernel, such as if your device doesn't have
a third party recovery, you can find a `boot.img` for your device, replace the
kernel in it, and leave the other parts intact. This can achieve the same effect
as if you used AnyKernel.

```bash
# Record parameters of the original boot.img
IMG_FORMAT=$(unpack_bootimg --boot_img ${bootImg} --format mkbootimg)
echo "Image format: \"$IMG_FORMAT\""

# Unpack boot.img
unpack_bootimg --boot_img ${bootImg}
# Replace the kernel with the new one we compiled
cp ${kernel}/arch/${arch}/boot/${kernelImageName} out/kernel

# Repackage boot.img with the original parameters and the new kernel
eval "mkbootimg $IMG_FORMAT -o $out/boot.img"
```

The full packaging code can be found at
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-boot-img.nix>.
