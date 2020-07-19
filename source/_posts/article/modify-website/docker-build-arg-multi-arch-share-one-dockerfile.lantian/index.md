---
title: '使用 Docker 构建参数，多架构共享一份 Dockerfile'
categories: 网站与服务端
tags: [Docker,Travis]
date: 2018-12-22 19:36:00
image: /usr/uploads/2018/12/1125148043.png
---
由于我有多种架构的设备运行 Docker（包括 x86 服务器，树莓派，Tinker Board），对于每个常用的软件，我[需要为每种不同架构都构建一份镜像][1]。之前，我采用的方式是每个架构都有一个独立的 Dockerfile，[类似于这样][2]：

![每个架构都有一个独立的 Dockerfile][3]

可以看到每份 Dockerfile 除了 FROM 调用的镜像不一样，其它几乎完全相同。用这种方式管理，好处是写构建脚本（travis.yml）的时候简单，直接一个个 `docker build` 过去即可，但是坏处也很明显，每次软件有版本更新，或者我决定添加或删除一个功能，我都要改好几份 Dockerfile。

前两天我查资料时，发现了 Docker 的一个功能：构建参数（Build args），就是可以填入一些参数供构建过程使用。于是我就决定修改构建脚本，将不同架构的 Dockerfile 合并。

使用构建参数
----------

Dockerfile 中使用 ARG 命令就可以定义一个构建参数，它可以像 ENV 定义出的环境变量一样使用：

```docker
# 定义一个名为 THIS_ARCH 的参数
ARG THIS_ARCH
# 或者给它定义上默认值：
ARG THIS_ARCH=amd64
```

然后在构建时这样使用：

```docker
docker build -t xddxdd/testimage --build-arg THIS_ARCH=amd64
```

使用 ARG 有两个坑，一是 ARG 不能像 ENV 那样一行定义好几个变量，必须一行一行分开来写。二是由于 Docker 现在的多阶段构建（Multi-stage Build）影响，每次调用 FROM 命令加载镜像后所有的参数会被清空，必须重新 ARG 一次，类似这样：

```docker
ARG THIS_ARCH_ALT=amd64
FROM multiarch/alpine:${THIS_ARCH_ALT}-v3.8
ARG THIS_ARCH_ALT=amd64
```

合并 Dockerfile
---------------

进行合并时，我的 Docker 镜像全部使用 Alpine 作为基础，所以我统一使用了 [multiarch/alpine][4] 这一系列的镜像作为之后的基础。可以看到它们的 tag 都是“架构-版本号”格式，因此将架构部分定义成一个 ARG 即可。

由于不同人/语言/系统对不同架构的称呼不同，例如：

1. 我：amd64，i386，arm32v7，arm64v8
2. Multiarch：amd64，i386，armhf，aarch64
3. Golang：amd64，386，arm，arm64

我就采用了三个构建参数一一对应。由于 Dockerfile 里难以进行条件判断，我选择在 bash 里完成参数转换然后一起传进去。例如，我是这样转换出 Multiarch 的称呼的：

```bash
# Translate to alternative arch names used in multiarch images
if [ "$THIS_ARCH" == "amd64"   ]; then THIS_ARCH_ALT=amd64  ; fi
if [ "$THIS_ARCH" == "i386"    ]; then THIS_ARCH_ALT=i386   ; fi
if [ "$THIS_ARCH" == "arm32v7" ]; then THIS_ARCH_ALT=armhf  ; fi
if [ "$THIS_ARCH" == "arm64v8" ]; then THIS_ARCH_ALT=aarch64; fi
```

随后将 Dockerfile 中的架构替换成变量就可以了，示例可以[在这里看到][5]。

统一构建
-------

我仍然使用 Travis 进行镜像构建。由于架构列表不变，我只需要将原先“每个架构对应一个文件名”改成“每个架构对应同一个文件和不同的参数”：

```bash
# 原先的构建命令
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$THIS_ARCH -f Dockerfile.$THIS_ARCH .
# 现在的构建命令
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$THIS_ARCH \
    --build-arg THIS_ARCH=$THIS_ARCH \
    --build-arg THIS_ARCH_ALT=$THIS_ARCH_ALT \
    --build-arg THIS_ARCH_GO=$THIS_ARCH_GO \
    $IMAGE_NAME
```

经过上述设置后，镜像已经可以正常分架构构建，同时管理起来也没那么麻烦了。

  [1]: /article/modify-computer/build-arm-docker-image-on-x86-docker-hub-travis-automatic-build.lantian
  [2]: https://github.com/xddxdd/dockerfiles/tree/46e7cc1f78ac1dce4b8b72c35bc3e6fbfb0333a3/nginx
  [3]: /usr/uploads/2018/12/1125148043.png
  [4]: https://hub.docker.com/r/multiarch/alpine/tags
  [5]: https://github.com/xddxdd/dockerfiles/tree/2f019f8b851d5e8d80a5ba3e7c07134cf883ebf9
