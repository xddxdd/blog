---
title: '用 PHP 和 JavaScript 显示地球卫星照片'
categories: 网站与服务端
tags: [向日葵8号]
date: 2016-06-14 22:40:00
image: /usr/uploads/2016/06/1359531479.png
---

> 向日葵8号气象卫星是日本宇宙航空研究开发机构设计制造的向日葵系列卫星之一，重约
> 3500公斤，设计寿命15年以上。该卫星于2014年10月7日由H2A火箭搭载发射成功，主要用
> 于监测暴雨云团、台风动向以及持续喷发活动的火山等防灾领域。——百度百科

日本发射这颗卫星后，不仅用它防灾，还将它拍摄的地球照片发布在互联网上，供爱好者下
载。照片发布的官方网站
是[http://himawari8.nict.go.jp/](http://himawari8.nict.go.jp/)，每到整10分钟更新
（比如9:30，9:40……），同时有30分钟延迟（你10:00看到的照片实际上是9:30拍的）。

接下来，我们就要研究一下如何获取这些卫星照片了。通过浏览器的访问监测功能，我们可
以看到请求的地址：（点击看大图）

![/usr/uploads/2016/06/1359531479.png](/usr/uploads/2016/06/1359531479.png)

在本例中，请求地址
是`http://himawari8-dl.nict.go.jp/himawari8/img/D531106/2d/550/2016/06/14/140000_0_1.png`。
地址中有以下几个重要的参数：

- 2d
  - 代表图像清晰度，2d就是将图像分成2x2的550px x 550px的图片，也就是总分辨率
    1100px x 1100px。顺带一提该网站最高提供20d的清晰度，也就是11000px x 11000px
    的分辨率。当然，除非你的网络极好，否则不要轻易尝试。
- 2016/06/14
  - 很好理解，就是日期。
- 140000
  - 是图片对应的UTC时间，注意是UTC！本例中的地址说明我下载的是北京时间晚上22点拍
    摄、22:30发布的图像。
- 0_1
  - 是图片对应的坐标，两个参数分别是从0开始计数的列数和行数。本例中，请求的是第
    一列第二行的图片。

明白了这些参数是做什么的，我们就可以开始写代码了。下面的 PHP 代码以表格形式输出
2d的共4张图片：

```php
<?php
function getHimawariUrl($d = 1,$x = 0, $y = 0){
    date_default_timezone_set('UTC');
    $pictime = time() - time() % 600 - 1800;
    $date = date('Y/m/d/Hi',$pictime);
    return "http://himawari8-dl.nict.go.jp/himawari8/img/D531106/".$d."d/550/".$date."00_".$x."_".$y.".png";
}
function writeHimawariTable($d=1){
    echo '<table style="margin:0;padding:0;cell-spacing:0">';
    for($i=0;$i<$d;$i++){
        echo '<tr>';
            for ($j=0;$j<$d;$j++){
                echo '<td><img src="'.getHimawariUrl($d,$j,$i).'" /></td>';
            }
        echo '</tr>';
    }
    echo '</table>';
}

writeHimawariTable(2);
?>
```

下面的 JavaScript（需要 jQuery 支持）输出1d的一张图片，预览可以
在[这个页面](/page/himawari/)看到：

```html
<script>
  $(document).ready(function () {
    var today = new Date()
    // get date for himawari picture
    t = today.getTime()
    t = t - (t % 600000) - 1800000
    today.setTime(t)
    year = today.getUTCFullYear()
    month = today.getUTCMonth() + 1
    day = today.getUTCDate()
    hour = today.getUTCHours()
    minute = today.getUTCMinutes()
    if (month < 10) month = '0' + month
    if (day < 10) day = '0' + day
    if (hour < 10) hour = '0' + hour
    if (minute < 10) minute = '0' + minute
    $('#himawari-time').text(today.toLocaleString())
    $('#himawari-pic').attr(
      'src',
      '//himawari.xuyh0120.win/1d/550/' +
        year +
        '/' +
        month +
        '/' +
        day +
        '/' +
        hour +
        minute +
        '00_0_0.webp'
    )
  })
</script>
<p id="himawari-time">加载速度稍慢，请稍候……</p>
<img id="himawari-pic" src="" />
```

大家在使用该项目图片时也要注意，这个照片发布项目是非盈利的，因此也不提供任何保
障，哪天 API 更换，或者是使用这些卫星照片的人太多导致网站流量超标，造成网站无法
访问，都是有可能的。另外几个基于该卫星照片的软件项目
[EarthLiveSharp](https://github.com/bitdust/EarthLiveSharp)、[馒头地球](http://www.coolapk.com/apk/ooo.oxo.apps.earth)都
是作者自己架设了 CDN 以缓解对源站的压力。

因此，我自己建了CDN，缓存图像并把它们转换成 WebP 格式。要让 WebP 在 IE 和
Firefox 上得到支持，可以
看[让 IE 与 Firefox 支持 WebP 图像格式](/article/modify-website/ie-firefox-webp-support.lantian)这
篇文章。

网站的数据源网址 `himawari8-dl.nict.go.jp` 是可以直接 CNAME 到你自己的域名上，并
加上 CDN 的。因此，也希望大家在使用时注意请求频率，也尽量架设自己的 CDN。
