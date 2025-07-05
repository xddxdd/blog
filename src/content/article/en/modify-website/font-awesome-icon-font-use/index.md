---
title: 'Using Font Awesome Icon Fonts'
categories: Website and Servers
tags: [fontawesome]
date: 2014-08-18 18:15:00
autoTranslated: true
---


Font Awesome is an open-source icon library. Its latest version 4.1 provides 439 vector icons that can match screens of various sizes and resolutions. It exists as a font, and a single 71KB file contains all these icons. These icons feature a unified style and can be conveniently used in various contexts.

1. Installation

First, download Font Awesome:  
[https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.1.0.zip](https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.1.0.zip)

Then unzip the file and upload its contents to your website.

Add the following code in the `<head>` section of your webpage:

```html
<link
  rel="stylesheet"
  href="http://your-website/folder/font-awesome/css/font-awesome.min.css"
/>
```

This completes the installation.

2. Usage

[https://fortawesome.github.io/Font-Awesome/icons/](https://fortawesome.github.io/Font-Awesome/icons/)  
provides a reference table of icon class names. Find your desired icon (e.g., `fa-cloud`) and insert this code in your webpage:

```html
<i class="fa fa-cloud"></i>
```

Effect: <em class="fa fa-cloud"></em>

To enlarge icons, add classes like `fa-lg`, `fa-2x`, `fa-3x`, `fa-4x`, or `fa-5x`:

```html
<i class="fa fa-cloud fa-lg"></i>
<i class="fa fa-cloud fa-2x"></i>
<i class="fa fa-cloud fa-3x"></i>
<i class="fa fa-cloud fa-4x"></i>
<i class="fa fa-cloud fa-5x"></i>
```

Effect: <em class="fa fa-cloud fa-lg"></em><em class="fa fa-cloud fa-2x"></em><em class="fa fa-cloud fa-3x"></em><em class="fa fa-cloud fa-4x"></em><em class="fa fa-cloud fa-5x"></em>

Some icons also support animation:

```html
<i class="fa fa-spinner fa-spin"></i>
<i class="fa fa-circle-o-notch fa-spin"></i>
<i class="fa fa-refresh fa-spin"></i>
<i class="fa fa-cog fa-spin"></i>
```

Effect: <em class="fa fa-spinner fa-spin"></em><em class="fa fa-circle-o-notch fa-spin"></em><em class="fa fa-refresh fa-spin"></em><em class="fa fa-cog fa-spin"></em>

Using these icons allows for more intuitive representation of website functionalities without compromising loading speed.
```
