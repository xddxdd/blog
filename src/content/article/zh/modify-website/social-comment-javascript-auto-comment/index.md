---
title: '社会化评论系统的JS签到'
categories: 网站与服务端
tags: [签到, JS]
date: 2013-07-02 11:40:43
---

受[WP博客一键签到JS](/article/chat/wordpress-blog-onekey-comment-javascript.lantian)启
发，我自己修改JS代码，实现了友言和多说的一键签到功能。

友言版：

```javascript
javascript: try {
  document.getElementById('uyan_l_uname').value = '你的昵称'
} catch (err) {}
var myDate = new Date()
var mytime = myDate.toLocaleTimeString()
document.getElementById('uyan_comment').value = '今天签到啦！时间：' + mytime
UYAN.addCmt(document.getElementById('uyan_cmt_btn'))
void 0
```

用法：打开有友言的页面，点一下即可。可以不登陆，也可以先用微博之类的登陆好。

多说版：

```javascript
javascript: var myDate = new Date()
var mytime = myDate.toLocaleTimeString()
document.getElementsByName('message').item(0).value =
  '今天签到啦！时间：' + mytime
document.getElementsByClassName('ds-post-button').item(0).click()
void 0
```

用法：打开有多说的页面，先用微博登陆好，然后点击使用。

我是拿我的留言版做的测试，欢迎大家继续测试~
