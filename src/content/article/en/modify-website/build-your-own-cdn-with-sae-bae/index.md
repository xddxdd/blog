---
title: 'Building Your Own CDN with Sina App Engine and Baidu App Engine'
categories: Website and Servers
tags: [CDN, SAE, BAE]
date: 2013-07-17 19:28:58
autoTranslated: true
---


**Warning: Due to my oversight, there was a mistake in a line of the SAE CDN index.php code. Please refer to the comment in the code below to correct it, otherwise it will cause issues with fetching remote images.**

Most people host their blogs abroad for reasons I won't elaborate on. However, SAE and BAE servers are located in China and offer fast speeds (though SAE, being in the China Telecom Access Network, experiences occasional instability). Therefore, we can use them to accelerate our blogs.

1. Building CDN with SAE

This method uses SaeLayerCDN, available in SAE's App Store for one-click installation. After installation, just modify a few simple settings. What puzzles me is why something achievable in a single PHP file was split into five files with object-oriented programming!

I've removed large portions of redundant code and consolidated it into one PHP file.

Installation method: Create an application on SAE, create a storage named "cache", create a code repository in code management, and create the following files in code editing:

1) config.yaml content:

```yaml
name: your_appid
version: your_version (usually 1)
handle:
  - compress:compress
  - rewrite:goto "index.php?q=$1"
```

2) index.php content:

```php
<?php
define('STATIC_URL','your_website_url_including_http_and_trailing_slash');
define('DOMAIN','your_storage_name_default_is_cache');
$content_type = 'application/force-download';
$request = ltrim($_GET['q'],'/');
$temp = array();
if(preg_match('/\.(jpg|jpeg|png|gif|css|js)$/i', $request,$temp)===1){
    switch($temp[1]){
        case 'jpg':{$content_type="image/jpeg";}break;
        case 'jpeg':{$content_type="image/jpeg";}break;
        case 'png':{$content_type="image/png";}break;
        case 'gif':{$content_type="image/gif";}break;
        case 'css':{$content_type="text/css";}break;
        case 'js':{$content_type="text/javascript";}break;
    }
}
$instance = new SaeStorage(SAE_ACCESSKEY,SAE_SECRETKEY);
if($instance->fileExists(DOMAIN,$request)){
    $content = $instance->read(DOMAIN,$request);
}else{
//    $content = @file_get_contents(BASE_URL.$request);
// I previously mistyped the above line, please change to the line below
    $content = @file_get_contents(STATIC_URL.$request);
    $instance->write(DOMAIN,$request,$content);
}
header("Expires:".date("D, j M Y H:i:s GMT",time()+315360000));
header("Last-Modified:Sat,26 Jul 1997 05:00:00 GMT");
header('Content-type:'.$content_type);
header('Cache-control:public');
echo $content;
```

Save, then change all URLs for images, videos, and other content you want to serve via SAE from your original site to the secondary domain provided by SAE.

2. Building CDN with BAE

There's no ready-made code for this, so I adapted the SAE version. Unfortunately, BAE's official documentation has issues, which caused me significant troubleshooting.

Create a BAE application of type "PC Iframe", then enable BAE hosting.

Create a bucket in cloud storage with a name of your choice.

Add a URL routing rule in app configuration: "/(.*)" (without quotes), executing index.php.

Create a file named index.php in code management with the following content:

```php
<?php
define('STATIC_URL','your_website_URL_including_http_and_trailing_slash');
define('DOMAIN','your_BAE_Bucket_name');
$content_type = 'application/force-download';
$request = ltrim($_SERVER['REQUEST_URI'],'/');
$temp = array();
if(preg_match('/\.(jpg|jpeg|png|gif|css|js)$/i', $request,$temp)===1){
    switch($temp[1]){
        case 'jpg':{$content_type="image/jpeg";}break;
        case 'jpeg':{$content_type="image/jpeg";}break;
        case 'png':{$content_type="image/png";}break;
        case 'gif':{$content_type="image/gif";}break;
        case 'css':{$content_type="text/css";}break;
        case 'js':{$content_type="text/javascript";}break;
    }
}
$instance = new BaiduBCS();
if($instance->is_object_exist(DOMAIN,'/'.$request)){
  $content = $instance->get_object(DOMAIN,'/'.$request)->body;
}else{
  $content = @file_get_contents(STATIC_URL.'/'.$request);
  $instance->create_object_by_content(DOMAIN,'/'.$request,$content);
}
header("Expires:".date("D, j M Y H:i:s GMT",time()+315360000));
header("Last-Modified:Sat,26 Jul 1997 05:00:00 GMT");
header('Content-type:'.$content_type);
header('Cache-control:public');
echo $content;
```

Save. I've already deployed this setup and will upload the data shortly.
```
