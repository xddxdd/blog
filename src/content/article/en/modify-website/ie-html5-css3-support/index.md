---
title: 'Adding HTML5 and CSS3 Support for IE'
categories: Website and Servers
tags: [IE8, CSS, HTML]
date: 2013-10-03 17:08:23
autoTranslated: true
---


Since I started this blog, I never considered the experience of IE users. At that time, my browser was Firefox, and the only use I had for IE was to download Firefox. Now I use Chrome on Windows, Chrome on Mac, and Opera on my phone. I thought I could bid farewell to IE compatibility forever.

But I didn't expect to be defeated by the electronic reading room at Hangzhou No. 2 High School.

Firefox installer: 20MB. Chrome installer: 30MB. They don't seem large, right? But the electronic reading room apparently uses QoS for smoother web browsing. QoS is fine, but it has bugs—the average speed per machine there is 50Kbps. With only half an hour of internet access per visit, spending over ten minutes downloading a browser is truly frustrating!

Additionally, they use XP systems with IE8 browsers. So, to make my website look decent, I reluctantly decided to add IE compatibility.

### 1. HTML5 Compatibility

My website extensively uses HTML5 technology. While this allows modern browsers to prioritize rendering the main content and speed up page loading, it looks terrible on IE8 which doesn't support HTML5. The recent comments section on the right expanding to 100% width—is that acceptable?

Therefore, solving the layout issues caused by HTML5 is crucial. The solution is to make IE recognize HTML5 tags.

HTML5Shiv addresses the issue where new HTML5 elements aren't recognized by IE6-8. These elements can't wrap child elements as parent nodes and can't have CSS styles applied. Applying CSS styles to unknown elements simply requires executing `document.createElement(elementName)`.

By adding HTML5Shiv, we achieve IE6-8 compatibility.

**Method:**
1. Download [HTML5Shiv source code](https://github.com/aFarkas/html5shiv/zipball/master) and upload it to your web server.
2. Add the following code to the `<head>` section of your webpage:
```html
<!--[if lt IE 9]><script src="html5shiv.js"></script><![endif]-->
```
3. Refresh the page to see the effect.

### 2. CSS3 Compatibility

While CSS3 greatly enhances webpage aesthetics, it makes pages look awful in IE. The second issue to solve is CSS3 support.

CSS3Pie is a plugin for IE6-9 that enables support for the most common CSS3 properties:  
`border-radius`, `box-shadow`, `border-image`, `multiple background images`, `linear-gradient as background image`.

Thus, we can add CSS3Pie to optimize webpage display.

**Method:**
1. Download [CSS3Pie 2.0](http://css3pie.com/download-latest-2.x) and upload all files to your server.
2. Locate CSS sections using the supported properties (e.g., in my CSS, only `#container` uses them).
3. Add this code to the relevant CSS block:
```css
behavior: url(PIE.htc);
```
*Note: The path to `PIE.htc` is relative to the webpage, not the CSS file.*
4. Clear cache and refresh to see the effect.

During testing, CSS3 effects only appear after the page fully loads, so your page loading speed is also important.
```
