---
title: 'Enabling Built-in FTP Service on Mac OS X'
categories: Computers and Clients
tags: [Mac, FTP]
date: 2014-07-05 21:15:17
image: /usr/uploads/52151404566003.png
autoTranslated: true
---


For certain reasons, I wanted to access files on my computer via FTP from my phone. Since Mac OS X has always included built-in FTP and SSH services, I decided to enable them.

Click the Apple icon in the top-left corner → System Preferences → Sharing, then check the box for "Remote Login" on the left. Also, ensure your username is in the allowed users list.

<img src="/usr/uploads/52151404566003.png" title="Screenshot 2014-07-05 at 9.05.20 PM.png"/>

In the ES File Explorer app on your phone, select the SFTP connection method, enter your computer's IP address along with your username and password to connect. However, in practice, since SFTP is based on SSH with high security requirements, the transfer speed is slow—only about 100KB/s—which isn't sufficient for smooth video playback.

In older Mac versions, you could enable FTP file sharing directly in Sharing settings, but this option has been removed in newer systems. The built-in FTP server remains functional, though. Simply open Terminal from Utilities and activate it with one command:

```bash
sudo -s launchctl load -w /System/Library/LaunchDaemons/ftp.plist
```

You'll be prompted to enter your password during the process. Note that no characters (not even asterisks) will appear as you type.

After pressing Enter, select the FTP connection method on your phone and enter your computer's local IP address, username, and password. Once connected, you can achieve speeds up to 1MB/s in actual use.
```
