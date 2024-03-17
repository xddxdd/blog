---
title: '鼠标移过图片放大显示效果'
categories: 网站与服务端
tags: [特效, HTML, CSS, jQuery, JS]
date: 2013-06-18 20:36:47
image: /usr/uploads/2013/06/1260012588.jpg
---

鼠标移过图片放大显示效果 - Original by [Maomihz](http://maomihz.com), Modified
by [Lan Tian](https://lantian.pub)

昨天晚上[Maomihz](http://maomihz.com)让我帮他改一段jQuery，实现鼠标移上去自动显
示高清大图的效果。一开始有两个Bug，一个是鼠标移到大图框上时，大图会闪来闪去，另
一个就是图片会超出屏幕上边界。

我的修改， 就是把大图放到小图底下去，然后给小图设定半透明效果。超出上边界的判断
非常容易，写了个max函数就搞定了。

下面放jQuery：

```javascript
$(function () {
  var x = 22
  var y = 540
  var a = 0

  $('a.smallimage').hover(
    function (e) {
      if (a == 0) {
        $('body').append(
          '<div id="bigimage"><img src="' + this.rel + '" alt="" /></div>'
        )
        a = 1
      }
      widthJudge(e)
      $('a.smallimage').fadeTo(300, 0.3)
      $('#bigimage').fadeIn(300)
    },
    function () {
      $('#bigimage').fadeOut(300)
      $('a.smallimage').fadeTo(300, 1)
    }
  )

  $('a.smallimage').mousemove(function (e) {
    widthJudge(e)
  })
  function max(a, b) {
    if (a > b) {
      return a
    } else {
      return b
    }
  }
  function widthJudge(e) {
    var marginRight = document.body.clientWidth - e.pageX
    var imageWidth = $('#bigimage').width()
    if (marginRight < imageWidth) {
      $('#bigimage').css({
        top: max(e.pageY - y, 22) + 'px',
        left: document.body.clientWidth - imageWidth + x + 'px',
      })
    } else {
      x = -22
      $('#bigimage').css({
        top: max(e.pageY - y, 22) + 'px',
        left: e.pageX + x + 'px',
      })
    }
  }
})
```

对应的CSS：

```css
.smallimage {
  position: relative;
  z-index: 3;
}
#bigimage {
  position: absolute;
  z-index: 2;
}
#bigimage img {
  height: 500px;
  padding: 5px;
  background: #fff;
  border: 1px solid #e3e3e3;
}
```

网页调用方法：

```html
<div class="imgls">![small.jpg" rel="img0.jpg" class="smallimage"><img src="small](small.jpg" rel="img0.jpg" class="smallimage"><img src="small.jpg)</div>
```

截图：

![特效截图](../../../../usr/uploads/2013/06/1260012588.jpg)

下载：（用的是Win8那两朵花）

[样例包](../../../../usr/uploads/2013/06/3009674103.zip)
