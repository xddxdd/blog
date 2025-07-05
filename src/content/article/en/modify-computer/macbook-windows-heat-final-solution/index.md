---
title: 'The Ultimate Solution for MacBook Overheating in Windows'
categories: Computers and Clients
tags: [Heat Dissipation, Mac]
date: 2014-05-03 15:50:08
image: /usr/uploads/2014/05/597218418.png
autoTranslated: true
---


[LubbosFanControl](/en/article/modify-computer/windows-control-macbook-fan.lantian) is indeed a magical tool for controlling fan speeds in Windows, but adjusting fan speed only treats the symptoms, not the root cause—it addresses heat dissipation without solving the core issue of excessive heat generation.

In macOS, when I use Chrome to browse Bilibili, CPU temperatures typically stabilize around 60°C and never exceed 70°C. However, performing the same operation in Windows 8 often pushes CPU temperatures above 70°C. I initially assumed Windows consumed more CPU resources, hence the higher temperatures.

But one day while watching videos, I opened Task Manager and discovered CPU usage was only around 53%. Meanwhile, my Core i5 processor had activated Turbo Boost, ramping up to 2.88GHz with temperatures hovering near 75°C.

<img src="/usr/uploads/2014/05/597218418.png" alt="QQ Screenshot 20140503154139.png" />

Turbo Boost technology in Core i5/i7 processors temporarily increases clock speeds under heavy workloads. The problem? This performance boost generates significantly more heat—a disaster for thermally constrained MBPs. Bizarrely, Windows often activates Turbo Boost unnecessarily during light tasks, maxing out CPU frequency and creating excessive heat. Thus, we need to disable Turbo Boost. A Core i5 without Turbo Boost still handles most tasks adequately.

**Steps:**
1. Click the battery icon in the system tray → "More power options" → Next to your active power plan, select "Change plan settings" → "Change advanced power settings".

2. Under "Processor power management":
   - Set both cooling policies to **Passive**
   - Set maximum processor state to **99%** for all modes  
   This prevents the system from triggering Turbo Boost when CPU usage peaks. Note: This won't affect LubbosFanControl's fan adjustments.

<img src="/usr/uploads/2014/05/1135873245.png" alt="QQ Screenshot 20140503154711.png" />

3. Click "OK". Now performing the same tasks, CPU frequency stays at 2.45GHz with temperatures between 65-70°C—significantly reduced heat output.

<img src="/usr/uploads/2014/05/409686842.png" alt="QQ Screenshot 20140503154857.png" />
```
