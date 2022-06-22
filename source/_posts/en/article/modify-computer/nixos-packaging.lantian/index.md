---
title: 'NixOS Series 3: Software Packaging 101'
categories: 'Computers and Clients'
tags: [NixOS]
date: 2022-06-21 23:42:16
image: /usr/uploads/202110/nixos-social-preview.png
---

@include "_templates/nixos-series/toc-en.md"

One characteristic of NixOS is that all binary applications and libraries are stored in `/nix/store` directory and managed by Nix package manager. This means that NixOS doesn't conform to [the FHS standard of Linux](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard), and there's not even a dynamic library loader like `ld-linux-x86-64.so.2` in `/lib` or `/lib64`, let alone other shared libraries like `libc.so`. Therefore, unless the program is statically linked, binaries compiled for other Linux distros will not run on NixOS at all.

Therefore, to use a program not packaged in Nixpkgs yet on NixOS, the best way is to package it yourself by writing a packaging script in Nix, and add the package definition to `configuration.nix`, in order to install it to the system.

There are three good news and two bad news when it comes to NixOS packaging. The good news are:

1. Nixpkgs, ot the software repository for NixOS, provides a ton of functions for automation. For many open source softwares written in popular programming languages (including C/C++, Python, Go, Node.js, Rust, etc., but not Java), you only need to call an existing function and specify the download source of the source code. Nixpkgs will automatically detect the packaging system, pass in correct parameters, and package it for you.
2. Nixpkgs also provides existing automated solutions for binary distributed software (commonly seen in closed-source software):
   - One is Autopatchelf, which automatically modifies the library paths in the binary, and points them to `/nix/store`.
   - The other is Bubblewrap, or `steam-run` based on Bubblewrap, that can emulate an FHS-compliant environment. As the name suggests, `steam-run` mainly focuses on the Steam gaming platform and the games on it, but it can also be used for other closed-source software.
3. Nix package manager run the packaging process in an isolated environment. You can think of it as a Docker container, with no networking access, no escalated privileges, and no access to filesystem except a few designated ones. All attempts to access external paths or Internet will fail; the compilation can only proceed with explicitly specified dependencies in the Nix packaging script. Therefore, the packaged program is guaranteed to have no dependency on external files.

And the bad news are:

1. Software developers may not know Linux better than packagers. Developers may hardcode paths in codes and compilation scripts, and make assumptions that are only true in FHS compliant environments. When this happens, you need to write patches and fix the paths yourself, so the program can correctly compile and run on NixOS.

2. When, for some reason, you cannot use an existing function, you need to prepare yourself for a long debugging journey:
   - Developer organized the source code in a strange way (like `osdlyrics`), or used a non-standard compilation procedure
   - Program actively detects its execution environment (like WeChat for UOS)
   - Program actively detects changes to itself (like SVP video interpolation software)

A few months ago, I replaced my daily driver distro from Arch Linux to NixOS, and I've packaged quite a few programs on NixOS. This post will explain the packaging procedures in NixOS as well as frequent problems and solutions, starting from the easier ones.

# Preparation

First, I strongly recommend you to install NixOS and only package on NixOS.

