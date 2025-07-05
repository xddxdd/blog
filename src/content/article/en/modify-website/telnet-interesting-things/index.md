---
title: 'Displaying Fun Things in Telnet'
categories: Website and Servers
tags: [Telnet]
date: 2016-07-27 16:42:00
autoTranslated: true
---


Telnet is one of the oldest network protocols released in 1969, yet it remains enduringly popular due to its simple implementation and ability to enable various interesting applications.

Some developers have created Nyancat that can be viewed in Telnet terminals, as well as Star Wars animations accessible via Telnet.

<img src="/usr/uploads/2016/07/3175903277.png" alt="Screenshot 2016-07-27 4.33.48 PM.png" />

<img src="/usr/uploads/2016/07/43160460.png" alt="Screenshot 2016-07-27 4.31.49 PM.png" />

<img src="/usr/uploads/2016/07/1644335517.png" alt="Screenshot 2016-07-27 4.31.56 PM.png" />

To see the ASCII version of Star Wars in your terminal, enter the following command (Windows 7+ users need to enable Telnet Client first via Control Panel > Programs and Features > Turn Windows features on or off):

```bash
telnet towel.blinkenlights.nl
```

To view Nyancat, enter:

```bash
telnet nyancat.dakko.us
```

You can also set up a similar Telnet service on your own server to display custom content. We'll use CMatrix (which shows the digital rain from The Matrix) as an example:

- Log into your Debian server and run:
```bash
apt-get install openbsd-inetd telnetd cmatrix
```
Wait for installation to complete.

- Create `/opt/cmatrix.sh` with:
```bash
#!/bin/sh
cmatrix -abu 2
```

- Edit `/etc/inetd.conf` and append:
```bash
telnet stream tcp nowait nobody /usr/sbin/tcpd /usr/sbin/in.telnetd -L /opt/cmatrix.sh
telnet stream tcp6 nowait nobody /usr/sbin/tcpd /usr/sbin/in.telnetd -L /opt/cmatrix.sh
```

- Restart the inetd service:
```bash
service inetd restart
```

Now run `telnet «your server address»` from your computer to see the digital rain effect.

<img src="/usr/uploads/2016/07/40895505.png" alt="Screenshot 2016-07-27 4.40.59 PM.png" />

I've also set this up on my server. Use these commands to see:  
Nyancat:
```bash
telnet lantian.pub 2001
```
Digital rain:
```bash
telnet lantian.pub 2002
```
```
