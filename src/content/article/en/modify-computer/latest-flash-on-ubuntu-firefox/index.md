---
title: 'Using the Latest Version of Flash on Ubuntu Firefox'
categories: Computers and Clients
tags: [flash]
date: 2014-12-13 13:32:05
autoTranslated: true
---


About a year ago, Adobe ceased new feature development for its Flash plugin on Linux systems, providing only security updates. The Linux version of Flash remained at version 11.2, while the latest Windows version had already advanced to 15.0.

However, Adobe collaborated with Google to develop Pepper Flash, which is integrated into the Chrome browser. Both Chrome and its built-in Pepper Flash have consistently stayed up-to-date on Linux.

This raises the question: Since Pepper Flash is exclusive to Chrome, how can we make it work in Firefox?

Some hoped Mozilla would actively support Pepper Flash, but the Firefox development team rejected the proposal: [https://bugzilla.mozilla.org/show_bug.cgi?id=729481](https://bugzilla.mozilla.org/show_bug.cgi?id=729481)

Consequently, an international developer [Rinat Ibragimov](https://github.com/i-rinat) created a plugin enabling Firefox to use Pepper Flash.

Although this plugin isn't yet perfect (hardware acceleration is unstable, and some features are missing), its core functionality works reliably.

On Ubuntu, you can install this software by adding WebUpd8's PPA repository:

```bash
sudo add-apt-repository ppa:nilarimogard/webupd8
sudo apt-get update
sudo apt-get install freshplayerplugin pepperflashplugin-nonfree
```
```
