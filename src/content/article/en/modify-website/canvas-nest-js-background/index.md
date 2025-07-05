---
title: 'Adding a Cool Web Background with Canvas-Nest.js'
categories: Website and Servers
tags: [JS]
date: 2016-08-03 22:28:00
image: /usr/uploads/2016/08/2318195135.png
autoTranslated: true
---


Today on [Advanced Blog][1], I discovered a stunning webpage background effect where dynamic lines form triangles and other geometric patterns that respond to mouse movements.

To implement this on your own site, simply add the following code before `</body>`:

    <script src="//cdn.bootcss.com/canvas-nest.js/1.0.0/canvas-nest.min.js"></script>

Refresh the page to see the effect. If it doesn't appear, verify the placement – this code **must not** be inserted between `<head>` and `</head>`!

However, this introduces an issue: when server-to-user speeds are slow (e.g., during peak-hour network congestion between China and the US), the browser won't detect the need to load this JavaScript until reaching the code's position near the page bottom. Consequently, this JavaScript only begins downloading after page rendering completes, significantly delaying overall load times.

To resolve this, add the following code between `<head>` and `</head>` at the beginning:

    <link href="//cdn.bootcss.com/canvas-nest.js/1.0.0/canvas-nest.min.js" rel="preload" as="script"/>

This instructs the browser to prioritize downloading the script during initial `<head>` parsing, substantially improving load performance. Developer tools will show that despite being placed at the page bottom, the script now loads concurrently with `<head>` resources after this optimization.

![Screenshot 2016-08-03 at 10.27.03 PM.png][2]

The final implementation can be observed on this site.

[1]: https://jinjie.bid/
[2]: /usr/uploads/2016/08/2318195135.png
```
