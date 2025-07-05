---
title: 'Using GPP to Preprocess Dockerfile for #include, #if, and Other Features'
categories: Website and Servers
tags: [GPP, Docker]
date: 2019-08-03 13:23:00
autoTranslated: true
---


Since I have multiple devices with different architectures running Docker (including x86_64 computers and servers, ARM32v7 Tinker Board, and ARM64v8 Raspberry Pi 3B), each of my Docker images needs to be built in multiple versions. Initially, I [wrote a separate Dockerfile for each architecture][1], but this approach proved difficult to manage uniformly, often leading to missed updates when modifying Dockerfiles during software upgrades. Later, I adopted [Docker's build argument feature][2], using the `--build-arg` parameter to select different base images and download architecture-specific files based on arguments.

However, this approach still has significant limitations. First, different projects use varying naming conventions for architectures. For example, the x86 32-bit architecture (i386) is called "386" in Go and many Go-based projects. Similarly, ARM32v7 may be referred to as ARMHF, while ARM64v8 has three common variants (ARM64v8, ARM64, AARCH64). Previously, I had to use bash scripts to convert between these naming conventions for different contexts, requiring numerous variables and complicating the process.

Additionally, some images require architecture-specific handling. For instance:
- The nginx image cannot use Cloudflare-optimized zlib on i386 or ARM32v7 and must use the vanilla version.
- Compiling nginx for i386 on x86_64 requires `setarch i386` to avoid generating 64-bit binaries.
- OpenLiteSpeed's official packages don't support ARM architectures, causing ARM image builds to fail—making it preferable to fail immediately rather than during the build process.

Moreover, many images share repetitive sections, such as initializing build parameters and invoking base images.

Dockerfile's native functionality is too simplistic—some of these requirements are cumbersome to implement, while others are outright impossible. Having `#include`, `#define`, and similar preprocessor directives in Dockerfiles, like in C++, would greatly simplify the process.

In [this Docker Issue][3], commenter jfinkhaeuser suggested using m4 or cpp for Dockerfile preprocessing. Note: "cpp" here refers to the C preprocessor (not C++), available in systems with gcc. These preprocessors can handle any text files.

During testing, I encountered issues: For example, cpp treated `/*` in `rm -rf /tmp/*` as a comment start, deleting subsequent content. Adding backslashes would preserve them in the output, affecting execution; adding spaces (like `/ *`) is also problematic—[as demonstrated by the Bumblebee incident][4]. Similarly, `https://www.example.com` lost content after `//`. m4's syntax was too different and complex for my needs.

Fortunately, alternatives exist. I ultimately chose [GPP (Generic Preprocessor)][5] because its syntax is highly configurable. Unlike cpp, I can disable comment processing to preserve critical content like URLs and paths.

## Installing GPP

On Debian:
```bash
apt-get install gpp
```

On Arch Linux (via AUR):
```bash
pikaur -S gpp
```

(Why isn't it in Arch's main repository...)

## Using GPP

Assume I have a template Dockerfile with `#include` directives named `template.Dockerfile`, and included files reside in another directory. Generate the complete Dockerfile with:
```bash
gpp -I /path/to/include --nostdinc -U "" "" "(" "," ")" "(" ")" "#" "" -M "#" "\n" " " " " "\n" "(" ")" +c "\\\n" "" -o Dockerfile /path/to/template.Dockerfile
```

This produces a Dockerfile ready for `docker build`.

The custom parameters enable:
- `#define` macros (e.g., `#define WGET(url) wget --no-check-certificate -q url`)
- Backslash line continuation handling
- `#if`/`#else` logic similar to cpp

For advanced usage, [consult GPP's documentation][6].

Beyond the lengthy parameters, GPP functions like cpp. For example, `-D ARCH_ARM64V8` defines variables for conditional processing in Dockerfiles.

Now I can write architecture-specific logic:
```docker
#if defined(ARCH_AMD64)
FROM multiarch/alpine:amd64-edge
#elif defined(ARCH_I386)
FROM multiarch/alpine:i386-edge
#elif defined(ARCH_ARM32V7)
FROM multiarch/alpine:armhf-edge
#elif defined(ARCH_ARM64V8)
FROM multiarch/alpine:arm64-edge
#else
#error "Architecture not set"
#endif
```

Or execute architecture-dependent commands:
```docker
#ifdef ARCH_I386
RUN setarch i386 make -j4 \
    && setarch i386 make install
#else
RUN make -j4 \
    && make install
#endif
```

To streamline usage, I created a Makefile for generating Dockerfiles, building images, and pushing to Docker Hub ([view here][9]).

This approach significantly extends Dockerfile capabilities, enabling more flexible workflows and simplifying maintenance.

My Dockerfiles are [available on GitHub][10] as always.

[1]:
  /article/modify-computer/build-arm-docker-image-on-x86-docker-hub-travis-automatic-build.lantian
[2]:
  /article/modify-website/docker-build-arg-multi-arch-share-one-dockerfile.lantian
[3]: https://github.com/moby/moby/issues/735#issuecomment-37273719
[4]:
  https://github.com/MrMEEE/bumblebee-Old-and-abbandoned/commit/a047be85247755cdbe0acce6f1dafc8beb84f2ac
[5]: https://files.nothingisreal.com/software/gpp/gpp.html
[6]: https://files.nothingisreal.com/software/gpp/gpp.html
[7]:
  https://github.com/xddxdd/dockerfiles/blob/f4b054c1c0736e432c329dea18669999933ff439/include/image/multiarch_alpine_edge.Dockerfile
[8]:
  https://github.com/xddxdd/dockerfiles/blob/f4b054c1c0736e432c329dea18669999933ff439/dockerfiles/nginx/template.Dockerfile
[9]:
  https://github.com/xddxdd/dockerfiles/blob/f4b054c1c0736e432c329dea18669999933ff439/Makefile
[10]:
  https://github.com/xddxdd/dockerfiles/tree/f4b054c1c0736e432c329dea18669999933ff439
```
