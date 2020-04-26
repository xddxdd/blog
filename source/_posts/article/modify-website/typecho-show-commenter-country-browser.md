---
lang: zh
title: 'Typecho 显示评论者国家和浏览器'
label: typecho-show-commenter-country-browser
categories: 网站与服务端
tags: [IP,Typecho]
date: 2014-07-30 21:09:00
---
Typecho 由于插件稀少，一直没有找到显示评论者国家和浏览器的插件，所以只好自力更生了。

代码修改自WordPress插件Show UserAgent，下载页面：[https://wordpress.org/plugins/show-useragent/](https://wordpress.org/plugins/show-useragent/)

前提是你的主题使用了自定义评论代码而不是Typecho默认的评论显示代码，一般符合要求的主题的comments.php或者functions.php中会有如下代码：

```php
<?php function threadedComments($comments, $options) {
    //blablabla
?>
```

下载Show UserAgent插件解压，把里面的flags文件夹改名成country，browsers文件夹改名成browser，ip2c文件夹改名成lib，上传到服务器上你的主题文件夹。（其实不改也可以，但是我是按照个人习惯这么改的，你也可以修改下面代码的路径）

在主题的functions.php中插入这么长一串代码：

```php
<?php /* 地理位置判断 */ ?>
<?php function CID_get_country($ip) {
    require_once(dirname(__FILE__).&#39;/lib/ip2c.php&#39;);
    if (isset($GLOBALS[&#39;ip2c&#39;])) {
        global $ip2c;
    } else {
        $ip2c = new ip2country(dirname(__FILE__).&#39;/lib/ip-to-country.bin&#39;);
        $GLOBALS[&#39;ip2c&#39;] = $ip2c;
    }
    return $ip2c->get_country($ip);
}

function CID_get_flag($ip, $show_image = true, $show_text = false, $before = &#39;&#39;, $after = &#39;&#39;) {
    if($ip == &#39;127.0.0.1&#39;){
        $code = &#39;wordpress&#39;;
        $name = &#39;Localhost&#39;;
    }else{

    $country = CID_get_country($ip);
    if (!$country) return "";

    $code = strtolower($country[&#39;id2&#39;]);
    $name = $country[&#39;name&#39;];
    }
    global $CID_options;

    $output = &#39;&#39;;

    if ($show_image)
        $output = &#39; <img src="http://cdn.lantian.lt/usr/themes/hybridside/lib/country/&#39; . $code . &#39;.png" title="&#39; . $name . &#39;" alt="&#39; . $name . &#39;" class="country-flag" />&#39;;
    if ($show_text)
        $output .= &#39; &#39; . $name;

    return $before . $output . $after;
}
?>

<?php /* 浏览器判断 */ ?>
<?php function CID_windows_detect_os($ua) {
    $os_name = $os_code = $os_ver = $pda_name = $pda_code = $pda_ver = null;

    if (preg_match(&#39;/Windows 95/i&#39;, $ua) || preg_match(&#39;/Win95/&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "95";
    } elseif (preg_match(&#39;/Windows NT 5.0/i&#39;, $ua) || preg_match(&#39;/Windows 2000/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "2000";
    } elseif (preg_match(&#39;/Win 9x 4.90/i&#39;, $ua) || preg_match(&#39;/Windows ME/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "ME";
    } elseif (preg_match(&#39;/Windows.98/i&#39;, $ua) || preg_match(&#39;/Win98/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "98";
    } elseif (preg_match(&#39;/Windows NT 6.0/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows_vista";
        $os_ver = "Vista";
    } elseif (preg_match(&#39;/Windows NT 6.1/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows_win7";
        $os_ver = "7";
    } elseif (preg_match(&#39;/Windows NT 6.2/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows_win8";
        $os_ver = "8";
    } elseif (preg_match(&#39;/Windows NT 5.1/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "XP";
    } elseif (preg_match(&#39;/Windows NT 5.2/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        if (preg_match(&#39;/Win64/i&#39;, $ua)) {
            $os_ver = "XP 64 bit";
        } else {
            $os_ver = "Server 2003";
        }
    }
    elseif (preg_match(&#39;/Mac_PowerPC/i&#39;, $ua)) {
        $os_name = "Mac OS";
        $os_code = "macos";
    }elseif (preg_match(&#39;/Windows Phone/i&#39;, $ua)) {
        $matches = explode(&#39;;&#39;,$ua);
        $os_name = $matches[2];
        $os_code = "windows_phone7";
    } elseif (preg_match(&#39;/Windows NT 4.0/i&#39;, $ua) || preg_match(&#39;/WinNT4.0/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "NT 4.0";
    } elseif (preg_match(&#39;/Windows NT/i&#39;, $ua) || preg_match(&#39;/WinNT/i&#39;, $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "NT";
    } elseif (preg_match(&#39;/Windows CE/i&#39;, $ua)) {
        list($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_pda_detect_os($ua);
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "CE";
        if (preg_match(&#39;/PPC/i&#39;, $ua)) {
            $os_name = "Microsoft PocketPC";
            $os_code = "windows";
            $os_ver = &#39;&#39;;
        }
        if (preg_match(&#39;/smartphone/i&#39;, $ua)) {
            $os_name = "Microsoft Smartphone";
            $os_code = "windows";
            $os_ver = &#39;&#39;;
        }
    } else{
        $os_name = &#39;Unknow Os&#39;;
        $os_code = &#39;other&#39;;
    }

    return array($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver);
}

function CID_unix_detect_os($ua) {
    $os_name = $os_ver = $os_code = null;
        if (preg_match(&#39;/Linux/i&#39;, $ua)) {
        $os_name = "Linux";
        $os_code = "linux";
        if (preg_match(&#39;#Debian#i&#39;, $ua)) {
            $os_code = "debian";
            $os_name = "Debian GNU/Linux";
        } elseif (preg_match(&#39;#Mandrake#i&#39;, $ua)) {
            $os_code = "mandrake";
            $os_name = "Mandrake Linux";
        } elseif (preg_match(&#39;#Kindle Fire#i&#39;,$ua)) {//for Kindle Fire
            $matches = explode(&#39;;&#39;,$ua);
            $os_code = "kindle";
            $matches2 = explode(&#39;)&#39;,$matches[4]);
            $os_name = $matches[2].$matches2[0];
        } elseif (preg_match(&#39;#Android#i&#39;,$ua)) {//Android
            $matches = explode(&#39;;&#39;,$ua);
            $os_code = "android";
            $matches2 = explode(&#39;)&#39;,$matches[4]);
            $os_name = $matches[2].$matches2[0];
        } elseif (preg_match(&#39;#SuSE#i&#39;, $ua)) {
            $os_code = "suse";
            $os_name = "SuSE Linux";
        } elseif (preg_match(&#39;#Novell#i&#39;, $ua)) {
            $os_code = "novell";
            $os_name = "Novell Linux";
        } elseif (preg_match(&#39;#Ubuntu#i&#39;, $ua)) {
            $os_code = "ubuntu";
            $os_name = "Ubuntu Linux";
        } elseif (preg_match(&#39;#Red ?Hat#i&#39;, $ua)) {
            $os_code = "redhat";
            $os_name = "RedHat Linux";
        } elseif (preg_match(&#39;#Gentoo#i&#39;, $ua)) {
            $os_code = "gentoo";
            $os_name = "Gentoo Linux";
        } elseif (preg_match(&#39;#Fedora#i&#39;, $ua)) {
            $os_code = "fedora";
            $os_name = "Fedora Linux";
        } elseif (preg_match(&#39;#MEPIS#i&#39;, $ua)) {
            $os_name = "MEPIS Linux";
        } elseif (preg_match(&#39;#Knoppix#i&#39;, $ua)) {
            $os_name = "Knoppix Linux";
        } elseif (preg_match(&#39;#Slackware#i&#39;, $ua)) {
            $os_code = "slackware";
            $os_name = "Slackware Linux";
        } elseif (preg_match(&#39;#Xandros#i&#39;, $ua)) {
            $os_name = "Xandros Linux";
        } elseif (preg_match(&#39;#Kanotix#i&#39;, $ua)) {
            $os_name = "Kanotix Linux";
        }
    } elseif (preg_match(&#39;/FreeBSD/i&#39;, $ua)) {
        $os_name = "FreeBSD";
        $os_code = "freebsd";
    } elseif (preg_match(&#39;/NetBSD/i&#39;, $ua)) {
        $os_name = "NetBSD";
        $os_code = "netbsd";
    } elseif (preg_match(&#39;/OpenBSD/i&#39;, $ua)) {
        $os_name = "OpenBSD";
        $os_code = "openbsd";
    } elseif (preg_match(&#39;/IRIX/i&#39;, $ua)) {
        $os_name = "SGI IRIX";
        $os_code = "sgi";
    } elseif (preg_match(&#39;/SunOS/i&#39;, $ua)) {
        $os_name = "Solaris";
        $os_code = "sun";
    } elseif (preg_match(&#39;#iPod.*.CPU.([a-zA-Z0-9.( _)]+)#i&#39;, $ua, $matches)) {
        $os_name = "iPod";
        $os_code = "iphone";
        $os_ver = $matches[1];
    } elseif (preg_match(&#39;#iPhone.*.CPU.([a-zA-Z0-9.( _)]+)#i&#39;, $ua, $matches)) {
        $os_name = "iPhone";
        $os_code = "iphone";
        $os_ver = $matches[1];
    } elseif (preg_match(&#39;#iPad.*.CPU.([a-zA-Z0-9.( _)]+)#i&#39;, $ua, $matches)) {
        $os_name = "iPad";
        $os_code = "ipad";
        $os_ver = $matches[1];
    } elseif (preg_match(&#39;/Mac OS X.([0-9. _]+)/i&#39;, $ua, $matches)) {
        $os_name = "Mac OS";
        $os_code = "macos";
        if(count(explode(7,$matches[1]))>1) $matches[1] = &#39;Lion &#39;.$matches[1];
        elseif(count(explode(8,$matches[1]))>1) $matches[1] = &#39;Mountain Lion &#39;.$matches[1];
        $os_ver = "X ".$matches[1];
    } elseif (preg_match(&#39;/Macintosh/i&#39;, $ua)) {
        $os_name = "Mac OS";
        $os_code = "macos";
    } elseif (preg_match(&#39;/Unix/i&#39;, $ua)) {
        $os_name = "UNIX";
        $os_code = "unix";
    } elseif (preg_match(&#39;/CrOS/i&#39;, $ua)){
        $os_name="Google Chrome OS";
        $os_code="chromeos";
    } elseif (preg_match(&#39;/Fedor.([0-9. _]+)/i&#39;, $ua, $matches)){
        $os_name="Fedora";
        $os_code="fedora";
        $os_ver = $matches[1];
    } else{
        $os_name = &#39;Unknow Os&#39;;
        $os_code = &#39;other&#39;;
    }

    return array($os_name, $os_code, $os_ver);
}

function CID_pda_detect_os($ua) {
    $os_name = $os_code = $os_ver = $pda_name = $pda_code = $pda_ver = null;
    if (preg_match(&#39;#PalmOS#i&#39;, $ua)) {
        $os_name = "Palm OS";
        $os_code = "palm";
    } elseif (preg_match(&#39;#Windows CE#i&#39;, $ua)) {
        $os_name = "Windows CE";
        $os_code = "windows";
    } elseif (preg_match(&#39;#QtEmbedded#i&#39;, $ua)) {
        $os_name = "Qtopia";
        $os_code = "linux";
    } elseif (preg_match(&#39;#Zaurus#i&#39;, $ua)) {
        $os_name = "Linux";
        $os_code = "linux";
    } elseif (preg_match(&#39;#Symbian#i&#39;, $ua)) {
        $os_name = "Symbian OS";
        $os_code = "symbian";
    } elseif (preg_match(&#39;#PalmOS/sony/model#i&#39;, $ua)) {
        $pda_name = "Sony Clie";
        $pda_code = "sony";
    } elseif (preg_match(&#39;#Zaurus ([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Sharp Zaurus " . $matches[1];
        $pda_code = "zaurus";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#Series ([0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Series";
        $pda_code = "nokia";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#Nokia ([0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Nokia";
        $pda_code = "nokia";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#SIE-([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Siemens";
        $pda_code = "siemens";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#dopod([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Dopod";
        $pda_code = "dopod";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#o2 xda ([a-zA-Z0-9 ]+);#i&#39;, $ua, $matches)) {
        $pda_name = "O2 XDA";
        $pda_code = "o2";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#SEC-([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Samsung";
        $pda_code = "samsung";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#SonyEricsson ?([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "SonyEricsson";
        $pda_code = "sonyericsson";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#Kindle\/([a-zA-Z0-9. ×\(.\)]+)#i&#39;,$ua, $matches)) {//for Kindle
        $pda_name = "kindle";
        $pda_code = "kindle";
        $pda_ver = $matches[1];
    } else {
        $pda_name = &#39;Unknow Os&#39;;
        $pda_code = &#39;other&#39;;
    }

    return array($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver);
}

function CID_detect_browser($ua) {
    $browser_name = $browser_code = $browser_ver = $os_name = $os_code = $os_ver = $pda_name = $pda_code = $pda_ver = null;
    $ua = preg_replace("/FunWebProducts/i", "", $ua);
    if (preg_match(&#39;#MovableType[ /]([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;MovableType&#39;;
        $browser_code = &#39;mt&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;#WordPress[ /]([a-zA-Z0-9.]*)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;WordPress&#39;;
        $browser_code = &#39;wp&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;#typepad[ /]([a-zA-Z0-9.]*)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;TypePad&#39;;
        $browser_code = &#39;typepad&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;#drupal#i&#39;, $ua)) {
        $browser_name = &#39;Drupal&#39;;
        $browser_code = &#39;drupal&#39;;
        $browser_ver = count($matches) > 0 ? $matches[1] : "";
    } elseif (preg_match(&#39;#symbianos/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $os_name = "SymbianOS";
        $os_ver = $matches[1];
        $os_code = &#39;symbian&#39;;
    } elseif (preg_match(&#39;#avantbrowser.com#i&#39;, $ua)) {
        $browser_name = &#39;Avant Browser&#39;;
        $browser_code = &#39;avantbrowser&#39;;
    } elseif (preg_match(&#39;#(Camino|Chimera)[ /]([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Camino&#39;;
        $browser_code = &#39;camino&#39;;
        $browser_ver = $matches[2];
        $os_name = "Mac OS";
        $os_code = "macos";
        $os_ver = "X";
    } elseif (preg_match(&#39;#anonymouse#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Anonymouse&#39;;
        $browser_code = &#39;anonymouse&#39;;
    } elseif (preg_match(&#39;#PHP#&#39;, $ua, $matches)) {
        $browser_name = &#39;PHP&#39;;
        $browser_code = &#39;php&#39;;
    } elseif (preg_match(&#39;#danger hiptop#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Danger HipTop&#39;;
        $browser_code = &#39;danger&#39;;
    } elseif (preg_match(&#39;#w3m/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;W3M&#39;;
        $browser_code = &#39;w3m&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;#Shiira[/]([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Shiira&#39;;
        $browser_code = &#39;shiira&#39;;
        $browser_ver = $matches[1];
        $os_name = "Mac OS";
        $os_code = "macos";
        $os_ver = "X";
    } elseif (preg_match(&#39;#Dillo[ /]([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Dillo&#39;;
        $browser_code = &#39;dillo&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;#Epiphany/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Epiphany&#39;;
        $browser_code = &#39;epiphany&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    } elseif (preg_match(&#39;#UP.Browser/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Openwave UP.Browser&#39;;
        $browser_code = &#39;openwave&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;#DoCoMo/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;DoCoMo&#39;;
        $browser_code = &#39;docomo&#39;;
        $browser_ver = $matches[1];
        if ($browser_ver == &#39;1.0&#39;) {
            preg_match(&#39;#DoCoMo/([a-zA-Z0-9.]+)/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches);
            $browser_ver = $matches[2];
        } elseif ($browser_ver == &#39;2.0&#39;) {
            preg_match(&#39;#DoCoMo/([a-zA-Z0-9.]+) ([a-zA-Z0-9.]+)#i&#39;, $ua, $matches);
            $browser_ver = $matches[2];
        }
    } elseif (preg_match(&#39;#(SeaMonkey)/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Mozilla SeaMonkey&#39;;
        $browser_code = &#39;seamonkey&#39;;
        $browser_ver = $matches[2];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Kazehakase/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Kazehakase&#39;;
        $browser_code = &#39;kazehakase&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Flock/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Flock&#39;;
        $browser_code = &#39;flock&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#(Firefox|Phoenix|Firebird|BonEcho|GranParadiso|Minefield|Iceweasel)/4([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Mozilla Firefox&#39;;
        $browser_code = &#39;firefox&#39;;
        $browser_ver = &#39;4&#39;.$matches[2];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#(Firefox|Phoenix|Firebird|BonEcho|GranParadiso|Minefield|Iceweasel)/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Mozilla Firefox&#39;;
        $browser_code = &#39;firefox&#39;;
        $browser_ver = $matches[2];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Minimo/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Minimo&#39;;
        $browser_code = &#39;mozilla&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#MultiZilla/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;MultiZilla&#39;;
        $browser_code = &#39;mozilla&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#SE 2([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;SouGou Browser&#39;;
        $browser_code = &#39;sogou&#39;;
        $browser_ver = &#39;2&#39;.$matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#baidubrowser ([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;BaiDu Browser&#39;;
        $browser_code = &#39;baidubrowser&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#360([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;360 Browser&#39;;
        $browser_code = &#39;360se&#39;;
        $browser_ver = $matches[1];
                if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#QQBrowser/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;QQ Browser&#39;;
        $browser_code = &#39;qqbrowser&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;/PSP \(PlayStation Portable\)\; ([a-zA-Z0-9.]+)/&#39;, $ua, $matches)) {
        $pda_name = "Sony PSP";
        $pda_code = "sony-psp";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#Galeon/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Galeon&#39;;
        $browser_code = &#39;galeon&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    } elseif (preg_match(&#39;#iCab/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;iCab&#39;;
        $browser_code = &#39;icab&#39;;
        $browser_ver = $matches[1];
        $os_name = "Mac OS";
        $os_code = "macos";
        if (preg_match(&#39;#Mac OS X#i&#39;, $ua)) {
            $os_ver = "X";
        }
    } elseif (preg_match(&#39;#K-Meleon/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;K-Meleon&#39;;
        $browser_code = &#39;kmeleon&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Lynx/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Lynx&#39;;
        $browser_code = &#39;lynx&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    } elseif (preg_match(&#39;#Links \\(([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Links&#39;;
        $browser_code = &#39;lynx&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    } elseif (preg_match(&#39;#ELinks[/ ]([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;ELinks&#39;;
        $browser_code = &#39;lynx&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    } elseif (preg_match(&#39;#ELinks \\(([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;ELinks&#39;;
        $browser_code = &#39;lynx&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    } elseif (preg_match(&#39;#Konqueror/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Konqueror&#39;;
        $browser_code = &#39;konqueror&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        if (!$os_name) {
            list($os_name, $os_code, $os_ver) = CID_pda_detect_os($ua);
        }
    } elseif (preg_match(&#39;#NetPositive/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;NetPositive&#39;;
        $browser_code = &#39;netpositive&#39;;
        $browser_ver = $matches[1];
        $os_name = "BeOS";
        $os_code = "beos";
    } elseif (preg_match(&#39;#OmniWeb#i&#39;, $ua)) {
        $browser_name = &#39;OmniWeb&#39;;
        $browser_code = &#39;omniweb&#39;;
        $os_name = "Mac OS";
        $os_code = "macos";
        $os_ver = "X";
    } elseif (preg_match(&#39;#Chrome/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
    $browser_name = &#39;Google Chrome&#39;; $browser_code = &#39;chrome&#39;; $browser_ver = $matches[1];
    if (preg_match(&#39;/Windows/i&#39;, $ua)) {
    list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
    } else {
    list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
    }
    } elseif (preg_match(&#39;#Arora/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Arora&#39;;
        $browser_code = &#39;arora&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Maxthon( |\/)([a-zA-Z0-9.]+)#i&#39;, $ua,$matches)) {
        $browser_name = &#39;Maxthon&#39;;
        $browser_code = &#39;maxthon&#39;;
        $browser_ver = $matches[2];
        if (preg_match(&#39;/Win/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#CriOS/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Chrome for iOS&#39;;
        $browser_code = &#39;crios&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
             list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Safari/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Safari&#39;;
        $browser_code = &#39;safari&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
             list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#opera mini#i&#39;, $ua)) {
        $browser_name = &#39;Opera Mini&#39;;
        $browser_code = &#39;opera&#39;;
        preg_match(&#39;#Opera/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches);
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#Opera.(.*)Version[ /]([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Opera&#39;;
        $browser_code = &#39;opera&#39;;
        $browser_ver = $matches[2];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
        if (!$os_name) {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
        if (!$os_name) {
            list($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_pda_detect_os($ua);
        }
        if (!$os_name) {
            if (preg_match(&#39;/Wii/i&#39;, $ua)) {
                $os_name = "Nintendo Wii";
                $os_code = "nintendo-wii";
            }
        }
    } elseif (preg_match(&#39;#Opera/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Opera Mini&#39;;
        $browser_code = &#39;opera&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#WebPro/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;WebPro&#39;;
        $browser_code = &#39;webpro&#39;;
        $browser_ver = $matches[1];
        $os_name = "PalmOS";
        $os_code = "palmos";
    } elseif (preg_match(&#39;#WebPro#i&#39;, $ua, $matches)) {
        $browser_name = &#39;WebPro&#39;;
        $browser_code = &#39;webpro&#39;;
        $os_name = "PalmOS";
        $os_code = "palmos";
    } elseif (preg_match(&#39;#Netfront/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Netfront&#39;;
        $browser_code = &#39;netfront&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_pda_detect_os($ua);
    } elseif (preg_match(&#39;#Xiino/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Xiino&#39;;
        $browser_code = &#39;xiino&#39;;
        $browser_ver = $matches[1];
    } elseif (preg_match(&#39;/wp-blackberry\/([a-zA-Z0-9.]*)/i&#39;, $ua, $matches)) {
        $browser_name = "WordPress for BlackBerry";
        $browser_code = "wordpress";
        $browser_ver = $matches[1];
        $pda_name = "BlackBerry";
        $pda_code = "blackberry";
    } elseif (preg_match(&#39;#Blackberry([0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Blackberry";
        $pda_code = "blackberry";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#Blackberry#i&#39;, $ua)) {
        $pda_name = "Blackberry";
        $pda_code = "blackberry";
    } elseif (preg_match(&#39;#SPV ([0-9a-zA-Z.]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Orange SPV";
        $pda_code = "orange";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#LGE-([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "LG";
        $pda_code = &#39;lg&#39;;
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#MOT-([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Motorola";
        $pda_code = &#39;motorola&#39;;
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#Nokia ?([0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Nokia";
        $pda_code = "nokia";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#NokiaN-Gage#i&#39;, $ua)) {
        $pda_name = "Nokia";
        $pda_code = "nokia";
        $pda_ver = "N-Gage";
    } elseif (preg_match(&#39;#Blazer[ /]?([a-zA-Z0-9.]*)#i&#39;, $ua, $matches)) {
        $browser_name = "Blazer";
        $browser_code = "blazer";
        $browser_ver = $matches[1];
        $os_name = "Palm OS";
        $os_code = "palm";
    } elseif (preg_match(&#39;#SIE-([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Siemens";
        $pda_code = "siemens";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#SEC-([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Samsung";
        $pda_code = "samsung";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;/wp-iphone\/([a-zA-Z0-9.]*)/i&#39;, $ua, $matches)) {
        $browser_name = "WordPress for iOS";
        $browser_code = "wordpress";
        $browser_ver = $matches[1];
        $pda_name = "iPhone &amp; iPad";
        $pda_code = "ipad";
    } elseif (preg_match(&#39;/wp-android\/([a-zA-Z0-9.]*)/i&#39;, $ua, $matches)) {
        $browser_name = "WordPress for Android";
        $browser_code = "wordpress";
        $browser_ver = $matches[1];
        $pda_name = "Android";
        $pda_code = "android";
    } elseif (preg_match(&#39;/wp-windowsphone\/([a-zA-Z0-9.]*)/i&#39;, $ua, $matches)) {
        $browser_name = "WordPress for Windows Phone 7";
        $browser_code = "wordpress";
        $browser_ver = $matches[1];
        $pda_name = "Windows Phone 7";
        $pda_code = "windows_phone7";
    } elseif (preg_match(&#39;/wp-nokia\/([a-zA-Z0-9.]*)/i&#39;, $ua, $matches)) {
        $browser_name = "WordPress for Nokia";
        $browser_code = "wordpress";
        $browser_ver = $matches[1];
        $pda_name = "Nokia";
        $pda_code = "nokia";
    } elseif (preg_match(&#39;#SAMSUNG-(S.H-[a-zA-Z0-9_/.]+)#i&#39;, $ua, $matches)) {
        $pda_name = "Samsung";
        $pda_code = "samsung";
        $pda_ver = $matches[1];
        if (preg_match(&#39;#(j2me|midp)#i&#39;, $ua)) {
        $browser_name = "J2ME/MIDP Browser";
        $browser_code = "j2me";
        }
    } elseif (preg_match(&#39;#SonyEricsson ?([a-zA-Z0-9]+)#i&#39;, $ua, $matches)) {
        $pda_name = "SonyEricsson";
        $pda_code = "sonyericsson";
        $pda_ver = $matches[1];
    } elseif (preg_match(&#39;#(j2me|midp)#i&#39;, $ua)) {
        $browser_name = "J2ME/MIDP Browser";
        $browser_code = "j2me";
    // mice
    } elseif (preg_match(&#39;/GreenBrowser/i&#39;, $ua)) {
        $browser_name = &#39;GreenBrowser&#39;;
        $browser_code = &#39;greenbrowser&#39;;
        if (preg_match(&#39;/Win/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#TencentTraveler ([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;腾讯TT浏览器&#39;;
        $browser_code = &#39;tencenttraveler&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#UCWEB([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;UCWEB&#39;;
        $browser_code = &#39;ucweb&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#MSIE ([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Internet Explorer&#39;;
        $browser_ver = $matches[1];
        if ( strpos($browser_ver, &#39;7&#39;) !== false || strpos($browser_ver, &#39;8&#39;) !== false)
            $browser_code = &#39;ie8&#39;;
        elseif ( strpos($browser_ver, &#39;9&#39;) !== false)
            $browser_code = &#39;ie9&#39;;
        elseif ( strpos($browser_ver, &#39;10&#39;) !== false)
            $browser_code = &#39;ie10&#39;;
        else
            $browser_code = &#39;ie&#39;;
        list($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_windows_detect_os($ua);
    } elseif (preg_match(&#39;#Universe/([0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Universe&#39;;
        $browser_code = &#39;universe&#39;;
        $browser_ver = $matches[1];
        list($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_pda_detect_os($ua);
    }elseif (preg_match(&#39;#Netscape[0-9]?/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Netscape&#39;;
        $browser_code = &#39;netscape&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#^Mozilla/5.0#i&#39;, $ua) &amp;&amp; preg_match(&#39;#rv:([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Mozilla&#39;;
        $browser_code = &#39;mozilla&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Windows/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    } elseif (preg_match(&#39;#^Mozilla/([a-zA-Z0-9.]+)#i&#39;, $ua, $matches)) {
        $browser_name = &#39;Netscape Navigator&#39;;
        $browser_code = &#39;netscape&#39;;
        $browser_ver = $matches[1];
        if (preg_match(&#39;/Win/i&#39;, $ua)) {
            list($os_name, $os_code, $os_ver) = CID_windows_detect_os($ua);
        } else {
            list($os_name, $os_code, $os_ver) = CID_unix_detect_os($ua);
        }
    }else{
        $browser_name = &#39;Unknow Browser&#39;;
        $browser_code = &#39;null&#39;;
      }
      if (!$pda_name &amp;&amp; !$os_name){
        $pda_name = &#39;Unknow Os&#39;;
        $pda_code = &#39;other&#39;;
        $os_name = &#39;Unknow Os&#39;;
        $os_code = &#39;other&#39;;
      }
    return array($browser_name, $browser_code, $browser_ver, $os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver);
}

function CID_friendly_string($browser_name = &#39;&#39;, $browser_code = &#39;&#39;, $browser_ver = &#39;&#39;, $os_name = &#39;&#39;, $os_code = &#39;&#39;, $os_ver = &#39;&#39;, $pda_name= &#39;&#39;, $pda_code = &#39;&#39;, $pda_ver = &#39;&#39;, $show_image = true, $show_text = false, $between = &#39;&#39;, $before = &#39;&#39;, $after = &#39;&#39;) {
    global $CID_width_height, $CID_image_url;

    $browser_name = htmlspecialchars($browser_name);
    $browser_code = htmlspecialchars($browser_code);
    $browser_ver = htmlspecialchars($browser_ver);
    $os_name = htmlspecialchars($os_name);
    $os_code = htmlspecialchars($os_code);
    $os_ver = htmlspecialchars($os_ver);
    $pda_name = htmlspecialchars($pda_name);
    $pda_code = htmlspecialchars($pda_code);
    $pda_ver = htmlspecialchars($pda_ver);
    $between = htmlspecialchars($between);

    $text1 = &#39;&#39;; $text2 = &#39;&#39;; $image1 = &#39;&#39;; $image2 = &#39;&#39;;

    if ($browser_name &amp;&amp; $pda_name) {
        if ($show_image) {
            $image1 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$browser_code.png&#39; title=&#39;$browser_name $browser_ver&#39; alt=&#39;$browser_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;browser-icon&#39; />";
            $image2 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$pda_code.png&#39; title=&#39;$pda_name $pda_ver&#39; alt=&#39;$pda_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;os-icon&#39; />";
        }
        if ($show_text) {
            $text1 = "$browser_name $browser_ver $between ";
            $text2 = "$pda_name $pda_ver";
        }
    } elseif ($browser_name &amp;&amp; $os_name) {
        if ($show_image) {
            $image1 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$browser_code.png&#39; title=&#39;$browser_name $browser_ver&#39; alt=&#39;$browser_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;browser-icon&#39; /> ";
            $image2 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$os_code.png&#39; title=&#39;$os_name $os_ver&#39; alt=&#39;$os_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;os-icon&#39; /> ";
        }
        if ($show_text) {
            $text1 = "$browser_name $browser_ver $between ";
            $text2 = "$os_name $os_ver";
        }
    } elseif ($browser_name) {
        if ($show_image)
            $image1 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$browser_code.png&#39; title=&#39;$browser_name $browser_ver&#39; alt=&#39;$browser_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;browser-icon&#39; />";
        if ($show_text)
            $text1 = "$browser_name $browser_ver";
    } elseif ($os_name) {
        if ($show_image)
            $image1 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$os_code.png&#39; title=&#39;$os_name $os_ver&#39; alt=&#39;$os_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;os-icon&#39; /> ";
        if ($show_text)
            $text1 = "$os_name $os_ver";
    } elseif ($pda_name) {
        if ($show_image)
            $image1 = " <img src=&#39;http://cdn.lantian.lt/usr/themes/hybridside/lib/browser/$pda_code.png&#39; title=&#39;$pda_name $pda_ver&#39; alt=&#39;$pda_name&#39; width=&#39;$CID_width_height&#39; height=&#39;$CID_width_height&#39; class=&#39;os-icon&#39; />";
        if ($show_text)
            $text1 = "$pda_name $pda_ver";
    }
    return $before . $image1 . &#39; &#39; . $text1 . &#39; &#39; . $image2 . &#39; &#39; . $text2 . $after;
}

function CID_browser_string($ua, $show_image = true, $show_text = false, $between = &#39;&#39;, $before = &#39;&#39;, $after = &#39;&#39;) {
    list ($browser_name, $browser_code, $browser_ver, $os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_detect_browser($ua);
    $string = CID_friendly_string($browser_name, $browser_code, $browser_ver, $os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver, $show_image, $show_text, $between, $before, $after);
    /*if (!$string) {
        $string = "Unknown browser";
    }*/
    return $string;
} ?>
```

把里面的`http://cdn.lantian.lt/usr/themes/hybridside`这个网址全部改成你的主题文件夹的网址。

在主题的自定义评论代码里你想显示评论者国家的地方插入：

```php
<?php echo CID_get_flag($comments->ip);?>
```

在你想显示系统和浏览器的地方插入：

```php
<?php echo CID_browser_string($comments->agent);?>
```

修改完成，测试效果。
