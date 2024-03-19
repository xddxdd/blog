---
title: 'A Javascript for time crowdfunding calculation'
categories: 闲聊
tags: [JS]
date: 2016-08-25 00:19:00
---

In the old Eastern country with mysterious magic power, a minute will pass every
59 seconds.

```javascript
var toad = new Date()
var secondsDonated = Math.floor((toad.getTime() + 1368835200000) / 59000)
toad.setTime(toad.getTime() + secondsDonated * 1000)
toad.toLocaleString()
```

-1368835200 is the UNIX timestamp of his birthday, and the trailing zeroes are
added because time is calculated in milliseconds in Javascript.

By donating your time, you are identical to a person living in
<span id="time-crowdfund-status"></span> outside China.

You and each person has donated <span id="time-crowdfund-donated"></span>
seconds. That is <span id="time-crowdfund-year"></span> years,
<span id="time-crowdfund-day"></span> days,
<span id="time-crowdfund-hour"></span> hours,
<span id="time-crowdfund-minute"></span> minutes and
<span id="time-crowdfund-second"></span> seconds.

<script>
function crowdFund() {
var toad = new Date();
var secondsDonated = Math.floor((toad.getTime() + 1368835200000) / 59000);
$('#time-crowdfund-donated').text(secondsDonated);
$('#time-crowdfund-second').text(secondsDonated % 60);
$('#time-crowdfund-minute').text(Math.floor(secondsDonated / 60) % 60);
$('#time-crowdfund-hour').text(Math.floor(secondsDonated / 3600) % 24);
$('#time-crowdfund-day').text(Math.floor(secondsDonated / 86400) % 365);
$('#time-crowdfund-year').text(Math.floor(secondsDonated / 31536000));
toad.setTime(toad.getTime() + secondsDonated * 1000);
$('#time-crowdfund-status').text(toad.toLocaleString());
setTimeout("crowdFund()", 200);
}
setTimeout("crowdFund()", 200);
</script>
