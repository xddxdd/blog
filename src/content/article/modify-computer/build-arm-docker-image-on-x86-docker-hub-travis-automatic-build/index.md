---
title: 'x86 下制作 ARM Docker 镜像，Docker Hub、Travis 自动构建'
categories: 计算机与客户端
tags: [Docker,Raspberry Pi,Travis,ARM]
date: 2018-07-26 22:33:00
---
一般情况下，Docker 的镜像都是在一个已有的镜像内，一步步运行给定的命令，从而生成一个新的镜像。这样的步骤在大多数人使用的 x86 架构计算机上都不是问题，由于架构互相兼容，一台计算机上生成的镜像往往可以被直接复制到其它计算机上运行，除非镜像中的程序使用了 AVX 等较新的指令集。

但是，还有一批基于 ARM 架构的主机也可以运行 Docker，并运行专门编译的 ARM 架构的镜像。这些主机包括树莓派系列，和其它类似树莓派的主机，例如 Cubieboard，Orange Pi，Asus Tinker Board 等等。另外，Scaleway 等主机商也提供基于 ARM 架构的独立服务器。

由于 ARM 架构的系统无法在 x86 架构计算机上运行，因此无法在 x86 计算机上直接通过 Dockerfile 生成 ARM 架构的镜像，一般采用的方法是直接找一台 ARM 主机来 docker build。

但是我在为我的树莓派制作 nginx 的 Docker 镜像时发现这并不是一个很好的方法。由于树莓派的内存只有 1GB，如果开启多线程编译（`make -j4` 或者 `make -j2`），内存会不足，gcc 会被杀掉；如果单线程编译（直接 `make`），编译时间又非常长（几个小时）。

经过查找，另有一种方案可以解决这个问题。这个方案是在 x86 架构计算机上模拟 ARM 环境，即“虚拟机”的方式来编译镜像。虽然 x86 模拟 ARM 没有硬件加速（VT-x，AMD-V 等）支持，效率极低，但是得益于 x86 CPU 的高性能，总体效率还是高于直接在树莓派上编译。

qemu-user-static
----------------

第一步是要模拟出一个 ARM 环境。当然，我们可以用 QEMU 直接开一个 ARM 架构的完整 Linux 虚拟机，然后在里面运行 Docker 构建镜像。但是这样做的问题是，需要额外管理一个 Docker，难以将系统资源在主系统和虚拟机之间灵活分配，并且难以使用脚本自动化，即难以整合到 CI、CD 中。

更好的方案是 qemu-user-static，是 QEMU 虚拟机的用户态实现。它可以直接在 amd64 系统上运行 ARM、MIPS 等架构的 Linux 程序，将指令动态翻译成 x86 指令。这样 ARM 系统环境中的进程与主系统的进程一一对应，资源分配灵活，并且易于脚本自动化。

但是还有一个问题：当 ARM 进程尝试运行其它进程时，qemu-user-static 并不会接管新建的进程。如果新的进程仍然是 ARM 架构，那么 Linux 内核就无法运行它。因此，需要开启 Linux 内核的 binfmt 功能，该功能可以让 Linux 内核在检测到 ARM、MIPS 等架构的程序时，自动调用 qemu-user-static。开启该功能，并且注册 qemu-user-static 虚拟机后，运行 ARM 程序就和运行 x86 程序一样，对用户来说毫无差别。

在 x86 Docker 中运行 ARM 镜像
---------------------------

要在 Docker 中运行 ARM 镜像，我们要先在计算机上注册 qemu-user-static 虚拟机：

    docker run --rm --privileged multiarch/qemu-user-static:register --reset

