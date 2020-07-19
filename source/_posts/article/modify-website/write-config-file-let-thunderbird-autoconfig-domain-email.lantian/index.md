---
title: '编写配置文件，让 Thunderbird 自动配置域名邮箱'
categories: 网站与服务端
tags: [邮件,Thunderbird,域名邮箱]
date: 2018-06-01 14:45:00
image: /usr/uploads/2018/06/1206081669.png
---
许多人在自己的网站域名上设置了邮箱系统，我也在主站 lantian.pub 的域名上使用了 Zoho 的域名邮箱。不过使用域名邮箱的一大缺点是，你很难记住邮件系统的 POP3、IMAP、SMTP 等服务器地址，一旦出现重装系统、重装邮件客户端等情况，需要重新配置时，就不得不再登上邮件系统去查看服务器地址，非常麻烦。

不过，如果你用的是 Thunderbird 邮件客户端，在设置账户时，你可能注意到，Thunderbird 在添加账户时，会有一个“从邮件服务商获取设置”的过程。这个过程实质上就是从这个域名的网站服务器上请求一份 XML 文档，其中记录了邮件服务器的设置。因此，只要手动编写这份配置文件，并将它放在网站服务器上，就可以实现 Thunderbird 下的自动配置了。

创建配置文件
------

配置文件中保存了 POP3、IMAP、SMTP 服务器的地址、端口号、用户名等信息。对于本站使用的 Zoho 邮件系统，配置文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="lantian.pub">
    <domain>lantian.pub</domain>
    <displayName>Lan Tian @ Mail</displayName>
    <displayShortName>Lan Tian Mail</displayShortName>
    <incomingServer type="imap">
      <hostname>imappro.zoho.com</hostname>
      <port>993</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <incomingServer type="pop3">
      <hostname>poppro.zoho.com</hostname>
      <port>995</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>smtp.zoho.com</hostname>
      <port>465</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </outgoingServer>
  </emailProvider>
</clientConfig>
```

可以看到，这个 XML 文件记录了 IMAP、POP3、SMTP 三个服务器的域名、端口、加密方式、认证方式。如果你也使用 Zoho 系统，把上面的 lantian.pub 替换成你自己的域名，就可以直接拿去用了。

如果你使用的是其它邮件系统，就要把对应的邮件服务器地址替换进去。但是，替换后也可能会遇到问题，提示“用户名密码错误”。这是因为邮件客户端在发送用户名密码的时候，可能以明文方式发送，也可能进行 MD5 加密后再发送。如果服务器不支持某种方式，就会出问题。

那么如何知道邮件服务器支持的认证方式呢？打开 Thunderbird，在添加账户界面选择“手动配置”，填入服务器配置，然后在“认证 / Authentication”一栏全部选择“自动检测 / Autodetect”，如图：

![Thunderbird 添加账户][1]

然后点击下面的“重新测试 / Re-test”，稍等片刻：

![Thunderbird 服务器认证方式变化][2]

认证方式一栏就会发生变化。“普通密码 / Normal password” 就是明文方式发送密码，对应 XML 文件 authentication 字段的 password-cleartext 值；“加密密码 / Encrypted password” 就是 MD5 加密，对应 password-encrypted。

如果你需要更复杂的配置，请参考 Mozilla 官方的 [Autoconfiguration in Thunderbird][3] 和 [Autoconfig: How to create a configuration file][4] 两篇文章。

上传配置文件
------

Thunderbird 获取配置文件时，会尝试两个地址：

1. http://autoconfig.你的域名.com/mail/config-v1.1.xml?emailaddress=[你的邮箱]
2. http://你的域名.com/.well-known/autoconfig/mail/config-v1.1.xml

因此将配置文件放在上述任选一处的位置即可。正确配置完成后的效果如下：（注意 Thunderbird 的提示“从邮件服务商获得配置 / Configuration found at email provider”）

![Thunderbird 自动检测到配置][5]


  [1]: /usr/uploads/2018/06/689399879.png
  [2]: /usr/uploads/2018/06/2691471279.png
  [3]: https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Autoconfiguration
  [4]: https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Autoconfiguration/FileFormat/HowTo
  [5]: /usr/uploads/2018/06/1206081669.png
/usr/uploads/2018/06/1206081669.png