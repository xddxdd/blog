---
title: 'Image Zoom Effect on Mouse Hover'
categories: Website and Servers
tags: [Effects, HTML, CSS, jQuery, JS]
date: 2013-06-18 20:36:47
image: /usr/uploads/2013/06/1260012588.jpg
autoTranslated: true
---


Image zoom effect on hover - Original by [Maomihz](http://maomihz.com), Modified by [Lan Tian](https://lantian.pub)

Last night [Maomihz](http://maomihz.com) asked me to modify a jQuery script to achieve an automatic HD image display effect when hovering over thumbnails. There were two initial bugs: the enlarged image would flicker when hovering over the frame, and the image would exceed the top edge of the screen.

My solution was to place the enlarged image under the thumbnail and set a semi-transparent effect for the thumbnail. The top-edge overflow issue was easily resolved by implementing a max() function.

Here's the jQuery code:

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

Corresponding CSS:

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

HTML implementation:

```html
<div class="imgls">![small.jpg" rel="img0.jpg" class="smallimage"><img src="small](small.jpg" rel="img0.jpg" class="smallimage"><img src="small.jpg)</div>
```

Screenshot:

![Effect Preview](/usr/uploads/2013/06/1260012588.jpg)

Download sample (using the two flowers from Windows 8):

[Sample Package](/usr/uploads/2013/06/3009674103.zip)
```
