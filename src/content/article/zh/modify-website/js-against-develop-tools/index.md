---
title: '终极对抗开发者工具的一段JS'
categories: 网站与服务端
tags: [网站]
date: 2013-04-12 19:46:56
---

做网站最烦的就是辛辛苦苦做的模板被人用开发者工具扒去了，因为Chrome Dev Tool和
Firebug都有超级牛力。（不解释）

开发者工具曾经是无敌的，直到这段JS出现。

[http://publicdn.cdn.duapp.com/js/wqnmlgb.min.js](http://publicdn.cdn.duapp.com/js/wqnmlgb.min.js)

源代码+作者信息：

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
    window.location = 'http://i-xider.com/#呵呵' //将当前窗口跳转置空白页
}
function ck() {
    console.profile()
    console.profileEnd()
    //我们判断一下profiles里面有没有东西，如果有，肯定有人按F12了，没错！！
    if (console.clear) {
        console.clear()
    }
    if (typeof console.profiles == 'object') {
        return console.profiles.length > 0
    }
}
ck() //节操亮出来
$('body').data('w', $(window).width())
$('body').data('h', $(window).height()) //将初始窗口的高度附加到body上，作为缓存，感谢@撸大师的指点
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
            (console.firebug ||
                (console.table && /firebug/i.test(console.table())))
        ) {
            fuckyou() // 火狐先森
        }
    } else {
        if (
            ($('body').data('w') == $(window).width() &&
                $('body').data('h') - $(window).height() > 50) ||
            (typeof console.profiles == 'object' && console.profiles.length > 0)
        ) {
            fuckyou() // Chrome and Opera 先森
        }
    }
}
hehe() //我劝你们撸管吧
window.onresize = function () {
    if (
        $('body').data('w') == $(window).width() &&
        $('body').data('h') - $(window).height() > 50
    )
        //判断当前窗口内页高度和窗口高度，如果差值大于50，那么呵呵
        fuckyou()
}
```

这个JS会自动检测你的浏览器有没有调试工具打开（Firebug，Chrome Dev Tool，etc），
一旦打开会强行将你的网页跳到about:blank，防止不怀好意的人扒你代码。

调用方法：

1.百度云CDN

```html
<script
    type="text/javascript"
    src="//publicdn.cdn.duapp.com/js/wqnmlgb.min.js"
></script>
```

2.zntec.cn站长提供

```html
<script
    type="text/javascript"
    src="http://bcs.duapp.com/babytomas/wqnmlgb.min.js"
></script>
```

当然如果你的博客不怕被扒代码就不用加了，我的博客页面都可以正常打开开发者工具，欢
迎扒代码……（其实还有个原因是我也要用）
