---
title: '用新浪云和百度云搭建自己的CDN'
categories: 网站与服务端
tags: [CDN,SAE,BAE]
date: 2013-07-17 19:28:58
---
**警告：由于我疏忽，把SAE CDN的index.php代码打错了一行，请参照下面代码中的注释修改代码，否则将造成远程图片不能获取的问题。**

大多数人的博客都放在国外，原因我不说了。但是SAE和BAE的服务器放在国内，速度很快（SAE由于是电信通机房，抽风有点严重），因此我们可以利用它们为自己的博客加速。

1.SAE搭建CDN

这个方法要用到SaeLayerCDN，在SAE的应用商店里也有，可以一键安装，然后修改几个简单的设置就完成运行。不过让我百思不得其解的是，为什么一个能在一个php文件里完成的东西愣是要弄成5个，还要搞面向对象的编程？

我把里面的无用代码删除了一大堆，并且合并到了一个php里。

安装方法：SAE里创建应用，创建一个storage名为cache，代码管理里创建代码库，在编辑代码里创建以下文件：

1）config.yaml 内容：

```yaml
name: 你的appid
version: 你的版本号，一般是1
handle:
- compress:compress
- rewrite:goto "index.php?q=$1"
```

2）index.php 内容：

```php
<?php
define('STATIC_URL','你的网站url，含http和末尾斜杠');
define('DOMAIN','你的storage名字，默认是cache');
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
// 原先我把上面一行打错了，请改成下面一行
    $content = @file_get_contents(STATIC_URL.$request);
    $instance->write(DOMAIN,$request,$content);
}
header("Expires:".date("D, j M Y H:i:s GMT",time()+315360000));
header("Last-Modified:Sat,26 Jul 1997 05:00:00 GMT");
header('Content-type:'.$content_type);
header('Cache-control:public');
echo $content;
```

保存，然后把你原网站里所有的图片、视频等你希望走SAE的内容的URL从你的网站改成SAE给你的二级域名。

2.BAE搭建CDN

这个可就没有现成代码了，我就照着上面的那个改了一下。要命的是BAE官方的开发文档有问题，搞得我折腾半天。

BAE创建应用，类型为PC Iframe，然后打开BAE托管。

在云存储里创建一个bucket，名字自定。

在应用配置里增加一条url类型规则，规则为“/(.*)”（不含引号），执行index.php。

在代码管理里面创建一个文件，名为index.php，内容如下：

```php
<?php
define('STATIC_URL','你的网站URL，含http和末尾斜杠');
define('DOMAIN','你的BAE Bucket名字');
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

存盘即可。

我已经把这个部署完毕了，等会上传数据。
