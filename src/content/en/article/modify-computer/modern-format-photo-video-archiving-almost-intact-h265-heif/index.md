---
title: '(Almost) Lossless Archival with Modern Formats - H265 and HEIF'
categories: 'Computers and Clients'
tags: [Image, Video, H265, HEIF]
date: 2020-02-13 15:05:18
---

Many people keep their inventory of photos and videos for their travels, parties, or whatever important moments of their lives. If you are into taking photos and recording videos and like keeping all of them, you will likely fill up hard drives after hard drives. If you don't want to keep adding more drives to your collection, you may also try to compress your photos and videos.

Speaking of compression, a common method is to reduce the resolution of images. I've used the good old Microsoft Office Picture Manager (that comes with Office 2003) and its built-in one-key image compression. Behind the scenes, it's actually downsampling images to JPEG files of around 1024x768. One major drawback is that a lot of the details are completely lost. Even if you think you can accept the losses by the time you archive the files, with the development of technology, those losses may become significant one day. For example, in mid-2000, a common monitor had a resolution of 1024x768, which is why Microsoft Office Picture Manager chose to compress images to this resolution. But when they are enlarged on a modern 1080p or even 4K monitor, the loss of details makes images blurry, and such losses are irreversible.

Therefore, I wish that the quality is almost not affected at all while compressing photos and videos. Help from modern video and image compression algorithms is needed to achieve this. Early compression algorithms come with limitations from their eras since they are unable to perform complicated compression or decompression operations with the CPU performance and RAM size limits and produce badly compressed files (larger in file size). Modern algorithms, on the other hand, are designed with multicore processors and large RAMs in mind and can compress the files to a smaller size. For example, the most popular JPEG image format is invented back in 1992, and its compression rate is being laughed at by WebP, invented in 2010. According to [this study by Google](https://developers.google.com/speed/webp/docs/webp_study), WebP is 25% smaller than JPEG for a set of sample files used. Another example is LZMA used by 7-Zip, which fully utilizes multicore processors and eats a few gigs of RAM, and in turn, produces results much smaller than Zip files' Deflate algorithm.

In this post, I will use FFmpeg and ImageMagick, to convert all my videos to H265 (HEVC) encoded MP4 files and my photos to HEIF.

Changelog
---------

- 2020-06-24: Fix an error with ImageMagick in Arch repo: it doesn't come with HEIF support by default, but installing `libheif` can fix that. No need for `imagemagick-full`.
- 2020-02-13: Initial version.

Video Archival - H265
---------------------

Here are the reasons I chose H265:

- H265 (invented in 2013) is newer than H264 (invented in 2003) and has a higher compress rate.
- According to [FFmpeg's H265 page](https://trac.ffmpeg.org/wiki/Encode/H.265), compared to the popular H264, H265 files can be around 50% smaller at the same quality.
- Although older computers may have performance issues decoding H265 videos, its hardware decoders are appearing on newer graphic cards and mobile devices. With the widespread of hardware decoders, such obstacles will gradually go away.
- Current H265 software encoders are mature enough.

Comparatively:

- While H264 is indeed popular with a ton of hardware and software decoders, it is too old and cannot achieve a satisfying compression ratio.
- VP9 is a free and open source video format created in 2013 by Google. Yes, it costs money to use H265 in a commercial environment. According to [Netflix's report](https://netflixtechblog.com/a-large-scale-comparison-of-x264-x265-and-libvpx-a-sneak-peek-2e81e88f8b0f), at the same image quality, VP9 produces better compression rate than H264, but worse than H265.
  - Since we are personal users, we don't care about H265's commercialization costs; simply use it.
- AV1 was created by an alliance of corporations in 2018 to compete with the costly commercial H265. The problem is that it's too new with immature encoders, and may produce worse results than H265.

While using FFmpeg to encode videos, we need to pay attention to parameter selections to both prevent wasting space and prevent degrading image quality.

- H265 is just a video encoding format, and we need a corresponding encoder. This is similar to writing a blog in Markdown, which I can do with either Notepad, Word, or VS Code.
  - For H265 video archival, **never use GPU hardware acceleration, even with a 2080 Ti**. Hardware acceleration of graphic cards is primarily focused on **real-time** processing, which is incredibly useful for online streaming and game recording. But to achieve that, a lot of details are lost. In addition, with limited space on the hardware encoding circuit on the silicon chip, the hardware encoder cannot use all features of H265 and will produce a larger file. You may think of this as "degraded to H264 level".
    - GPUs of the same generation share the same encoding/decoding circuit. The only difference is thenumber of circuits. For example, GTX 1050 has one set of circuit, while GTX 1080 Ti has two. This means that GTX 1080 Ti can encode two streams simultaneously. But for each stream, the quality and speed should be largely the same (assuming GPUs run at the same frequency).
    - In fact, according to [NVIDIA's information](https://developer.nvidia.com/video-encode-decode-gpu-support-matrix), GPUs with only one set of circuit, such as 1050, can encode two streams at the same time, and I guess it's achieved by switching back and forth. However, don't expect much performance in this case. On another thought, if you have to encode two streams at the same time, you can definitely afford another 1050.
  - The commonly used CPU encoder is `x265`, a runtime library that cannot be executed directly. Therefore we will use `FFmpeg`, which calls x265 to perform H265 encoding.
  - For H264, since NVIDIA's new hardware encoders are mature enough and can achieve a similar quality compared to CPU encoding, you may try them on **10 series or newer** GPUs. However, I still recommend CPU encoding unless you're unable to use it.
  - Similarly, the most popular CPU encoder for H264 is `x264`, also called by FFmpeg.
- The parameter with the most impact on video quality is `Bitrate`, or the file size of one second's video.
  - Usually, we don't manually specify bitrates for each video, as this will need a lot of time. Instead, we use `CRF (Constant Rate Factor)` to set the desired quality and let the software automatically determine a suitable bitrate. **A lower CRF means larger file and higher quality**, and vice versa.
  - For different encoding formats, the same CRF number refers to different quality levels. For example, according to [FFmpeg's H265 page](https://trac.ffmpeg.org/wiki/Encode/H.265), H264's CRF 23 is almost equivalent to H265's CRF 28 quality-wise.
  - For H265, according to [HandBrake converter's doc](https://handbrake.fr/docs/en/latest/workflow/adjust-quality.html), the common range of CRF for 4K resolution is 22-28, and 20-24 for 1080p. My final choice of CRF is 22, as I consider it to be a balance point between quality and size personally.
  - For H264, CRF is usually set to 17-24.
  - Bitrate doesn't impact encoding speed much.
- Another important factor is `preset` which sets the computational complexity of the encoder to look for similar parts in the video and compress them, even at the same bitrate.
  - For H264 and H265, `preset` can be set to:
    - ultrafast
    - superfast
    - veryfast
    - faster
    - fast
    - medium
    - slow
    - slower
    - veryslow
    - placebo
  - For H265, since H265 encoding already takes ages, I chose `medium` (for i7-7700HQ). If you're using something like a i9-9900K, i9-10980XE, or a Threadripper 3990X, something with many many threads and super high clock speeds, you may try `slow` or even `slower`.
  - For H264, since H264 encoding is much simpler (compared to H265), you may start from `slower` and try `veryslow`.
  - If you set this parameter too high, the output file will not be much smaller, but the time it takes will **increase exponentially**.

I'm doing the transcoding on Arch Linux. First install `x264` (optional), `x265` and `FFmpeg`:

```bash
sudo pacman -S ffmpeg x265 x264
```

Then `cd` to the directory containing your videos, and run this command (H265, CRF 22, `medium`):

```bash
for FILE in **/*.mp4; do ffmpeg -loglevel quiet -stats -i "$FILE" -c:v libx265 -crf 22 -preset medium -c:a aac -b:a 128k -movflags +faststart "$FILE.converted.mp4"; done
```

Or this command (H264, CRF 17, `slower`):

```bash
for FILE in **/*.mp4; do ffmpeg -loglevel quiet -stats -i "$FILE" -c:v libx264 -crf 17 -preset slower -c:a aac -b:a 128k -movflags +faststart "$FILE.converted.mp4"; done
```

Since video encoding is slow, you may leave the computer transcoding while you go to sleep. It may take a few hours and even up to a few days. As a reference, by using the H265 command on my i7-7700HQ laptop, the speed factor is 0.065x, or the computer will encode 0.065 seconds of video every real-world second, or 15 real-world seconds for 1 video second.

Image Archival - HEIF
---------------------

Here are the reasons I chose HEIF:

- HEIF specification was finalized in 2015.
- HEIF is currently widely used on iOS devices as the default format for cameras. Android 9 also added support as well. In the foreseeable future, software support for HEIF will become mature quickly.
- The major advantage is that it uses H265 to encode photos, which fully utilizes the maturity of video encoders. In addition, hardware acceleration can be used if necessary.

HEIF files can be generated by ImageMagick. But on Arch Linux, the ImageMagick from Arch repo doesn't come with HEIF support by default, and we need to install `libheif` additionally. We can also install `exiftool`, which copies EXIF information (including camera model, aperture, shutter, ISO parameters, locations, etc) to HEIF files.

```bash
pikaur -S imagemagick libheif perl-image-exiftool
```

The next three commands convert all JPG files to HEIC (file extension for HEIF), transfer EXIF information, and remove the JPG files:

```bash
for x in **/*.jpg; do magick "$x" "${x%.jpg}.heic"; done
for x in **/*.jpg; do exiftool -overwrite_original -tagsFromFile "$x" -all:all "${x%.jpg}.heic"; done
rm -rf **/*.jpg
```

The HEIC files produced should be around half the size of JPEG files.

There aren't many parameters to tune for HEIF, and the default settings are enough for almost everyone. By contrast, in my testing, if I adjust quality with parameters, the generated image will be huge (even larger than JPEG) but with no noticeable differences in image quality.

Results
-------

I compressed my photos and videos from 36 GB to 19 GB with the help of H265 and HEIC, with no noticeable quality changes.
