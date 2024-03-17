---
title: Himawari Satellite's Earth Images
date: 1970-01-01 00:00:00
---

This page contains a Javascript snippet to dynamically load photos taken from
Japan's Himawari 8 satellite. The data comes from
[http://himawari8.nict.go.jp/](http://himawari8.nict.go.jp/) and is updated
every 10 minutes, with a 1-hour delay.

Detailed information and implementation can be found at
[/en/article/modify-website/php-javascript-satellite-earth-picture.lantian](/en/article/modify-website/php-javascript-satellite-earth-picture.lantian).

<p id="himawari-time">Loading, may take some time...</p>

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
    document.getElementById('himawari-pic').src = 'https://himawari8.nict.go.jp/img/D531106/1d/550/'+year+'/'+month+'/'+day+'/'+hour+minute+'00_0_0.png';
})();
</script>
