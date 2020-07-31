---
title: '俯瞰地球（向日葵 8 号卫星图像）'
date: 1970-01-01 00:00:00
---

本页面使用 JavaScript 动态更新日本向日葵8号地球同步卫星拍摄的图片，数据来自[http://himawari8.nict.go.jp/](http://himawari8.nict.go.jp/)，10分钟一更新，有一小时延迟。

详细信息及实现方法请至[/article/modify-website/php-javascript-satellite-earth-picture.lantian](/article/modify-website/php-javascript-satellite-earth-picture.lantian)查看。

图片由我的服务器处理并转换成 WebP 格式，以提升加载速度。[对于某些不支持 WebP 的浏览器（例如旧版 Firefox 和 IE），使用 Javascript 实现本地转换](/article/modify-website/ie-firefox-webp-support.lantian)，页面加载卡顿属于正常现象。

<p id="himawari-time">加载速度稍慢，请稍候……</p>

<script>(function(){var WebP=new Image();WebP.onload=WebP.onerror=function(){if(WebP.height!=2){var sc=document.createElement('script');sc.type='text/javascript';sc.async=true;var s=document.getElementsByTagName('script')[0];sc.src='https://cdn.jsdelivr.net/npm/webpjs@0.0.2/webpjs.min.js';s.parentNode.insertBefore(sc,s);}};WebP.src='data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';})();</script>

<img id="himawari-pic" src="" />

<script>
(function(){
    var today = new Date();
    // get date for himawari picture
    t = today.getTime();
    t = t - t % 600000 - 3600000;
    today.setTime(t);
    year = today.getUTCFullYear();
    month = today.getUTCMonth() + 1;
    day = today.getUTCDate();
    hour = today.getUTCHours();
    minute = today.getUTCMinutes();
    if(month<10) month = '0' + month;
    if(day<10) day = '0' + day;
    if(hour<10) hour = '0' + hour;
    if(minute<10) minute = '0' + minute;
    document.getElementById('himawari-time').innerHTML = '图像拍摄时间：'+today.toLocaleString();
    document.getElementById('himawari-pic').src = '//himawari.lantian.pub/himawari8/img/D531106/1d/550/'+year+'/'+month+'/'+day+'/'+hour+minute+'00_0_0.webp';
})();
</script>
