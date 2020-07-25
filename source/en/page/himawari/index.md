---
title: 'Himawari Satellite's Earth Images'
weight: 3
date: 1970-01-01 00:00:00
---

This page contains a Javascript snippet to dynamically load photos taken from Japan's Himawari 8 Satellite. The data comes from [http://himawari8.nict.go.jp/](http://himawari8.nict.go.jp/) and is updated every 10 minutes, with a 1-hour delay.

Detailed information and implementation can be found at [/en/article/modify-website/php-javascript-satellite-earth-picture.lantian](/en/article/modify-website/php-javascript-satellite-earth-picture.lantian).

The images are processed and converted to WebP on my server to speed up loading. [A Javascript library is used to convert images locally if the browser doesn't support WebP, like older Firefox or IE](/en/article/modify-website/ie-firefox-webp-support.lantian), and it's normal for the conversion to take a few seconds.

<p id="himawari-time">Loading, may take some time...</p>

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
    document.getElementById('himawari-time').innerHTML = 'Image taken at '+today.toLocaleString();
    document.getElementById('himawari-pic').src = '//himawari.lantian.pub/himawari8/img/D531106/1d/550/'+year+'/'+month+'/'+day+'/'+hour+minute+'00_0_0.webp';
})();
</script>
