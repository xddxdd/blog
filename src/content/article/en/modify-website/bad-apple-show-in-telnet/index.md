---
title: 'Porting Bad Apple to Telnet and Successfully Screening It'
categories: Website and Servers
tags: [VPS, Tinkering, Bad Apple]
date: 2013-03-02 13:31:23
autoTranslated: true
---


Today, after tinkering for half a day, I successfully ported Bad Apple to my VPS's Telnet service using the [command-line animation version](/en/article/modify-computer/bad-apple-command-line-art.lantian) I published earlier.

To view it yourself:  
`telnet xuyh0120.tk` or `telnet 5.175.156.249`

### Round 1. Porting to SSH
Since I originally promised a classmate I'd implement this via SSH, I started there. First, I uploaded Bad Apple to my VPS at `/opt/badapple`, which contains two files: `badapple` and `badapple.in` (the resource file with a modified extension).

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

When testing via SSH, I encountered Error 2 (resource file not found). I recompiled locally (the VPS lacks FPC), changed paths from relative to absolute, re-uploaded, and successfully displayed the animation upon reconnecting.  

Next, I needed to automatically disconnect users after playback. A classmate suggested `pkill -9 sshd`—effective but disruptive to concurrent viewers. However, I discovered that OpenSSH automatically terminates the connection when my Pascal program exits.  

SSH's powerful features posed security risks. For example, its built-in SFTP bypasses the shell. I disabled it by commenting out the relevant line in `/etc/ssh/sshd_config`:

````bash
Subsystem sftp /usr/libexec/openssh/sftp-server```
````

I also disabled TCP/IP port forwarding by adding:

````bash
AllowTcpForwarding no```
````

Later, I found SCP file transfer—deeply integrated with SSH and impossible to disable—forcing me to abandon SSH and delete the user.

### Round 2. Porting to Telnet
Try `telnet towel.blinkenlights.nl` on your machine (safe, but Vista+ users may not see effects). This inspired me to replicate the ASCII-art experience via Telnet.

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

Initially, Telnet required authentication via the `badapple` user. To achieve password-free access like the Star Wars demo, I studied `telnetd` and discovered its `-L` parameter for custom login programs. After unsuccessful attempts via `xinetd`, I leveraged the default login path:

```bash
cd /usr/lib
mv telnetlogin telnetlogin_backup
ln -sf /opt/badapple/badapple telnetlogin
service xinetd restart
```

This replaces the login shell with Bad Apple, starting playback immediately upon connection. Like SSH, Telnet disconnects automatically after playback.  

The result is impressive—despite a brief "Debian GNU Linux 6.0" header, the core objective is achieved. Mission complete.  

**Demo**: `telnet xuyh0120.tk` or `telnet 5.175.156.249`
```