另外，Docker 镜像内必须也含有对应的 qemu-user-static 虚拟机。不过，Docker Hub 上已经有了添加 qemu-user-static 的系统镜像，可以在 [https://hub.docker.com/u/multiarch/][1] 获取：

![multiarch 用户镜像列表][2]

例如，multiarch/alpine 镜像就在不同 tag 下提供了 aarch64（armv8）、armhf、amd64、i386 的镜像：

![multiarch/alpine tag 列表][3]

如果你之前已经注册了虚拟机，那么就可以直接运行了：

    docker run -it --rm multiarch/alpine:armhf-edge /bin/sh
    docker run -it --rm multiarch/alpine:aarch64-edge /bin/sh

![直接运行 ARM 镜像][4]

修改 Dockerfile
--------------

接下来我们要在 Dockerfile 中调用 ARM 架构的镜像。如果你的 ARM 主机是 armv7l（armhf）架构（树莓派（默认），Tinker Board 等），那么把 Dockerfile 中的第一行修改成 [https://hub.docker.com/u/multiarch/][5] 下对应的 armhf 架构镜像即可。对应关系如下：

- alpine -> multiarch/alpine:armhf-edge
- ubuntu:bionic -> multiarch/ubuntu-debootstrap:armhf-bionic
- debian:stretch -> multiarch/debian-debootstrap:armhf-stretch

如果你的 ARM 主机是 aarch64（armv8）架构（树莓派 3 开始支持，但是需要特殊系统才是这个架构），那么对应关系如下：

- alpine -> multiarch/alpine:aarch64-edge
- ubuntu:bionic -> multiarch/ubuntu-debootstrap:arm64-bionic
- debian:stretch -> multiarch/debian-debootstrap:arm64-stretch

改完后直接重新构建镜像，你就可以在本地生成 ARM 架构的镜像了。

Docker Hub 自动构建
------------------

Docker Hub 不仅提供镜像的存储共享服务，也提供简单的镜像自动构建服务。自动构建服务给每个用户分配了一台 2GB 内存、1 核心 CPU、30GB 硬盘的完整虚拟机运行 2 小时（来自 [Docker 官方论坛][6]），并且用户具有 root 权限。

默认的自动构建相当于是我们构建镜像时运行的 docker build 那一步，但是我们需要在这之前注册 qemu-user-static 虚拟机。我们可以用 Docker 官方提供的 hook 在构建开始前运行自定义的命令（来自 [Docker Cloud 文档][7]）。因为我们分配到的是完整的虚拟机，有 root 权限，所以我们也可以在 hook 中注册虚拟机。

如何创建这样一个 hook？在 Dockerfile 的文件夹下创建 hooks 文件夹，再在 hooks 文件夹下创建 pre_build 文件，内容如下：

    #!/bin/sh
    docker run --rm --privileged multiarch/qemu-user-static:register --reset

可以在[我的这个 commit][8] 中看到 hook 的示例。

Docker Hub 的自动构建服务会先运行这个脚本注册 qemu-user-static，然后再开始构建。构建完成时 push 上来的就是 ARM 架构

如果你的镜像构建时没有编译操作，构建速度应该相当快，不会比 x86 的镜像慢多少；但是如果有大量的编译操作，例如我的 nginx 镜像，很有可能就超出了 2 小时的时间限制而构建失败。在这种情况下，我们就要换其它不限制时间的自动构建服务，例如 Travis CI。

Travis CI 自动构建
-----------------

Travis CI 是对开源社区免费的一款自动构建工具。只要你的 Dockerfile 传到了 GitHub 上的 Public Repository（公开代码仓库）里，就可以直接使用它。

对于构建 Docker 镜像来说，Travis 提供的配置是 7.5GB 内存、2 核心 CPU、18GB 硬盘，限制 50 分钟运行时间。因此编译时可以开启 `make -j4` 四线程编译来提高速度。

首先到 [https://travis-ci.org/][9] 用 GitHub 账号登录，然后开启你放 Dockerfile 仓库的自动构建功能。

![开启自动构建功能][10]

然后在 Settings 页面添加你的 Docker Hub 账户的用户名密码到环境变量，这样后续你就不用在自动构建配置中明文保存密码了。

![添加用户名密码][11]

然后创建一个名为 `.travis.yml` 的文件到 git 仓库的根目录，这就是 Travis 的 “Dockerfile”，保存你的自动构建指令。

`.travis.yml` 的语法较复杂，你可以在我的 [`.travis.yml`][12] 的基础上作修改。我的 `.travis.yml` 可以在 [https://github.com/xddxdd/dockerfiles/blob/master/.travis.yml][13] 看到。

如果需要更复杂的修改，可以阅读 Travis 的[官方文档][14]自行学习。

编辑 `.travis.yml` 完成后，把它提交到 GitHub 上，Travis 就会自动开始构建你的镜像，把它们 push 到 Docker Hub 上，并且发邮件告诉你自动构建的情况。

  [1]: https://hub.docker.com/u/multiarch/
  [2]: /usr/uploads/2018/07/99234240.png
  [3]: /usr/uploads/2018/07/3870052736.png
  [4]: /usr/uploads/2018/07/299155336.png
  [5]: https://hub.docker.com/u/multiarch/
  [6]: https://forums.docker.com/t/automated-build-resource-restrictions/1413
  [7]: https://docs.docker.com/docker-cloud/builds/advanced/
  [8]: https://github.com/xddxdd/dockerfiles/tree/16bc3155352881fe116963f76899c8860e77ab11/nginx/arm64v8
  [9]: https://travis-ci.org/
  [10]: /usr/uploads/2018/07/2912698916.png
  [11]: /usr/uploads/2018/07/3122209022.png
  [12]: https://github.com/xddxdd/dockerfiles/blob/master/.travis.yml
  [13]: https://github.com/xddxdd/dockerfiles/blob/master/.travis.yml
  [14]: https://docs.travis-ci.com/
