---
title: 'Using Certificates to Authenticate Linux Remote Login'
categories: Website and Servers
tags: [Tinkering, VPS]
date: 2013-02-22 20:21:04
autoTranslated: true
---


Most people use passwords to log into a Linux shell remotely. Not only is it tedious, but if you use the same password everywhere and encounter an incident like the CSDN 6 million password leak, your VPS is essentially compromised. Therefore, we can replace passwords with a more convenient and secure method: RSA-encrypted certificate files.

First, we need to generate a certificate.

```bash
cd ~/.ssh
ssh-keygen -t rsa
```

At this point, your `.ssh` directory should contain two new files: `id_rsa.pub` and `id_rsa`. The latter is your private key—keep it secure—while the former is your public key, which can be shared publicly. Next, we'll configure our VPS.

Upload your `id_rsa.pub` to the server's `~/.ssh` directory using FileZilla or WinSCP, and rename it to `authorized_keys`. Note that this file must be placed under the target user's `.ssh` directory (e.g., `/root/.ssh` for root, `/home/lantian/.ssh` for lantian). Then adjust the OpenSSH settings:

```bash
cd /etc/ssh
nano sshd_config
```

Modify the following settings:

```bash
RSAAuthentication yes
PubkeyAuthentication yes
PermitEmptyPasswords no
```

After saving, run `service ssh restart`. Disconnect and reconnect via SSH—if you log in with just your username, it's successful. If prompted for a password, review the previous steps. Once confirmed, you can further enhance security by disabling password login:

```bash
PasswordAuthentication no
```

For added security, log in via SSH and set the `authorized_keys` file permissions to `600` and the `.ssh` directory to `700`. On your local machine, similarly set both key files to `600` and the `.ssh` directory to `700`. This significantly improves security.
```
