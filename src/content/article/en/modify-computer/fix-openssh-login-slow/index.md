---
title: 'How to Fix Slow OpenSSH Login'
categories: Computers and Clients
tags: [ssh]
date: 2014-12-26 19:53:57
autoTranslated: true
---


Today when connecting to an Azure China virtual machine, I noticed extremely slow login response. Even with a good network environment, it took over ten seconds to display the password prompt.

After searching on Google, I discovered the issue was caused by DNS reverse lookup.

OpenSSH performs a reverse lookup on your IP during login to determine if your IP is on the system's blacklist. However, China Telecom doesn't provide reverse lookup for residential IP addresses, causing OpenSSH to wait until the lookup times out before establishing the connection.

The solution is simply to disable reverse lookup.

```bash
sudo nano /etc/ssh/sshd_config
# Add "UseDNS no" at the end of the file, then save and close
sudo service ssh restart
```

If the connection remains slow after this configuration, try the following settings:

```bash
sudo nano /etc/ssh/sshd_config
# Add "GSSAPIAuthentication no" at the end of the file, then save and close
sudo service ssh restart
```

After applying these settings, SSH connections now complete within 2 seconds - a significant improvement compared to the previous 10+ second wait time.
```
