---
title: 'Optimizing Docker Image Size'
categories: Computers and Clients
tags: [Docker]
date: 2018-07-18 03:18:00
autoTranslated: true
---


Since switching from OpenVZ-based VPS to KVM-based VPS, I've been using Docker to deploy essential services like nginx, MariaDB, and PHP for my websites. This approach not only simplifies restarting and managing configurations for individual services (by mapping all configuration directories together using volumes) but also streamlines service upgrades.

For example, my blog's VPS has limited resources, with memory usage consistently around 80% recently. When updating nginx or adding modules, compiling directly on this VPS would be slow and risk crashing the site due to insufficient memory. With Docker, I can build images on other resource-rich VPS machines or my local computer, push them to Docker Hub, then pull and run them on the production VPS.

However, my nginx image size remained around 200 MB (as shown on Docker Hub, excluding base image size, smaller than local `docker image` output), significantly larger than necessary. Since the VPS had sufficient disk space and I lacked time earlier, I ignored this issue. Now with free time, I investigated thoroughly, modified the Dockerfile, and reduced the image size to 17 MB.

## Merging RUN Commands

Upon opening the Dockerfile, I immediately spotted a basic mistake:

```docker
FROM debian:stretch
MAINTAINER Lan Tian "lantian@lantian.pub"
ENV NGINX_VERSION=1.15.1 OPENSSL_VERSION=OpenSSL_1_1_1-pre8
RUN apt-get update -q \
    && apt-get -y upgrade \
    && apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip libjemalloc-dev patch
RUN cd /tmp \
    && wget -q http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
    && tar xf nginx-${NGINX_VERSION}.tar.gz \
    && # Compilation process follows
```

During image builds, Docker creates a "layer" for each instruction, stacking them to form the final image. 

The first RUN command creates a layer containing nginx dependencies and temporary apt-get files. The subsequent compilation in the second RUN operates on a new layer above the dependency layer, leaving the original dependency files untouched. Even if I later run `apt-get clean`, it only marks files for deletion in the top layer—the files persist in the dependency layer.

The solution is to chain both RUN commands using `&&` and backslashes to combine them into a single layer. I initially separated these commands during testing to reuse downloaded dependencies while debugging compilation issues, but forgot to revert this after testing!

After merging, the image size immediately decreased by 25 MB. Though 175 MB was an improvement, it remained excessive.

## Using Alpine as the Base Image

I previously used Debian due to familiarity and tools like apt-get, but its ~125 MB base image is bulky. Alpine Linux—a ~5 MB distro widely adopted in Docker—became my choice for size reduction.

First, I replaced `FROM debian:stretch` with `FROM alpine` (using the latest version; specify if version-sensitive).

Next, I mapped Debian dependencies to Alpine equivalents using apk:

Original Debian dependencies:
```bash
apt-get update -q
apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip libjemalloc-dev patch
```

Alpine equivalent:
```bash
apk --no-cache add build-base git autoconf automake libtool wget tar zlib-dev pcre-dev unzip jemalloc-dev patch linux-headers
```

The `--no-cache` flag fetches packages directly from repositories (like `apt-get update`) and auto-clears caches (like `apt-get clean`).

Similarly, I adjusted dependency removal. Original Debian cleanup:
```bash
apt-get purge -y unzip -q git autoconf libtool automake build-essential
apt-get autoremove -y --purge
```

Alpine cleanup:
```bash
apk del build-base git autoconf automake wget tar unzip patch linux-headers
```

This reduced the image to 17 MB! Local `docker images` shows 39.6 MB including Alpine—dramatically smaller. The savings come not just from Alpine's size but also its lightweight musl C library.

## Applying the Same Optimization to Other Images

After optimizing nginx, I applied similar changes to other images. First, PHP-FPM—I couldn't use the official image due to needing many PHP modules.

Original Debian installation:
```bash
apt-get install -y php7.2-fpm php7.2-bz2 php7.2-curl php7.2-gd php7.2-json php7.2-mbstring php7.2-memcached php7.2-mysql php7.2-redis php7.2-sqlite3 php7.2-xml php7.2-xmlrpc php7.2-zip php7.2-intl
```

Alpine equivalent:
```bash
apk --no-cache add php7-fpm php7-bz2 php7-curl php7-gd php7-json php7-mbstring php7-memcached php7-mysqli php7-pdo_mysql php7-redis php7-sqlite3 php7-pdo_sqlite php7-xml php7-xmlrpc php7-zip php7-intl php7-ctype php7-tokenizer
```

Note: Alpine's PHP packages omit some defaults (e.g., php7-ctype, php7-tokenizer). Omitting these causes errors in apps like Typecho.

This reduced the Docker Hub size from 90 MB to 25 MB—a quarter of the original local size.

For MariaDB, I used the prebuilt [bianjp/mariadb-alpine][1] instead of creating my own. It's fully compatible with the official Debian-based image—I only changed the image name in docker-compose.yml.

## Conclusion

These optimizations saved ~1 GB on my VPS—significant for its small disk. 

Push/pull operations also accelerated, especially beneficial for my Hong Kong VPS with slow Docker Hub speeds. Smaller images enable faster version testing and quicker rollbacks during issues.

[1]: https://hub.docker.com/r/bianjp/mariadb-alpine/
```
