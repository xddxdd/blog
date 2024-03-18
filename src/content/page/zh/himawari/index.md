---
title: '俯瞰地球（向日葵 8 号卫星图像）'
---

本页面使用 JavaScript 动态更新日本向日葵8号地球同步卫星拍摄的图片，数据来
自[http://himawari8.nict.go.jp/](http://himawari8.nict.go.jp/)，10分钟一更新，有
一小时延迟。

详细信息及实现方法请
至[/article/modify-website/php-javascript-satellite-earth-picture.lantian](/article/modify-website/php-javascript-satellite-earth-picture.lantian)查
看。

<p id="himawari-time">加载速度稍慢，请稍候……</p>

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
    document.getElementById('himawari-pic').src = 'https://himawari8.nict.go.jp/img/D531106/1d/550/'+year+'/'+month+'/'+day+'/'+hour+minute+'00_0_0.png';
})();
</script>
