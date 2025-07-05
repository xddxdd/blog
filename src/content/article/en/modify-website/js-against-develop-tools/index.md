---
title: 'A Piece of JS for Ultimate Resistance Against Developer Tools'
categories: Website and Servers
tags: [Web]
date: 2013-04-12 19:46:56
autoTranslated: true
---


The most frustrating part of website development is having your painstakingly crafted templates ripped off using developer tools, as Chrome Dev Tools and Firebug possess immense power. (No explanation needed)

Developer tools were once invincible, until this piece of JS emerged.

[http://publicdn.cdn.duapp.com/js/wqnmlgb.min.js](http://publicdn.cdn.duapp.com/js/wqnmlgb.min.js)

Source code + author information:

```javascript
/*
    Plugin Name : WQNMLGB
    Plugin Author : Xider
    Plugin Version : 1.2 final
    Plugin Site : http://lab.i-xider.com

    Now Support : Chrome , Safari , FireFox ( NOT ALL ) , Opera ( NOT ALL ) , IE ( NOT ALL )
                                 请原谅我把原生JS和JQuery混为一起写
*/

function fuckyou() {
  window.location = 'http://i-xider.com/#呵呵' //Redirect current window to blank page
}
function ck() {
  console.profile()
  console.profileEnd()
  //Check if profiles contains data - if yes, someone pressed F12!
  if (console.clear) {
    console.clear()
  }
  if (typeof console.profiles == 'object') {
    return console.profiles.length > 0
  }
}
ck() //Reveal integrity
$('body').data('w', $(window).width())
$('body').data('h', $(window).height()) //Cache initial window dimensions on body
function hehe() {
  if ($.browser.msie) {
    if (
      $('body').data('w') == $(window).width() &&
      $('body').data('h') - $(window).height() > 50
    ) {
      fuckyou() // IE WQNMLGB
    }
  } else if ($.browser.mozilla) {
    if (
      window.console &&
      (console.firebug || (console.table && /firebug/i.test(console.table())))
    ) {
      fuckyou() // Firefox
    }
  } else {
    if (
      ($('body').data('w') == $(window).width() &&
        $('body').data('h') - $(window).height() > 50) ||
      (typeof console.profiles == 'object' && console.profiles.length > 0)
    ) {
      fuckyou() // Chrome and Opera
    }
  }
}
hehe() //Suggest alternative activities
window.onresize = function () {
  if (
    $('body').data('w') == $(window).width() &&
    $('body').data('h') - $(window).height() > 50
  )
    //If page height vs window height difference >50, redirect
    fuckyou()
}
```

This JS automatically detects if developer tools (Firebug, Chrome Dev Tools, etc.) are open in your browser. When triggered, it forcibly redirects the page to about:blank to prevent malicious code theft.

Usage:

1. Baidu Cloud CDN

```html
<script
  type="text/javascript"
  src="//publicdn.cdn.duapp.com/js/wqnmlgb.min.js"
></script>
```

2. Provided by zntec.cn

```html
<script
  type="text/javascript"
  src="http://bcs.duapp.com/babytomas/wqnmlgb.min.js"
></script>
```

Of course, if your blog isn't concerned about code theft, skip this. My blog pages allow normal access to developer tools - feel free to inspect the code... (Truth be told, I need to use them myself too)
```
