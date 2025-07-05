---
title: 'Enabling Color Display in Bash'
categories: Computers and Clients
tags: [Bash]
date: 2016-07-18 10:41:00
image: /usr/uploads/2016/07/1736856861.png
autoTranslated: true
---


The default Bash command line in Linux is always black text on a white background, which can appear somewhat monotonous. However, we can add a few lines of commands to make Bash display information in color. This not only enhances visual appeal but also helps highlight important content.

<img src="/usr/uploads/2016/07/1736856861.png" alt="Screenshot 2016-07-18 at 10.36.27 AM.png" />

Edit the `.profile` file in your home directory:

<pre class="prettypaint">
nano ~/.profile
```

Add the following at the end of the file:

<pre class="prettypaint">
export LS_OPTIONS='--color=auto'
eval "`dircolors`"
alias ls='ls $LS_OPTIONS'
alias ll='ls $LS_OPTIONS -l'
alias l='ls $LS_OPTIONS -lA'
PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u\[\033[00m\]@\[\033[01;36m\]\h\[\033[00m\]:[\[\033[01;34m\]\w\[\033[00m\]]\$ '  
```

Save and exit, then either restart Bash or enter:

<pre class="prettypaint">
source ~/.bashrc
```

You will now see a colorful command line.
```
