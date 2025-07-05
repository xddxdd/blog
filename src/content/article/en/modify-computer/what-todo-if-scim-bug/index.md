---
title: 'Solution for SCIM Malfunction'
categories: Computers and Clients
tags: [Linux, Tinkering]
date: 2012-12-31 22:27:39
autoTranslated: true
---


On Ubuntu 12.10, I dislike using the default ibus. Neither fcitx nor scim in the software repositories include a Pinyin package, so I downloaded the Google Pinyin module for scim, compiled and installed it myself.

However, during use, scim frequently malfunctions. The symptom is that no matter which input field I click, scim fails to recognize it and thinks Chinese input isn't possible there. This forces me to type in English.

During one such malfunction, I was chatting with a classmate via pywebqq. When scim crashed, the subsequent conversation was conducted entirely in Pinyin. It wasn't until the other party stopped responding that I took the chance to log out and log back in, restoring scim. Today, while writing an essay on my computer, scim malfunctioned again.

I really didn't want to log out, so I opened the terminal to check scim's commands.

```bash
xdd@xdd-asus:~$ scim --help
Smart Common Input Method 1.4.14

Usage: scim [option]...

The options are:
  -l, --list              List all of available modules.
  -f, --frontend name     Use specified FrontEnd module.
  -c, --config name       Use specified Config module.
  -e, --engines name      Load specified set of IMEngines.
  -ne,--no-engines name   Do not load those set of IMEngines.
  -d, --daemon            Run scim as a daemon.
  --no-socket             Do not try to start a SCIM SocketFrontEnd daemon.
  -h, --help              Show this help message.
xdd@xdd-asus:~$
```

I discovered the `-d` command-line option, which I guessed was for launching scim. Then it occurred to me: if scim has crashed, why not kill it and restart? So I entered the following command:

```bash
pkill -9 scim & scim -d
```

After execution, scim disappeared. When I pressed Ctrl+Space, scim reappeared. Clicking in LibreOffice, all language and symbol options became available. The problem was solved.
```
