---
title: 'Removing W3 Total Cache Footer Comment'
categories: Website and Servers
tags: [Website, Tinkering, WordPress, W3 Total Cache]
date: 2013-02-13 21:07:00
autoTranslated: true
---


The resource minification effect of W3 Total Cache is excellent - it even minifies HTML. Just look at my webpage source code: line breaks are removed, and the minification is extremely effective. However, at the end of the page, there's an added comment by W3 Total Cache:

```bash
<!-- Performance optimized by W3 Total Cache. Learn more: http://www.w3-edge.com/wordpress-plugins/

Minified using disk: basic
Content Delivery Network via lantian.pub

Served from: lantian.pub @ 2013-02-13 20:56:59 by W3 Total Cache -->
```

For someone like me who pursues speed, this not only unnecessarily increases the webpage size but, more importantly, it annoys me whenever I see it. Therefore, I decided to tackle W3 Total Cache and remove the code that generates this comment.

I first searched on Google and found someone mentioning it's around line 2000+ in `w3-total-cache/lib/W3/Plugin/TotalCache.php`. But when I opened the file, it was only 800 lines long - nowhere near 2000 lines! Continued searching yielded no results, so I had to investigate myself. I started scanning through this PHP file until I found this section:

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

"Add footer comment" - this block of code, you've got trouble coming. This is exactly what generates the comment at the end of the HTML, and I certainly can't let it stay.

If you want to remove it, you can directly delete this code block. But if you're worried about breaking the plugin, you can add `/*` before the code and `*/` after it - these are PHP comment markers. If you ever want to restore it, just remove these two symbols.
```
