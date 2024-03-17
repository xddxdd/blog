---
title: 'Support WebP on IE and Firefox'
categories: 'Website and Servers'
tags: [Himawari 8, Firefox, IE, WebP]
date: 2016-08-23 13:59:00
---

I wrote a PHP snippet to fetch high-resolution images from the website of the
Himawari 8 satellite and combine them into one high-resolution image. The way to
fetch satellite images is available
[here](/en/article/modify-website/php-javascript-satellite-earth-picture.lantian).

However... The combined 4d resolution PNG image (2200x2200) is over 7 MB in
size, and due to the bad connectivity between China and the US, it takes over a
minute to load the image (from my server).

Way too slow!

Google provided a solution: the WebP image format. WebP is famous for its high
compression ratio on lossless compression scenarios.

After converting the 7 MB earth photo PNG file to WebP, the resulting file size
is less than 700 KB. For a photo with resolution 2200x2200, this is pretty
small.

But... Some browsers, including IE and Firefox, don't support WebP, and the
picture simply won't display on them. Therefore some local processing is needed
to convert WebP to something they will understand.

WebPJS is a Javascript library that does the conversion in the browser. It
recognizes WebP images based on file extensions **(important!)**, converts them
to PNG, and displays them in the browser.

To use it, you will need:

1. Download
   [webpjs-0.0.2.min.js](http://webpjs.appspot.com/js/webpjs-0.0.2.min.js) and
   [webpjs-0.0.2.swf](http://webpjs.appspot.com/js/webpjs-0.0.2.swf)

2. Add the following code to the `<head>` section:

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
        sc.src = 'YOUR_PATH_TO_THE LIBRARY_FILES/webpjs-0.0.2.min.js'
        s.parentNode.insertBefore(sc, s)
      }
    }
    WebP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })()
</script>
```

And voila. The only downside is that the browser will lag for 2-3 seconds while
loading the image, but compared to the time on transferring the data this is
ignorable.

Back to satellite images of Himawari 8. In my configuration PHP will directly
output a combined WebP image, and the URL ends with `.php` rather than `.webp`.
In this case, WebPJS will not recognize the image. What can we do?

Suppose originally you have the following HTML code:

```html
<img src="himawari.php" />
```

Simply add something after `himawari.php`:

```html
<img src="himawari.php/TYPE_ANYTHING_HERE.webp" />
```

Upon receiving the request, the webserver will first look for
`himawari.php/TYPE_ANYTHING_HERE.webp` which, of course, doesn't exist. Then the
server will look for `himawari.php`, which is there. Now the server will let the
code handle the request.

I suggest you replace `TYPE_ANYTHING_HERE` with the current time or image hash,
so they can be cached on CDN services like Qiniu.
