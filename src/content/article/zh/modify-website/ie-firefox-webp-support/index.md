---
title: '让 IE 与 Firefox 支持 WebP 图像格式'
categories: 网站与服务端
tags: [向日葵8号, Firefox, IE, WebP]
date: 2016-08-23 13:59:00
---

写了段 PHP 代码，自动从向日葵 8 号卫星的网站上抓取高清图并合成一张图。获取卫星照
片的方法可以
在[这里](/article/modify-website/php-javascript-satellite-earth-picture.lantian)看
到。

但是……最终合成的 4d 分辨率（2200x2200）的PNG图片有 7 MB 多大，而且中美网络又频繁
抽风，实际都要1分钟左右才能从我的服务器上加载完这张图片。

太慢了！

Google 提供了一种解决方案：WebP 图片格式。这种图片格式以无损压缩下极高的压缩比而
著名。

把 7 MB 的地球照片 PNG 转换成 WebP，最终的文件大小是：700 KB 不到。对于一张分辨
率2200x2200的图片来说，这个大小已经非常小了。

但是……以 IE 和 Firefox 为首的一些浏览器不支持 WebP，在这些浏览器上，WebP 图片是
显示不出来的。所以，我们要在本地端加点处理，把 WebP 转换成浏览器支持的图像格式。

WebPJS 是一个在浏览器中完成上述转换的 Javascript 代码。它根据文件扩展名**（很重
要！）**识别浏览器加载的 WebP 图像，并将它们转换成 PNG 显示在浏览器中。

要使用它，你只需要：

1. 下载 [webpjs-0.0.2.min.js](http://webpjs.appspot.com/js/webpjs-0.0.2.min.js)
   和 [webpjs-0.0.2.swf](http://webpjs.appspot.com/js/webpjs-0.0.2.swf)

2. 在网页的 head 里加入如下代码：

```html
<script>
    ;(function () {
        var WebP = new Image()
        WebP.onload = WebP.onerror = function () {
            if (WebP.height != 2) {
                var sc = document.createElement('script')
                sc.type = 'text/javascript'
                sc.async = true
                var s = document.getElementsByTagName('script')[0]
                sc.src = '你放这段代码的地址/webpjs-0.0.2.min.js'
                s.parentNode.insertBefore(sc, s)
            }
        }
        WebP.src =
            'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })()
</script>
```

就搞定了。唯一的缺点是图片大时浏览器会卡个两三秒，不过相比于省下的传输时间，这点
时间可以忽略不计。

回到向日葵 8 号卫星图片上面来。我的设置是让 PHP 合成图片之后直接输出 WebP 图像，
也就是 URL 末尾是 `.php` 而不是 `.webp`。这种情况下 WebPJS 是识别不出这张图片
的。怎么办？

假设你原来的 HTML 代码是这样：

```html
<img src="himawari.php" />
```

只需要在 `himawari.php` 后加一点东西即可：

```html
<img src="himawari.php/这里输入什么都可以.webp" />
```

网页服务器在接收到这个请求时，会查找 `himawari.php/这里输入什么都可以.webp`；当
然，这个文件不存在。随后，服务器会查找 `himawari.php`，这个是存在的。服务器就会
把请求交由这段代码来执行。

上面的 `这里输入什么都可以` 建议用当前时间或者要输出的图片的hash代替，以便在七牛
之类 CDN 上实现缓存。
