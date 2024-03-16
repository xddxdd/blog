---
title: Disabling TR069 on a Youhua PT926G Fiber Optic Modem
categories: 'Random Notes'
tags: [Youhua PT926G, Fiber Optic Modem, TR069]
date: 2020-10-03 15:40:30
---

This post explains the procedure to disable TR069 on a Youhua PT926G fiber optic modem, to prevent China Telecom from pushing config/firmware updates, and void your change of switching to bridging mode or setting port-forward rules.

In the WAN settings of the management portal of this modem, the TR069 connection can neither be modified nor removed. But with a simple patch on the management portal's code, you can break the limitation on the modem.

First, you should follow my previous post: [Hacking a Youhua PT926G Fiber Optic Modem](/en/article/random-notes/youhua-pt926g-fiber-modem-crack.lantian/), to obtain the Telnet Root password.

Then Telnet in, run `su`, and type in the password to get to Root Shell. When you do that correctly, the command-line will prompt `#`.

Then follow these steps:

1. Type `cp /home/httpd/web/net_eth_links.asp /var/` and hit Enter.
   - We're going to modify this file, but it's on a read-only partition. So we first copy it to somewhere writable first.
2. Type `vi /var/net_eth_links.asp` to edit the file. `vi` is famous for being difficult to use, so let's go through this step by step:
   1. Type `/is_configurable` and Enter, which is searching for string `is_configurable`. The cursor should jump to somewhere around:

      ```javascript
      //If connection type is TR069 return false, else return true
      function is_configurable()
      {
        var lk = document.forms[0].lkname.value;
        var province= <%checkWrite("PROVINCE");%>;
        /* Some code redacted here */
        return true;
      }
      ```

   2. Use your arrow keys to move to the line with `var lk`, and press the D key twice. Now that line is removed.
   3. Press D repeatedly until you removed the line right before `return true;` (not including `return true;`), so the whole function will look like:

      ```javascript
      //If connection type is TR069 return false, else return true
      function is_configurable()
      {
        return true;
      }
      ```

   4. Type `:wq` and press Enter to save the file and close the editor.
3. Type `mount --bind /var/net_eth_links.asp /home/httpd/web/net_eth_links.asp` and Enter.
   - Although we cannot modify the original file, we can use the new file "in place of" the old file, so the system will automatically use the new copy when trying to access the file.
   - This is what this line is doing.
4. Open your browser and visit the management portal at 8080. Now the TR069 connection in WAN settings can be edited.
   - You may remove it, change its type to `Internet` or `Other`, or set it to `Bridge` mode. It's up to you.
   - Now, the modem's TR069 settings are no longer valid, and it won't be able to connect to China Telecom's central management services.
