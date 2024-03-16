---
title: 'Font Awesome 图标字体使用'
categories: 网站与服务端
tags: [fontawesome]
date: 2014-08-18 18:15:00
---
 
Font Awesome 是一个图标库开源项目，它目前最新的4.1版本提供了439个矢量图标，可以匹配各种大小和各种分辨率的屏幕，而它是作为一个字体存在，71KB的一个文件就包括了这些图标。这些图标风格统一，可以很方便地用在各种地方。
 
1.安装
 
首先下载Font Awesome：[https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.1.0.zip](https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.1.0.zip)
 
然后解压，把里面的文件上传到你的网站。
 
然后在网页的head标签部分加入以下代码：

```html
<link rel="stylesheet" href="http://你的网站/文件夹/font-awesome/css/font-awesome.min.css">
```
 
这样就安装完成了。
 
2.使用
 
[https://fortawesome.github.io/Font-Awesome/icons/](https://fortawesome.github.io/Font-Awesome/icons/) 这里有一张表，对应着图标的class名称，找到你要的图标，比如fa-cloud，然后在你的网页代码里插入：

```html
<i class="fa fa-cloud"></i>
```
 
效果：<em class="fa fa-cloud"></em>
 
如果你需要放大图标，那么就增加一个类fa-lg，或fa-2x，fa-3x，fa-4x，fa-5x。

```html
<i class="fa fa-cloud fa-lg"></i>
<i class="fa fa-cloud fa-2x"></i>
<i class="fa fa-cloud fa-3x"></i>
<i class="fa fa-cloud fa-4x"></i>
<i class="fa fa-cloud fa-5x"></i>
```
 
效果：<em class="fa fa-cloud fa-lg"></em><em class="fa fa-cloud fa-2x"></em><em class="fa fa-cloud fa-3x"></em><em class="fa fa-cloud fa-4x"></em><em class="fa fa-cloud fa-5x"></em>
 
同时还有一些图标是可以转的。

```html
<i class="fa fa-spinner fa-spin"></i>
<i class="fa fa-circle-o-notch fa-spin"></i>
<i class="fa fa-refresh fa-spin"></i>
<i class="fa fa-cog fa-spin"></i>
```
 
效果：<em class="fa fa-spinner fa-spin"></em><em class="fa fa-circle-o-notch fa-spin"></em><em class="fa fa-refresh fa-spin"></em><em class="fa fa-cog fa-spin"></em>
 
用这些图标，可以更加直观地表现网站上的各个功能，同时不拖慢网站加载速度。
