---
title: 'LT NoLitter：防止 Android 应用乱建文件夹的 Xposed 插件'
categories: 计算机与客户端
tags: [Android]
date: 2017-01-31 23:17:27
---
Android 系统有着用户可直接操作的存储空间，用户可以很方便地管理自己的文件（相比 iOS 而言）。但是某些软件也会在存储空间根目录直接建立大量的文件夹，影响了用户的文件管理，并对强迫症人群造成了极大的威胁。

于是我写了一个 Xposed 插件。插件 Hook 了 Android 的 File 类，当有程序尝试用 File 类读取或写入根目录的文件或文件夹，插件会检测这个文件或文件夹是否存在。如果存在，那么插件不做任何操作；如果不存在，那么插件就将操作重定向到 `/Android/files` 文件夹下。

相比于 XInternalSD，这样操作的优点是可以对付某些不自律的应用。这些应用不使用 Android 系统函数获取存储路径，而是直接将文件保存到 `/sdcard` 之类的通用路径，XInternalSD 只修改了获取到的存储路径，因此无能为力。

相比于 SD 重定向，这样操作免除了复杂的配置。用户只需要在装上插件时把文件管理应用拉白名单，然后把根目录下不想要的文件夹删除或移动到 `/Android/files` 即可。如果今后想让某个程序将数据保存在根目录下的某个文件夹，同样直接建立文件夹即可。

项目地址：[https://github.com/xddxdd/lantian-nolitter][1]

  [1]: https://github.com/xddxdd/lantian-nolitter
