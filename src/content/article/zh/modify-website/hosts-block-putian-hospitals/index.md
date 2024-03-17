---
title: '一个屏蔽莆田系医院的 Hosts'
categories: 网站与服务端
tags: [Hosts, 莆田系]
date: 2016-06-18 12:39:00
---

    1980年代，位于东庄镇的陈德良通过自己研制的偏方，在本地成为著名的皮肤病（疥疮）游医，之后他招收门徒，开始向全国进军。他们最初在电线杆上张贴性病、皮肤病等小广告宣传，在中国大陆各地赚到“第一桶金”，后来改在电视与报纸刊登广告。主要治疗项目有性病、鼻炎、狐臭、肝炎、风湿、皮肤病等。莆田系最主要的势力是由詹氏家族、林氏家族、陈系家族和黄氏家族四个家族组成。

    这些游医最初采取找医院承包科室，将不合法的莆田系开始走向合法化与隐秘连锁的规模化发展；并用重金聘请公立医院医生。1998年，被外界称为“中国打假第一人”的王海，对备受社会诟病的性病游医展开调查，并发现中国全国所有性病游医几乎均来自福建省莆田市东庄镇。尽管由王海掀起的打击性病游医风波，对莆田系的扩张造成沉重打击，但莆田系发展却并没因此结束，相反，他们通过转型升级获得进一步发展。2000年，国务院发布指导意见，政府的非营利医疗机构不得与其他组织合作营利性的“科室”、“病区”、“项目”。2004年，承包科室被卫生部列入严打之列，众多莆田系合作项目因此被强行终止。后来王海发现，莆田系医院一直利用虚假宣传包装假医生的形式，向患者夸大或虚构病情敛财。此外，莆田系医院在线客服的“医生”均为没有接受专业医学教育的人员，他们通过自学的形式培训成为“医生”，以百度百科为培训教材。

    之后部分莆田系改变经营模式，通过兼并公立医院为私立医院，以及向部分公立医院领导送礼争取合作，逐渐形成主流；至今莆田系已掌握中国大陆80%的民营医疗市场。大多数莆田系医院仍通过专治旁门左病的方式，疯狂进行广告宣传和现金输出，获取大量病源；比如百度贴吧出卖“病友吧”、“血友病吧”给莆田系，获取大量佣金。莆田系还向医疗产业的上游发展，通过生产医药、医疗仪器等，并多在莆田系医院内部销售，以远高于市场均价的价格销售给患者获取大量收益。经营成功的医院会扩大规模，而经营失败的医院会转移地点。在百度2013年260亿元人民币的广告收入中，有120亿来自莆田系医院。而部分公立医院的诊所和中心仍然受到莆田系的控制，2016年爆发的魏则西事件印证了这一问题。

    ——维基百科，[https://zh.wikipedia.org/wiki/%E8%8E%86%E7%94%B0%E7%B3%BB](https://zh.wikipedia.org/wiki/%E8%8E%86%E7%94%B0%E7%B3%BB)

简单来说，莆田系医院通过大打广告、夸大患者病情等方式坑害患者，引起公愤。于
是，GitHub 上的一群程序员建立了 Open Power Group 小组，建立了收集莆田系医院信息
的项目
[open-power-workgroup/Hospital](https://github.com/open-power-workgroup/Hospital)
供人们查询，并开放其数据供各类查询客户端和浏览器插件使用。其数据可以在
[https://raw.githubusercontent.com/open-power-workgroup/Hospital/master/resource/API_resource/hospital_list.json](https://raw.githubusercontent.com/open-power-workgroup/Hospital/master/resource/API_resource/hospital_list.json)
下载到。

这是一个 JSON 格式的数据，可以被很容易地解码。从中截取的一小段示例如下：

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

该 JSON 包含 3 层信息：地区，医院名，以及医院的信息条目。利用这些信息，我制作了
一个 PHP 程序，可以通过该 JSON 提供的数据生成一个 Hosts，屏蔽这些莆田系医院的网
站，以防止患者误入。

但是在利用这些数据时需要注意，这个数据是直接存放在 GitHub 服务器上的，直接在软件
里使用这个地址是极其不明智的。曾经就有多款 12306 抢票插件直接引用了 GitHub 上的
JS 代码，结果导致 GitHub 服务器被几千万甚至几亿用户的访问量直接打崩。因此，就需
要在本地留下缓存，以减轻 GitHub 的压力。

我制作的 Hosts 可以在
[https://lab.lantian.pub/putianhosts.php](https://lab.lantian.pub/putianhosts.php)
看到，每30分钟向 GitHub 发起一次数据更新请求，并可以同时屏蔽带www和不带www的域
名。将这个 URL 加入 AdAway 等 Hosts 自动更新软件，就可以随时自动更新了。

这段 PHP 的源代码如下：

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
