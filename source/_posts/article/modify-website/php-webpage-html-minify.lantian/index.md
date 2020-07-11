---
title: 'PHP网页的HTML压缩'
label: php-webpage-html-minify
categories: 网站与服务端
tags: [优化,PHP,Typecho,折腾,网站]
date: 2013-05-18 14:11:56
---
```html
<body id="wordpress-org" class="home blog">
<div id="header">
     <div class="wrapper">
         <h1>[WordPress.org ](http://cn.wordpress.org/)</h1><h2 class="rosetta">[China &#31616;&#20307;&#20013;&#25991; ](http://cn.wordpress.org/)</h2>                 <div style="clear:both"></div>

<ul>
     <li><a href='/' title='&#39318;&#39029;' class="current">&#39318;&#39029; </a></li>
     <li><a href='http://zh-cn.forums.wordpress.org/' title='&#22312;&#27492;&#25552;&#20986;&#23433;&#35013;&#12289;&#20351;&#29992;&#19978;&#30340;&#38382;&#39064;&#65292;&#25110;&#19982;&#20854;&#23427; WordPress &#29233;&#22909;&#32773;&#36827;&#34892;&#20132;&#27969;' >&#35770;&#22363; </a></li>
     <li><a href='http://codex.wordpress.org/zh-cn:Main_Page' title='WordPress &#23448;&#26041;&#20013;&#25991;&#25991;&#26723;' >&#25991;&#26723; </a></li>
     <li><a href='http://codex.wordpress.org/Category:zh-cn:%E9%9C%80%E8%A6%81%E6%82%A8%E7%9A%84%E5%B8%AE%E5%8A%A9' title='&#20026;&#20013;&#25991; WordPress &#20570;&#20986;&#36129;&#29486;' >&#36129;&#29486; </a></li>
     <li><a href='http://cn.wordpress.org/validators/' title='WordPress China &#24403;&#21069;&#21508;&#20010;&#39033;&#30446;&#30340;&#20998;&#24037;&#24773;&#20917;' >&#22242;&#38431; </a></li>
     <li><a href='/contact/' title='&#32852;&#31995;&#35793;&#32773;' >&#32852;&#31995; </a></li>
</ul>

<div style="clear:both"></div>

</div>

</div>

<div class="outer" id="mid-wrapper">
         <div class="wrapper">
             <div class="section">
                 <h3>&#27426;&#36814; </h3>

                 <img class="shot" width="466" height="303" src="http://cn.wordpress.org/files/2011/07/dashboard-2.jpg" alt="Localized version screenshot" />&#27426;&#36814;&#35775;&#38382; WordPress &#31616;&#20307;&#20013;&#25991;&#31449;&#28857;&#65292;&#36825;&#37324;&#25552;&#20379;&#21487;&#38752;&#30340;&#23448;&#26041; WordPress &#20013;&#25991;&#29256;&#26412;&#20197;&#21450;&#30456;&#20851;&#25903;&#25345;&#12290;

WordPress &#26159;&#19968;&#20010;&#27880;&#37325;&#32654;&#23398;&#12289;&#26131;&#29992;&#24615;&#21644;&#32593;&#32476;&#26631;&#20934;&#30340;&#20010;&#20154;&#20449;&#24687;&#21457;&#24067;&#24179;&#21488;&#12290;WordPress &#34429;&#20026;&#20813;&#36153;&#30340;&#24320;&#28304;&#36719;&#20214;&#65292;&#20294;&#20854;&#20215;&#20540;&#26080;&#27861;&#29992;&#37329;&#38065;&#26469;&#34913;&#37327;&#12290;

&#20351;&#29992; WordPress &#21487;&#20197;&#25645;&#24314;&#21151;&#33021;&#24378;&#22823;&#30340;&#32593;&#32476;&#20449;&#24687;&#21457;&#24067;&#24179;&#21488;&#65292;&#20294;&#26356;&#22810;&#30340;&#26159;&#24212;&#29992;&#20110;&#20010;&#24615;&#21270;&#30340;&#21338;&#23458;&#12290;&#38024;&#23545;&#21338;&#23458;&#30340;&#24212;&#29992;&#65292;WordPress &#33021;&#35753;&#24744;&#30465;&#21364;&#23545;&#21518;&#21488;&#25216;&#26415;&#30340;&#25285;&#24515;&#65292;&#38598;&#20013;&#31934;&#21147;&#20570;&#22909;&#32593;&#31449;&#30340;&#20869;&#23481;&#12290;

&#33509;&#24744;&#38656;&#35201;&#24110;&#21161;&#65292;&#21487;&#20197;&#27983;&#35272;&#25105;&#20204;&#30340; [&#20013;&#25991;&#25991;&#26723; ](http://codex.wordpress.org/zh-cn:Main_Page)&#12289;&#22312; [&#20013;&#25991;&#35770;&#22363; ](http://zh-cn.forums.wordpress.org/)&#21457;&#24086;&#65292;&#25110;&#32773;&#36890;&#36807; [&#32852;&#31995;&#34920;&#21333; ](http://cn.wordpress.org/contact/)&#32852;&#31995;&#25105;&#20204;&#12290;&#31069;&#24744;&#20351;&#29992;&#24841;&#24555;&#65281;

</div>

</div>

</div>

```

