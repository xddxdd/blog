---
title: 'Getting Started with the Hexo Static Site Generator'
categories: Website and Servers
tags: [Hexo, Static Site]
date: 2019-09-25 22:17:00
autoTranslated: true
---


## What is a Static Site Generator

Common CMS platforms like WordPress and Typecho are dynamic websites. When users access a webpage, the server runs programs written in languages like PHP, Python, or Node.js to **dynamically generate** the webpage in real-time based on the user's request and returns it to the user.

Static site generators like Jekyll, Hexo, and Hugo take a different approach: they **pre-generate** HTML files in advance to match anticipated user requests.

The main advantages and disadvantages of these two approaches are as follows:

| Advantage | Dynamic Website                                                                         | Static Website                                         |
| --------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Dynamic   | Supports complex interactions and content updates based on user input                   | Limited flexibility, only responds to predefined inputs |
| Dynamic   | Most CMS provide user-friendly admin panels for easy content updates                    | No online admin panel; requires local software for updates |
| Static    | Server-side script runtime environment requires complex configuration                   | Minimal server configuration; no script runtime needed |
| Static    | Real-time page generation consumes significant resources (script execution, DB queries) | Near-zero server computation; extremely fast response |
| Static    | Server migration requires moving scripts, databases, and reconfiguration                | Effortless migration; simply copy HTML files          |

## Why I Switched from Typecho to a Static Site

1. As I installed more programs on my VPS, server resources became strained, slowing down Typecho (especially MySQL)
   - Without configuration changes, the LT-Latency HTTP header value increased from 0.02 to 0.1, negating [previous optimizations](/en/article/modify-website/typecho-performance-optimization.lantian/)
   - My VPS was purchased at a discount and couldn't be upgraded
   - New Hong Kong VPS with similar specs cost 3-4 times more
2. Historical article formats required complex post-processing scripts for compatibility
   - Used WordPress, Typecho's Baidu UEditor, and Typecho Markdown editors
   - Post-processing scripts were slow and hard to optimize
   - Automatic conversion of legacy articles to Markdown was impossible; manual conversion too tedious
3. Recent (Sept 2019) international network instability necessitated frequent migration
   - 5 VPS IPs became inaccessible from mainland China this month, including my web server
   - Currently using a discounted Hong Kong VPS ([0.1% off 50KVM VPS](/en/article/modify-website/got-50kvm-99off-vps.lantian/)) as relay
   - This VPS has only 5Mbps bandwidth, unsuitable for primary use (backups problematic)
4. Static sites enable easier load balancing and high availability
   - Dynamic sites require syncing both CMS and databases
     - Traditional MySQL master-slave replication lacks real-time capability
       - Writes to other nodes must return to master, causing high latency
     - MySQL Galera multi-master replication unstable across continents
       - Spent 2 full days attempting Galera configuration without success

## Preparation: Architecture Selection

Migration goals:
- Preserve all articles with original URLs
  - Custom URL extensions (.lantian) require static generator support
- Migrate all comments with functioning comment system
  - Target system must support Typecho/WordPress import tools
  - Must be accessible in China
  - Must allow anonymous comments
  - Must support article IDs to ensure comment display
    - Minor URL changes possible during migration
- Prioritize static generator extensibility over speed
  - Need plugin/modification support for customization
  - Acceptable to spend minutes regenerating site
    - Could offload generation to Jenkins on another VPS

Final choices:
- **Static Generator**: Hexo
  - Node.js-based with JavaScript extensibility
  - Large community, abundant plugins/resources
  - Compared to Hugo: Faster but lacks plugin system and complex theme logic
- **Comment System**: Disqus
  - Supports WordPress comment import (Typecho→WordPress tools available)
  - Established service with long-term stability
  - Supports URL/ID mapping for comment preservation
  - Workaround for mainland access (explained later)
  - Alternatives considered:
    - Valine: Uses LeanCloud, no import tools, free tier limitations
    - Isso: SQLite-only, no article ID support
    - HashOver: No article ID support
    - GitHub-based systems: Rejected due to anonymous comment limitations

## Converting Typecho Articles to Hexo

Used Newbmiao's [PHP script](https://github.com/NewbMiao/typecho2Hexo/blob/master/converter.php) with modifications:
- Output Markdown filenames use slug (URL-friendly title)
- Files organized by category folders

