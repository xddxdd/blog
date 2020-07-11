---
title: '让 ASF 帮你在 Steam 中挂“贪玩蓝月”'
label: asf-steam-tanwanlanyue
categories: 计算机与客户端
tags: [Steam,贪玩蓝月]
date: 2018-01-16 22:02:00
image: /usr/uploads/2018/01/3907525424.png
---
最近贪玩蓝月因为其洗脑的广告而流行了起来，也出现了许多通过在 Steam 中添加自定义程序后重命名为“贪玩蓝月”，达到显示自己在玩贪玩蓝月效果的教程。不过这么做需要把那个自定义程序一直开着，有些时候还是比较麻烦的。

ASF（ArchiSteamFarm）则是一个模拟用户玩游戏，从而刷 Steam 交易卡掉落的程序。因为它能模拟用户玩游戏，自然也能模拟玩“贪玩蓝月”，在自己电脑上什么都不用设置的情况下达到如图效果：

![Steam 贪玩蓝月][1]

实现这个效果，在你运行 ASF 的主机上修改 ASF 的配置即可。打开 `config/[BOT 名称].json`，找到下面三行并修改成对应的参数：

    "CustomGamePlayedWhileFarming": "贪玩蓝月",
    "CustomGamePlayedWhileIdle": "贪玩蓝月",
    "FarmOffline": false,

第一项是在模拟玩 Steam 游戏时显示的名称，第二项是不模拟时（也就是交易卡挂完后）显示的名称。第三项是“离线挂卡”功能，就是模拟玩游戏时不在好友列表中显示上线，这项必须关闭，否则好友根本看不到你的状态。

改完重启 ASF 就有了贪玩蓝月的效果了。

  [1]: /usr/uploads/2018/01/3907525424.png
