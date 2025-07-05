---
title: 'Reflections on the NOIP Finals'
categories: Computers and Clients
tags: [OI]
date: 2012-11-10 22:21:10
autoTranslated: true
---


NOIP gets easier every year. After being crushed by problems on XJOJ before, it was finally my turn to dominate the questions.

First, Friday. Rumors spread all morning that XXY would rescue us from class. We went to ask our homeroom teacher for leave. Then we AC'd (got Accepted). After lunch, we took our parents' car to XJ.

In the car, my dad told me he installed Win8 for me to try. When I booted it up – x64... Turns out my sound card has bugs under Win8 x64 and won't work... Arrived at XJ, downloaded the x86 ISO, and reinstalled. While reinstalling, I pulled out my Nokia N81 to browse XJOJ...

Just arrived at XJ, the computer lab was packed. I immediately spotted JC and DZY – those two beasts heading to crush the advanced division. They'd rooted the school's system two days early and unlocked themselves.

Honestly, xuejun-wireless gets more godly by the day. It randomly makes the internet inaccessible. Previously, I struggled with short network cables, so this time I brought a super-long extension. Thought I'd solved the problem, only to discover XJ's network port had poor contact... Orz.

After installing the OS, I downloaded drivers while grinding OJ problems. They released a bizarre contest, but I didn't want to attempt it – didn't want to lose confidence... Decisively submitted sample answers. Scored 10 points total across 4 problems...

Another contest that night. I breezed through the first two easy problems, skipped the last two. Turned out the test data was weak – scored 200...

Next morning at XJ, another contest. XXY had already left to accompany the advanced division at Fourteenth High School. So we stared blankly at the empty contest page (zero problems!) until 10 AM when XXY returned, scolded us, and added the questions. Then 10 points – no explanation needed.

At 11 AM, a group went to eat. XXY suddenly roared: "Don't go eat! Eat at Fourteenth High!" Collective silence. We waited for them until 11:40. Then XXY told us to buy our own food and return by 12:00 – we got back at 12:06. Used those 20 minutes to download Perfect Decoder via xuejun-wireless to watch videos. On the bus, people set up WiFi hotspots. Various entertainment activities ensued. Also: all kinds of 3G, 2G, and other "G"s.

Arrived at Fourteenth High, immediately saw JC and DZY. I whipped out my phone for a photo – damn, it was blurry... Then we collected promo bags containing materials and an umbrella.

Went to the cafeteria. Took one look at the food and gave my meal ticket away – survived on the 11:40 "Fatty Pancake". Truly a classic shop. Then headed to Fourteenth High's auditorium.

The auditorium was chaotic: people live-posting on Weibo. We watched Fourteenth High's sports day footage. A kid sang at a frequency that put WiFi to shame – WiFi's 2.4Ghz, you know.

Then we entered the exam hall. The teacher wrote the password on the blackboard: "DoubleIncome2020"... Last year's "SeeYouInAdvancedDivNextYear" got thoroughly mocked. When will CCF ever use Chinese character passwords?

Unzipped the package, immediately moved everything to E: (no system restore). Win+R → cmd → e:\ → cd ZJ-xxxx → md xxx. Created all folders with md commands. Copied the PDF inside.

Opened the PDF. Problem 1: Given the product of two primes, find the larger one. RSA vibes. Brute-force was stressful, but generating a 27k lookup table worked.

Problem 2: Treasure hunt – climbing floors while calculating passwords. Straightforward simulation. With constrained data, time wasn't an issue.

Midway, staff handed out water and cake. (Brought my own Coke). Suddenly a girl's voice: "Teacher, I can't open this water bottle, WTF." Whole classroom paused for 3 seconds.

Problem 3: Flower arrangement – 100+ flower types. Some online said DP; I disagreed. Tried brute-force, got TLE on max data. Then remembered memoization ("Step Up" method) and crushed it.

Problem 4: Cultural exchange with Bug – envoys learning cultures while avoiding conflicts. Clearly Dijkstra territory, but we'd crammed quicksort, 0/1 knapsack, bubble sort... Brute-force passed only 30%... Added a check: if data too big, output -1. At least WA looks better than TLE.

Added file I/O to all programs, included data generators and old versions in comments. Copied everything to my folder. Started reading Pascal docs – same as last year. Some played Minesweeper. Others played Spider Solitaire.

Contest ended. Pulled out my phone immediately to post on Weibo – no signal jamming this year! Last year, jammed signals drained my battery... After posting, walked out to meet parents and classmates. Game Over.
```
