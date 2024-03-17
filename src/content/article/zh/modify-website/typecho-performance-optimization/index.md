---
title: 'Typecho 主题性能优化和缓存'
categories: 网站与服务端
tags: [Redis, Typecho]
date: 2019-03-02 22:24:00
---

为了实现 Lightbox、代码高亮等功能，我在我的博客主题中写了一些后处理代码，对
Typecho Markdown 输出后的 HTML 代码再进行一层处理。但是因为我的博客历史文章较
多，我在不同时期也用了不同的编辑器（WordPress 编辑器，百度 UEditor 等等），为了
尽可能保证历史文章也能正常显示，我的处理逻辑比较复杂。再加上我用的廉价 VPS 性能
本就不怎么样，相应的网页加载时间也较长。

我在 nginx 配置中添加了这样一行，以在 HTTP 头中输出网页在服务器端处理的用时：

```bash
add_header LT-Latency $request_time;
```

最初，这个值是 0.25 左右，代表着每个网页需要在服务器端处理 250ms 之久。于是，我
在大概一年前（[2018 年 3 月 11 日，《大幅优化了博客主题性能》][1]）大改了一轮后
处理逻辑，修改点大致如下：

-   原先，为了对应历史文章代码，我使用多条正则表达式一条条进行匹配、替换。我在修
    改时将有些正则表达式整合成一条，并且直接在数据库中改了一些文章的原始 HTML 代
    码，减少渲染时不必要的工作。
-   Typecho 的很多函数都是直接 echo，而非返回值。原先，为了获取它们的结果，我使
    用 `ob_start` 以及 `ob_get_flush` 函数来捕获对应函数的输出，但这样效率较低。
    研究 Typecho 代码之后发现，可以直接在主题中使用 `$this->content` 来获取渲染
    后的文章数据；类似的，大多数需要的参数都可以这样获取。

修改这两个主要的问题之后，LT-Latency 显示的延迟降到了 0.1。已经有了很明显的改
善，但是还是不够。于是，我决定上 Redis 缓存。

## 耗时都在哪里

PHP 的 Xdebug 扩展带有 Profiling 功能，可以详细输出每个函数的耗时。首先在自己的
环境下安装 Xdebug，通常可以用包管理器完成：

```bash
apk add php7-pecl-xdebug
apt-get install php-xdebug
```

或者，如果包管理中没有，可以自行到 [Xdebug 官网][2]下载源码编译：

```bash
tar xvf xdebug.tar.gz
cd xdebug
phpize
./configure --enable-xdebug
make -j4
make install
```

然后在 php.ini 中添加以下内容启用 Xdebug：

```ini
[xdebug]
zend_extension=/usr/local/Cellar/php/7.3.1/pecl/20180731/xdebug.so
xdebug.profiler_enable=0;
xdebug.profiler_enable_trigger=1;
xdebug.profiler_output_dir="/Users/lantian/Htdocs";
```

第一行是 Xdebug 的安装路径，2、3 行说明默认不启用 Xdebug，但是在“收到触发”（由特
定的 HTTP 请求头触发）后启用。第四行是 Profiling 结果的保存路径。

之后，Chrome 浏览器安装“Xdebug Helper”插件。在需要 Xdebug 时，在插件菜单选择
“Profile”并刷新页面，上面指定的路径就会出现一份文件名以 cachegrind 开头的报告。
报告可以用 Kcachegrind、Qcachegrind 等软件打开。

对于我的情况，主要耗时在侧边栏的小部件上（大约 40%！），Typecho 的 Markdown 渲染
（15%），以及自己的后处理函数上（10%），那就给它们加上 Redis 的缓存。

## 具体怎么做

Typecho 已经有了缓存插件，例如 TpCache 等。但是在我之前试用时，它们经常无法在文
章更新或者发表评论后自动刷新缓存。同时，它们缓存的只是 Typecho Markdown 这一层，
无法覆盖到我自己写的后处理函数。

我希望获得的效果是：将文章的 Markdown 原始代码 hash 作为 key，将文章在 Markdown
渲染及后处理后的结果作为 value，放入 Redis 进行缓存。但经过研究，在主题层面无法
直接获得文章的原始代码，而我又不想修改 Typecho 的核心，这可能会影响后续的升级。

