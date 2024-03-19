---
title: 在 OpenVZ 6 上安装/升级到 Debian 10
categories: 随手记
tags: [Debian, OpenVZ]
date: 2020-03-19 21:55:54
---

- 2020 年了，你怎么还在用 OpenVZ 6 的 VPS？
- 因为它（们）只要一刀一年。

因为 OpenVZ 6 的内核非常老旧（Linux 2.6.32），较新的系统无法在旧内核上正常运行，
因此之前我的 OpenVZ VPS 只能用 Debian 8。

但我在 GitHub 发现了一
个[修改版的 glibc（C 语言运行库）](https://github.com/sdwru/glibc-debian-10/releases)，
可以在 OpenVZ 6 内核上正常运行 Debian 10。

## 警告

不保证以下步骤适用于所有 OpenVZ VPS，也不保证这个 glibc 的安全性（我没看它修改了
哪里，说起来停止维护的 OpenVZ 6 还要什么安全性）。

**请备份好数据**，最坏的情况下你可能需要重装系统。

## 安装步骤

原作者只提供了 deb 包，但这些 deb 包里有调试符号之类一般人用不上的东西，所以不建
议 `dpkg -i *.deb`。

原作者建议自己在本地建一个简单的软件源再使用它，步骤如下：

```bash
# 下载截至本文发布日的最新版本
wget https://github.com/sdwru/glibc-debian-10/releases/download/2.28-9910.0/glibc_2.28-9910.0+custom1.1_amd64.deb.zip
unzip glibc_2.28-9910.0+custom1.1_amd64.deb.zip
# 在 /opt/packages 建立一个软件源
apt -y install dpkg-dev software-properties-common
mkdir -p /opt/packages/binary
cp *.deb /opt/packages/binary
cd /opt/packages
dpkg-scanpackages . | gzip -9c > Packages.gz
# 添加这个软件源
add-apt-repository 'deb [trusted=yes] file:/opt/packages/ ./'
apt update
```

我在按照上述步骤建立软件源后直接把它传到了我的服务器上，你也可以直接用，但没有数
字签名比较危险：

```bash
echo "deb [trusted=yes] http://lab.lantian.pub/glibc-for-debian-10-on-openvz ./" > /etc/apt/sources.list.d/glibc-for-debian-10-on-openvz.list
apt update
```

添加完软件源后，执行正常的 Debian 升级流程，但是先不要重启（其实你也重启不了）：

```bash
# 取决于你以前在哪个版本，依次对应 Debian 7、8、9
sed -i "s/wheezy/buster/g" /etc/apt/sources.list /etc/apt/sources.list.d/*
sed -i "s/jessie/buster/g" /etc/apt/sources.list /etc/apt/sources.list.d/*
sed -i "s/stretch/buster/g" /etc/apt/sources.list /etc/apt/sources.list.d/*
# 开始升级
apt update
apt dist-upgrade
```

此时把 glibc 标记成 `hold` 状态，即禁止 apt 自动去升级它：

```bash
apt-mark hold libc6
```

升级完后，你输入 `reboot` 应该没有任何反应。此时只要去 VPS 服务商的控制面板里重
启就可以了。

![在 OpenVZ 6 内核上运行的 Debian 10](/usr/uploads/202003/debian-10-on-openvz-6.png)
