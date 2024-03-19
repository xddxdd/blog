---
title: '用证书验证Linux远程登录'
categories: 网站与服务端
tags: [折腾, VPS]
date: 2013-02-22 20:21:04
---

一般人远程登录Linux Shell都是敲密码，烦不说，一旦你的密码在全世界都一样，再遇到
CSDN 600万密码大泄漏的事件，你的VPS也差不多完了。所以我们可以用一种更加方便和安
全的方式替代密码，也就是RSA加密的证书文件。

首先，我们要生成一个证书。

```bash
cd ~/.ssh
ssh-keygen -t rsa
```

这时你的.ssh目录里应该多出来id_rsa.pub和id_rsa，其中后一个文件保管好，是你的密
码，前一个是你的公钥，可以全世界去发布。然后我们要设置一下我们的VPS。

首先用FileZilla或者WinSCP把你的id_rsa.pub上传到服务器的~/.ssh里，并重命名为
authorized_keys，注意你想用哪个用户登录就copy到哪个用户的.ssh下，比如用root登，
就是/root/.ssh，用lantian登就是/home/lantian/.ssh。然后要在OpenSSH里做一点设置。

```bash
cd /etc/ssh
nano sshd_config
```

改下面的内容：

```bash
RSAAuthentication yes
PubkeyAuthentication yes
PermitEmptyPasswords no
```

存盘后service ssh restart，然后可以断掉SSH再次连接，如果只输用户名就连接成功，那
么就OK了，如果还要输密码，就回去检查你前面的操作步骤。OK后还可以做一点修改，就是
禁止密码登录，更加安全。

```bash
PasswordAuthentication no
```

然后为了安全起见，请登上SSH，把authorized_keys文件权限改成600，.ssh目录改成700，
对于你本机则把两个密钥改成600，.ssh改成700。这样就安全多了。
