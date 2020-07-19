---
title: 'WP博客一键签到JS'
categories: 闲聊
tags: [WordPress,JS,签到]
date: 2013-07-01 22:04:09
---
这个是我从Arefly的博客上看来的。原网址：[http://www.arefly.com/zh-cn/wordpress-js-check/](http://www.arefly.com/zh-cn/wordpress-js-check/)

使用方法：

1.随便收藏一个网页。

2.找到你刚才收藏的网页，右键编辑，把名字改成“一键签到”或者你喜欢的东西，地址改成下面的这段代码：

```javascript
javascript:document.getElementById('author').value = '你的昵称'; document.getElementById('email').value = '你的邮箱'; document.getElementById('url').value = '你的网站';var myDate = new Date();var mytime=myDate.toLocaleTimeString();document.getElementById('comment').value = '今天签到啦！时间：' + mytime;submit.click();void(0)
```

注意里面的昵称、邮箱、网站别忘了修改。

3.打开你想签到的网页，点一下这个收藏，搞定。

好好动下脑筋，可以用这段代码来发垃圾评论，别说是我教的。另外别想用这个在我这里签到，我用的是Typecho，评论用的是友言。看着办吧。
