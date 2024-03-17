---
title: '使用现代格式几乎无损地存档图片及视频 - H265 与 HEIF'
categories: 计算机与客户端
tags: [图片, 视频, H265, HEIF]
date: 2020-02-13 15:05:18
---

很多人都会保存有每次参加旅游、聚会等活动，或是人生重要时刻的图片和视频。如果你很
喜欢拍照和录视频，并且把它们都保存下来，你很有可能会飞快地塞满一块有一块的硬盘。
如果你不想不停地加硬盘，你也可以尝试对你的图片和视频等进行压缩。

说到压缩，常见的操作是降低图片的分辨率。我曾经用过的古老的 Microsoft Office
Picture Manager（集成在 Office 2003 中）就带有一键图片压缩功能，实际上是将图片转
换成分辨率约为 1024x768 的 JPEG 图片。这样操作的一个很大的缺陷，就是图片的大量细
节信息完全丢失了。即使你在存档的当时觉得可以接受这些细节的丢失，但随着技术发展，
这些丢失很可能有一天变得非常扎眼。例如，零几年时显示器的分辨率普遍为 1024x768，
因此 Microsoft Office Picture Manager 将图片压缩到这个分辨率。而这些图片在现代的
1080p 乃至 4K 显示器上被放大，细节的丢失就会导致旧图片变得模糊，而这些损失是不可
逆的。

