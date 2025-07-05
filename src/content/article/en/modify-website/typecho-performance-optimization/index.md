---
title: 'Typecho Theme Performance Optimization and Caching'
categories: Website and Servers
tags: [Redis, Typecho]
date: 2019-03-02 22:24:00
autoTranslated: true
---


To implement features like Lightbox and code highlighting, I added post-processing code to my blog theme that performs an additional layer of processing on the HTML output after Typecho's Markdown conversion. However, due to the large number of historical articles on my blog and my use of different editors over time (WordPress editor, Baidu UEditor, etc.), my processing logic became quite complex to ensure compatibility with older articles. Combined with the limited performance of my budget VPS, this resulted in longer webpage loading times.

I added the following line to my nginx configuration to output server-side processing time in HTTP headers:

```bash
add_header LT-Latency $request_time;
```

Initially, this value was around 0.25, meaning each page took about 250ms to process on the server. About a year ago ([March 11, 2018, "Significantly Optimized Blog Theme Performance"][1]), I overhauled the post-processing logic with these key changes:

- Originally, I used multiple regular expressions to match and replace content line by line for historical article compatibility. I consolidated some regex patterns and directly modified the original HTML of articles in the database to reduce unnecessary rendering work.
- Many Typecho functions directly echo output instead of returning values. I previously used `ob_start` and `ob_get_flush` to capture output, which was inefficient. After studying Typecho's code, I discovered I could directly access rendered content via `$this->content` in themes, and most required parameters could be obtained similarly.

After these optimizations, LT-Latency dropped to 0.1 – a significant improvement, but still insufficient. I then decided to implement Redis caching.

## Where is the Time Spent?

PHP's Xdebug extension provides profiling functionality to detail function execution times. First, install Xdebug via your package manager:

```bash
apk add php7-pecl-xdebug
apt-get install php-xdebug
```

If unavailable in packages, compile from source ([Xdebug website][2]):

```bash
tar xvf xdebug.tar.gz
cd xdebug
phpize
./configure --enable-xdebug
make -j4
make install
```

Then enable Xdebug in php.ini with:

```ini
[xdebug]
zend_extension=/usr/local/Cellar/php/7.3.1/pecl/20180731/xdebug.so
xdebug.profiler_enable=0;
xdebug.profiler_enable_trigger=1;
xdebug.profiler_output_dir="/Users/lantian/Htdocs";
```

The first line specifies Xdebug's installation path. Lines 2-3 disable profiling by default but enable it via trigger (activated by specific HTTP headers). Line 4 sets the profiling output directory.

Next, install the "Xdebug Helper" extension in Chrome. Select "Profile" in the extension menu and refresh the page to generate a `cachegrind` report in the specified directory. Open these reports with Kcachegrind or Qcachegrind.

In my case, significant time was spent on sidebar widgets (~40%), Typecho's Markdown rendering (15%), and my post-processing functions (10%). I added Redis caching to these components.

## Implementation Details

While Typecho has caching plugins like TpCache, they often failed to auto-refresh caches after article updates or new comments. They also only cached the Markdown rendering layer, not covering my post-processing functions.

I wanted to cache using the article's original Markdown hash as the key and the fully processed HTML as the value. However, themes can't directly access raw Markdown content without core modifications that might break future updates.

The solution came from the [Typecho Parsedown][3] plugin, which replaces Typecho's built-in HyperDown parser with Parsedown. Crucially, its Plugin.php contains:

```php
public static function markdown($text)
{
    require_once dirname(__FILE__) . '/Parsedown.php';
    return Parsedown::instance()
        ->setBreaksEnabled(true)
        ->text($text);
}
```

This allowed caching with the raw Markdown hash as key and rendered output as value. My post-processing layer could then cache its results similarly. This approach requires no cache invalidation – unchanged content keeps the same hash, while changed content automatically gets new cache entries.

For the heavy-load sidebar, I cached the HTML directly with a 10-minute TTL.

I implemented these Redis get/set functions:

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

To simplify integration, I created a wrapper for caching function I/O:

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

Applied to existing functions:

```php
// Parameterized function, no expiration
function lantian_content_processor($html) {
    return lantian_cache_wrap($key, function($html) {
        // Slow code
    }, array($html));
}
// Parameterless function, 600s cache
echo lantian_cache_wrap($key, function() {
    // Slow code
}, NULL, 600);
```

After caching, homepage LT-Latency stabilized at ~0.04 (due to many articles) – another 50% reduction. Inner page latency can drop to 0.015 (15ms). Combined with InstantClick, pages load nearly instantly.

(Though recent network instability in China might currently mask these improvements)

[1]: /en/article/modify-website/optimize-blog-theme-performance.lantian
[2]: https://xdebug.org/
[3]: https://github.com/kokororin/typecho-plugin-Parsedown
```
