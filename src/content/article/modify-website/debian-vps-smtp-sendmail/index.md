---
title: 'Debian VPS 设置SMTP发信'
categories: 网站与服务端
tags: [WordPress,SMTP,sendmail]
date: 2014-08-02 21:15:32
---
在博客中，当博主对访客的评论作出回复，除非访客再次来访，否则很难发现博主已经回复了自己。但是通过评论回复邮件通知功能，在博主或者其他访客回复访客评论的时候，访客会收到邮件，从而及时得知自己收到了回复。

但是在最常用的WordPress博客系统中，一般只能通过系统默认的sendmail发送邮件，这样的邮件很容易进入垃圾箱，因此我们一般选用腾讯、微软、Google等提供域名邮箱和他们的邮件服务，这就需要通过SMTP发邮件。问题是sendmail并不支持SMTP，我们可以在博客系统中通过插件解决问题。

但是这种方法有局限，如果VPS提供商屏蔽了25端口（SMTP标准端口）那么某些不支持通过SSL加密的SMTP发送的博客系统也发不了邮件。而且如果你的VPS上运行好几个网站、不同网站程序，逐个设置非常麻烦也容易出错。

所以我们可以在VPS中直接安装SMTP邮件发送软件来解决问题。

eSMTP是一款和sendmail语法兼容的软件，它可以把sendmail要发送的邮件通过SMTP来发送。

登陆你的VPS，输入以下命令：

```bash
sudo apt-get install esmtp
sudo ln -s /usr/bin/esmtp /usr/bin/sendmail
sudo nano /etc/esmtprc
```

在hostname=后填入SMTP服务器地址，如果不是25端口那么需要指定端口号。Gmail的SMTP服务器地址是smtp.gmail.com:587。

在username=后填入邮箱地址，password=后填入邮箱密码。

如果邮件服务器支持StartTLS，那么把starttls=后面的disabled改成enabled。Gmail支持这么做。

在mda=后填入"/usr/bin/procmail -d %T"（包括双引号）

最后文件应该看起来像这样：

```bash
# Config file for ESMTP sendmail

# The SMTP host and service (port)
hostname=smtp.gmail.com:587

# SECURITY WARNING: Do NOT set username and password in the system wide
# configuration file unless you are the only user of this machine. See
# esmtprc(5).

# The user name
username=邮件地址@gmail.com

# The password
password=密码

# Whether to use Starttls
starttls=enabled

# The certificate passphrase
#certificate_passphrase=

# The Mail Delivery Agent
mda="/usr/bin/procmail -d %T"
```

Ctrl+X保存文件并退出。

修改你的php.ini，查找到sendmail_path一行，修改成：

```bash
sendmail_path = /usr/bin/esmtp -t -i
```

保存，输入以下命令：

```bash
sudo service apache2 restart #使用Apache2做服务器
sudo service php5-fpm restart #使用nginx或者其它基于php5-fpm的方式做服务器
```

配置完成，你可以在博客系统里发送一封邮件来进行测试。</p></li></ol>