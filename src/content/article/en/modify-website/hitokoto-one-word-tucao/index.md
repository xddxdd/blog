---
title: 'Hitokoto: One-Sentence Quotations'
categories: Website and Servers
tags: [Hitokoto, Quotations]
date: 2013-08-04 15:52:01
autoTranslated: true
---


![Hitokoto](/usr/uploads/2013/08/1999601044.png)

Hitokoto is a one-sentence quotation website.

The so-called "one-sentence quotation" is a way to record what you said, did, or thought in a single sentence and share it with others. Hitokoto provides a platform for everyone to share these quotations.

But obviously, the purpose of this article isn't about that. I'll focus on its API – how to display these quotations on your own website.

1. PHP Server-Side Fetch

Note: I don't recommend this method as it slows down page loading, especially if your server isn't in North America or Canada (Hitokoto's main server is in Canada). If your website happens to suffer a CC attack... when your upload/download bandwidth is saturated, you'll have no choice but to accept the consequences.

```php
<?php $hitokoto = json_decode(file_get_contents('https://api.hitokoto.us/rand?'.rand(0,10000)),true);
echo $hitokoto['author'].'&#22312;'.$hitokoto['date'].'&#23545;'.$hitokoto['source'].'&#21520;&#27133;&#26352;&#65306;'.$hitokoto['hitokoto']; ?>
```

2. Javascript Client-Side Fetch

I prefer this method. It lets the client fetch data directly, saving both time and server resources.

```html
<script
  type="text/javascript"
  src="https://api.hitokoto.us/rand?encode=js&amp;charset=utf-8"
></script>
<script>
  hitokoto()
</script>
```

Demo:

<script type="text/javascript" src="https://api.hitokoto.us/rand?encode=js&charset=utf-8"></script>

<script>hitokoto();</script>
```
