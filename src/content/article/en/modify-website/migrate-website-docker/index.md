---
title: 'Migrating the Website to Docker'
categories: Website and Servers
tags: [Docker]
date: 2016-12-29 13:55:00
autoTranslated: true
---


Docker is a container management software for Linux. Each container is functionally similar to an OpenVZ VPS, allowing isolation of applications on a server. This isolation enables different versions of the same software or conflicting applications to run on the same server. For example, MySQL 5.7, MySQL 5.6, and MariaDB 10.1 can run simultaneously in three separate Docker containers on one server.

However, Docker surpasses OpenVZ in its more flexible Linux kernel version requirements. OpenVZ kernels remain stuck at 2.6.32 (stable) and 3.10 (development), while Docker runs on any Linux kernel above 3.10. My server currently uses Linux kernel 4.9 (for BBR support), which clearly cannot run OpenVZ but works perfectly with Docker.

Another advantage of Docker is its comprehensive image repository and automation tools. With OpenVZ, I had to log into each VPS individually to configure networks, run `apt-get`, and perform regular backups. With Docker, I can directly use pre-built software images (no need for `apt-get`) and map data folders directly to the host machine (eliminating separate backups).

Docker also provides Docker Compose, which allows configuring multiple containers via a configuration file for rapid deployment and removal.

## Installing Docker and Docker Compose

I use Debian 8, which allows direct installation from Docker's official repository.

```bash
apt-get install apt-transport-https ca-certificates gnupg2
apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
echo "deb https://apt.dockerproject.org/repo debian-jessie main" >> /etc/apt/sources.list
apt-get update
apt-get install docker-engine
curl -L "https://github.com/docker/compose/releases/download/1.9.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## Migrating Using Existing Images

My server originally ran: Nginx, PHP7.0-FPM, MariaDB, Memcached, Redis, and SS. For unified management, I migrated them using Docker images.

I stored all data in `/srv`, so I created a `docker-compose.yml` file in this directory. This is Docker Compose's configuration file. The basic format is as follows: (Content after # is my explanatory note and doesn't exist in the original file)

```yaml
version: '2'
services:
  container1: 
    image: Container image name (Docker automatically downloads if missing)
    container_name: Container name
    environment: # Environment variables
      - ENV_VAR_NAME=value
      - PASSWORD=123456
    restart: always # Restart immediately if container crashes
    volumes: # Map host folders to container for data management
      - '/host/data/path:/container/data/path'
      - '/var/lib/mysql:/var/lib/mysql'
    ports: # Port mapping
      - 'host_port:container_port' # Publicly accessible
      - '80:80'
      - 'host_ip:host_port:container_port' # Only accessible locally
      - '127.0.0.1:11211:11211'
  container2: ... (same as container1)
```

Next, we'll create a `docker-compose.yml` to run the MariaDB image and import data. (Content after # is my note)

```yaml
version: '2'
services:
  lantian-mariadb:
    image: mariadb:latest
    container_name: lantian-mariadb
    restart: always
    volumes:
      - '/srv/mysql:/var/lib/mysql'
      - '/etc/timezone:/etc/timezone' # Sync host timezone
      - '/etc/localtime:/etc/localtime'
    ports:
      - '127.0.0.1:3306:3306'
```

First, stop the original MariaDB: `service mysql stop` (no seamless migration considered)

Move the data folder: `mv /var/lib/mysql /srv/mysql`

Finally, load the configuration: `docker-compose up -d`

MariaDB is now running in Docker!

Redis and Memcached can be migrated similarly using their official images.

## Creating an Image from apt-get Installed Software

PHP7.0-FPM is more complex. The official PHP-FPM image uses unusual compilation flags and configuration paths that differ from my DotDeb installation. To avoid issues, I created a custom Docker image.

Building Docker images requires only basic bash knowledge. Create a new folder, then add a Dockerfile with the following structure: (Comments after # are mine)

```dockerfile
FROM debian:jessie # Base image
MAINTAINER Lan Tian "lantian@lantian.pub" # Optional author info
ADD somefile.txt /somefile.txt # Add local file to image
RUN apt-get update # Execute command during build
EXPOSE 80 # Expose port to other containers
ENTRYPOINT ["php-fpm7.0"] # Startup command (container stops when this exits)
```

For this image, I need to: add DotDeb repository, run `apt-get`, add custom configs, expose ports, and set the startup command. My Dockerfile:

```dockerfile
FROM debian:jessie
MAINTAINER Lan Tian "lantian@lantian.pub"
ADD dotdeb.gpg /dotdeb.gpg
RUN echo "deb http://packages.dotdeb.org jessie all" >> /etc/apt/sources.list \
    && echo "deb-src http://packages.dotdeb.org jessie all" >> /etc/apt/sources.list \
    && apt-key add /dotdeb.gpg \
    && apt-get update \
    && apt-get install -y php7.0-fpm php7.0-bz2 php7.0-curl php7.0-gd php7.0-json php7.0-mbstring php7.0-mcrypt php7.0-memcached php7.0-mysql php7.0-redis php7.0-sqlite3 php7.0-xml php7.0-xmlrpc php7.0-zip \
    && apt-get clean
