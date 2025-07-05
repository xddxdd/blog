---
title: 'Using the SSH Blacklist System of Northeastern University Network Center'
categories: Computers and Clients
tags: [Linux, ssh]
date: 2017-03-27 22:26:00
image: /usr/uploads/2017/03/4117890454.png
autoTranslated: true
---


The Network Center of Northeastern University provides an SSH blacklist on its official website, which records IP addresses detected using port scanning tools on SSH ports. This system appears to be based on statistics collected from their own honeypot servers. They also offer a downloadable hosts.deny file corresponding to the blacklist, allowing users to automatically update the SSH blacklist and block these scanners (preventing them from logging in) using scheduling tools like cron.

It's unclear exactly when this system was implemented, but it has been operational for at least two years. Additionally, the blocking duration for these IP addresses appears to be 60 days from their last detection.

![Northeastern University Network Center Network Threat Blacklist System][1]

Usage method: Install cron on your server and run the following commands to set up the script:

    ldd `which sshd` | grep libwrap
    cd /usr/local/bin/
    wget antivirus.neu.edu.cn/ssh/soft/fetch_neusshbl.sh
    chmod +x fetch_neusshbl.sh
    cd /etc/cron.hourly/
    ln -s /usr/local/bin/fetch_neusshbl.sh .
    ./fetch_neusshbl.sh

This script will connect to the Northeastern University Network Center servers hourly, download the latest hosts.deny file, and apply it to your system.

[1]: /usr/uploads/2017/03/4117890454.png
