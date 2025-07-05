---
title: 'A Hosts File to Block Putian Hospitals'
categories: Website and Servers
tags: [Hosts, Putian System]
date: 2016-06-18 12:39:00
autoTranslated: true
---


In the 1980s, Chen Deliang from Dongzhuang Town became locally famous as an itinerant doctor treating skin diseases (scabies) using his self-developed folk remedies. He later took on disciples and expanded nationwide. Initially posting advertisements for sexually transmitted diseases and skin conditions on utility poles, they earned their "first bucket of gold" across mainland China before shifting to TV and newspaper ads. Their primary treatments included STDs, rhinitis, body odor, hepatitis, rheumatism, and skin diseases. The Putian system is primarily controlled by four families: the Zhans, Lins, Chens, and Huangs.

These itinerant doctors initially contracted hospital departments, legitimizing and covertly scaling their operations while recruiting public hospital doctors with high salaries. In 1998, Wang Hai—known as "China's No.1 Anti-Counterfeiting Crusader"—investigated the controversial STD clinics and discovered nearly all originated from Dongzhuang Town, Putian City, Fujian. Though Wang's campaign dealt a blow to their expansion, the Putian system adapted by upgrading operations. In 2000, the State Council banned non-profit medical institutions from collaborating on for-profit "departments," "wards," or "projects." By 2004, contracted departments faced strict crackdowns, terminating many Putian partnerships. Wang later exposed how Putian hospitals used false advertising to exaggerate or fabricate illnesses for profit. Their online "doctors" lacked medical training, instead relying on self-education via Baidu Baike.

Subsequently, some shifted to acquiring public hospitals or bribing officials for partnerships, now controlling 80% of China's private healthcare market. Most still specialize in niche ailments, aggressively advertising to attract patients—e.g., Baidu sold "Patient Forum" and "Hemophilia Forum" to them for hefty commissions. They also expanded upstream, producing medical supplies sold internally at inflated prices. Successful hospitals scale up; failed ones relocate. In 2013, 12 of Baidu's 26 billion RMB ad revenue came from Putian hospitals. Some public hospital clinics remain under their control, as exposed by the 2016 Wei Zexi incident.

— Wikipedia, [https://zh.wikipedia.org/wiki/%E8%8E%86%E7%94%B0%E7%B3%BB](https://zh.wikipedia.org/wiki/%E8%8E%86%E7%94%B0%E7%B3%BB)

In short, Putian hospitals harm patients through deceptive advertising and exaggerated diagnoses, sparking public outrage. In response, GitHub programmers formed the Open Power Group and created the [open-power-workgroup/Hospital](https://github.com/open-power-workgroup/Hospital) project to catalog these hospitals. The data is open for clients and browser extensions, downloadable at:  
[https://raw.githubusercontent.com/open-power-workgroup/Hospital/master/resource/API_resource/hospital_list.json](https://raw.githubusercontent.com/open-power-workgroup/Hospital/master/resource/API_resource/hospital_list.json)

This JSON data is easily parsable. A sample snippet:

```json
{
  "成都": {
    "成都美莱医学美容医院": {
      "证据": ["参见文末美莱医疗美容连锁医院集团条目"],
      "电话": ["02868268888"],
      "网址": ["hxxp://www.scmylike.com/（http 被我手动和谐成了 hxxp）"],
      "地址": ["成都市青华路31号杜甫草堂北大门旁"]
    }
  }
}
```

The JSON has three layers: region → hospital name → hospital details. Using this, I created a PHP script to generate a Hosts file blocking these hospitals' websites, preventing patient exposure.

However, directly fetching this JSON from GitHub in software is unwise—recall when 12306 ticket plugins overloaded GitHub with millions of requests. Local caching is essential to reduce GitHub load.

My Hosts file is available at:  
[https://lab.lantian.pub/putianhosts.php](https://lab.lantian.pub/putianhosts.php)  
It updates from GitHub every 30 minutes, blocking both www and non-www domains. Add this URL to AdAway or similar tools for automatic updates.

The PHP source:

```php
<?php
    // fix charset bug
    header("Content-Type: text/plain; charset=UTF-8");
    echo "# Putian-Hosts 屏蔽莆田系医院的 Hosts\n";
    echo "# 数据来自 Open Power Workgroup @ https://github.com/open-power-workgroup/Hospital\n";
    error_reporting(0);
    define("OPW_CACHE","hospital_list.json");
    define("OPW_ORIGIN","https://raw.githubusercontent.com/open-power-workgroup/Hospital/master/resource/API_resource/hospital_list.json");
    define("OPW_UPDATE_INTERVAL",1800);
    if(time() - filemtime(OPW_CACHE) >= OPW_UPDATE_INTERVAL){
        $ptjson = file_get_contents(OPW_ORIGIN) or die("# 无法获取源数据！");
        $pttime = time();
        file_put_contents(OPW_CACHE,$ptjson);
    } else {
        $ptjson = file_get_contents(OPW_CACHE);
        $pttime = filemtime(OPW_CACHE);
    }
    $ptdata = json_decode(file_get_contents(OPW_CACHE),true);
    date_default_timezone_set("Asia/Shanghai");
    echo "# 上次刷新日期 ".date("Y-m-d A h:i:s",$pttime)."\n";
    // 列出所有的城市
    foreach($ptdata as $ptcityinfo){
        // 列出该城市所有莆田系医院
        foreach($ptcityinfo as $pthospital => $pthospitalinfo){
            // 列出网址
            foreach($pthospitalinfo["网址"] as $ptwebsite){
                //处理出不带www的裸域名并屏蔽
                $pthost = str_replace(array("http://","/","www."),"",$ptwebsite);
                echo "0.0.0.0\t".$pthost."\t# ".$pthospital."\n";
                //带www的也屏蔽
                echo "0.0.0.0\twww.".$pthost."\t# ".$pthospital."\n";
            }
        }
    }
?>
```
```
