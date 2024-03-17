---
title: 'W3 Total Cache 末尾注释去除'
categories: 网站与服务端
tags: [网站, 折腾, WordPress, W3 Total Cache]
date: 2013-02-13 21:07:00
---

W3 Total Cache 开了资源最小化的效果是非常好的，连HTML都给我最小化了，不信看看我
的网页源代码，连换行符都被删掉了，最小化效果超级给力。但是末尾的地方，却有个W3
Total Cache加的注释。

```bash
<!-- Performance optimized by W3 Total Cache. Learn more: http://www.w3-edge.com/wordpress-plugins/

Minified using disk: basic
Content Delivery Network via lantian.pub

Served from: lantian.pub @ 2013-02-13 20:56:59 by W3 Total Cache -->
```

对于我这种追求速度的人，这段东西不光让网页无端变大，最重要的是我想到有这个东西就
烦。于是，我决定对W3 Total Cache开刀，把产生注释的这一段代码删掉。

先到Google上查了一下，有人说在w3-total-cache/lib/W3/Plugin/TotalCache.php这个文
件的2000多行的位置。结果我打开文件一看，整个文件才800行，哪来的2000行？继续搜，
无果。只能我自己看看吧。于是我开始翻这个php文件，直到我翻到这一段代码：

```php
/**
 * Add footer comment
 */
$date = date_i18n('Y-m-d H:i:s');
$host = (!empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost');

if ($this->_config->get_string('common.support') != '' || $this->_config->get_boolean('common.tweeted')) {
    $buffer .= sprintf("\r\n<!-- Served from: %s @ %s by W3 Total Cache -->", w3_escape_comment($host), $date);
} else {
    $strings = array();

    if ($this->_config->get_boolean('minify.enabled') && !$this->_config->get_boolean('minify.debug')) {
        $w3_plugin_minify = w3_instance('W3_Plugin_Minify');

        $strings[] = sprintf("Minified using %s%s", w3_get_engine_name($this->_config->get_string('minify.engine')), ($w3_plugin_minify->minify_reject_reason != '' ? sprintf(' (%s)', $w3_plugin_minify->minify_reject_reason) : ''));
    }

    if ($this->_config->get_boolean('pgcache.enabled') && !$this->_config->get_boolean('pgcache.debug')) {
        $w3_pgcache = w3_instance('W3_PgCache');

        $strings[] = sprintf("Page Caching using %s%s", w3_get_engine_name($this->_config->get_string('pgcache.engine')), ($w3_pgcache->cache_reject_reason != '' ? sprintf(' (%s)', $w3_pgcache->cache_reject_reason) : ''));
    }

    if ($this->_config->get_boolean('dbcache.enabled') &&
            !$this->_config->get_boolean('dbcache.debug')) {
        $db = w3_instance('W3_DbCache');
        $append = (!is_null($db->cache_reject_reason) ?
            sprintf(' (%s)', $db->cache_reject_reason) :
            '');

        if ($db->query_hits) {
            $strings[] = sprintf("Database Caching %d/%d queries in %.3f seconds using %s%s",
$db->query_hits, $db->query_total, $db->time_total,
w3_get_engine_name($this->_config->get_string('dbcache.engine')),
$append);
        } else {
            $strings[] = sprintf("Database Caching using %s%s",
w3_get_engine_name($this->_config->get_string('dbcache.engine')),
$append);
        }
    }

    if (w3_is_dbcluster()) {
        $db_cluster = w3_instance('W3_Enterprise_DbCluster');
        $strings[] = $db_cluster->status_message();
    }

    if ($this->_config->get_boolean('objectcache.enabled') && !$this->_config->get_boolean('objectcache.debug')) {
        $w3_objectcache = w3_instance('W3_ObjectCache');

        $append = ($w3_objectcache->cache_reject_reason != '' ?
            sprintf(' (%s)', $w3_objectcache->cache_reject_reason) :
            '');

        $strings[] = sprintf("Object Caching %d/%d objects using %s%s",
            $w3_objectcache->cache_hits, $w3_objectcache->cache_total,
            w3_get_engine_name($this->_config->get_string('objectcache.engine')),
            $append);
    }

    if ($this->_config->get_boolean('fragmentcache.enabled') && !$this->_config->get_boolean('fragmentcache.debug')) {
        $w3_fragmentcache = w3_instance('W3_Pro_FragmentCache');
        $append = ($w3_fragmentcache->cache_reject_reason != '' ?
            sprintf(' (%s)', $w3_fragmentcache->cache_reject_reason) :'');
        $strings[] = sprintf("Fragment Caching %d/%d fragments using %s%s",
            $w3_fragmentcache->cache_hits, $w3_fragmentcache->cache_total,
            w3_get_engine_name($this->_config->get_string('fragmentcache.engine')),
            $append);
    }

    if ($this->_config->get_boolean('cdn.enabled') && !$this->_config->get_boolean('cdn.debug')) {
        $w3_plugin_cdn = w3_instance('W3_Plugin_Cdn');
        $w3_plugin_cdncommon = w3_instance('W3_Plugin_CdnCommon');
        $cdn = & $w3_plugin_cdncommon->get_cdn();
        $via = $cdn->get_via();

        $strings[] = sprintf("Content Delivery Network via %s%s", ($via ? $via : 'N/A'), ($w3_plugin_cdn->cdn_reject_reason != '' ? sprintf(' (%s)', $w3_plugin_cdn->cdn_reject_reason) : ''));
    }

    if ($this->_config->get_boolean('newrelic.enabled')) {
        $w3_newrelic = w3_instance('W3_Plugin_NewRelic');
        $append = ($w3_newrelic->newrelic_reject_reason != '') ?
            sprintf(' (%s)', $w3_newrelic->newrelic_reject_reason) : '';
        $strings[] = sprintf(__("Application Monitoring using New Relic%s", 'w3-total-cache'), $append);
    }
    $buffer .= "\r\n<!-- Performance optimized by W3 Total Cache. Learn more: http://www.w3-edge.com/wordpress-plugins/\r\n";

    if (count($strings)) {
        $buffer .= "\r\n" . implode("\r\n", $strings) . "\r\n";
    }

    $buffer .= sprintf("\r\n Served from: %s @ %s by W3 Total Cache -->", w3_escape_comment($host), $date);
}
```

“Add footer comment”，这一段代码，你摊上事了。这一段代码就是产生在HTML最末端的注
释，我当然不能让它存在。

如果你要删，你可以直接把这段代码删掉，但是如果你怕删错了搞坏插件，你可以在这段代
码两段分别加一个/_ 和 _/，这是PHP里的注释符号。如果你今后想把它弄出来，把这两个
符号删掉就行了。
