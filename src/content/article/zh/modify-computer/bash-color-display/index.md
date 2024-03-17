---
title: '启用 Bash 的彩色显示'
categories: 计算机与客户端
tags: [Bash]
date: 2016-07-18 10:41:00
image: /usr/uploads/2016/07/1736856861.png
---

Linux 默认的 Bash 命令行总是黑底白字，有些单调。但我们可以通过加几行命令，让
Bash 以彩色显示信息，不仅美观，而且可以突出重点内容。

<img src="/usr/uploads/2016/07/1736856861.png" alt="屏幕快照 2016-07-18 上午10.36.27.png" />

编辑你的Home目录下的.profile文件：

<pre class="prettypaint">
nano ~/.profile
```

在文件末尾加上：

<pre class="prettypaint">
export LS_OPTIONS='--color=auto'
eval "`dircolors`"
alias ls='ls $LS_OPTIONS'
alias ll='ls $LS_OPTIONS -l'
alias l='ls $LS_OPTIONS -lA'
PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u\[\033[00m\]@\[\033[01;36m\]\h\[\033[00m\]:[\[\033[01;34m\]\w\[\033[00m\]]\$ '  
```

保存退出，然后重进 Bash 或者输入：

<pre class="prettypaint">
source ~/.bashrc
```

就可以看到彩色的命令行了。