ADD www.conf /etc/php/7.0/fpm/pool.d/www.conf
ADD php.ini /etc/php/7.0/fpm/php.ini
ADD php-fpm.conf /etc/php/7.0/fpm/php-fpm.conf
EXPOSE 9000
ENTRYPOINT ["php-fpm7.0"]
```

Prepare files:
```bash
wget https://www.dotdeb.org/dotdeb.gpg
cp /etc/php/7.0/fpm/pool.d/www.conf ./
cp /etc/php/7.0/fpm/php.ini ./
cp /etc/php/7.0/fpm/php-fpm.conf ./
```

Build the image:
```bash
docker build -t lt-php7-fpm .
```

Add to `docker-compose.yml`:
```yaml
lt-php-fpm:
  image: lt-php7-fpm
  container_name: lt-php-fpm
  restart: always
  volumes:
    - './www:/srv/www' # Website root
    - './owncloud:/srv/owncloud' # Remove if not using OwnCloud
    - '/etc/timezone:/etc/timezone' # Timezone
    - '/etc/localtime:/etc/localtime'
```

## Building a Custom Software Image

My Nginx setup is more complex due to custom patches: HTTP2/SPDY, Google PageSpeed, Certificate Transparency, and Brotli compression. Since no existing image fits, I compiled my own.

The solution: convert all compilation commands into a Dockerfile. Use variables for version numbers to simplify updates:

```dockerfile
ENV NGINX_VERSION=1.11.8 # Set variable
RUN cd nginx-${NGINX_VERSION} # Use variable
```

My Dockerfile:
```dockerfile
FROM debian
MAINTAINER Lan Tian "lantian@lantian.pub"

ENV NGINX_VERSION=1.11.8 OPENSSL_VERSION=1.1.0c NPS_VERSION=1.12.34.2
RUN mkdir /tmp/build && cd /tmp/build \
    && apt-get update -q\
    && apt-get -y install build-essential git autoconf automake libtool wget tar zlib1g-dev libpcre3 libpcre3-dev unzip \
    && wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
      && tar xvf nginx-${NGINX_VERSION}.tar.gz \
    && git clone https://github.com/bagder/libbrotli.git \
      && cd /tmp/build/libbrotli && ./autogen.sh && ./configure && make && make install && cd /tmp/build \
      && ln -s /usr/local/lib/libbrotlienc.so.1 /usr/lib/libbrotlienc.so.1 \
    && git clone https://github.com/google/ngx_brotli.git \
      && cd /tmp/build/ngx_brotli && git submodule update --init && cd /tmp/build/ \
    && git clone https://github.com/grahamedgecombe/nginx-ct.git \
    && wget https://www.openssl.org/source/openssl-${OPENSSL_VERSION}.tar.gz \
      && tar xvf openssl-${OPENSSL_VERSION}.tar.gz \
    && wget https://github.com/pagespeed/ngx_pagespeed/archive/v${NPS_VERSION}-beta.zip \
      && unzip v${NPS_VERSION}-beta.zip \
      && cd /tmp/build/ngx_pagespeed-${NPS_VERSION}-beta/ \
      && wget https://dl.google.com/dl/page-speed/psol/${NPS_VERSION}-x64.tar.gz \
      && tar -xvf ${NPS_VERSION}-x64.tar.gz \
      && cd /tmp/build \
    && wget https://raw.githubusercontent.com/cujanovic/nginx-http2-spdy-patch/master/nginx-spdy-1.11.5%2B.patch -O nginx-spdy.patch \
    && cd nginx-${NGINX_VERSION} \
    && patch -p1 < /tmp/build/nginx-spdy.patch \
    && ./configure \
       --with-threads \
       --with-file-aio \
       --with-ipv6 \
       --with-http_ssl_module \
       --with-http_spdy_module \
       --with-http_v2_module \
       --with-http_gzip_static_module \
       --with-http_gunzip_module \
       --with-http_stub_status_module \
       --with-http_sub_module \
       --add-module=/tmp/build/ngx_pagespeed-${NPS_VERSION}-beta \
       --add-module=/tmp/build/nginx-ct \
       --add-module=/tmp/build/ngx_brotli \
       --with-openssl=/tmp/build/openssl-${OPENSSL_VERSION} \
       --with-cc-opt="-O3 -fPIE -fstack-protector-strong -Wformat -Werror=format-security -Wno-deprecated-declarations" \
    && make \
    && make install \
    && cd / && rm -rf /tmp/build \
    && apt-get purge -y unzip git autoconf libtool wget automake build-essential \
    && apt-get autoremove -y --purge \
    && ln -sf /dev/stdout /usr/local/nginx/logs/access.log \
      && ln -sf /dev/stderr /usr/local/nginx/logs/error.log
EXPOSE 80 443
ADD start.sh /start.sh
ENTRYPOINT /bin/bash /start.sh
```

Critical issue: Nginx runs in background by default, causing Docker to terminate the container. Solution via `start.sh`:
```bash
#!/bin/bash
/usr/local/nginx/sbin/nginx
tail -F /usr/local/nginx/logs/access.log
```
`tail -F` keeps the container running by continuously monitoring logs.

Build the image:
```bash
docker build -t lt-nginx .
```

Add to `docker-compose.yml`:
```yaml
lt-nginx:
  image: lt-nginx
  container_name: lt-nginx
  restart: always
  volumes:
    - './nginx:/usr/local/nginx/conf' # Config files
    - './www:/srv/www' # Website root
    - '/etc/timezone:/etc/timezone' # Timezone
    - '/etc/localtime:/etc/localtime'
  ports:
    - '80:80'
    - '443:443'
```

## Conclusion

We've set up MariaDB, PHP-FPM, and Nginx containers. They can now be managed uniformly via:
- Start: `docker-compose up -d`
- Stop: `docker-compose down`
This greatly simplifies deployment and maintenance.
```
