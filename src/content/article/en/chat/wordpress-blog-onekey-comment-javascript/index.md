---
title: 'One-Click Check-in JS for WordPress Blog'
categories: Chat
tags: [WordPress, JS, Check-in]
date: 2013-07-01 10:04:09 PM
autoTranslated: true
---


This is something I came across on Arefly's blog. Original URL:  
[http://www.arefly.com/zh-cn/wordpress-js-check/](http://www.arefly.com/zh-cn/wordpress-js-check/)

Usage:

1. Bookmark any webpage.  
2. Find the bookmark you just created, right-click to edit it. Change the name to "One-Click Check-in" or whatever you prefer, and replace the address with the following code:  

```javascript
javascript: document.getElementById('author').value = 'Your Nickname'
document.getElementById('email').value = 'Your Email'
document.getElementById('url').value = 'Your Website'
var myDate = new Date()
var mytime = myDate.toLocaleTimeString()
document.getElementById('comment').value = 'Checked in today! Time: ' + mytime
submit.click()
void 0
```

Remember to modify the nickname, email, and website in the code.  

3. Open the webpage where you want to check in, click this bookmark, and you're done.  

Put on your thinking cap—you could use this code to post spam comments, but don't say I taught you. Also, don't even think about using this to check in on my site; I use Typecho with YouYan for comments. Figure it out yourself.
```
