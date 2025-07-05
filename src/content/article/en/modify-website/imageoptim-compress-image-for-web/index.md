---
title: 'ImageOptim: Compressing Images for Web Use'
categories: Website and Servers
tags: [compression]
date: 2013-07-20 16:34:18
image: /usr/uploads/2013/07/622061787.png
autoTranslated: true
---


First off, I did a quick search online. It seems that all MacBook series, whether Pro or Air, regardless of the OS version, have CPU overheating issues, especially when watching Flash. According to online reviews, the highest recorded temperature for a MacBook is 101 degrees Celsius. Next time I need to boil water, I'll just use it. As for frying an egg, the temperature might not be sufficient yet, but there's still room for improvement.

Laptops are also called "lap-top computers." Next time, see who dares to put an Apple laptop on their lap when it's running at full load. Oh, and don't forget to delete smcFanControl—don't think I don't know you've cranked the fan speed to the maximum.

---------- End of Rant, Main Content Begins ----------

A website cannot lack images, except for the Wenlan Kill official website.

![Screenshot of Wenlan Kill Official Website](/usr/uploads/2013/07/622061787.png)

The author of Wenlan Kill said he's planning to style his personal website like a command prompt. To that, I can only say two words: hehe.

Large images can severely impact webpage loading speed. If your server is in Hong Kong, Singapore, or China Telecom, and it's a small-bandwidth machine like 1M or 2M, then your loading speed is definitely not going to be good. Therefore, we need to compress images.

Compressing images includes several methods:

1. Remove photo metadata, such as EXIF in JPEGs. This records camera information and is completely useless when displayed on a webpage.

2. Reduce the number of colors, mainly for PNG's indexed colors. Since some colors are indistinguishable to the human eye, it's better to merge them into one color to reduce the image size.

3. Reduce resolution. This doesn't mean reducing the number of pixels, but rather the dots per inch (DPI), such as 72 dpi or 300 dpi. Regular monitors are 72 dpi, so higher values are useless and can be stripped. Note: This doesn't consider Retina displays. For Retina, simply multiply the image width and height by 0.5, and the problem is solved.

There are many online tools and local tools for this. However, on Mac, the most powerful one is ImageOptim. It's a combination of multiple tools that can compress images layer by layer to achieve maximum compression, with (almost) no visible difference to the naked eye.

The main interface is as follows:

![ImageOptim](/usr/uploads/2013/07/2934219930.png)

Usage is super simple: drag images or a folder containing images into it, and the original images will be automatically replaced with the optimized versions. Remember to back up your files.

Download: [http://imageoptim.com/](http://imageoptim.com/)
```