- Although you can package software with Nix on non-NixOS operating systems, the produced software may still have runtime dependencies on the FHS structure, causing incompatibilities on NixOS. Of course, if you're only packaging for yourself, and have no plan to share the packages, you can safely ignore this.
- In addition, you need to use [Home-Manager](https://github.com/nix-community/home-manager), a program that manages config files in your Home directory with a Nix-language config file, to install Nix-packaged software on a non-NixOS system. You need to do your own research on how to use this program.

## Using Packaging Template from NUR

NUR is a Nix software repository managed by individual users, similar to AUR of Arch Linux. NUR provides a ready-to-use template that can be used to centrally manage your packages.

Go to [nur-packages-template](https://github.com/nix-community/nur-packages-template) on GitHub, click "Use this template" and create a repository. You will store all your custom packages in that new repository.

> If you want to publish your packages to NUR, you need to send a Pull Request to [NUR's main repository](https://github.com/nix-community/NUR) and add the URL to your own repository. However, even if you don't do that, you can still use your own repository.

Then, clone your repository.

- If you don't use Nix Flake, you can run the following command to build the example package from the template:

  ```bash
  nix-build -A example-package
  ```

- If you use Flake, you can run the following commands:

  ```bash
  nix flake update # Optional, update repositories in flake.lock to latest version
  nix build ".#example-package"
  ```

Then, add your own repository in your NixOS config.

- If you don't use Nix Flake, add the following definitions to `configuration.nix`:

  ```nix
  nixpkgs.config.packageOverrides = pkgs: {
    myRepo = import (builtins.fetchTarball "https://github.com/nix-community/nur-packages-template/archive/master.tar.gz") {
      inherit pkgs;
    };
  };
  ```

  Replace `https://github.com/nix-community/nur-packages-template` with your repository URL.

  Now you can use your own packages in the form of `pkgs.myRepo.example-package`.

- If you use Nix Flake, add the following definitions to the `inputs` section in `flake.nix`:

  ```nix
  inputs = {
    # ...
    myRepo = {
      url = "github:nix-community/nur-packages-template";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    # ...
  };
  ```

  Replace `nix-community/nur-packages-template` with your repository URL.

  Then, in the `output` section in `flake.nix`, for each of your `nixosConfigurations` definition, add a module for the systems:

  ```nix
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations."nixos" = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # Add the following lines at the beginning of modules
        ({
          nixpkgs.overlays = [
            (final: prev: {
              myRepo = inputs.myRepo.packages."${prev.system}";
            })
          ];
        })
        # Add the preceding lines at the beginning of modules

        ./configuration.nix
      ];
    };
  };
  ```

  Now you can use your own packages in the form of `pkgs.myRepo.example-package`.

## Add Packages Straight to NixOS Config

Of course, instead of using the template from NUR, you can put your package definitions along with your NixOS config files.

Assuming you have this packaging definition as `example-package.nix`: (From <https://github.com/nix-community/nur-packages-template/blob/master/pkgs/example-package/default.nix>)

```nix
{ stdenv }:

stdenv.mkDerivation rec {
  name = "example-package-${version}";
  version = "1.0";
  src = ./.;
  buildPhase = "echo echo Hello World > example";
  installPhase = "install -Dm755 example $out";
}
```

You can use the `pkgs.callPackage` function to use it in `configuration.nix`:

```nix
{ config, pkgs, ... }:

{
  # Use this package directly
  environment.systemPackages = [
    (pkgs.callPackage ./example-package.nix { })
  ];

  # Or define a constant for the package first
  environment.systemPackages = let
    examplePackage = pkgs.callPackage ./example-package.nix { };
  in [
    examplePackage
  ];
}
```

If you want to build just this package, you can use the following command:

```bash
nix-build -E 'with import <nixpkgs> {}; callPackage ./example-package.nix {}'
```

# Phases in Packaging

Although you can [package directly with Nix package manager's `builtins.derivation` function](https://scrive.github.io/nix-workshop/04-derivations/04-raw-derivation.html), we usually use the `stdenv.mkDerivation` function to generate a Nix package definition, since it's much easier. Contrary to `builtins.derivation`, `stdenv.mkDerivation` splits the packaging process to 7 phases:

1. Unpack phase

   - In this step, `stdenv.mkDerivation` automatically unpacks the source code archive specified by `src`. For example, if your archive is in `.tar.gz` format, it automatically runs `tar xf`.
   - But `stdenv.mkDerivation` doesn't recognize all archive types, for example `.zip`. In this case, you need to specify the unpack command yourself:

     ```nix
     nativeBuildInputs = [ unzip ];
     unpackPhase = ''
       unzip $src
     '';
     ```

   - `stdenv.mkDerivation` requires that the source code resides in a top-level folder in the archive. It automatically `cd`s into that folder after unpack.

2. Patch phase

   - In this step, `stdenv.mkDerivation` applies all `patches` in sequential order. This can be used to fix the incompatibilities between some programs and NixOS.

3. Configure phase

   - This is equivalent to running `./configure` or `cmake`. `stdenv.mkDerivation` automatically detects the packaging system and calls the appropriate commands, or, when no relevant config files exist, automatically skips the phase.
   - It's worth noting that, to use `cmake`, you need to add an additional line of `nativeBuildInputs = [ cmake ];` to add CMake into the packaging environment.
   - You can add configuration parameters with `configureFlags` or `cmakeFlags`, to enable or disable functionalities of the program.

4. Build phase

   - This is equivalent to running `make`. You can specify the arguments to `make` with `makeFlags`.

5. Check phase

   - This phase executes the unit tests in the source directory, to ensure that the program functions correctly.
   - You can skip this step with `doCheck = false;`.

6. Install phase

   - This is equivalent to running `make install`, which copies the compilation results to the relevant folder in Nix store.
   - The whole building process happens in a temporary folder, rather than in Nix store. Therefore, such a copy is necessary.
   - When you specify the installation commands yourself, the target path is stored in variable `$out`. `$out` can be either a directory containing files, or simply a file.

7. Fixup phase
   - This step cleans up the results in Nix store by, for example, stripping debug symbols.
   - Autopatchelf Hook, a hook that automatically replaces `.so` paths for closed-source programs, is executed in this step.
   - You can disable this step with `dontFixup = true;`.

For each phase, the command to be executed, or the pre/post command hooks, can be specified. Take the install phase for example:

```nix
preInstall = ''
  echo Here are the commands executed before installPhase
'';
installPhase = ''
  # Run preInstall commands. Included in the default installPhase, but not in your specified one. You need to add this yourself, or preInstall won't run
  runHook preInstall

  echo Here are the commands for installPhase

  # Run postInstall commands, same as above
  runHook postInstall
'';
postInstall = ''
  echo Here are the commands executed after installPhase
'';
```

It might be hard to understand the steps just by reading their definitions, so I will give a few examples with detailed explanations. In addition, I will also show a few specific functions for popular programming languages, like `buildPythonPackage` for Python and `buildGoModule` for Go. All the examples are from [my NUR repository](https://github.com/xddxdd/nur-packages).

# Examples: Open Source Software

Packaging open source software tends to be easy, since in the process, Nix package manager will adjust the environment variables so that the compiler can find the libraries in other directories in Nix store. Therefore, all generated binary files are linked to libraries in Nix store, rather than ones in `/usr` or similar paths, so they can be used directly on NixOS. In addition, even if a hardcoded path appears in the open source software, you can change the path by creating a patch in the packaging process, to make it work on NixOS.

## Easy: LibOQS (C++, CMake, Automated)

Let's take a look at the most simple one: LibOQS. [LibOQS provides implementations for various post-quantum cryptography, and can be used for post-quantum support for OpenSSL or BoringSSL](https://github.com/open-quantum-safe/liboqs).

Since LibOQS is built by CMake and has no dependencies itself, almost all the work can be automatically done by `stdenv.mkDerivations`. All we need to do is to specify a few extra arguments for CMake:

```nix
# When you use pkgs.callPackage, parameters here will be filled with packages from Nixpkgs (if there's a match)
{ lib
, stdenv
, fetchFromGitHub
, cmake
, ...
} @ args:

stdenv.mkDerivation rec {
  # Specify package name and version
  pname = "liboqs";
  version = "0.7.1";

  # Download source code from GitHub
  src = fetchFromGitHub ({
    owner = "open-quantum-safe";
    repo = "liboqs";
    # Commit or tag, note that fetchFromGitHub cannot follow a branch!
    rev = "0.7.1";
    # Download git submodules, most packages don't need this
    fetchSubmodules = false;
    # Don't know how to calculate the SHA256 here? Comment it out and build the package
    # Nix will raise an error and show the correct hash
    sha256 = "sha256-m20M4+3zsH40hTpMJG9cyIjXp0xcCUBS+cCiRVLXFqM=";
  });

  # Parallel building, drastically speeds up packaging, enabled by default.
  # You only want to turn this off for one of the rare packages that fails with this.
  enableParallelBuilding = true;
  # If you encounter some weird error when packaging CMake-based software, try enabling this
  # This disables some automatic fixes applied to CMake-based software
  dontFixCmake = true;

  # Add CMake to the building environment, to generate Makefile with it
  nativeBuildInputs = [ cmake ];

  # Arguments to CMake that controls functionalities of liboqs
  cmakeFlags = [
    "-DBUILD_SHARED_LIBS=ON"
    "-DOQS_BUILD_ONLY_LIB=1"
    "-DOQS_USE_OPENSSL=OFF"
    "-DOQS_DIST_BUILD=ON"
  ];

  # stdenv.mkDerivation automatically does the rest for you
}
```

Then run the following command. Nix package manager will build the package automatically, and link the output to `results` in the current directory.

```bash
nix-build -E 'with import <nixpkgs> {}; callPackage ./liboqs.nix {}'
```

## Medium: OpenSSL OQS Provider (C, Has Dependencies)

With LibOQS ready, we can package [OpenSSL OQS Provider, an encryption/decryption engine for OpenSSL 3.0 that adds post-quantum cryptography](https://github.com/open-quantum-safe/oqs-provider).

```nix
{ lib
, stdenv
, fetchFromGitHub
, cmake
, liboqs
, openssl_3_0
, python3
, ...
} @ args:

stdenv.mkDerivation rec {
  pname = "openssl-oqs-provider";
  version = "ec60cde5cc894814016f821a1162fe1a4b888a75";
  src = fetchFromGitHub ({
    owner = "open-quantum-safe";
    repo = "oqs-provider";
    rev = "ec60cde5cc894814016f821a1162fe1a4b888a75";
    fetchSubmodules = false;
    sha256 = "sha256-NyT5CpQeclSJ0b4Qr4McAJXwKgy6SWiUijkAgu6TTNM=";
  });

  enableParallelBuilding = true;
  dontFixCmake = true;

  # nativeBuildInputs specifies packages used only during packaging rather than execution
  # Like CMake for generating Makefile, and Python for generating config files
  nativeBuildInputs = [
    cmake
    # Add Python and a few packages, to be used by preConfigure
    (python3.withPackages (p: with p; [ jinja2 pyyaml tabulate ]))
  ];

  # buildInputs specifies packages used during execution
  buildInputs = [
    liboqs
    openssl_3_0
  ];

  # Commands run before the configure phase, enable all post-quantum algorithms
  preConfigure = ''
    cp ${sources.openssl-oqs.src}/oqs-template/generate.yml oqs-template/generate.yml
    sed -i "s/enable: false/enable: true/g" oqs-template/generate.yml
    LIBOQS_SRC_DIR=${sources.liboqs.src} python oqs-template/generate.py
  '';

  cmakeFlags = [ "-DCMAKE_BUILD_TYPE=Release" ];

  # Manually specified installation commands, copy oqsprovider.so to $out/lib
  # Usually executables reside in $out/bin, libraries in $out/lib, and application menus in $out/share
  # That's not a requirement. You can put them wherever you want in $out
  # But it could be more difficult to use them from other places
  installPhase = ''
    mkdir -p $out/lib
    install -m755 oqsprov/oqsprovider.so "$out/lib"
  '';
}
```

This package mainly demonstrates the difference between `nativeBuildInputs` and `buildInputs`:

- `nativeBuildInputs` are only used during packaging. They're usually used to generate config files or compilation scripts. During cross compilation (compiling for a device of another architecture), `nativeBuildInputs` will have the same architecture as the device running the build, rather than the target device. For example, if you're building for ARM Raspberry Pi on a x86 PC, `nativeBuildInputs` will have architecture x86.
- `buildInputs` are used both in packaging and in program execution. All dependent libraries go in here. These dependencies have the same architecture as the target device. As an example, `liboqs` required by `openssl-oqs-provider` must have the same architecture (both x86 or both ARM).

## Hard: OSDLyrics (Python & C++, Two-Stage Build)

Next, let's take a look at [OSDLyrics, a desktop lyrics software](https://github.com/osdlyrics/osdlyrics). On the first glance, this software is easy to package, as the official installation instruction is only four lines:

```bash
./autogen.sh
./configure --prefix=/usr PYTHON=/usr/bin/python3
make
sudo make install
```

However, things become more difficult as Python is involved in compilation. OSDLyrics consists of two parts, Python and C++, and the C++ part will call the Python libraries. As the result, the official installation script will copy the Python module to Python's `site-packages` directory. But since Python's installation directory is read only for OSDLyrics on Nix, the installation cannot proceed.

Therefore, we need to package the Python module independently:

```nix
{ python3Packages
, fetchFromGitHub
, writeText
, ...
}:

python3Packages.buildPythonPackage rec {
  pname = "osdlyrics";
  version = "0.5.10";
  src = fetchFromGitHub ({
    owner = "osdlyrics";
    repo = "osdlyrics";
    rev = "0.5.10";
    fetchSubmodules = false;
    sha256 = "sha256-x9gIT1JkfPIc4RmmQJLv9rOG2WqAftoTK5uiRlS65zU=";
  });

  configurePhase =
    let
      # The original Python module doesn't comply with PIP's packaging standards
      # Need to add these two config files
      setupPy = writeText "setup.py" ''
        from setuptools import setup, find_packages
        setup(
          name='${pname}',
          version='${version}',
          packages=['osdlyrics', 'osdlyrics/dbusext'],
        )
      '';
      initPy = writeText "__init__.py" ''
        PROGRAM_NAME = 'OSD Lyrics'
        PACKAGE_NAME = '${pname}'
        PACKAGE_VERSION = '${version}'
      '';
    in
    # Rename the Python module folder & add configs to adhere to standards
    ''
      ln -s ${setupPy} setup.py
      mv python osdlyrics
      ln -s ${initPy} osdlyrics/__init__.py
    '';

  # Disable tests, there aren't any in the source code
  doCheck = false;
}
```

Then add the module to the Python environment used by OSDLyrics:

```nix
{ python3Packages
, fetchFromGitHub
, writeText
, python3
, ...
}:

let
  osdlyricsPython = python3Packages.buildPythonPackage rec {
    # ...
  };

  # These packages are needed by OSDLyrics
  python = python3.withPackages (p: with p; [
    chardet
    dbus-python
    future
    mpd2
    osdlyricsPython
    pycurl
    pygobject3
  ]);
in
# ...
```

Finally, package its C++ part:

```nix
{ ... }:

let
# ...
in
stdenv.mkDerivation rec {
  pname = "osdlyrics";
  version = "0.5.10";
  src = fetchFromGitHub ({
    owner = "osdlyrics";
    repo = "osdlyrics";
    rev = "0.5.10";
    fetchSubmodules = false;
    sha256 = "sha256-x9gIT1JkfPIc4RmmQJLv9rOG2WqAftoTK5uiRlS65zU=";
  });

  nativeBuildInputs = [
    # Automatically run autoconf, same as autogen.sh
    autoreconfHook
    # Tool to generate language files
    intltool
    # pkgconfig, used by autoconf scripts to search for dependencies
    pkg-config
  ];
  # Dependencies of C++ part
  buildInputs = [
    dbus-glib
    gtk2
    libnotify
    # Note that this Python is the one defined above, with a few extra modules
    python
  ];

  # Fix some compilation errors
  postPatch = ''
    sed -i 's/-Werror//g' configure.ac
  '';

  # autoreconfHook adds an autoreconf phase to packaging, with its own pre/post hooks
  preAutoreconf = ''
    export AUTOPOINT=intltoolize
  '';

  # Use the Python with extra modules
  makeFlags = [ "PYTHON=${python}/bin/python" ];

  # Remove Python modules from output (already packaged)
  postInstall = ''
    rm -rf $out/lib/python*
  '';
}
```

The final complete definition is:

```nix
{ stdenv
, lib
, fetchFromGitHub
, writeText
, python3Packages
  # nativeBuildInputs
, autoreconfHook
, intltool
, pkg-config
  # buildInputs
, dbus-glib
, gtk2
, libnotify
, python3
, ...
} @ args:

let
  pname = "osdlyrics";
  version = "0.5.10";
  src = fetchFromGitHub ({
    owner = "osdlyrics";
    repo = "osdlyrics";
    rev = "0.5.10";
    fetchSubmodules = false;
    sha256 = "sha256-x9gIT1JkfPIc4RmmQJLv9rOG2WqAftoTK5uiRlS65zU=";
  });

  osdlyricsPython = python3Packages.buildPythonPackage rec {
    inherit pname version src;

    configurePhase =
      let
        setupPy = writeText "setup.py" ''
          from setuptools import setup, find_packages
          setup(
            name='${pname}',
            version='${version}',
            packages=['osdlyrics', 'osdlyrics/dbusext'],
          )
        '';
        initPy = writeText "__init__.py" ''
          PROGRAM_NAME = 'OSD Lyrics'
          PACKAGE_NAME = '${pname}'
          PACKAGE_VERSION = '${version}'
        '';
      in
      ''
        ln -s ${setupPy} setup.py
        mv python osdlyrics
        ln -s ${initPy} osdlyrics/__init__.py
      '';

    doCheck = false;
  };

  python = python3.withPackages (p: with p; [
    chardet
    dbus-python
    future
    mpd2
    osdlyricsPython
    pycurl
    pygobject3
  ]);
in
stdenv.mkDerivation rec {
  inherit pname version src;
  nativeBuildInputs = [
    autoreconfHook
    intltool
    pkg-config
  ];
  buildInputs = [
    dbus-glib
    gtk2
    libnotify
    python
  ];
  postPatch = ''
    sed -i 's/-Werror//g' configure.ac
  '';
  preAutoreconf = ''
    export AUTOPOINT=intltoolize
  '';
  makeFlags = [ "PYTHON=${python}/bin/python" ];
  postInstall = ''
    rm -rf $out/lib/python*
  '';
}
```

# Examples: Closed Source Software (& Binary Distributed Ones)

Compared to open source software, packaging closed source ones tend to be more difficult. These closed source software usually distribute only the binary files, which are compiled for those traditional Linux distros adhering to FHS standard directory structures, like CentOS, Debian, Ubuntu, etc. As we don't have the source code, we can only modify the binary files, replacing all the FHS standard paths with ones from Nix store.

Fortunately, Nixpkgs provides a number of schemes for different scenarios, and many closed source software can be packaged successfully.

## Easy: Bilibili-linux (Unpack DEB, Electron)

Let's take a look at an easy scenario: Electron based software. Here I use the example of [Bilibili-linux, the official Bilibili Windows desktop client ported to Linux](https://github.com/msojocs/bilibili-linux).

Although compared to traditional GTK or Qt programs, Electron programs consume more power and disk space, and install dozens of Chromiums in each and every PC, resulting in a market share of over 1000%, their ease of porting should not be ignored. The Bilibili-linux client is implemented in pure Javascript, and there's no binary files in the package, except for Electron. Therefore, we can take its Javascript code, and simply run it with the system-wide Electron.

```nix
{ stdenv
, fetchurl
, electron
, lib
, makeWrapper
, ...
} @ args:

################################################################################
# Mostly based on bilibili-bin package from AUR:
# https://aur.archlinux.org/packages/bilibili-bin
################################################################################

stdenv.mkDerivation rec {
  pname = "bilibili";
  version = "1.2.1-1";
  src = fetchurl {
    url = "https://github.com/msojocs/bilibili-linux/releases/download/v1.2.1-1/io.github.msojocs.bilibili_1.2.1-1_amd64.deb";
    sha256 = "sha256-t/igezm0ipkOkKION8qTYGK9f6qI3c4iPuS/wWrMywQ=";
  };

  # Unpack DEB package
  unpackPhase = ''
    ar x ${src}
    tar xf data.tar.xz
  '';

  # makeWrapper generates a command that calls another command (aka wrapper),
  # that modifies parameters and environment variables based on the original ones
  buildInputs = [ makeWrapper ];

  installPhase = ''
    mkdir -p $out/bin

    # Replace paths in application menu (desktop files)
    cp -r usr/share $out/share
    sed -i "s|Exec=.*|Exec=$out/bin/bilibili|" $out/share/applications/*.desktop

    # Copy out the client's Javascript parts and ignore the rest
    cp -r opt/apps/io.github.msojocs.bilibili/files/bin/app $out/opt

    # Creates bilibili command that loads the client's Javascript package with electron ($out/opt/app.asar)
    makeWrapper ${electron}/bin/electron $out/bin/bilibili \
      --argv0 "bilibili" \
      --add-flags "$out/opt/app.asar"
  '';
}
```

## Medium: DingTalk (Auto Patch Binaries, Finding Dependencies)

Of course, not all closed source software are built with Electron. For the ones with binary files, we need to modify them by changing all the dependent library paths to ones in Nix store. Nixpkgs offers an easy-to-use tool called `autoPatchelfHook`, that searches for all the binaries in the package, modifies them all. It will error out when a dependency isn't met, which is useful for debugging.

Our example this time will be the Linux client for DingTalk. It uses GTK as its UI framework. Since we have no idea of its dependencies, we first create a packaging template:

```nix
{ stdenv
, fetchurl
, autoPatchelfHook
, makeWrapper
, lib
, callPackage
, ...
} @ args:

################################################################################
# Mostly based on dingtalk-bin package from AUR:
# https://aur.archlinux.org/packages/dingtalk-bin
################################################################################

stdenv.mkDerivation rec {
  pname = "dingtalk";
  version = "1.4.0.20425";
  src = fetchurl {
    url = "https://dtapp-pub.dingtalk.com/dingtalk-desktop/xc_dingtalk_update/linux_deb/Release/com.alibabainc.dingtalk_${version}_amd64.deb";
    sha256 = "sha256-UKkFuuFK/Ae+XIWbPYYsqwS/FOJfOqm9e1i18JB8UfA=";
  };

  # autoPatchelfHook automatically patches binaries
  nativeBuildInputs = [ autoPatchelfHook makeWrapper ];

  unpackPhase = ''
    ar x ${src}
    tar xf data.tar.xz

    mv opt/apps/com.alibabainc.dingtalk/files/version version
    mv opt/apps/com.alibabainc.dingtalk/files/*-Release.* release

    # Remove libraries that can be replaced with system ones, and useless EXEs
    rm -rf release/Resources/{i18n/tool/*.exe,qss/mac}
    rm -f release/{*.a,*.la,*.prl}
    rm -f release/dingtalk_updater
    rm -f release/libgtk-x11-2.0.so.*
    rm -f release/libm.so.*
  '';

  installPhase = ''
    mkdir -p $out
    mv version $out/

    # Some libraries must be the same ones from the package
    mv release $out/lib

    # The desktop file and icon is obtained from AUR
    mkdir -p $out/share/applications $out/share/pixmaps
    ln -s ${./dingtalk.desktop} $out/share/applications/dingtalk.desktop
    ln -s ${./dingtalk.png} $out/share/pixmaps/dingtalk.png
  '';
}
```

Then we try to build the package. It fails, as expected:

```bash
# ...
> auto-patchelf failed to find all the required dependencies.
> Add the missing dependencies to --libs or use `--ignore-missing="foo.so.1 bar.so etc.so"`.
For full logs, run 'nix log /nix/store/gm3d0jm6l19ypcz6vfmv5hmx8d9iygr1-dingtalk-1.4.0.20425.drv'.
```

Let's run the command above to see the complete log:

```bash
# ...
error: auto-patchelf could not satisfy dependency libX11.so.6 wanted by /nix/store/w179pb9w545rwnhvv0kkcjvra0gv82sp-dingtalk-1.4.0.20425/lib/cefclient
error: auto-patchelf could not satisfy dependency libgtk-x11-2.0.so.0 wanted by /nix/store/w179pb9w545rwnhvv0kkcjvra0gv82sp-dingtalk-1.4.0.20425/lib/cefclie
nt
error: auto-patchelf could not satisfy dependency libgdk_pixbuf-2.0.so.0 wanted by /nix/store/w179pb9w545rwnhvv0kkcjvra0gv82sp-dingtalk-1.4.0.20425/lib/cefc
lient
error: auto-patchelf could not satisfy dependency libgobject-2.0.so.0 wanted by /nix/store/w179pb9w545rwnhvv0kkcjvra0gv82sp-dingtalk-1.4.0.20425/lib/cefclie
nt
error: auto-patchelf could not satisfy dependency libglib-2.0.so.0 wanted by /nix/store/w179pb9w545rwnhvv0kkcjvra0gv82sp-dingtalk-1.4.0.20425/lib/cefclient
# ...
```

`autoPatchelf` already listed all missing libraries, and we need to find the relevant packages one by one, and add them to the `buildInputs` of the package. You can search for packages on [NixOS Search](https://search.nixos.org/packages) based on your experience, or use [nix-index, a tool to search for packages with filenames](https://github.com/bennofs/nix-index), to speed up the process.

After all dependencies are met, the definition for DingTalk looks like:

```nix
{ stdenv
, fetchurl
, autoPatchelfHook
, makeWrapper
, lib
, callPackage
  # DingTalk dependencies
, alsa-lib
, at-spi2-atk
, at-spi2-core
, cairo
, cups
, dbus
, e2fsprogs
, gdk-pixbuf
, glib
, gnutls
, graphite2
, gtk2
, krb5
, libdrm
, libgcrypt
, libGLU
, libpulseaudio
, libthai
, libxkbcommon
, mesa_drivers
, nspr
, nss
, rtmpdump
, udev
, util-linux
, xorg
, ...
} @ args:

################################################################################
# Mostly based on dingtalk-bin package from AUR:
# https://aur.archlinux.org/packages/dingtalk-bin
################################################################################

let
  version = "1.4.0.20425";

  # Dingtalk relies on an older version of OpenLDAP
  # openldap-2_4.nix can be found in my NUR
  openldap = callPackage ./openldap-2_4.nix { };

  libraries = [
    alsa-lib
    at-spi2-atk
    at-spi2-core
    cairo
    cups
    dbus
    e2fsprogs
    gdk-pixbuf
    glib
    gnutls
    graphite2
    gtk2
    krb5
    libdrm
    libgcrypt
    libGLU
    libpulseaudio
    libthai
    libxkbcommon
    mesa_drivers
    nspr
    nss
    openldap
    rtmpdump
    udev
    util-linux
    xorg.libICE
    xorg.libSM
    xorg.libX11
    xorg.libxcb
    xorg.libXcomposite
    xorg.libXcursor
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXi
    xorg.libXinerama
    xorg.libXmu
    xorg.libXrandr
    xorg.libXrender
    xorg.libXScrnSaver
    xorg.libXt
    xorg.libXtst
  ];
in
stdenv.mkDerivation rec {
  pname = "dingtalk";
  inherit version;
  src = fetchurl {
    url = "https://dtapp-pub.dingtalk.com/dingtalk-desktop/xc_dingtalk_update/linux_deb/Release/com.alibabainc.dingtalk_${version}_amd64.deb";
    sha256 = "sha256-UKkFuuFK/Ae+XIWbPYYsqwS/FOJfOqm9e1i18JB8UfA=";
  };

  nativeBuildInputs = [ autoPatchelfHook makeWrapper ];
  buildInputs = libraries;

  unpackPhase = ''
    ar x ${src}
    tar xf data.tar.xz

    mv opt/apps/com.alibabainc.dingtalk/files/version version
    mv opt/apps/com.alibabainc.dingtalk/files/*-Release.* release

    # Cleanup
    rm -rf release/Resources/{i18n/tool/*.exe,qss/mac}
    rm -f release/{*.a,*.la,*.prl}
    rm -f release/dingtalk_updater
    rm -f release/libgtk-x11-2.0.so.*
    rm -f release/libm.so.*
  '';

  installPhase = ''
    mkdir -p $out
    mv version $out/

    # Move libraries
    # DingTalk relies on (some of) the exact libraries it ships with
    mv release $out/lib

    # Entrypoint
    mkdir -p $out/bin
    # Dingtalk dynamically loads libraries during execution, so all dependencies
    # should be listed on LD_LIBRARY_PATH so they can be found
    makeWrapper $out/lib/com.alibabainc.dingtalk $out/bin/dingtalk \
      --argv0 "com.alibabainc.dingtalk" \
      --prefix LD_LIBRARY_PATH : "${lib.makeLibraryPath libraries}"

    # App Menu
    mkdir -p $out/share/applications $out/share/pixmaps
    ln -s ${./dingtalk.desktop} $out/share/applications/dingtalk.desktop
    ln -s ${./dingtalk.png} $out/share/pixmaps/dingtalk.png
  '';
}
```

## Hard: SVP (Integrity Check, Bubblewrap)

Although some closed source software like dingtalk are troublesome to package, requiring manually searching for all dependencies and repeated testing, the software itself will not create more obstacles for you. Other closed source ones, to avoid being cracked, will check their own integrities, and refuse to start if their binary files are ever changed. [SVP video interpolation software](https://www.svp-team.com/get/), for example, is one of them.

`autoPatchelfHook` is a no-no for such software. We have to switch to another way, by creating a FHS-compliant virtual environment, placing all libraries in the correct paths, and starting the program in this environment. The most commonly used software for this purpose is [Bubblewrap](https://github.com/containers/bubblewrap). It's originally designed to sandbox programs from sensitive data, but that sandbox can be the virtual environment we need today.

Let's get straight to the packaging definition of SVP:

```nix
{ stdenv
, bubblewrap
, fetchurl
  # All dependencies of SVP
, ffmpeg
, glibc
, gnome
, lib
, libmediainfo
, libsForQt5
, libusb1
, lsof
, makeWrapper
, mpv-unwrapped
  # NVIDIA driver, SVP needs a library to support accelerated Optical Flow
  # Users need to override this to their driver version on systems with NVIDIA
  # or set it to null on systems without NVIDIA
, nvidia_x11 ? null
, ocl-icd
, p7zip
, patchelf
, vapoursynth
, wrapMpv
, writeShellScript
, writeText
, xdg-utils
, xorg
, ...
}:

################################################################################
# Based on svp package from AUR:
# https://aur.archlinux.org/packages/svp
################################################################################

let
  # Package a MPV with NVIDIA Optical Flow and Vapoursynth video processing engine
  mpvForSVP = wrapMpv
    (mpv-unwrapped.override {
      vapoursynthSupport = true;
    })
    {
      extraMakeWrapperArgs = lib.optionals (nvidia_x11 != null) [
        "--prefix"
        "LD_LIBRARY_PATH"
        ":"
        "${lib.makeLibraryPath [ nvidia_x11 ]}"
      ];
    };

  # Dependencies of the main SVP program
  libPath = lib.makeLibraryPath [
    libsForQt5.qtbase
    libsForQt5.qtdeclarative
    libsForQt5.qtscript
    libsForQt5.qtsvg
    libmediainfo
    libusb1
    xorg.libX11
    stdenv.cc.cc.lib
    ocl-icd
    vapoursynth
  ];

  # SVP's executable lookup paths (aka PATH environment variable)
  execPath = lib.makeBinPath [
    ffmpeg.bin
    gnome.zenity
    lsof
    xdg-utils
  ];

  svp-dist = stdenv.mkDerivation rec {
    pname = "svp-dist";
    version = "4.5.210";
    src = fetchurl {
      url = "https://www.svp-team.com/files/svp4-linux.${version}-1.tar.bz2";
      sha256 = "10q8r401wg81vanwxd7v07qrh3w70gdhgv5vmvymai0flndm63cl";
    };

    nativeBuildInputs = [ p7zip patchelf ];

    # Disable fixup phase, it modifies SVP binary and breaks integrity check
    dontFixup = true;

    # Decompression and installation steps from AUR: https://aur.archlinux.org/packages/svp-bin
    unpackPhase = ''
      tar xf ${src}
    '';

    buildPhase = ''
      mkdir installer
      LANG=C grep --only-matching --byte-offset --binary --text  $'7z\xBC\xAF\x27\x1C' "svp4-linux-64.run" |
        cut -f1 -d: |
        while read ofs; do dd if="svp4-linux-64.run" bs=1M iflag=skip_bytes status=none skip=$ofs of="installer/bin-$ofs.7z"; done
    '';

    installPhase = ''
      mkdir -p $out/opt
      for f in "installer/"*.7z; do
        7z -bd -bb0 -y x -o"$out/opt/" "$f" || true
      done

      for SIZE in 32 48 64 128; do
        mkdir -p "$out/share/icons/hicolor/''${SIZE}x''${SIZE}/apps"
        mv "$out/opt/svp-manager4-''${SIZE}.png" "$out/share/icons/hicolor/''${SIZE}x''${SIZE}/apps/svp-manager4.png"
      done
      rm -f $out/opt/{add,remove}-menuitem.sh
    '';
  };

  # Create a startup script with Bubblewrap
  startScript = writeShellScript "SVPManager" ''
    # Map all paths under root to the virtual environment except these paths
    # They're still mapped, but with finer granularity rules
    blacklist=(/nix /dev /usr /lib /lib64 /proc)

    declare -a auto_mounts
    # loop through all directories in the root
    for dir in /*; do
      # if it is a directory and it is not in the blacklist
      if [[ -d "$dir" ]] && [[ ! "''${blacklist[@]}" =~ "$dir" ]]; then
        # add it to the mount list
        auto_mounts+=(--bind "$dir" "$dir")
      fi
    done

    # Bubblewrap startup scripts
    cmd=(
      ${bubblewrap}/bin/bwrap
      # /dev must be mapped with special parameters
      --dev-bind /dev /dev
      # Switch to the current directory in the virtual environment
      --chdir "$(pwd)"
      # Kill all processes in virtual environment when Bubblewrap exits
      --die-with-parent
      # /nix is mapped read-only
      --ro-bind /nix /nix
      # /proc must be mapped with special parameters
      --proc /proc
      # Put Glibc to /lib & /lib64 so SVP can load them
      --bind ${glibc}/lib /lib
      --bind ${glibc}/lib /lib64
      # Commands used by SVP, path hardcoded to /usr/bin in SVP
      --bind /usr/bin/env /usr/bin/env
      --bind ${ffmpeg.bin}/bin/ffmpeg /usr/bin/ffmpeg
      --bind ${lsof}/bin/lsof /usr/bin/lsof
      # Setup environment variables, including executable and library search paths
      --setenv PATH "${execPath}:''${PATH}"
      --setenv LD_LIBRARY_PATH "${libPath}:''${LD_LIBRARY_PATH}"
      # Map the MPV player packaged for SVP
      --symlink ${mpvForSVP}/bin/mpv /usr/bin/mpv
      # Map other paths under root
      "''${auto_mounts[@]}"
      # Run main SVP program once virtual environment starts
      ${svp-dist}/opt/SVPManager "$@"
    )
    exec "''${cmd[@]}"
  '';

  # SVP application menu item
  desktopFile = writeText "svp-manager4.desktop" ''
    [Desktop Entry]
    Version=1.0
    Encoding=UTF-8
    Name=SVP 4 Linux
    GenericName=Real time frame interpolation
    Type=Application
    Categories=Multimedia;AudioVideo;Player;Video;
    MimeType=video/x-msvideo;video/x-matroska;video/webm;video/mpeg;video/mp4;
    Terminal=false
    StartupNotify=true
    Exec=${startScript} %f
    Icon=svp-manager4.png
  '';
in
# Create a simple package with only startup script and menu item
stdenv.mkDerivation {
  pname = "svp";
  inherit (svp-dist) version;
  phases = [ "installPhase" ];
  installPhase = ''
    mkdir -p $out/bin $out/share/applications
    ln -s ${startScript} $out/bin/SVPManager
    ln -s ${desktopFile} $out/share/applications/svp-manager4.desktop
    ln -s ${svp-dist}/share/icons $out/share/icons
  '';
}
```

## Hard: WeChat-UOS (Environment Check, Steam-run)

Another program that checks its execution environment is WeChat client for UOS. Although it's just an Electron app and should be easy to package, it comes with a library that checks UOS license files. If the check fails, you won't be able to login. Therefore, we still need to create a virtual environment and put the license files in the correct locations, so that we can use WeChat.

Here I demonstrate another simple packaging tool: `steam-run`. `steam-run` calls Bubblewrap internally, but as its name suggests, it's originally built for the Steam client and all the games on Steam, so it includes quite a few commonly used libraries in its default environment, and therefore can run many closed source programs.

```nix
{ stdenv
, fetchurl
, writeShellScript
, electron
, steam
, lib
, scrot
, ...
} @ args:

################################################################################
# Mostly based on wechat-uos package from AUR:
# https://aur.archlinux.org/packages/wechat-uos
################################################################################

let
  version = "2.1.4";

  # UOS license files obtained from AUR: https://aur.archlinux.org/packages/wechat-uos
  license = stdenv.mkDerivation rec {
    pname = "wechat-uos-license";
    version = "0.0.1";
    src = ./license.tar.gz;

    installPhase = ''
      mkdir -p $out
      cp -r etc var $out/
    '';
  };

  # WeChat package, only keep Javascript and necessary libraries just like Bilibili client
  resource = stdenv.mkDerivation rec {
    pname = "wechat-uos-resource";
    inherit version;
    src = fetchurl {
      url = "https://home-store-packages.uniontech.com/appstore/pool/appstore/c/com.tencent.weixin/com.tencent.weixin_${version}_amd64.deb";
      sha256 = "sha256-V74m+dFK9/f0QoHfvIjk7hyIil6FpV9HGkPqwJLvQhM=";
    };

    unpackPhase = ''
      ar x ${src}
    '';

    installPhase = ''
      mkdir -p $out
      tar xf data.tar.xz -C $out
      mv $out/usr/* $out/
      mv $out/opt/apps/com.tencent.weixin/files/weixin/resources/app $out/lib/wechat-uos
      chmod 0644 $out/lib/license/libuosdevicea.so
      rm -rf $out/opt $out/usr

      # use system scrot
      pushd $out/lib/wechat-uos/packages/main/dist/
      sed -i 's|__dirname,"bin","scrot"|"${scrot}/bin/"|g' index.js
      popd
    '';
  };

  # Create a Steam-run environment with UOS license files and WeChat package
  steam-run = (steam.override {
    extraPkgs = p: [ license resource ];
    runtimeOnly = true;
  }).run;

  # WeChat startup script
  startScript = writeShellScript "wechat-uos" ''
    # Currently WeChat cannot display tray icon on NixOS, so when you close the window,
    # you never get it back. Kill WeChat if it's running so it can be restarted
    wechat_pid=`pidof wechat-uos`
    if test $wechat_pid; then
        kill -9 $wechat_pid
    fi

    # Start WeChat in virtual environment with Steam-run
    ${steam-run}/bin/steam-run \
      ${electron}/bin/electron \
      ${resource}/lib/wechat-uos
  '';
in
# Create a simple package with only startup script and menu item
stdenv.mkDerivation {
  pname = "wechat-uos";
  inherit version;
  phases = [ "installPhase" ];
  installPhase = ''
    mkdir -p $out/bin $out/share/applications
    ln -s ${startScript} $out/bin/wechat-uos
    ln -s ${./wechat-uos.desktop} $out/share/applications/wechat-uos.desktop
    ln -s ${resource}/share/icons $out/share/icons
  '';
}
```

While `steam-run` is handy, it includes a lot of libraries to support the vast number of Steam games. Using `steam-run` for simple programs is putting fine timber to petty use. I recommend you to package simple programs with Bubblewrap, and only handle the larger, complicated ones with `steam-run`.

# Examples: Special Packages

Here close to the end, I will demonstrate packaging some special stuff.

## Font: Hoyo-Glyphs

Fonts are packages in NixOS. You just need to place the TTF files in the package's `$out/share/fonts/opentype` folder.

Here I use Hoyo-Glyphs for demonstration. [It's a font project created by miHoYo game lovers, that imitates the constructed scripts in miHoYo games, including Genshin Impact, Star Rail, and ZZZ](https://github.com/SpeedyOrc-C/Hoyo-Glyphs).

```nix
{ stdenvNoCC
, lib
, fetchFromGitHub
, ...
} @ args:

# stdenvNoCC is a packaging environment without compilers; we don't need them for fonts
stdenvNoCC.mkDerivation rec {
  pname = "hoyo-glyphs";
  version = "b2bf17cd3d9637fbf55c23bf46fe380e4f7e0739";
  src = fetchFromGitHub ({
    owner = "SpeedyOrc-C";
    repo = "Hoyo-Glyphs";
    rev = "b2bf17cd3d9637fbf55c23bf46fe380e4f7e0739";
    fetchSubmodules = false;
    sha256 = "sha256-7Jx/7z3QxAi7lsV3JFwUDWJUpaKOmfZyGKL3MUrUopw=";
  });

  # Find all OTF font files and copy them to $out/share/fonts/opentype
  # We do this because fonts are scattered in directories in hoyo-glyphs
  installPhase = ''
    mkdir -p $out/share/fonts/opentype/
    cp font/**/*.otf $out/share/fonts/opentype/
  '';
}
```

Finally, add the package to the font configuration of NixOS to use them:

```nix
let
  hoyo-glyphs = pkgs.callPackage ./hoyo-glyphs.nix { };
in
{
  fonts.fonts = [
    hoyo-glyphs
  ];
}
```

## Go Package: Konnect

The next thing I'll demonstrate is packaging Go programs. Nixpkgs provides a `buildGoModule` function that packages Go programs almost completely automatically. However, there remains one issue with `buildGoModule`: since Go building process involves downloading dependencies in `vendor` directory from the Internet, `buildGoModule` will calculate the hash of the whole `vendor` directory, which must be specified on packaging.

Don't know how to calculate the hash here? Comment it out (or change a few characters) and build the package, and Nix will raise an error and show the correct hash.

Here I'm demonstrating with [Konnect, an OpenID SSO service with LDAP backend support](https://github.com/Kopano-dev/konnect).

```nix
{ fetchFromGitHub
, buildGoModule
}:

buildGoModule rec {
  pname = "konnect";
  version = "v0.34.0";
  src = fetchFromGitHub ({
    owner = "Kopano-dev";
    repo = "konnect";
    rev = "v0.34.0";
    fetchSubmodules = false;
    sha256 = "sha256-y7SD+czD/jK/m0LbFq7qGjwJgBIXfTNrdsA3pzgD2xE=";
  });
  vendorSha256 = "sha256-ZrwFUZDTbJx5qvloVOa5qK1ykKNkUn1hjfz0xf+8sWk=";
}
```

You don't need to specify any compilation commands, as `buildGoModule` does everything for you.

Similarly, many popular languages like Python, NodeJS and Rust have their own packaging functions, [which can be found on NixOS Wiki](https://nixos.wiki/).

> One notable exception is Java, since the popular Maven build system doesn't support pinning dependencies to a specific version. Dependencies may change between two builds, which violates the requirements of Nix.

## Kernel: linux-xanmod-lantian

Finally, I'll show you the steps of customizing the Linux kernel. As usual, Nixpkgs provides a convenience function called `buildLinux`:

```nix
{ pkgs
, stdenv
, lib
, fetchFromGitHub
, buildLinux
, ...
} @ args:

let
  version = "5.17.14";
  release = "1";
in
buildLinux {
  inherit stdenv lib version;
  src = fetchFromGitHub {
    owner = "xanmod";
    repo = "linux";
    rev = "${version}-xanmod${release}";
    sha256 = "sha256-OutD9Z/4LMT1cNmpq5fHaJZzU6iMDoj2N8GXFvXkECY=";
  };

  # Specify the name of the kernel module directory
  # I changed this following modification to CONFIG_LOCALVERSION
  modDirVersion = "${version}-xanmod${release}-lantian";

  # Load config from config.nix
  structuredExtraConfig = import ./config.nix args;

  # Patches applied to kernel. Here I include two patches from Nixpkgs,
  # and all patches in the patches directory (auto detected)
  kernelPatches = [
    pkgs.kernelPatches.bridge_stp_helper
    pkgs.kernelPatches.request_key_helper
  ] ++ (builtins.map
    (name: {
      inherit name;
      patch = ./patches + "/${name}";
    })
    (builtins.attrNames (builtins.readDir ./patches)));

  # Only allow building for x86_64
  extraMeta.broken = !stdenv.hostPlatform.isx86_64;
}
```

`config.nix` stores your custom kernel configs. Nixpkgs will apply your changes on top of [the default kernel config of NixOS](https://github.com/NixOS/nixpkgs/blob/master/pkgs/os-specific/linux/kernel/common-config.nix).

```nix
{ lib, ... }:

with lib.kernel;
{
  # Specify a string: use freeform
  LOCALVERSION = freeform "-lantian";

  # Specify a number: also use freeform, and write number as string
  LOG_BUF_SHIFT = freeform "12";

  # Compile to module: use module
  # If your settings conflict with default config, use lib.mkForce to override
  TCP_CONG_CUBIC = lib.mkForce module;

  # Compile into kernel: use yes
  TCP_CONG_BBR = yes;

  # Disable: use no
  CRYPTO_842 = no;
}
```

# Conclusion

Software packaging has always been difficult. In the packaging process, you often need to consider all dependencies of the software, and try repeatedly whilst adjusting parameters. Compared to other distros, packaging in NixOS (and Nixpkgs) may seem complicated at first, but is actually easy:

- Many repetitive work are automated with functions;
- Packaging is isolated from the main OS, no worries of package breaking for others because of residuals or missing dependencies.

In this post, I demonstrated a few common packaging scenarios, including open source and closed source ones. But since I only shown a limited number of examples, they certainly do not cover all scenarios you may run into, so you're likely required to do your own research:

- [NixOS Wiki](https://nixos.wiki/) provides packaging guides for many popular programming languages, as well as special cases (like Qt).
- [Nixpkgs](https://github.com/NixOS/nixpkgs) itself is a large package repository with definitions for over 80,000 packages, which serves as a reference.
- [NUR](https://nur.nix-community.org/) is package repositories managed by Nix users, similar to AUR.

All packaging examples in this post are from [my NUR repository](https://github.com/xddxdd/nur-packages).
