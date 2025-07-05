---
title: 'Combining Google China Satellite Imagery and Amap in Leaflet'
categories: Website and Servers
tags: [Amap, Leaflet, Google]
date: 2016-07-21 10:22:00
autoTranslated: true
---


A few days ago, I used the Leaflet JavaScript module for a project that required maps. However, when searching for map data sources, I found that Amap's satellite imagery cannot be zoomed to high precision outside mainland China, showing no satellite imagery for that area; while Google China's satellite imagery lacks street information.

After some research, I discovered that Amap's satellite imagery consists of two layers: the satellite layer and the street layer. Moreover, both Amap and Google China maps use China's "Mars Coordinate System" encryption, meaning their maps can be directly overlaid without misalignment. By combining Amap's street layer with Google China's satellite layer, we obtain an electronic map that supports high-precision zooming while displaying street information.

Demo:

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
            'Google-Amap Hybrid/Satellite':L.layerGroup([
                    L.tileLayer('//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    minZoom: 3,
                    attribution: "Satellite imagery by Google, Street map by Amap"
                }),
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "Satellite imagery by Google, Street map by Amap",
                    subdomains: "1234",
                    opacity:0.5
                })
            ]).addTo(map),
            'Amap/Satellite':L.layerGroup([
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "Amap AutoNavi.com",
                    subdomains: "1234"
                }),
                L.tileLayer('//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    minZoom: 3,
                    attribution: "Amap AutoNavi.com",
                    subdomains: "1234",
                    opacity:0.5
                })
            ]),
            'Amap/Street':L.tileLayer('//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                maxNativeZoom: 18,
                minZoom: 3,
                attribution: "Amap AutoNavi.com",
                subdomains: "1234"
            }),
            'Google/Satellite':L.tileLayer('//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                minZoom: 3,
                attribution: "Google Google.cn"
            }),
            'Google/Street':L.tileLayer('//www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                minZoom: 3,
                attribution: "Google Google.cn"
            }),
            'GeoQ/Street':L.tileLayer('//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 20,
                maxNativeZoom: 16,
                minZoom: 3,
                attribution: "GeoQ GeoQ.cn"
            })
        }
        var layerControl = L.control.layers(mapLayers, {}, {
            position: 'topright',
            collapsed: true
        }).addTo(map);
        L.control.zoom({
            zoomInTitle: 'Zoom in',
            zoomOutTitle: 'Zoom out'
        }).addTo(map);
</script>

You can view the source code by right-clicking, or copy it below. The map data source URLs are from [htoooth/Leaflet.ChineseTmsProviders](https://github.com/htoooth/Leaflet.ChineseTmsProviders).

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Leaflet Example</title>
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
    />
    <link
      href="//cdn.bootcss.com/leaflet/1.0.0-rc.1/leaflet.css"
      rel="stylesheet"
    />
    <script src="//cdn.bootcss.com/jquery/3.1.0/jquery.min.js"></script>
    <script src="//cdn.bootcss.com/leaflet/1.0.0-rc.1/leaflet.js"></script>
    <style type="text/css">
      body {
        padding: 0;
        margin: 0;
      }
      html,
      body,
      #map {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', {
        center: [39.904983, 116.427287],
        zoom: 3,
        zoomControl: false,
      }).setMaxBounds([
        [-90, 0],
        [90, 360],
      ])
      var mapLayers = {
        'Google-Amap Hybrid/Satellite': L.layerGroup([
          L.tileLayer(
            '//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
            {
              maxZoom: 20,
              minZoom: 3,
              attribution: 'Satellite imagery by Google, Street map by Amap',
            }
          ),
          L.tileLayer(
            '//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
            {
              maxZoom: 20,
              maxNativeZoom: 18,
              minZoom: 3,
              attribution: 'Satellite imagery by Google, Street map by Amap',
              subdomains: '1234',
              opacity: 0.5,
            }
          ),
        ]).addTo(map),
        'Amap/Satellite': L.layerGroup([
          L.tileLayer(
            '//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
            {
              maxZoom: 20,
              maxNativeZoom: 18,
              minZoom: 3,
              attribution: 'Amap AutoNavi.com',
              subdomains: '1234',
            }
          ),
          L.tileLayer(
            '//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
            {
              maxZoom: 20,
              maxNativeZoom: 18,
              minZoom: 3,
              attribution: 'Amap AutoNavi.com',
              subdomains: '1234',
              opacity: 0.5,
            }
          ),
        ]),
        'Amap/Street': L.tileLayer(
          '//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          {
            maxZoom: 20,
            maxNativeZoom: 18,
            minZoom: 3,
            attribution: 'Amap AutoNavi.com',
            subdomains: '1234',
          }
        ),
        'Google/Satellite': L.tileLayer(
          '//www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
          {
            maxZoom: 20,
            minZoom: 3,
            attribution: 'Google Google.cn',
          }
        ),
        'Google/Street': L.tileLayer(
          '//www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}',
          {
            maxZoom: 20,
            minZoom: 3,
            attribution: 'Google Google.cn',
          }
        ),
        'GeoQ/Street': L.tileLayer(
          '//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 20,
            maxNativeZoom: 16,
            minZoom: 3,
            attribution: 'GeoQ GeoQ.cn',
          }
        ),
      }
      var layerControl = L.control
        .layers(
          mapLayers,
          {},
          {
            position: 'topright',
            collapsed: true,
          }
        )
        .addTo(map)
      L.control
        .zoom({
          zoomInTitle: 'Zoom in',
          zoomOutTitle: 'Zoom out',
        })
        .addTo(map)
    </script>
  </body>
</html>
```
```
