---
title: 'Bad Apple 移植到 Telnet 中并成功放映'
categories: 网站与服务端
tags: [VPS,折腾,Bad Apple]
date: 2013-03-02 13:31:23
---
今天折腾了半天，把Bad Apple折腾到了我VPS的Telnet里面，用的就是我早些时候发的[命令行动画版](/article/modify-computer/bad-apple-command-line-art.lantian)</a>。

如果大家想看，telnet xuyh0120.tk 或 telnet 5.175.156.249

Round 1. 移植到SSH

因为本来和同学说好我要在SSH下折腾出一个，所以就先用这个了。首先把Bad Apple传到VPS上，我存在/opt/badapple。这个文件夹里两个文件：badapple和badapple.in（资源文件，我改过扩展名）。

```bash
useradd badapple
passwd badapple
# 密码我设的badapple
su badapple
# 切换过去
chsh
# 输入/opt/badapple/badapple
exit
```

SSH登录看效果，结果Error 2，找不到资源文件。我就在本地重新编译一遍（VPS上没FPC），把路径从相对改成绝对，上传，再次登录，就成功出现了Bad Apple的动画。

下一个要解决的问题是放完片子自动把用户T出去，我的一同学给我的建议居然是pkill -9 sshd……这样效果不错，但是你对得起另外在看的人吗……不过我发现，片子放完，我用pascal写的这个程序结束之后，openssh自动断掉了链接。

但是SSH功能过分强大，会有安全隐患，比如SSH自带的SFTP文件传输协议，可以直接跳过sh。所以需要在/etc/ssh/sshd_config里找到这么一段：

```bash
Subsystem sftp /usr/libexec/openssh/sftp-server```
```

具体内容有所差异，但是开头就是Subsystem，前面加#号注释掉就可以。

第二个要禁用的就是TCP/IP 端口转发，这个功能强大，必须得封掉。还是在上面那个文件里加上：

```bash
AllowTcpForwarding no```
```

但是在后来的研究中，我又发现了SCP文件传输，而且居然和SSH深度绑定，无法禁用。于是我只好悲剧的放弃了SSH，删除了用户。

Round 2. 移植到Telnet

大家在自己机器里执行一下telnet towel.blinkenlights.nl试试。放心，不会搞坏你的机器，但是Vista及以上用户一般看不到效果。

这是国外一家网站提供的星球大战ASCII艺术，可以在telnet里看。所以我也准备试试。

```bash
apt-get install telnet telnetd xinetd
cd /etc/xinetd.d
nano telnet
#输入：
#service telnet
#{
#        disable=no
#        flags=REUSE
#        socket_type=stream
#        wait=no
#        user=root
#        server=/usr/sbin/in.telnetd
#        log_in_failure+=USERID
#}
service xinetd restart
```

当时我还没有删除badapple用户，所以telnet过去，输用户名密码就进了。但是输密码麻烦，而且在那个星球大战里面也无需输密码。所以我只好研究一下telnetd了。执行man telnetd，发现有一个-L参数，可以自己设定登录用的程序，也就是Login Shell。我在xinetd里加了参数，没用。结果man里还有一句：默认使用/usr/lib/telnetlogin。高级！

```bash
cd /usr/lib
mv telnetlogin telnetlogin_backup
ln -sf /opt/badapple/badapple telnetlogin
service xinetd restart
```

以上就是用Bad Apple替代原有Login Shell，在登录阶段就开始显示动画。和SSH一样，动画放完telnet也会自动断掉。

效果非常爽，除了出来动画前还有一句Debian GNU Linux 6.0什么的，但是我要的效果已经达到了，收工。

演示地址：telnet xuyh0120.tk 或 telnet 5.175.156.249
