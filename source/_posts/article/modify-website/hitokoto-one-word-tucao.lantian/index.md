---
title: 'Hitokoto 一句话吐槽'
categories: 网站与服务端
tags: [Hitokoto,吐槽]
date: 2013-08-04 15:52:01
---
![Hitokoto](../../../../usr/uploads/2013/08/1999601044.png)

Hitokoto是一个一句话吐槽网站。

所谓一句话吐槽，就是用一句话的方式，记录自己的所说、所做、所想，并与别人分享。Hitokoto就提供了一个让大家分享吐槽的网站。

但是很明显，这篇文章的目的不是讲这个。我讲的是他的API，也就是在自己网站上显示这些吐槽。

1.PHP服务器端拉取

提示：这种方法我不建议，因为拖慢页面加载速度，如果你服务器不在北美或加拿大（Hitokoto主站在加拿大）更是这样。如果你的网站刚好遭到CC……在你的上传下载都被占满的时候，你就节哀顺变吧。

```php
<?php $hitokoto = json_decode(file_get_contents('https://api.hitokoto.us/rand?'.rand(0,10000)),true);
echo $hitokoto['author'].'&#22312;'.$hitokoto['date'].'&#23545;'.$hitokoto['source'].'&#21520;&#27133;&#26352;&#65306;'.$hitokoto['hitokoto']; ?>
```

2.Javascript客户端拉取

这种方法我喜欢，让客户端自己去读取数据，既省时间，又省服务器资源。

```html
<script type="text/javascript" src="https://api.hitokoto.us/rand?encode=js&amp;charset=utf-8"></script>
<script>hitokoto()</script>
```

演示：

<script type="text/javascript" src="https://api.hitokoto.us/rand?encode=js&charset=utf-8"></script>

<script>hitokoto();</script>
