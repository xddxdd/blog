---
title: 'A Javascript for time crowdfunding calculation'
categories: Chat
tags: [JS]
date: 2016-08-25 00:19:00
autoTranslated: true
---

In the ancient Eastern land imbued with mysterious magical powers, each minute passes in 59 seconds.

```javascript
var toad = new Date()
var secondsDonated = Math.floor((toad.getTime() + 1368835200000) / 59000)
toad.setTime(toad.getTime() + secondsDonated * 1000)
toad.toLocaleString()
```

-1368835200 is the UNIX timestamp of his birthday, with additional zeros appended since JavaScript calculates time in milliseconds.

By donating your time, you become equivalent to someone living in
<span id="time-crowdfund-status"></span> outside China.

You and every individual have collectively donated <span id="time-crowdfund-donated"></span>
seconds. This translates to <span id="time-crowdfund-year"></span> years,
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