有兴趣的同学可以数数上面的这段代码里有几个tab符。上面还只是cn.wordpress.org的一小段。

在HTML编程过程中，为了让代码对网站主和技术员简明易懂，程序猿们经常会在代码前加上分层缩进的Tab或者空格。但对于最终用户来说，这些tab和空格都是无用的。所以在网站输出中，我们应该把这些东西都干掉，甚至包括换行符，除了textarea和pre内容的换行符，这两个你懂的。

有国外大神开发出了HTML Minify PHP文件，可以全自动清除这些浪费流量的内容。不过，原始PHP执行效率较低，因为它有一个将绝对路径转换成相对路径的功能，耗时比清除这些内容的时间还要长，所以我进行了修改，把这个功能干掉了。还有其它一些修改，都是牺牲小部分功能来加快代码执行的。

使用方法：把这段代码保存成html-minify.php，上传到和你的主题模板index.php在同一目录下，在你模板header.php里最上头增加这么一行话：

```php
<?php include "html-minify.php"; ?>
```

保存，搞定。

以下为我修改的代码：（要原版请移步[http://github.com/stevenvachon/html-minify/](http://github.com/stevenvachon/html-minify/)）

```php
<?php
/*
HTML Minify 0.5.7 <http://www.svachon.com/blog/html-minify/>
Reduce file size by shortening URLs and safely removing all standard comments and unnecessary white space from an HTML document.
*/

class HTML_Minify
{
    // Settings
    protected $compress_css;
    protected $compress_js;
    protected $info_comment;
    protected $remove_comments;
    // Variables
    protected $html = '';

    public function __construct($html, $compress_css=false, $compress_js=false, $remove_comments=true)
    {
        if ($html !== '')
        {
            $this->compress_css = $compress_css;
            $this->compress_js = $compress_js;
            $this->info_comment = $info_comment;
            $this->remove_comments = $remove_comments;
            $this->html = $this->minifyHTML($html);
        }
    }

    public function __toString()
    {
        return $this->html;
    }

    protected function minifyHTML($html)
    {
        $pattern = '/<(?<script>script).*?<\/script\s*>|<(?<style>style).*?<\/style\s*>|<!(?<comment>--).*?-->|<(?<tag>[\/\w.:-]*)(?:".*?"|\'.*?\'|[^\'">]+)*>|(?<text>((<[^!\/\w.:-])?[^<]*)+)|/si';
        if (preg_match_all($pattern, $html, $matches, PREG_SET_ORDER) === false)
        {
            // Invalid markup
            return $html;
        }
        $overriding = false;
        $raw_tag = false;
        // Variable reused for output
        $html = '';
        foreach ($matches as $token)
        {
            $tag = (isset($token['tag'])) ? strtolower($token['tag']) : null;
            $content = $token[0];
            $relate = false;
            $strip = false;
            if (is_null($tag))
            {
                $content = preg_replace('/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->).)*-->/s', '', $content);
                $relate = true;
                $strip = true;
            }
            else    // All tags except script, style and comments
            {
                if ($tag === 'pre' || $tag === 'textarea')
                {
                    $raw_tag = $tag;
                }
                else if ($tag === '/pre' || $tag === '/textarea')
                {
                    $raw_tag = false;
                }
                else if (!$raw_tag && !$overriding)
                {
                    if ($tag !== '')
                    {
                        // Remove any space before the end of a tag (including closing tags and self-closing tags)
                        $content = preg_replace('/\s+(\/?\>)/', '$1', $content);
                        // Do not shorten canonical URL
                        if ($tag !== 'link')
                        {
                            $relate = true;
                        }
                        else if (preg_match('/rel=(?:\'|\")\s*canonical\s*(?:\'|\")/i', $content) === 0)
                        {
                            $relate = true;
                        }
                    }
                    else    // Content between opening and closing tags
                    {
                        // Avoid multiple spaces by checking previous character in output HTML
                        if (strrpos($html,' ') === strlen($html)-1)
                        {
                            // Remove white space at the content beginning
                            $content = preg_replace('/^[\s\r\n]+/', '', $content);
                        }
                    }

                    $strip = true;
                }
            }
            if ($strip)
            {
                $content = $this->removeWhiteSpace($content, $html);
            }
            $html .= $content;
        }
        return $html;
    }

    protected function removeWhiteSpace($html, $full_html)
    {
        $html = str_replace("\t", '', $html);
        $html = str_replace("\r", '', $html);
        $html = str_replace("\n", '', $html);
        return str_replace('  ', '', $html);
    }
}

function html_minify_buffer($html)
{
    return new HTML_Minify($html);
}

ob_start('html_minify_buffer');

?>```