因此我希望，在减少图片及视频的文件大小时，可以做到几乎不降低画质。这就要借助现代
的视频和图片压缩算法了。早期的压缩算法通常带有时代的局限性，受限于当时计算机的
CPU 处理能力与内存容量，往往无法做出复杂的压缩、解压算法，相对的压缩率也就很低
（指生成的文件较大），而现代的压缩算法可以利用上多核心 CPU 和巨大的内存，将文件
压缩到更小。例如我们最常使用的、1992 年发明的 JPEG 图片格式，压缩率就被 2010 年
发明的 WebP 吊着打。根据
[Google 的这项研究](https://developers.google.com/speed/webp/docs/webp_study)，
对于 Google 使用的样例图片，在产生的图片画质几乎相同时，WebP 文件大小比 JPEG 要
小 25%。另一个例子是 7-Zip 使用的 LZMA，它在压缩时可以充分利用多核心处理器，并吃
掉几个 G 的内存，获得比 Zip 压缩文件的 Deflate 算法小得多的压缩结果。

本文中我将使用 FFmpeg 与 ImageMagick 两款软件，将录像统一转换成 H265（HEVC）编码
的 MP4 文件，将图片转换成 HEIF 文件格式。

## 本文更新日志

-   2020-06-24：修正关于 Arch 源中 ImageMagick 的错误表述，Arch 源里的
    ImageMagick 默认不带 HEIF 支持，但安装 `libheif` 即可支持，无需安装
    `imagemagick-full`。
-   2020-02-13：最初版本。

## 视频存档 - H265

我选择 H265 的原因如下：

-   H265（2013 年推出）相比 H264（2003 年推出）更新，具有更高的压缩率。
-   根据 [FFmpeg 的 H265 页面](https://trac.ffmpeg.org/wiki/Encode/H.265)，相比
    于目前常用的 H264 编码格式，在同等画质下，H265 的文件可以小约 50%。
-   虽然目前可能有一些老电脑解码 H265 视频会遇到性能不足的困难，但是 H265 的硬件
    解码器已经在新款显卡及移动设备中出现。随着硬件解码器的普及，上述障碍会迅速消
    失。
-   现在的 H265 软件编码器已经比较成熟。

相对的：

-   虽然 H264 很流行，硬件软件编解码器一大堆，但是它太老了，压缩率不够。
-   VP9 是 Google 2013 年推出的免费开源的视频格式，是的，H265 商用是要付费的。根
    据
    [Netflix 的报告](https://netflixtechblog.com/a-large-scale-comparison-of-x264-x265-and-libvpx-a-sneak-peek-2e81e88f8b0f)，
    相同画质下 VP9 的压缩率高于 H264，但低于 H265。
    -   我们个人用户完全不用管 H265 商用收费的事，直接用就是了。
-   AV1 是一群公司组成联盟开发的视频格式，2018 年推出，目的是对抗商用收费的
    H265。它的问题是太新了，编码器尚未完善，效果可能还没有 H265 好。

在使用 FFmpeg 进行视频编码时，我们要注意参数的选择，既要避免浪费空间，也要避免严
重影响画质。

-   H265 只是一种视频编码格式，我们需要一个对应的编码器。类似于同样是写 Markdown
    的博文，我可以用记事本，Word，VS Code 等不同软件来写。
    -   对于 H265 视频存档，**永远不要使用显卡的硬件加速，就算你用 2080 Ti 也不
        行**。显卡的硬件加速优先考虑的是**实时性**，这在网络直播、游戏录屏时很有
        用。但是为了追求实时性，显卡编码时会丢失大量的细节信息；同时由于芯片上留
        给硬件编码电路的空间有限，显卡编码器无法利用上 H265 的全部功能，输出文件
        也会很大。可以理解为“降级到了接近 H264 的程度”。
        -   对于同一代的显卡，它们的硬件编解码电路都是一样的，区别只有数量。例
            如，GTX 1050 上有一套编解码电路，GTX 1080 Ti 上有两套，意味着 1080
            Ti 可以同时编码两路视频。但是每路视频本身的编码速度和质量应该基本相
            同（假设 GPU 芯片频率相同）。
        -   实际上根据
            [NVIDIA 的信息](https://developer.nvidia.com/video-encode-decode-gpu-support-matrix)
            1050 等只有一套编解码电路的显卡也可以同时编码两路视频，应该是通过来
            回切换实现的。但是此时就不要指望性能了。不如说，如果你必须同时编码两
            路视频，那你一定有钱再买一张 1050。
    -   常用的 CPU 编码器是 x265，这是一个运行库，无法直接通过命令操作它本身。因
        此我们使用 FFmpeg，FFmpeg 会调用 x265 完成 H265 的编码工作。
    -   对于 H264，由于 NVIDIA 的新款硬件编码器已经非常成熟，可以达到与 CPU 编码
        相近的画质，因此可以考虑使用 **10 系列及以上**显卡的硬件编码，但能用 CPU
        尽量还是用 CPU。
    -   相似的 H264 常用的 CPU 编码器是 x264，也可以被 FFmpeg 调用。
-   对生成视频质量影响最大的参数是比特率，也就是每秒的视频占用多大的硬盘空间。
    -   一般我们不会对每个视频手动调整比特率，这将耗费大量的时间。因此我们使用
        CRF（`Constant Rate Factor`），可以理解为“输入目标画质，自动决定适合的比
        特率”。**CRF 越低，生成的文件越大，画质越高**，反之亦然。
    -   对于不同的编码格式，相同 CRF 对应不同的画质。例如根据
        [FFmpeg 的 H265 页面](https://trac.ffmpeg.org/wiki/Encode/H.265)，H264
        的 CRF 23 约等于 H265 的 CRF 28。
    -   对于 H265，根据
        [HandBrake 转码软件的文档](https://handbrake.fr/docs/en/latest/workflow/adjust-quality.html)，4K
        分辨率下常用的 CRF 范围是 22-28，1080p 常用 20-24。我最终选择的 CRF 是
        22，个人认为这是一个比较好的画质和文件大小的平衡点。
    -   对于 H264，CRF 一般选择 17-24。
    -   调整比特率对编码速度影响不大。
-   另一个影响较大的参数是 preset，它决定了在相同比特率的情况下，编码器会花多少
    时间搜索画面中的相似部分，以将它们压缩。
    -   对于 H264 和 H265，preset 有以下选项：
        -   ultrafast
        -   superfast
        -   veryfast
        -   faster
        -   fast
        -   medium
        -   slow
        -   slower
        -   veryslow
        -   placebo
    -   对于 H265，因为 H265 编码本身就很慢，我选择的是 medium（对应 i7-7700HQ
        处理器）。如果你用的是什么 i9-9900K 啊，i9-10980XE 啊，线程撕裂者 3990X
        啊，框框非常多，频率特别高的处理器，可以挑战 slow 甚至 slower。
    -   对于 H264，因为 H264 编码较简单（相比 H265），一般推荐 slower 起步，可以
        挑战 veryslow。
    -   如果这个参数调得过高，编码出的视频文件并不会小多少，但相应的编码时间
        将**成倍增加**。

我在 Arch Linux 下进行转码操作，首先安装 x264（可选），x265 和 FFmpeg：

```bash
sudo pacman -S ffmpeg x265 x264
```

然后 `cd` 到你放视频的文件夹，运行这条命令（对应 H265，CRF 22，medium）：

```bash
for FILE in **/*.mp4; do ffmpeg -loglevel quiet -stats -i "$FILE" -c:v libx265 -crf 22 -preset medium -c:a aac -b:a 128k -movflags +faststart "$FILE.converted.mp4"; done
```

或者这条（对应 H264，CRF 17，slower）：

```bash
for FILE in **/*.mp4; do ffmpeg -loglevel quiet -stats -i "$FILE" -c:v libx264 -crf 17 -preset slower -c:a aac -b:a 128k -movflags +faststart "$FILE.converted.mp4"; done
```

由于视频编码很慢，你可以把电脑开着转码，然后自己去睡觉了。取决于你的视频的量，需
要的时间可能从几个小时到几天不等。作为参考，我的 i7-7700HQ 笔记本电脑使用 H265
那条指令，编码速度大约是 0.065x 左右，即每秒编码原视频 0.065 秒的内容，或者 15
秒对应 1 秒。

## 图片存档 - HEIF

我选择 HEIF 的原因如下：

-   HEIF 是 2015 年完成规范制定的文件格式。
-   HEIF 目前在 iOS 设备上被广泛使用，作为相机的默认格式。Android 9 也添加了对它
    的支持。在可预见的将来，对 HEIF 的软件支持将迅速完善。
-   它最大的特点是使用 H265 对图片进行编码，充分地利用了视频编码器发展的结果，同
    时需要时可以利用硬件编解码器提供加速。

HEIF 文件可以使用 ImageMagick 转换生成。但是在 Arch Linux 下，官方软件源的
ImageMagick 默认不带 HEIF 支持，我们需要额外安装 `libheif`。另外，还可以装一个
exiftool，把原照片的 EXIF 信息（包括相机型号，光圈快门 ISO 参数，地理位置等）转
移到 HEIF 文件。

```bash
pikaur -S imagemagick libheif perl-image-exiftool
```

然后下面三行命令，分别是将所有 JPG 文件转换成 HEIC（HEIF 的文件扩展名），转移
EXIF 信息，和删掉 JPG：

```bash
for x in **/*.jpg; do magick "$x" "${x%.jpg}.heic"; done
for x in **/*.jpg; do exiftool -overwrite_original -tagsFromFile "$x" -all:all "${x%.jpg}.heic"; done
rm -rf **/*.jpg
```

产生的 HEIC 文件大小应该是 JPEG 的一半左右。

HEIF 并没有什么参数可调，直接保持默认就可以满足绝大多数需求。相反，在我的测试
中，如果加上 quality 等参数调整质量，会得到体积非常巨大（比原始 JPEG 还大），但
画质看不出区别的 HEIF 文件。

## 效果

我原始占用空间 36 GB 的图片和视频，经过转换成 H265 和 HEIC 保存后，占用空间降到
了 19 GB，且画质没有肉眼可见的变化。
