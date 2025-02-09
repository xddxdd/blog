---
title: '用 Nix 编译自定义 Android 内核'
categories: 计算机与客户端
tags: [Nix, Android, 内核, KernelSU, SusFS]
date: 2025-02-10 00:44:06
---

# 前言

我现在使用的手机是 Motorola Edge+
2023，一台 Android 手机。为了更好的自定义手机的功能，我解锁了手机的 Bootloader，并且获取了 Root 权限，以便安装 LSPosed 以及基于 LSPosed 的各种插件。

我使用的 Root 方案是
[KernelSU](https://kernelsu.org/)，通过修改 Linux 内核，从而允许且只允许指定程序获取 Root 权限。虽然 KernelSU 官方提供了适配大部分手机的
[GKI](https://source.android.com/docs/core/architecture/kernel/generic-kernel-image)
内核镜像，但我给手机刷了不兼容 GKI 的 LineageOS，所以只能自己编译内核。

由于直接修改内核镜像的难度较大，我们一般是从手机厂商获取以 GPLv2 协议开源的内核源码，按照
[KernelSU 的官方教程](https://kernelsu.org/zh_CN/guide/how-to-integrate-for-non-gki.html)进行修改后，再编译成完整的内核。

> 注：现在有一种新的 Root 方案
> [APatch](https://apatch.dev/)，通过直接修改内核镜像来实现类似 KernelSU 的功能。我没试过 APatch，但如果你不想自己编译内核，可以尝试一下。

由于 KernelSU 使用广泛，有一些开发者编写了 GitHub Actions 的 Workflow，例如
<https://github.com/xiaoleGun/KernelSU_Action>，可以自动给内核源码打补丁并进行编译。但我在尝试这些 Workflow 时发现了一些问题：

- 这些 Workflow 会同时安装多种编译器，包括 GitHub
  Actions 环境自带的 GCC，Google 专门为 Android 提供的
  [ARM32 GCC](https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/arm/arm-linux-androideabi-4.9/)
  和
  [ARM64 GCC](https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/aarch64/aarch64-linux-android-4.9)，以及
  [Clang](https://android.googlesource.com/platform/prebuilts/clang/host/linux-x86/)。如果编译参数设置错误，编译 Android 内核时会混用多种编译器进行编译，导致最终生成的内核运行不稳定，甚至无法启动。
- 这些 Workflow 都只能在 GitHub Actions 上运行，难以在本地进行调试。
- 这些 Workflow 一般都是定时运行，或者由用户手动触发。如果采用定时运行，即使内核源码和 KernelSU 源码都没有更新，Workflow 也会反复重新编译内核，浪费计算资源。如果由用户手动触发，可能无法及时获取到最新的内核更新。

因为我最近一直在用 NixOS 作为操作系统，我自然想到了用 Nix 包管理器解决上面的问题：

- Nix 在构建软件包时会创建一个隔离环境，其中只含有我指定的编译器。这就避免了混用编译器导致的问题。
- Nix 包管理器既可以在本地的 Linux 系统上运行，也可以在 GitHub
  Actions 上运行，并且创建的隔离环境都是一样的。因此我可以在本地调试完流程，然后放心地上传到 GitHub 上让 Actions 去自动编译更新后的内核。
- Nix 在构建软件包时同样会记录所有源代码的版本（实际上是记录源码的 SHA256）和编译命令。如果源代码版本和编译命令都和之前的相同，Nix 可以直接调出上次的编译结果，不用重复编译。

于是，我就写了一套 Nix 的编译脚本（Nix Derivation），用来给我的手机编译内核。

# 使用

我把这套编译脚本上传到了 GitHub：<https://github.com/xddxdd/nix-kernelsu-builder>

这套脚本可以自动给你的内核源码打上 KernelSU 和 SusFS 补丁，然后编译内核并生成基于 AnyKernel 的刷机包，供在 Recovery 中刷入。

在安装 Nix 包管理器后，你可以 Fork 仓库，修改 `kernels.nix`
加入你的手机的内核信息，然后通过 `nix build .#[内核名称]`
来编译内核。具体的配置参数已经列出在仓库的 README 中。

如果你使用
[Flake.parts](https://flake.parts/)，你也可以把我的仓库当成 Flake.parts 的模块使用：

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
            # 在此处添加你的内核配置
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

# 关键部分

下文将介绍这套脚本中的一些关键部分。

## 准备编译器

要编译内核，首先要准备好的就是编译器。编译 Android 内核时常用的编译器是 Clang，但一些老旧设备的内核可能太老，不支持 Clang，此时就需要使用 GCC 编译器。

Clang 编译器很好解决，Nixpkgs 里就有 Clang 的软件包，可以用
`nix run nixpkgs#clang -- --version` 看到最新的 Clang 版本：

```bash
# nix run nixpkgs#clang -- --version
clang version 19.1.6
Target: x86_64-unknown-linux-gnu
Thread model: posix
InstalledDir: /nix/store/2d1r5kvz7plg24bwb316972knqmiyf2p-clang-19.1.6/bin
```

Clang 编译器本身支持交叉编译，可以直接在 x86_64 的电脑上编译 ARM32、ARM64 的程序，不需要额外的工具链，因此 Nixpkgs 里的 Clang 可以直接使用。

老旧内核的 GCC 就有点麻烦了，Nixpkgs 里早已删除了老旧的 GCC 版本，目前（2025 年 2 月）Nixpkgs 里最旧的 GCC 版本是 9.5.0。而且，默认的 GCC 只能编译同平台的程序，要交叉编译 ARM32/ARM64 的内核需要特殊的 GCC 和工具链。

在这里我选择了取巧的方法：我直接把 Google 提供的 GCC 编译器打包成 Nix 的软件包，提供给编译环境。虽然 Google 已经从服务器上删除了较老的 GCC 编译器，但 GitHub 上有人提供了备份。

ARM32 GCC 的打包结果如下：

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

而 ARM64 GCC 的打包结果如下：

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

## 获取内核和 KernelSU 源码

有了编译器，下一步就是要获取内核和 KernelSU 的源代码。因为我用的是 LineageOS，我可以直接从 LineageOS 的 GitHub 仓库里下载到内核源码：<https://github.com/LineageOS/android_kernel_motorola_sm8550>

> 你也可以去手机厂商的官网上找内核代码。由于 Linux 内核的授权协议是 GPLv2，所有手机厂商都必须把他们修改后的内核代码开源。

在 Nix 包管理器中，你可以用 `fetchFromGitHub` 函数从 GitHub 上下载内核源码：

```nix
fetchFromGitHub {
  owner = "LineageOS";
  repo = "android_kernel_motorola_sm8550";
  rev = "1bdeb4f5c8d2b98ef5f2bedaa5d704032dffd676";
  fetchSubmodules = false;
  sha256 = "sha256-ZK/DH5N5LdkLe48cANESjw1x74aXoZLFoMAwEDvzEk4=";
};
```

但这样下载的是 `rev`
参数指定的 Commit 的内核源码，不会自动更新。要解决这个问题，我们可以用
[Nvfetcher](https://github.com/berberman/nvfetcher)
工具，自动获取最新 Commit。首先创建一个 `nvfetcher.toml` 文件：

```toml
[linux-moto-rtwo-lineageos-22_1]
src.git = "https://github.com/LineageOS/android_kernel_motorola_sm8550.git"
src.branch = "lineage-22.1"
fetch.github = "LineageOS/android_kernel_motorola_sm8550"
```

然后运行 Nvfetcher：`nix run github:berberman/nvfetcher`

Nvfetcher 会根据你的配置自动下载最新的 Commit，并写入 `_sources/generated.nix`
文件中。然后你就可以调用这个文件里配置好的内核源码了：

```nix
let
  sources = callPackage ../_sources/generated.nix { };
in
  sources.linux-moto-rtwo-lineageos-22_1.src
```

我们可以用同样的方法获取 KernelSU 的版本，但由于 KernelSU 从 1.0 开始的版本只支持 GKI 内核，我们只能使用最后一个支持其它内核的 0.9.5 版本：

```toml
# nvfetcher.toml

[kernelsu-stable]
src.manual = "v0.9.5"
fetch.git = "https://github.com/tiann/KernelSU.git"

# 我们还需要获取 KernelSU 的 Revision Code（即 Commit 数量）。对于 0.9.5 版本可以直接写死
[kernelsu-stable-revision-code]
src.manual = "11872"
# 下载地址无所谓，我们只用版本号
fetch.url = "https://example.com"
```

不过现在有一个 KernelSU 的 Fork
[KernelSU-Next](https://github.com/rifsxd/KernelSU-Next)，其最新版本同时支持 GKI 和非 GKI 内核，因此我们可以用它获取最新功能：

```toml
# nvfetcher.toml

[kernelsu-next]
src.github = "rifsxd/KernelSU-Next"
fetch.git = "https://github.com/rifsxd/KernelSU-Next.git"

# 从 KernelSU-Next 官方发布的管理器 APK 文件名提取 Commit 数量
[kernelsu-next-revision-code]
src.webpage = "https://api.github.com/repos/rifsxd/KernelSU-Next/releases?per_page=1"
src.regex = "download\\/v[0-9\\._]+\\/KernelSU[^\"]*_([0-9]+)-release\\.apk"
# 下载地址无所谓，我们只用版本号
fetch.url = "https://example.com"
```

## 给内核源码打补丁

有了内核源码和 KernelSU，下一步就是按照
[KernelSU 的官方教程](https://kernelsu.org/zh_CN/guide/how-to-integrate-for-non-gki.html)修改内核。这一步我只是将官方教程的步骤转写成 Bash 脚本放入 Nix 编译脚本中。

唯一需要注意的是，KernelSU 会尝试通过 Git 获取 Commit 数量，也就是你在 KernelSU 管理器里看到的版本号。由于 Nix 包管理器的限制，获取的源码中没有 Git 仓库信息，因此我们需要修改 KernelSU 的脚本，使用我们预先获取的 Commit 数量：

```nix
let
  # 创建一个假的 git 命令，防止找不到命令出错
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

    # 把 KernelSU 复制到内核源码文件夹下
    cp -r ${kernelSU.src} ${kernelSU.subdirectory}
    chmod -R +w ${kernelSU.subdirectory}

    # 强制设置 KernelSU 版本，不让它从 Git 获取版本号
    sed -i "/ version:/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "/KSU_GIT_VERSION not defined/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "s|ccflags-y += -DKSU_VERSION=|ccflags-y += -DKSU_VERSION=\"${kernelSU.revision}\"\n#|g" ${kernelSU.subdirectory}/kernel/Makefile

    # 将内核编译脚本的 #!/bin/sh 等 Shebang 替换成隔离环境中的路径
    patchShebangs .

    # 调用 KernelSU 的脚本打补丁
    bash ${kernelSU.subdirectory}/kernel/setup.sh
  '';

  # ...
}
```

完整的代码可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/patch-kernel-src.nix>
看到。

## （可选）SusFS 补丁

[SusFS](https://gitlab.com/simonpunk/susfs4ksu)
是一组额外的内核补丁，它可以隐藏 Root 后对系统的一些文件修改，让他们只对获取了 Root 权限的软件以及系统本身可见，从而防止软件检测 Root 并拒绝启动。

这里也是根据 [SusFS 的 README](https://gitlab.com/simonpunk/susfs4ksu)
一步一步走就好：

```nix
stdenv.mkDerivation {
  # ...

  postPatch = ''
    export HOME=$(pwd)

    # 把 KernelSU 复制到内核源码文件夹下
    cp -r ${kernelSU.src} ${kernelSU.subdirectory}
    chmod -R +w ${kernelSU.subdirectory}

    # 强制设置 KernelSU 版本，不让它从 Git 获取版本号
    sed -i "/ version:/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "/KSU_GIT_VERSION not defined/d" ${kernelSU.subdirectory}/kernel/Makefile
    sed -i "s|ccflags-y += -DKSU_VERSION=|ccflags-y += -DKSU_VERSION=\"${kernelSU.revision}\"\n#|g" ${kernelSU.subdirectory}/kernel/Makefile

    # 把 SusFS 复制到内核源码文件夹下
    cp -r ${susfs.src}/kernel_patches/fs/* fs/
    cp -r ${susfs.src}/kernel_patches/include/linux/* include/linux/
    chmod -R +w fs include/linux

    # 对内核本身应用 SusFS 的补丁
    patch -p1 < ${susfs.kernelPatch}

    # 对 KernelSU 应用 SusFS 的补丁
    pushd ${kernelSU.subdirectory}
    patch -p1 < ${susfs.kernelsuPatch}
    popd

    # 将内核编译脚本的 #!/bin/sh 等 Shebang 替换成隔离环境中的路径
    patchShebangs .

    # 调用 KernelSU 的脚本打补丁
    bash ${kernelSU.subdirectory}/kernel/setup.sh
  '';

  # ...
}
```

完整的代码可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/patch-kernel-src.nix>
看到。

## 开启 KernelSU 相关编译选项

添加 KernelSU 补丁后，还需要在内核的 `defconfig`
中开启相关的选项，保证 KernelSU 功能被加入到编译出的内核中：

```bash
# 指定 defconfig 的路径
export CFG_PATH=arch/${arch}/configs/${defconfig}

# 如果启用了 KernelSU
echo "CONFIG_MODULES=y" >> $CFG_PATH
echo "CONFIG_KPROBES=y" >> $CFG_PATH
echo "CONFIG_HAVE_KPROBES=y" >> $CFG_PATH
echo "CONFIG_KPROBE_EVENTS=y" >> $CFG_PATH
echo "CONFIG_OVERLAY_FS=y" >> $CFG_PATH
echo "CONFIG_KSU=y" >> $CFG_PATH

# 如果启用了 SusFS
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

完整命令可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/kernel-config-cmd.nix>
看到。

## 编译内核

下一步就是用打过补丁的内核源码编译出内核镜像。

如果使用 GCC 作为编译器，需要将 Google 提供的编译器加入编译环境，并在编译参数中指定编译器命令前缀即可：

```nix
let
  gcc-aarch64-linux-android = pkgs.callPackage ../pkgs/gcc-aarch64-linux-android.nix { };
  gcc-arm-linux-androideabi = pkgs.callPackage ../pkgs/gcc-arm-linux-androideabi.nix { };

  # 稍后传给 make 命令
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

完整命令可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-kernel-gcc.nix>
看到。

如果使用 Clang 作为编译器，可以直接使用 Nixpkgs 提供的 Clang
stdenv，并在编译参数中指定使用 LLVM 和 `lld`：

```nix
let
  # 稍后传给 make 命令
  finalMakeFlags = [
    "ARCH=${arch}"
    "CC=clang"
    "O=$out"
    "LD=ld.lld"
    "LLVM=1"
    "LLVM_IAS=1"
    "CLANG_TRIPLE=aarch64-linux-gnu-"
  ] ++ makeFlags;

  # 使用用户指定的 Clang/LLVM 版本
  usedLLVMPackages = pkgs."llvmPackages_${builtins.toString clangVersion}";
in
# 使用 Clang/LLVM 的 stdenv，自带了 Clang/LLVM 工具链
usedLLVMPackages.stdenv.mkDerivation {
  # ...
  nativeBuildInputs = [
    # 添加 ld.lld 命令
    usedLLVMPackages.bintools
  ];
  # ...
}
```

完整命令可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-kernel-clang.nix>
看到。

## 生成 AnyKernel 刷机包

[AnyKernel](https://github.com/osm0sis/AnyKernel3)
是一个 Android 刷机包模板，可以将给定的内核镜像刷入手机中。AnyKernel 的一大优势是它可以只刷内核镜像，不修改 Initramfs 中的其它启动命令，包括 Android 系统的启动命令和 Magisk 的命令（如果安装了的话）。

AnyKernel 本身的使用非常简单：只需要根据手机的情况修改 `anykernel.sh`
中的几个参数，然后把内核文件和 AnyKernel 的其它文件放在一起打成 `zip`
压缩包即可。

唯一需要注意的是，原版的 AnyKernel 只支持非 GKI 的设备，在支持 GKI 的设备上会报错。KernelSU 团队提供了一个[修改的 AnyKernel](https://github.com/Kernel-SU/AnyKernel3)，它和原版正相反，只支持 GKI 设备，在非 GKI 设备上会报错。根据你的设备选择即可。

我把两个版本的 AnyKernel 都放入了 `nvfetcher.toml` 以供调用：

```toml
[anykernel-kernelsu]
src.git = "https://github.com/Kernel-SU/AnyKernel3.git"
fetch.github = "Kernel-SU/AnyKernel3"

[anykernel-osm0sis]
src.git = "https://github.com/osm0sis/AnyKernel3.git"
fetch.github = "osm0sis/AnyKernel3"
```

完整的打包代码可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-anykernel-zip.nix>
看到。

## （可选）生成 boot.img 镜像

如果你不想/不能使用 AnyKernel，例如你的设备没有第三方 Recovery 可用，你可以找一份你的设备的
`boot.img`
镜像。只要把镜像中的内核替换掉，并保持其它部分不变，也可以达成和 AnyKernel 一样的效果。

```bash
# 记录原设备 boot.img 镜像的参数
IMG_FORMAT=$(unpack_bootimg --boot_img ${bootImg} --format mkbootimg)
echo "Image format: \"$IMG_FORMAT\""

# 解压 boot.img
unpack_bootimg --boot_img ${bootImg}
# 用新编译出的内核替换原始内核
cp ${kernel}/arch/${arch}/boot/${kernelImageName} out/kernel

# 用原参数重新打包一份带新内核的 boot.img
eval "mkbootimg $IMG_FORMAT -o $out/boot.img"
```

完整的打包代码可以在
<https://github.com/xddxdd/nix-kernelsu-builder/blob/main/pipeline/build-boot-img.nix>
看到。
