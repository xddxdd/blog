---
title: 'Controlling MacBook Fan Speed on Windows'
categories: Computers and Clients
tags: [fan, Mac, Windows]
date: 2013-10-01 15:00:54
image: /usr/uploads/2013/10/566121349.png
autoTranslated: true
---


MacBook's thermal management is a perpetual pain point for users. Apple's cooling strategy is extremely conservative, only ramping up fan speeds when CPU temperatures exceed 90°C, which significantly harms both the CPU and user experience.

This morning after installing Windows 8.1 and watching some online videos, I accidentally touched the exhaust vent while moving the laptop... you know how that feels.

Therefore, since Apple's thermal control strategy falls short, we'll take matters into our own hands using software.

Initially, I tried iFanAutoControl. The software detected my CPU temperature at 70°C, rapidly increased fan speed, and brought temperatures down to 50°C. But after setting the laptop aside, the fan stubbornly maintained 6000 RPM – does this software only accelerate without deceleration? ...Uninstalled.

After uninstallation, the fan kept spinning wildly. Only a full shutdown and cold boot resolved it (a simple restart didn't work).

Then I discovered a fantastic tool: LubbosFanControl. Though somewhat dated with built-in profiles for older Nvidia-based Macs, it performed poorly on my integrated graphics model.

I launched the software (surprisingly without admin rights). It reported my CPU at 90°C – alarmingly high! The fan immediately jumped to 6000 RPM. Yet after a while, while temperatures stubbornly showed 90°C, the exhaust air felt nowhere near that hot when I touched it.

![Lubbos Fan Control](/usr/uploads/2013/10/2933104397.png)

A Google search revealed outdated sensor parameters in the old version. I edited the .ini configuration file, adjusting sensor settings, GPU count, and CPU count to match my MacBook. After relaunching, LubbosFanControl correctly detected 57°C with normal fan control.

I tested it with a CPU/GPU-intensive video: [Railgun Era](http://www.bilibili.tv/video/av719948/) (2160p@120fps – impossible for integrated graphics). Upon playback, CPU usage spiked and fan speed increased appropriately. Closing the video triggered automatic fan slowdown – success!

![/usr/uploads/2013/10/566121349.png](/usr/uploads/2013/10/566121349.png)

Modified LubbosFanControl download (fully supports mid-2012 integrated graphics MBP): [LubbosFanControl.7z](/usr/uploads/2013/10/1691255080.7z)
```
