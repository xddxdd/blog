---
title: '开始使用 Hexo 静态网站生成器'
categories: 网站与服务端
tags: [Hexo, 静态网站]
date: 2019-09-25 22:17:00
---

## 什么是静态网站生成器

我们常用的 WordPress、Typecho 等 CMS（内容管理系统）都是动态网站。当用户访问网页
时，服务端运行使用 PHP、Python、Node.js 等语言的程序，根据用户的请求**实时**产生
网页，将其返回给用户。

而 Jekyll、Hexo、Hugo 等静态网站生成器采取的是另一种方法：**提前**预测用户的请
求，一次性产生对应的 HTML 文件。

这两种方式的主要优缺点如下：

| 谁更占优 | 动态网站                                                                         | 静态网站                                         |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| 动       | 可以实现复杂的交互，根据用户的输入随时改变内容                                   | 只能响应预定的输入，灵活性差                     |
| 动       | 大多数 CMS 都会提供易用的管理后台，方便用户随时更新内容                          | 没有在线后台，需要在本地安装额外软件更新网站内容 |
| 静       | 安装脚本运行环境需要较复杂的配置                                                 | 服务端无需脚本运行环境，几乎无需服务端任何配置   |
| 静       | 实时产生网页需要较大的运算量（包括脚本运行、数据库查询），对服务器造成较大的压力 | 服务端几乎无需计算，响应速度极快                 |
| 静       | 如果需要迁移服务器，需要同时迁移脚本、数据库，还常常需要修改脚本配置             | 迁移难度极低，只需要直接复制 HTML 文件即可       |

## 我为什么从 Typecho 转向静态网站

1. 随着我向 VPS 上安装更多的程序，服务器资源已经捉襟见肘，导致 Typecho（尤其是
   MySQL 数据库）响应变慢
   - 在我没有修改任何配置的情况下，LT-Latency HTTP 头反馈的数值从 0.02 再次提升
     到了 0.1，相当
     于[之前的优化](/article/modify-website/typecho-performance-optimization.lantian/)白
     做了
   - 我的 VPS 是特价购买，无法升级更高配置
   - 香港的同配置 VPS 新购价格比我现在 VPS 的价格高 3-4 倍，如果要加资源那就更高
     了
2. 由于历史原因，我有过多种文章格式，需要复杂的后处理脚本来保持兼容
   - 我之前用过 WordPress，Typecho 的百度 UEditor，Typecho Markdown 等作为编辑器
   - 后处理脚本运行时间长且难以优化
   - 无法自动将先前文章转为 Markdown，手动转 Markdown 过于麻烦
3. 近期（2019 年 9 月）国际网络极其不稳定，我需要随时迁移
   - 本月我已经有 5 台 VPS 的 IP 无法从大陆访问了，包括我放网站这台
   - 目前我暂时使用另一台特价香港
     VPS（[0.1 折的 50KVM VPS](/article/modify-website/got-50kvm-99off-vps.lantian/)）
     中转来保持网站正常访问
   - 但这台 VPS 带宽仅 5Mbps，难以主用（数据备份等都是大问题）
4. 静态网站可以更加方便地负载均衡，保持高可用
   - 动态网站不仅需要同步网站系统，还要同步数据库
     - MySQL 传统主从复制难以满足实时性要求
       - 其它节点网站系统写数据库必须回主节点，延迟高且跨大洲网络不能保证稳定
     - MySQL Galera 多主复制在跨大洲情况下也不稳定
       - 我曾经花了 2 个整天尝试配置 Galera，还是失败了

## 预先准备：架构选择

我这次转换的目标：

- 文章全部转移且 URL 保持不变
  - 尤其是我的 URL 不是以传统的 HTML 结尾的，是早期我自己设置的扩展名 lantian，
    因此需要静态网站生成器支持自定义 URL
- 评论全部转移，内容不变，且仍有评论系统可用
  - 目标评论系统需要有现成的从 Typecho 或者 WordPress 转换的轮子
  - 目标评论系统需要能在国内访问
  - 目标评论系统需要能够接受匿名评论
  - 目标评论系统需要可以指定文章 ID，保证评论的正常显示
    - 在迁移过程中 URL 可能有小改变
- 静态网站生成器扩展性尽量强，速度不是很重要
  - 我希望能通过添加插件、修改代码等方式尽可能自定义网站内容
  - 我可以接受每次花几分钟重新生成一遍网站
    - 我甚至可以把生成过程放到另一台 VPS 的 Jenkins 上去做

最终我的选择如下：

- 静态网站生成器选择 Hexo
  - Hexo 使用 Node.js 写成，可以直接用 Javascript 扩展主题、插件
  - 用户多，插件多，资料多
  - 与其它选择相比：
    - Hugo 虽然速度非常快，但是它没有插件系统，主题系统也无法实现复杂逻辑
