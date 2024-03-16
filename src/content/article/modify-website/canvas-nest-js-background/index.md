---
title: '用  Canvas-Nest.js 加上酷炫的网页背景'
categories: 网站与服务端
tags: [JS]
date: 2016-08-03 22:28:00
image: /usr/uploads/2016/08/2318195135.png
---
今天在 [进阶博客][1] 看到了一个酷炫的网页背景效果，背景上会有动态的线组合成三角形等各种图形，并且会对用户鼠标移动作出响应。

要在自己的网站上加入这个效果，很简单，在 `</body>` 之前加入这段代码：

    <script src="//cdn.bootcss.com/canvas-nest.js/1.0.0/canvas-nest.min.js"></script>

刷新网页，效果就有了。如果没有看到效果，请检查你加的位置，这段代码不能加在 `<head>` 和 `</head>` 之间！

但这样就产生了一个问题：在服务器到用户速度较慢的时候（比如晚上中美链路抽风的时候），用户浏览器在加载到上面这段代码所在的位置，也就是页面底部之前，无法得知它要加载这个 Javascript。也就是说，这段 Javascript 要在页面加载完毕后才会开始下载，而这会显著拖慢网页的总体加载速度。

所以，我们要在开头 `<head>` 和 `</head>` 之间再加入如下代码：

    <link href="//cdn.bootcss.com/canvas-nest.js/1.0.0/canvas-nest.min.js" rel="preload" as="script"/>

这会让浏览器在加载完 `<head>`，也就是加载页面顶端之前，就知道要去下载这段代码，可以有效地提升加载速度。在开发者工具中可以看到，这段代码尽管放在页面底部，但在经过如上设置后，会和放在 `<head>` 里的 Javascript 一起加载。

![屏幕快照 2016-08-03 下午10.27.03.png][2]

最终设置的效果可以在本站看到。

  [1]: https://jinjie.bid/
  [2]: /usr/uploads/2016/08/2318195135.png
