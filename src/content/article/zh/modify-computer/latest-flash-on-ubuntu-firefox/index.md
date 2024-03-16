---
title: '在 Ubuntu Firefox 上使用最新版本的 Flash'
categories: 计算机与客户端
tags: [flash]
date: 2014-12-13 13:32:05
---
早在一年前，Adobe 公司停止了其 Flash 插件在 Linux 系统下的新功能开发，只提供安全更新。Linux 版 Flash 的版本号也停留在了 11.2，而最新的 Windows 版 Flash 已经更新到了 15.0 版本。

不过，Adobe 又和 Google 合作开发了 Pepper Flash，集成在 Chrome 浏览器中，而 Chrome 以及其内置的 Pepper Flash 一直在 Linux 上保持最新。

那么问题来了，Pepper Flash 是 Chrome 独占的，如何让 Firefox 也用上呢？

有人希望 Mozilla 来主动支持 Pepper Flash，但是被 Firefox 开发组否决了：[https://bugzilla.mozilla.org/show_bug.cgi?id=729481](https://bugzilla.mozilla.org/show_bug.cgi?id=729481)

于是国外网友 [Rinat Ibragimov](https://github.com/i-rinat) 开发了一款插件，支持 Firefox 使用 Pepper Flash。

这款插件虽然还不完善（硬件加速功能不稳定，部分功能缺失），但是基本功能已经可以正常使用。

在 Ubuntu 下，可以通过添加 WebUpd8 的 PPA 源来安装这款软件：

```bash
sudo add-apt-repository ppa:nilarimogard/webupd8
sudo apt-get update
sudo apt-get install freshplayerplugin pepperflashplugin-nonfree
```
