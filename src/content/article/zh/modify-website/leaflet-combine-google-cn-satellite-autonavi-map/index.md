---
title: '在 Leaflet 中合并使用谷歌中国卫星图和高德地图'
categories: 网站与服务端
tags: [高德地图,Leaflet,Google]
date: 2016-07-21 10:22:00
---
前几天用 Leaflet 这个 Javascript 模块制作了一个需要用到地图的项目，但是在寻找地图数据源时发现，高德的卫星图在中国大陆以外地区无法放大到较高精度，显示该区域无卫星图；而谷歌中国的卫星图上没有街道信息。

经过一些研究，我发现高德的卫星图分为两个图层：卫星图层和街道图层。而且，高德和谷歌中国的地图都使用了天朝的火星坐标系加密，也就是两者的地图可以直接叠加而不会错位。将高德的街道层和谷歌中国的卫星层合并，就有了一张既能高精度放大、又有街道信息的电子地图。

演示：

<div id="map" style="height:300px"></div>

<link href="//cdn.bootcss.com/leaflet/1.0.0-rc.1/leaflet.css" rel="stylesheet">
<script src="//cdn.bootcss.com/leaflet/1.0.0-rc.1/leaflet.js"></script>
<script>
        var map = L.map("map", {
            center: [39.904983,116.427287],
            zoom: 3,
            zoomControl: false
        }).setMaxBounds([[-90,0],[90,360]]);
        var mapLayers = {
            '谷歌高德杂交/卫星':L.layerGroup([
                    L.tileLayer('//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    minZoom: 3,
                    attribution: "谷歌提供卫星图，高德提供街道图"
                }),
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "谷歌提供卫星图，高德提供街道图",
                    subdomains: "1234",
                    opacity:0.5
                })
            ]).addTo(map),
            '高德/卫星':L.layerGroup([
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "高德地图 AutoNavi.com",
                    subdomains: "1234"
                }),
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "高德地图 AutoNavi.com",
                    subdomains: "1234",
                    opacity:0.5
                })
            ]),
            '高德/街道':L.tileLayer('//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                maxNativeZoom: 18,
                minZoom: 3,
                attribution: "高德地图 AutoNavi.com",
                subdomains: "1234"
            }),
            '谷歌/卫星':L.tileLayer('//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                minZoom: 3,
                attribution: "谷歌 Google.cn"
            }),
            '谷歌/街道':L.tileLayer('//www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                minZoom: 3,
                attribution: "谷歌 Google.cn"
            }),
            '智图/街道':L.tileLayer('//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 20,
                maxNativeZoom: 16,
                minZoom: 3,
                attribution: "智图 GeoQ.cn"
            })
        }
        var layerControl = L.control.layers(mapLayers, {}, {
            position: 'topright',
            collapsed: true
        }).addTo(map);
        L.control.zoom({
            zoomInTitle: '放大',
            zoomOutTitle: '缩小'
        }).addTo(map);
</script>

源代码可右键查看，也可以在下面复制，其中地图数据源的 URL 来自 [htoooth/Leaflet.ChineseTmsProviders](https://github.com/htoooth/Leaflet.ChineseTmsProviders) 。

```html
<!DOCTYPE HTML>
<html>
<head>
    <meta charset="UTF-8">
    <title>Leaflet Example</title>
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <link href="//cdn.bootcss.com/leaflet/1.0.0-rc.1/leaflet.css" rel="stylesheet">
    <script src="//cdn.bootcss.com/jquery/3.1.0/jquery.min.js"></script>
    <script src="//cdn.bootcss.com/leaflet/1.0.0-rc.1/leaflet.js"></script>
    <style type="text/css">
        body {
            padding: 0;
            margin: 0;
        }
        html, body, #map {
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map("map", {
            center: [39.904983,116.427287],
            zoom: 3,
            zoomControl: false
        }).setMaxBounds([[-90,0],[90,360]]);
        var mapLayers = {
            '谷歌高德杂交/卫星':L.layerGroup([
                    L.tileLayer('//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    minZoom: 3,
                    attribution: "谷歌提供卫星图，高德提供街道图"
                }),
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "谷歌提供卫星图，高德提供街道图",
                    subdomains: "1234",
                    opacity:0.5
                })
            ]).addTo(map),
            '高德/卫星':L.layerGroup([
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "高德地图 AutoNavi.com",
                    subdomains: "1234"
                }),
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "高德地图 AutoNavi.com",
                    subdomains: "1234",
                    opacity:0.5
                })
            ]),
            '高德/街道':L.tileLayer('//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                maxNativeZoom: 18,
                minZoom: 3,
                attribution: "高德地图 AutoNavi.com",
                subdomains: "1234"
            }),
            '谷歌/卫星':L.tileLayer('//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                minZoom: 3,
                attribution: "谷歌 Google.cn"
            }),
            '谷歌/街道':L.tileLayer('//www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                minZoom: 3,
                attribution: "谷歌 Google.cn"
            }),
            '智图/街道':L.tileLayer('//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 20,
                maxNativeZoom: 16,
                minZoom: 3,
                attribution: "智图 GeoQ.cn"
            })
        }
        var layerControl = L.control.layers(mapLayers, {}, {
            position: 'topright',
            collapsed: true
        }).addTo(map);
        L.control.zoom({
            zoomInTitle: '放大',
            zoomOutTitle: '缩小'
        }).addTo(map);
    </script>
</body>
</html>
```
