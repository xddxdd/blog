---
title: '给IE添加HTML5和CSS3支持'
categories: 网站与服务端
tags: [IE8, CSS, HTML]
date: 2013-10-03 17:08:23
---

自从我建立这个博客开始，我就从来没考虑过IE用户的感受。当时我的浏览器是
Firefox，IE对我的唯一用处是去下载Firefox。现在我自己在Win下用Chrome，Mac下也用
Chrome，手机上用Opera。本来我以为我可以对IE兼容说永别了。

但是，我没想到被杭二的电子阅览室打败了。

Firefox，安装包20M。Chrome，安装包30M。看起来都不大，对吧？但是杭二的电子阅览室
貌似为了网页浏览流畅，貌似用了QoS。QoS就QoS吧，那QoS还有Bug，那里单机平均速度
50K，我每次去电阅只能上半个小时网，下载浏览器花个十几分钟真的令人无语！

另外，那里用XP系统，IE8浏览器。所以，为了让自己的网站看着舒心一点，我就勉为其难
地给IE加上兼容吧。

1.HTML5兼容

我的网站广泛采用了HTML5技术，这个技术在新浏览器上可以告诉浏览器优先渲染文章主体
部分什么的，加快页面加载速度，但是在不支持HTML5的IE8上惨不忍睹，右边的最近评论宽
度变成100%真的大丈夫？

所以，首先解决HTML5带来的排版问题才是关键。解决方法，就是让IE认HTML5的标签。

HTML5Shiv主要解决HTML5提出的新的元素不被IE6-8识别，这些新元素不能作为父节点包裹
子元素，并且不能应用CSS样式。让CSS 样式应用在未知元素上只需执行
document.createElement(elementName) 即可实现。

因此，我们加上HTML5Shiv就可以兼容IE6-8了。

方法：

1.下载[HTML5Shiv 源代码](https://github.com/aFarkas/html5shiv/zipball/master)，
并上传到自己网站服务器。

2.在网页的head部分加入以下代码：

```html
<!--[if lt IE 9]><script src="html5shiv.js"></script><![endif]-->
```

3.刷新网页看效果。

2.CSS3兼容

CSS3在极大地美化了网页同时，却让网页在IE下惨不忍睹。所以第二个要解决的问题就是
CSS3。

CSS3Pie是一款针对IE6-9的插件，可以让IE支持最常用的几个CSS3代码：

border-radius box-shadow border-image multiple background images linear-gradient
as background image

因此我们就可以添加CSS3Pie，优化网页的显示效果。

1.下载[CSS3Pie 2.0](http://css3pie.com/download-latest-2.x)，把压缩包里所有文件
传到服务器上。

2.在CSS中找到有上述支持的CSS3代码的部分，比如我的CSS中只有#container有支持的CSS3
部分。

3.在代码块中加上以下代码：

```css
behavior: url(PIE.htc);
```

注意，其中PIE.htc的路径是相对网页而非CSS的。

4.清除缓存，刷新看效果。

在实际测试中，需要在网页完全加载完成后，CSS3效果才会出现，因此你的网页加载速度也
很重要。