- 评论系统选择 Disqus
  - 可以直接导入 WordPress 评论，而 Typecho 有现成转换到 WordPress 的轮子
  - 老牌评论系统，多年稳定服务，大量网站使用
  - 可以指定评论区对应的 URL 和 ID，保证评论内容不变
  - 虽然大陆无法访问，但是有解决方案，见后文
  - 与其它选择相比：
    - Valine 使用 LeanCloud 保存评论数据，没找到现成轮子，且 LeanCloud 免费应用
      限制较多
    - Isso 仅支持 SQLite 数据库，且似乎无法指定文章 ID
    - HashOver 不支持指定文章 ID
    - 其它基于 GitHub 的评论系统一律不考虑，因为难以支持匿名评论

## Typecho 文章内容转 Hexo

我用的是 Newbmiao
的[这个 PHP 文件](https://github.com/NewbMiao/typecho2Hexo/blob/master/converter.php)，
修改数据库密码后直接在服务器上运行，就可以将文章全部导出为 Hexo 需要的 Markdown
文件。

不过我对上述 PHP 做了一些修改，以支持：

- 以 slug（缩略名，网址上的英文标题）命名导出的 Markdown 文件
- 将文件按分类保存到不同文件夹

以下是我的代码：

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
categories: {$r->category}
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

## Typecho 评论转 Disqus

如果直接将 TypExport 这个插件生成的 WordPress XML 导入到 Disqus，会出现评论区的
URL 和文章 URL 对应不上的问题。

我的解决方法极其简单粗暴：装一个 WordPress，导入一遍，再导出一遍，就正常了。

## 解决大陆无法访问 Disqus

GitHub 用户 fooleap 开源了一个 PHP 程序，代理了 Disqus 的 API，并提供了一个简版
评论框，让大陆用户可以通过这个代理进行评论。

这个程序可以在
[https://github.com/fooleap/disqus-php-api](https://github.com/fooleap/disqus-php-api)
得到，按照说明配置即可。

由于我只是将主站静态化，没有完全卸载 PHP 的计划，因此我可以接受再安装一套 PHP 的
代码。而且，即使后续服务器资源再不足，也只会对评论区产生较大的影响，主站依然能保
持快速的响应。

在 Hexo 的模版中插入以下代码开启评论区：

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

我在此次迁移中，部分页面的 URL 还是发生了变化：

- 文章的 `.lantian` 后面加了一个斜杠：如果直接生成 `.lantian` 文件，浏览器会直接
  提示下载。虽然我可以修改 nginx 配置内的 MIME 类型解决问题，但为了保持与其它空
  间商的兼容性，我选择让 Hexo 生成 `.lantian/index.html`。这样浏览器可以直接访问
  `.lantian/` 这个路径而不出问题。
- 独立页面的 URL 后面被 Hexo 加上了 `/index.html`，例如
  `/page/archive/index.html` 而不是 `/page/archive/`。

虽然用原来的 URL 仍然可以访问现在的内容，但是 Disqus 拿到的 URL 就不一样了，会造
成一篇文章对应多个评论区。因此此处我对传进 Disqus 的 URL 做了处理，去掉了最后的
斜杠和 `/index.html`，来保持与先前 URL 的兼容。

## Hexo 的一些插件配置

此次配置我启用了 Hexo 的一些插件来进一步优化网站的表现：

- [hexo-generator-feed](https://github.com/hexojs/hexo-generator-feed.git)，产生
  RSS 订阅的 XML 文件
  - 对 nginx 进行了一点配置，将原来的 `/feed` 跳转到现在的 `/feed.xml` 上
- [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap)，产
  生 Sitemap
- [hexo-renderer-markdown-it-plus](https://github.com/CHENXCHEN/hexo-renderer-markdown-it-plus)，
  带语法高亮、Katex 数学公式渲染等功能的 Markdown 渲染器
- [hexo-yam](https://github.com/curbengh/hexo-yam)
  - 可以去除 CSS、JS、HTML 文件中的空格等，缩小文件体积（即 Minifier）
    - 如果在 PHP 实时处理，或者用 nginx 的 PageSpeed 模块，都会造成较大的处理延
      时
    - 但对静态网站生成器来说这都不是事
  - 可以提前产生 GZip 和 Brotli 压缩好的文件（例如 `index.html.gz` 和
    `index.html.br`）
    - 开启 `gzip_static on` 和 `brotli_static on` 选项后，nginx 不再需要实时压缩
      文件了，性能更强
    - 提前产生时可以使用更耗时的最高压缩级别，相比实时压缩时使用的级别更高，压缩
      文件更小

## 完成后效果

现在本站已经迁移完成，原有数据完全保留。目前效果如下：

- 响应速度大幅上升（LT-Latency 头已经是 0.000 了，代表基本没有后端处理流程）
- 大部分前端功能保留
  - 文章显示、导航栏、底部分页等效果完全相同
- 只有小部分改变
  - 侧边栏删除了最新评论（因为使用了 Disqus，暂时获取不到最新评论）
  - 删除了顶部的 HTTPS 信息显示（因为静态页面无法动态产生这些内容）
  - 评论区换成了 Disqus
  - 右下角加入了 Powered by Hexo 以及当前页面的产生时间

关于生成速度，我现在大约 150 篇文章，生成一次需要大概 1 分钟时间。相比 Hugo 来说
慢到不知哪里去了（Hugo 只要几秒），但为了扩展性，我都可以接受。

也许有一天我会从头 DIY 一个自己的静态网站生成器。
