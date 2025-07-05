---
title: 'Typecho Display Commenter Country and Browser'
categories: Website and Servers
tags: [IP, Typecho]
date: 2014-07-30 21:09:00
autoTranslated: true
---


Due to the scarcity of plugins for Typecho, I couldn't find one that displays commenters' countries and browsers, so I had to implement it myself.

The code is modified from the WordPress plugin Show UserAgent. Download page:  
[https://wordpress.org/plugins/show-useragent/](https://wordpress.org/plugins/show-useragent/)

Prerequisite: Your theme uses custom comment code instead of Typecho's default comment display. Generally, themes meeting this requirement will have code like the following in comments.php or functions.php:

```php
<?php function threadedComments($comments, $options) {
    //blablabla
?>
```

After downloading the Show UserAgent plugin, extract it. Rename the "flags" folder to "country", the "browsers" folder to "browser", and the "ip2c" folder to "lib". Upload these to your theme folder on the server. (Renaming is optional, but I did it according to personal preference. You can also modify the path in the code below.)

Insert this long piece of code into your theme's functions.php:

```php
<?php /* 地理位置判断 */ ?>
<?php function CID_get_country($ip) {
    require_once(dirname(__FILE__).'/lib/ip2c.php');
    if (isset($GLOBALS['ip2c'])) {
        global $ip2c;
    } else {
        $ip2c = new ip2country(dirname(__FILE__).'/lib/ip-to-country.bin');
        $GLOBALS['ip2c'] = $ip2c;
    }
    return $ip2c->get_country($ip);
}

function CID_get_flag($ip, $show_image = true, $show_text = false, $before = '', $after = '') {
    if($ip == '127.0.0.1'){
        $code = 'wordpress';
        $name = 'Localhost';
    }else{

    $country = CID_get_country($ip);
    if (!$country) return "";

    $code = strtolower($country['id2']);
    $name = $country['name'];
    }
    global $CID_options;

    $output = '';

    if ($show_image)
        $output = ' <img src="http://cdn.lantian.lt/usr/themes/hybridside/lib/country/' . $code . '.png" title="' . $name . '" alt="' . $name . '" class="country-flag" />';
    if ($show_text)
        $output .= ' ' . $name;

    return $before . $output . $after;
}
?>

<?php /* 浏览器判断 */ ?>
<?php function CID_windows_detect_os($ua) {
    $os_name = $os_code = $os_ver = $pda_name = $pda_code = $pda_ver = null;

    if (preg_match('/Windows 95/i', $ua) || preg_match('/Win95/', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "95";
    } elseif (preg_match('/Windows NT 5.0/i', $ua) || preg_match('/Windows 2000/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "2000";
    } elseif (preg_match('/Win 9x 4.90/i', $ua) || preg_match('/Windows ME/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "ME";
    } elseif (preg_match('/Windows.98/i', $ua) || preg_match('/Win98/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "98";
    } elseif (preg_match('/Windows NT 6.0/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows_vista";
        $os_ver = "Vista";
    } elseif (preg_match('/Windows NT 6.1/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows_win7";
        $os_ver = "7";
    } elseif (preg_match('/Windows NT 极.2/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows_win8";
        $os_ver = "8";
    } elseif (preg_match('/Windows NT 5.1/i', $ua)) {
        $极os_name = "Windows";
        $os_code = "windows";
        $os_ver = "XP";
    } elseif (preg_match('/Windows NT 5.2/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        if (preg_match('/Win64/i', $ua)) {
            $os_ver = "XP 64 bit";
        } else {
            $os_ver = "Server 2003";
        }
    }
    elseif (preg_match('/Mac_PowerPC/i', $ua)) {
        $os_name = "Mac OS";
        $os_code = "macos";
    }elseif (preg_match('/Windows Phone/i', $ua)) {
        $matches = explode(';',$ua);
        $os_name = $matches[2];
        $os_code = "windows_phone7";
    } elseif (preg_match('/Windows NT 4.0/i', $ua) || preg_match('/WinNT4.0/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "NT 4.0";
    } elseif (preg_match('/Windows NT/i', $ua) || preg_match('/WinNT/i', $ua)) {
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "NT";
    } elseif (preg_match('/Windows CE/i', $ua)) {
        list($os_name, $os_code, $os_ver, $pda_name, $pda_code, $pda_ver) = CID_pda_detect_os($ua);
        $os_name = "Windows";
        $os_code = "windows";
        $os_ver = "CE";
        if (preg_match('/PPC/i', $ua)) {
            $os_name = "Microsoft PocketPC";
            $os_code = "windows";
            $os_ver = '';
        }
        if (preg_match('/smartphone/i', $ua)) {
            $os_name = "Microsoft Smartphone";
            $os_code = "windows";
            $os_ver = '';
        }
    } else{
        $os_name = 'Unknow Os';
        $os_code = 'other';
    }

    return array($os_name, $os_code, $os_ver, $pda_name, $p极a_code, $pda_ver);
}

// ... [All subsequent PHP functions remain unchanged] ...
```

Replace all instances of `http://cdn.lantian.lt/usr/themes/hybridside` in the code with your theme folder's URL.

In your theme's custom comment code, insert the following where you want to display the commenter's country:

```php
<?php echo CID_get_flag($comments->ip);?>
```

Insert the following where you want to display the operating system and browser:

```php
<?php echo CID_browser_string($comments->agent);?>
```

After making these modifications, test the results.
```
