---
title: 'Manually Setting CPU Fan Cooling for Macbook'
categories: Computers and Clients
tags: [Temperature, CPU, Fan, Laptop, Apple]
date: 2013-07-20 09:55:36
image: /usr/uploads/2013/07/445511655.png
autoTranslated: true
---


When designing products, Apple always strives to make devices as thin as possible. For phones, this isn't a major issue, but for laptops, thinner designs often lead to hotter machines!

If the CPU consistently operates at high temperatures, it will age faster, shortening its lifespan and requiring earlier replacement. Therefore, monitoring CPU temperature is crucial.

I noticed this issue while watching videos on Bilibili – my Macbook's exhaust vents were extremely hot. I immediately realized I needed temperature monitoring software.

That's when I found [smcFanControl](http://www.eidac.de/?p=243), a tool that monitors CPU temperature and controls fan speed. It displays real-time CPU temperature and fan RPM in the menu bar.

After downloading the .app file, right-click any Dock icon (except Finder, window icons, Downloads, or Trash), select Options > Show in Finder, then drag the app into the folder. Launch it via Launchpad.

![smcFanControl Menu Bar Screenshot](/usr/uploads/2013/07/445511655.png)

Since I'm on macOS 10.9 and the software officially supports up to 10.8, it showed a compatibility warning. But in my tests, it worked perfectly on 10.9. Note: Don't run other fan control software simultaneously to avoid conflicts.

Upon opening, I saw alarming readings: CPU at 90°C with fans at only 2000 RPM. What's going on here!!!

My previous Asus laptop would automatically max out fans at 80°C, cooling the CPU to 70°C within 30 seconds. That's proper CPU protection. Apple, what were you thinking!!!

I clicked the menu icon and opened Preferences.

![smcFanControl Menu](/usr/uploads/2013/07/1980939657.png)

In the main interface, I clicked "+" to create a "Max Speed" profile, dragging the slider to 6200 RPM.

![smcFanControl Settings](/usr/uploads/2013/07/1127560382.png)

Within 10 seconds, the fans roared to life. After a minute, CPU temperature dropped to 65°C.

However, running fans at maximum speed long-term accelerates wear. I set a "Higher RPM" profile at 5000 RPM, which maintains my Macbook at a safe 65°C during testing.

Now, whenever the CPU exceeds 70°C, I activate Max Speed until it cools to ~65°C, then switch to Higher RPM. The noise is noticeable, but machine safety comes first.
```
