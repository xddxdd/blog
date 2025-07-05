---
title: 'JS Check-in for Social Comment Systems'
categories: Website and Servers
tags: [Check-in, JS]
date: 2013-07-02 11:40:43
autoTranslated: true
---


Inspired by [WP Blog One-click Check-in JS](/en/article/chat/wordpress-blog-onekey-comment-javascript.lantian), I modified the JS code to implement one-click check-in functionality for Youyan and Duoshuo comment systems.

**Youyan Version:**

```javascript
javascript: try {
  document.getElementById('uyan_l_uname').value = 'Your Nickname'
} catch (err) {}
var myDate = new Date()
var mytime = myDate.toLocaleTimeString()
document.getElementById('uyan_comment').value = 'Checked in today! Time: ' + mytime
UYAN.addCmt(document.getElementById('uyan_cmt_btn'))
void 0
```

Usage: Open a page with Youyan and click once. Can be used without login, or after logging in via Weibo first.

**Duoshuo Version:**

```javascript
javascript: var myDate = new Date()
var mytime = myDate.toLocaleTimeString()
document.getElementsByName('message').item(0).value =
  'Checked in today! Time: ' + mytime
document.getElementsByClassName('ds-post-button').item(0).click()
void 0
```

Usage: Open a page with Duoshuo, log in via Weibo first, then click to use.

I tested this on my guestbook. Feel free to continue testing~
