---
title: 'Adding an Easter Egg in "Developer Tools"'
categories: Website and Servers
tags: [JS, Easter Egg]
date: 2014-08-11 14:18:00
image: /usr/uploads/92411407737467.png
autoTranslated: true
---


![/usr/uploads/92411407737467.png](/usr/uploads/92411407737467.png)

In Chrome Developer Tools, there's a section called the "Console" where we can add some Easter egg messages, for example:

```bash
Welcome to Lan Tian @ Blog.
```

If you can see these lines, then you definitely don't have a girlfriend.

These messages can be output using JavaScript with the following implementation code:

```javascript
if(window.console){
    var cons = console;
    if (cons){
        cons.warn('%cWelcome to Lan Tian @ Blog.','color:#09f');
        cons.warn('If you can see these lines,');
        cons.warn('then you definitely don\'t have a girlfriend.');
    }
}
```

When `cons.warn` takes only one parameter, it outputs that sentence in the console. If it takes two parameters and the first parameter (the message) starts with `%c`, then the second parameter is CSS code.

Using `cons.warn` will display a yellow triangle at the beginning of the output. Using `cons.log` shows nothing at the beginning, while `cons.error` displays a red cross, as shown in the image.

![/usr/uploads/20140811/1407737826162144.png](/usr/uploads/20140811/1407737826162144.png)

Place this modified code in your website's `footer.php` template and refresh the page to see the effect.
```