直到我发现一个插件：[Typecho Parsedown][3]。它用 Parsedown 替代了 Typecho 内置的
名为 HyperDown 的 Markdown 解释器。更为重要的是，它的 Plugin.php 中有如下代码：

```php
public static function markdown($text)
{
    require_once dirname(__FILE__) . '/Parsedown.php';
    return Parsedown::instance()
        ->setBreaksEnabled(true)
        ->text($text);
}
```

在这里，它可以同时拿到文章的原始代码及 Markdown 渲染结果，将原始代码 hash 作为
key，渲染结果作 value，可以做一层缓存。再加上后处理函数可以将 Markdown 渲染结果
与后处理结果再同样缓存一次，这两层缓存可以在不大改架构的情况下取得较好的缓存效
果。还有一个优点，这样的缓存结果不用反复清空，文章内容不变时 hash 不变，缓存永久
有效；hash 变动后缓存自动失效。

对于同样耗时很多的侧边栏，我直接将 HTML 代码进行了缓存，并为 key/value 对设置了
10 分钟的失效时间（TTL）。

于是我就写了一对 Redis 的 get/set 函数：

```php
function lantian_cache_set($key, $value, $ttl = 0) {
    // Don't use cache if either Redis is not set, or Redis plugin isn't installed
    if(!defined('__LANTIAN_REDIS_HOST__') || !defined('__LANTIAN_REDIS_PORT__')) return false;
    if(!class_exists('Redis')) return false;
    try {
        $redis = new Redis();
        if(!$redis->pconnect(__LANTIAN_REDIS_HOST__, __LANTIAN_REDIS_PORT__)) return false;
        $key_prepend = 'lt-theme-v' . LANTIAN_THEME_REVISION . '-';
        if($ttl != 0) {
            return $redis->set($key_prepend . $key, $value, Array('ex' => $ttl));
        } else {
            return $redis->set($key_prepend . $key, $value);
        }
    } catch (Exception $e) {
        return false;
    }
}

function lantian_cache_get($key) {
    // Don't use cache if either Redis is not set, or Redis plugin isn't installed
    if(!defined('__LANTIAN_REDIS_HOST__') || !defined('__LANTIAN_REDIS_PORT__')) return false;
    if(!class_exists('Redis')) return false;
    try {
        $redis = new Redis();
        if(!$redis->pconnect(__LANTIAN_REDIS_HOST__, __LANTIAN_REDIS_PORT__)) return false;
        $key_prepend = 'lt-theme-v' . LANTIAN_THEME_REVISION . '-';
        return $redis->get($key_prepend . $key);
    } catch (Exception $e) {
        return false;
    }
}
```

然后，为了简化代码，我写了一个 Wrapper，可以将现有函数的输入输出进行缓存：

```php
function lantian_cache_wrap($key, $func, $args = NULL, $ttl = 0) {
    if($cache = lantian_cache_get($key)) return "<!-- LT Cache Hit Start -->" . $cache . "<!-- LT Cache Hit End -->";
    ob_start();
    $value = '';
    if($args != NULL) {
        $value = call_user_func_array($func, $args);
    } else {
        $value = call_user_func($func);
    }
    $value .= ob_get_flush();
    lantian_cache_set($key, $value, $ttl);
    return "<!-- LT Cache Miss Start -->" . $value . "<!-- LT Cache Miss End -->";
}
```

然后将它套到原先的函数上就行：

```php
// 原有函数带参数，缓存不过期
function lantian_content_processor($html) {
    return lantian_cache_wrap($key, function($html) {
        // Slow code
    }, array($html));
}
// 原有函数不带参数，缓存 600 秒
echo lantian_cache_wrap($key, function() {
    // Slow code
}, NULL, 600);
```

添加缓存之后，首页的 LT-Latency 稳定在了 0.04 左右（因为文章多），相比之前又减了
一半。内页的最低延迟甚至可以达到极低的 0.015，15ms。再加上 InstantClick 插件，完
全可以秒开。

（然而因为近期国内访问外网又双叒叕很不稳定，这段时间可能感受不到了）

[1]: /article/modify-website/optimize-blog-theme-performance.lantian
[2]: https://xdebug.org/
[3]: https://github.com/kokororin/typecho-plugin-Parsedown
