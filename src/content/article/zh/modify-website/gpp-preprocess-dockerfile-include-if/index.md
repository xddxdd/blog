---
title: '使用 GPP 预处理 Dockerfile，实现 #include、#if 等功能'
categories: 网站与服务端
tags: [GPP, Docker]
date: 2019-08-03 13:23:00
---

由于我有多种架构的设备运行 Docker（包括 x86_64 的电脑和服务器，ARM32v7 的 Tinker
Board 和 ARM64v8 的树莓派 3B），我的每个 Docker 镜像都要构建多种版本。最初我[给
每个架构单独写一份 Dockerfile][1]，但是很明显这样难以统一管理，在软件更新修改
Dockerfile 时经常漏改文件。之后，我用的是 [Docker 的构建参数功能][2]，即
`--build-arg` 参数，根据参数来调用不同的基础镜像、下载不同文件。

但是这样还是有很大的局限性。首先，不同项目对不同架构的称呼是不一样的。例如，我们
平时说的 x86 32 位架构，i386，就被 Go 以及众多使用 Go 的项目叫做 386。类似
的，ARM32v7 也可以叫做 ARMHF，而 ARM64v8 有三种写法（ARM64v8，ARM64，AARCH64）。
之前，我就不得不用 bash 脚本转换出不同的称呼组合在不同的地方使用，但是这样做就需
要设置很多的变量，非常麻烦。

另外，有些镜像在特定架构下需要特殊处理。例如，nginx 镜像在 i386 和 ARM32v7 下不
能使用 Cloudflare 优化的 zlib，只能使用原版；nginx 在 x86_64 环境下编译 i386 镜
像时需要 setarch i386，否则会编译出 64 位的程序。再例如，OpenLiteSpeed 官方源提
供的程序不支持 ARM 环境，此时由于我的镜像并不会手动编译 OpenLiteSpeed，ARM 的镜
像构建会在这里出错，那还不如一开始就直接失败。

再者，很多镜像都有大量重复的部分，例如初始化构建参数、调用初始镜像等。

而 Dockerfile 提供的功能太过简单，以上功能有些虽然可以实现但是很麻烦，而有些则完
全做不到。如果可以像写 C++ 代码一样，在 Dockerfile 里用上 `#include`，`#define`
等功能，就可以方便很多。

在 [Docker 的这个 Issue][3] 中，评论者 jfinkhaeuser 提出了一个解决方法：使用 m4
或者 cpp 等对 Dockerfile 进行预处理。注意这里的 cpp 不是 C++，是 C 及 C++ 代码的
一个预处理程序，在安装了 gcc 的系统中应该都有。这些预处理器不只能处理它们对应的
语言，还能对任意文件进行相同的处理。

但是我试用了一下，发现了很多问题：例如，cpp 将 `rm -rf /tmp/*` 这条命令中的 `/*`
当成了注释开始，然后把后面的内容全删了。如果在这里加反斜杠，最后生成的
Dockerfile 也会有反斜杠，影响最后代码的执行；我又不能像写 C 一样在斜杠和星号中间
加空格，[上一个这么干的是 Bumblebee，最后的结果怎么样大家都知道了][4]。同样的，
类似 `https://www.example.com` 这样的网址，`//` 后的内容也全没了。而 m4 的语法差
异实在太大，而且有一些功能也有点难实现。

不过除了 cpp 和 m4 以外，还有其它的预处理程序可以选择。我最后选择的是
[GPP（Generic Preprocessor）][5]。它的最大优势是大部分语法都可以通过参数指定。例
如，相比于 cpp，我就可以关闭对注释的处理，从而保留上面这些应该保留的内容。

## 安装 GPP

在 Debian 中：

```bash
apt-get install gpp
```

没了。在 Arch Linux 中，就要通过 AUR 安装：

```bash
pikaur -S gpp
```

所以为什么它没进 Arch Linux 的主软件源。。。

## 使用 GPP

例如，我现在有一份 Dockerfile，是带了 `#include` 之类指令的，命名为
`template.Dockerfile`。被 include 的文件放在了另一个文件夹下。此时，要生成完整的
Dockerfile，使用如下命令：

```bash
gpp -I /path/to/include --nostdinc -U "" "" "(" "," ")" "(" ")" "#" "" -M "#" "\n" " " " " "\n" "(" ")" +c "\\\n" "" -o Dockerfile /path/to/template.Dockerfile
```

就可以生成一份完整的 Dockerfile，喂给 `docker build` 就可以了。

上面带的自定义参数打开了如下功能：

-   `#define` 宏的功能，类似
    `#define WGET(url) wget --no-check-certificate -q url`
-   行尾反斜杠的处理
-   `#if`，`#else` 之类类似 cpp 的功能

要实现更多的功能，可以[自行参阅 gpp 的文档][6]。

除了自定义参数很长以外，gpp 的用法和 cpp 非常像。例如，我可以用
`-D ARCH_ARM64V8` 来定义更多的变量，从而在 Dockerfile 中使用 `#if` 等进行对应的
处理。

这样我就可以在 Dockerfile 里这样写，根据不同架构调用不同基础镜像：（[来自这
里][7]）

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

或者根据架构执行不同的命令：（[来自这里][8]）

```docker
#ifdef ARCH_I386
RUN setarch i386 make -j4 \
    && setarch i386 make install
#else
RUN make -j4 \
    && make install
#endif
```

当然，为了简化使用，我写了一份 Makefile，包括生成 Dockerfile、构建镜像、上传
Docker Hub 等，[可以在这里看到][9]。

这样，Dockerfile 的功能就被扩展了很多，可以实现更灵活的玩法。管理 Dockerfile 的
工作也变得更加简单了。

我的 Dockerfile 照例[发布在 GitHub][10]。

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
