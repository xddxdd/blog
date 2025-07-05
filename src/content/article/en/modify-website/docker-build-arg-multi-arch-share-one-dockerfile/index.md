---
title: 'Using Docker Build Args to Share a Single Dockerfile Across Multiple Architectures'
categories: Website and Servers
tags: [Docker, Travis]
date: 2018-12-22 19:36:00
image: /usr/uploads/2018/12/1125148043.png
autoTranslated: true
---


Since I have multiple architecture devices running Docker (including x86 servers, Raspberry Pi, Tinker Board), for each commonly used software, I [need to build an image for each different architecture][1]. Previously, my approach was to maintain a separate Dockerfile for each architecture, [similar to this][2]:

![Each architecture has its own Dockerfile][3]

You can see that each Dockerfile is almost identical except for the base image referenced in the FROM instruction. While this management method simplifies writing build scripts (travis.yml) by allowing direct `docker build` commands for each, the drawback is obvious: every time the software version updates or I decide to add/remove a feature, I have to modify multiple Dockerfiles.

Two days ago while researching, I discovered a Docker feature: Build Args, which allows passing parameters during the build process. So I decided to modify my build scripts to consolidate Dockerfiles for different architectures.

## Using Build Args

In a Dockerfile, use the ARG command to define a build argument, which can be used like environment variables defined by ENV:

```docker
# Define a parameter named THIS_ARCH
ARG THIS_ARCH
# Or set a default value:
ARG THIS_ARCH=amd64
```

Then use it during build like this:

```docker
docker build -t xddxdd/testimage --build-arg THIS_ARCH=amd64
```

There are two pitfalls with ARG: First, ARG cannot define multiple variables in one line like ENV; each must be declared separately. Second, due to Docker's multi-stage builds, all arguments are reset after each FROM command, requiring re-declaration:

```docker
ARG THIS_ARCH_ALT=amd64
FROM multiarch/alpine:${THIS_ARCH_ALT}-v3.8
ARG THIS_ARCH_ALT=amd64
```

## Consolidating Dockerfiles

During consolidation, I standardized on Alpine-based images, so I uniformly used the [multiarch/alpine][4] image series as the base. Their tags follow an "architecture-version" format, making the architecture portion suitable for an ARG parameter.

Different systems/languages use varying architecture naming conventions, for example:

1. My convention: amd64, i386, arm32v7, arm64v8
2. Multiarch convention: amd64, i386, armhf, aarch64
3. Golang convention: amd64, 386, arm, arm64

I used three build arguments to map these. Since conditional logic is challenging in Dockerfiles, I handled the conversion in bash before passing the values. Here's how I converted to Multiarch naming:

```bash
# Translate to alternative arch names used in multiarch images
if [ "$THIS_ARCH" == "amd64"   ]; then THIS_ARCH_ALT=amd64  ; fi
if [ "$THIS_ARCH" == "i386"    ]; then THIS_ARCH_ALT=i386   ; fi
if [ "$THIS_ARCH" == "arm32v7" ]; then THIS_ARCH_ALT=armhf  ; fi
if [ "$THIS_ARCH" == "arm64v8" ]; then THIS_ARCH_ALT=aarch64; fi
```

Then I replaced architecture names with variables in the Dockerfile. An example can be [seen here][5].

## Unified Building

I still use Travis for image building. Since the architecture list remains unchanged, I only needed to modify the build command from "one Dockerfile per architecture" to "same Dockerfile with different parameters":

```bash
# Original build command
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$THIS_ARCH -f Dockerfile.$THIS_ARCH .
# Current build command
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$THIS_ARCH \
    --build-arg THIS_ARCH=$THIS_ARCH \
    --build-arg THIS_ARCH_ALT=$THIS_ARCH_ALT \
    --build-arg THIS_ARCH_GO=$THIS_ARCH_GO \
    $IMAGE_NAME
```

With this setup, images can now be built for each architecture normally while significantly simplifying maintenance.

[1]:
  /article/modify-computer/build-arm-docker-image-on-x86-docker-hub-travis-automatic-build.lantian
[2]:
  https://github.com/xddxdd/dockerfiles/tree/46e7cc1f78ac1dce4b8b72c35bc3e6fbfb0333a3/nginx
[3]: /usr/uploads/2018/12/1125148043.png
[4]: https://hub.docker.com/r/multiarch/alpine/tags
[5]:
  https://github.com/xddxdd/dockerfiles/tree/2f019f8b851d5e8d80a5ba3e7c07134cf883ebf9
```