Modified code:
```php
<?php
// 运行 php converter.php
$db = new mysqli();
// 根据实际情况更改
$db->connect('127.0.0.1','root','password','typecho');
$prefix = 'typecho_';
$sql = <<<TEXT
select title,text,created,category,tags,slug from {$prefix}contents c,
 (select cid,group_concat(m.name) tags from {$prefix}metas m,{$prefix}relationships r where m.mid=r.mid and m.type='tag' group by cid ) t1,
(select cid,m.slug category from {$prefix}metas m,{$prefix}relationships r where m.mid=r.mid and m.type='category') t2
where t1.cid=t2.cid and c.cid=t1.cid
TEXT;
$res = $db->query($sql);
if ($res) {
    if ($res->num_rows > 0) {
        while ($r = $res->fetch_object()) {
            $_c = @date('Y-m-d H:i:s', $r->created);
            $_t = str_replace('<!--markdown-->', '', $r->text);
            $_tmp = <<<TMP
---
title: '{$r->title}'
categories: Website and Servers
tags: [{$r->tags}]
date: {$_c}
---
{$_t}
TMP;
            $name = $r->slug;
            if (strpos(PHP_OS, "WIN") !== false) {
                $name = iconv("UTF-8", "GBK//IGNORE", $r->slug);
            }
            $name = str_replace(array(" ", "?", "\\", "/", ":", "|", "*"), '-', $name);
            echo $name."\n";
            mkdir($r->category);
            file_put_contents($r->category . '/' . $name . ".md", $_tmp);
        }
    }
    $res->free();
}
$db->close();
```

## Migrating Typecho Comments to Disqus

Directly importing TypExport's WordPress XML to Disqus caused URL mismatches. Solution:
1. Install WordPress
2. Import comments
3. Re-export from WordPress
This corrected URL mappings.

## Enabling Disqus Access from Mainland China

Used fooleap's open-source [Disqus API proxy](https://github.com/fooleap/disqus-php-api) to provide a simplified comment box accessible in mainland China.

Added to Hexo template:
```html
<div id="comments"></div>

<% var removeTrailingSlash = function(s) { if(s[s.length - 1] == '/') { return
s.substring(0, s.length - 1); } else if(s.substring(s.length - 11) ==
'/index.html') { return s.substring(0, s.length - 11); } else { return s; } } %>
<script>
  addLoadEvent(function () {
    var disq = new iDisqus('comments', {
      forum: 'lantian',
      api: 'https://comments.lantian.pub',
      site: 'https://lantian.pub',
      identifier: '/<%= removeTrailingSlash(page.path) %>',
      url: '<%= removeTrailingSlash(page.permalink) %>',
      mode: 1,
      timeout: 1000,
      init: true,
      emojiPreview: true,
      autoCreate: true,
    })
  })
</script>
```

URL normalization handles changes:
- Articles: `.lantian` → `.lantian/` (to avoid browser download prompts)
- Pages: Added `/index.html` suffix (e.g., `/page/archive/index.html`)
The script trims trailing slashes and `/index.html` to maintain comment thread consistency.

## Hexo Plugin Configuration

Enabled plugins for optimization:
- **[hexo-generator-feed](https://github.com/hexojs/hexo-generator-feed)**: RSS feed
  - Nginx redirect: `/feed` → `/feed.xml`
- **[hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap)**: Sitemap
- **[hexo-renderer-markdown-it-plus](https://github.com/CHENXCHEN/hexo-renderer-markdown-it-plus)**: Markdown renderer with syntax highlighting and Katex math
- **[hexo-yam](https://github.com/curbengh/hexo-yam)**:
  - Minifies CSS/JS/HTML (no runtime penalty)
  - Pre-generates GZip/Brotli files (`index.html.gz`, `index.html.br`)
    - Enable with `gzip_static on` and `brotli_static on` in nginx
    - Higher compression levels than real-time compression

## Results After Migration

Successful migration with full data preservation:
- **Significant speed boost** (LT-Latency header: 0.000)
- **Preserved frontend functionality**:
  - Article display, navigation, pagination identical
- **Minor changes**:
  - Removed sidebar "Recent Comments" (Disqus limitation)
  - Removed dynamic HTTPS info display
  - Switched to Disqus comments
  - Added "Powered by Hexo" and page generation time

Generation time: ~1 minute for 150 articles (slower than Hugo but acceptable for extensibility). Considering building a custom static generator in the future.
```
