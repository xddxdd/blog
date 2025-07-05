---
title: 'The Legend of Class 63 — Summit of No.2 High School: Reverse Engineering and Easter Egg Hunt in the Demon Tower Game'
categories: Chat
tags: [No.2 High School, Demon Tower]
date: 2014-02-03 23:01:00
image: /usr/uploads/2014/02/530548245.png
autoTranslated: true
---


These nights I've been attending chemistry Olympiad classes. During yesterday's session, our chemistry teacher invited several seniors to share their experiences. As they chatted, they mentioned a Demon Tower game they developed in their free time — "The Legend of Class 63: Summit of No.2 High School".

![/usr/uploads/2014/02/530548245.png](/usr/uploads/2014/02/530548245.png)

Such an impressive game with Hangzhou No.2 High School elements naturally made me curious about its Easter eggs. Instead of playing through, reverse engineering seemed more efficient.

The seniors mentioned using RPG Maker XP. Easy enough — downloaded it from [http://xiazai.zol.com.cn/detail/43/426737.shtml](http://xiazai.zol.com.cn/detail/43/426737.shtml)

Noticing the 9MB Game.rgssad file, I tried opening it with 7-Zip. No luck.

![/usr/uploads/2014/02/2010882355.png](/usr/uploads/2014/02/2010882355.png)

The file properties revealed:

![/usr/uploads/2014/02/1183876371.png](/usr/uploads/2014/02/1183876371.png)

Encrypted? Interesting. A game that doesn't require passwords must have a decryption method.

Googling led me to an RGSSAD unpacker: [http://www.pc6.com/softview/SoftView_62304.html](http://www.pc6.com/softview/SoftView_62304.html)

After extraction, I created a new RPG Maker XP project and replaced its data files. Now, let's hunt for Easter eggs.

First, examining the map list:

![/usr/uploads/2014/02/1995936471.png](/usr/uploads/2014/02/1995936471.png)

**School History Museum:**

![/usr/uploads/2014/02/3589412933.png](/usr/uploads/2014/02/3589412933.png)

1899 event:
> 1895: Demons obtained the power of Valor, Dominance, and Wisdom.  
> 1899: American missionary W.S. Sweet created the Demon-Slaying Sword and Shield to seal the Three Demon Lords at our school site. He founded Huilan Academy to protect the artifacts, later transformed into the "Principal's Sword" and "Principal's Shield".

1923 event:
> High school department added. Artifacts passed down through principals.

1940 event:
> Demon King She Tianwang invaded. Artifacts depleted energy during defense. National Zhejiang University Affiliated High School established to resist.

1951 event:
> Merger of Huilan Academy and ZJU Affiliated High School into Hangzhou No.2 High School.

1995 event:
> School designated as provincial key high school to combat revived demons.

2000 event:
> New campus built on former seal site, preventing demon resurgence.

**Sage Tower**

Ground floor NPC (Grandpa Lai):
![/usr/uploads/2014/02/2852339400.png](/usr/uploads/2014/02/2852339400.png)
> "The Sage's power resides here. Defeat the boss to summon the true Sage!"

Top floor boss (Parrot):
![/usr/uploads/2014/02/109403124.png](/usr/uploads/2014/02/109403124.png)
> After battle: "I guarded this vial containing the Sage's essence. The path is open now."

**Brave Tower**

Ground floor:
![/usr/uploads/2014/02/2996602411.png](/usr/uploads/2014/02/2996602411.png)
> Fat Bro: "Math is too hard!"  
> Player: "Is it?"  
> Fat Bro: "For the brave, nothing is difficult!"

Third floor:
![/usr/uploads/2014/02/3727711326.png](/usr/uploads/2014/02/3727711326.png)
> Xiaohuihui: "CCZL is behind this!"  
> CCZL battle reveals: "The Dark Demon met with Class Monitor. Rescue captured classmates!"

**Overlord Tower**

Ground floor:
![/usr/uploads/2014/02/4079948483.png](/usr/uploads/2014/02/4079948483.png)
> Divine Ox Bian: "Demons clone classmates! Defeat replicas to save real ones."

Top floor:
![/usr/uploads/2014/02/1469884290.png](/usr/uploads/2014/02/1469884290.png)
> Dark Demon: "Each tower corresponds to campus locations — Sage Tower by the lake, Brave Tower at cafeteria, this one at lab building with massive power needs."

The game intricately weaves school landmarks with RPG elements, packed with inside jokes and historical references familiar to No.2 High students. Reverse engineering revealed a treasure trove of creative world-building hiding beneath its pixelated surface.
