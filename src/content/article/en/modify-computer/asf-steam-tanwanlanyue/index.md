---
title: 'Let ASF Help You "Play" Greedy Moon on Steam'
categories: Computers and Clients
tags: [Steam, Greedy Moon]
date: 2018-01-16 22:02:00
image: /usr/uploads/2018/01/3907525424.png
autoTranslated: true
---


Recently, Greedy Moon (贪玩蓝月) has gained popularity due to its brainwashing advertisements. Many tutorials have emerged showing how to add a custom program to Steam and rename it to "Greedy Moon" to display yourself as playing the game. However, this method requires keeping that custom program running constantly, which can be inconvenient.

ASF (ArchiSteamFarm) is a program that simulates game play to farm Steam trading cards. Since it can simulate game play, it can naturally also simulate playing "Greedy Moon" - achieving the effect shown below without any local configuration:

![Steam Greedy Moon][1]

To implement this effect, modify the ASF configuration on your host machine running ASF. Open `config/[BotName].json` and modify these three parameters:

```json
"CustomGamePlayedWhileFarming": "贪玩蓝月",
"CustomGamePlayedWhileIdle": "贪玩蓝月",
"FarmOffline": false,
```

1. The first parameter sets the displayed name while farming cards.
2. The second parameter sets the name shown after completing card farming.
3. The third parameter controls "offline farming" (not showing online status while farming). This must be disabled (false), otherwise friends won't see your status.

After making these changes, restart ASF to activate the Greedy Moon effect.

[1]: /usr/uploads/2018/01/3907525424.png
