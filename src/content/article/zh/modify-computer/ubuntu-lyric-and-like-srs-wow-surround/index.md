---
title: 'Ubuntu 安装 LRC 歌词显示插件和开启类 SRS WOW 音效'
categories: 计算机与客户端
tags: [音乐, 折腾, Linux]
date: 2013-03-09 11:40:45
image: /usr/uploads/2013/03/2013-03-09-113429的屏幕截图.png
---

我的华硕笔记本原先Windows 7下的声卡驱动自带一个叫ASUS Sonic Focus的技术，原理就
是通过对音频的均衡器调节做到心理学杜比环绕，也就是让人心理上以为声音是环绕声。开
启Sonic Focus后，我觉得音效好多了。（我不是耳机党）

但是在Ubuntu上，自然不会有Sonic Focus，华硕才没空对付这样一个升级频繁的系
统。Dolby和SRS等也不会给Linux支持，所以开源社区有大神就写出了Extra Stereo，用于
替代这些功能。还有一个Crystalizer，也就是增强高频声音响度让声音清澈动听，用过创
新声卡和创新X-Fi的人应该知道。

同时，在Ubuntu上听歌，没有歌词是最痛苦的。Rhythmbox自带个什么歌词自动下载，结果
我打开根本没用……没办法，自己去网上找吧。

于是，我找到了OSD Lyrics。

> OSD Lyrics is a lyrics show compatible with various media players. It is not a
> plugin but a standalone program. OSD Lyrics shows lyrics on your desktop, in
> the style similar to KaraOK. It also provides another displaying style, in
> which lyrics scroll from bottom to top. OSD Lyrics can download lyrics from
> the network automatically.

这款软件是一个桌面歌词软件，支持Audacious，Banshee（Ubuntu 12.04还是11.10内置
的，我忘了），Rhythmbox（Ubuntu 12.10内置）等等，效果和酷我之类的差不多，还能从
千千静听的歌词数据库自动搜索下载。软件官方提供PPA源，可以直接添加安装。

```bash
sudo add-apt-repository ppa:osd-lyrics/ppa
sudo apt-get update
sudo apt-get install osdlyrics
```

软件默认把歌词存在~/.lyrics下面，比较难找，我喜欢和歌存在一起。你可以先打开OSD
Lyrics（会让你选择启动哪个播放器），点右上角的那个图标里的选项，翻到歌词位置，路
径一栏删到只留%，文件名只留%f。

2.开启类SRS WOW音效

这个东西有难度，最重要的是Extra Stereo没有独立安装，也不是驱动级别的。所以我们要
安装支持这个功能的播放器。目前支持的有MPlayer（SMPlayer），和Audacious。听歌当然
用Audacious。

```bash
sudo apt-get install audacious
```

完事后打开Audacious，顶上菜单-输出-音效，Crystalizer和Extra Stereo就都有了。

PS：对于一般电脑音箱用户，Extra Stereo开2.8左右（大于3.5破音）。Crystalizer开2左
右（大于3破音），Echo（回声功能）从上到下分别调成180、28、24。

对于SMPlayer，你可以每放一部片子自己改一次设置，也可以直接设到MPlayer启动参数
里。菜单-选项-首选项-高级，在“每次打开文件时执行下列动作“什么的下面的框里写上：

```bash
extrastereo_filter true
```

保存设置就可以了。罗嗦一句，手动开启方法是菜单-音频-过滤器-增强立体声。
