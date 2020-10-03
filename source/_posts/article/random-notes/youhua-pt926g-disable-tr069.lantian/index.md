---
title: 友华 PT926G 关闭 TR069
categories: 随手记
tags: [友华 PT926G, 光猫, TR069]
date: 2020-10-03 15:40:30
---

本文介绍如何关闭友华 PT926G 光猫的 TR069 功能，防止电信推送配置/固件更新，导致你自己改的桥接、端口转发等失效。

这台光猫的 WAN 设置里，TR069 连接是无法修改或者删除的。但是我们只要对光猫后台的代码做一点小小的修改，就可以破解这个限制。

首先你需要按照我的《[友华 PT926G 光猫破解](/article/random-notes/youhua-pt926g-fiber-modem-crack.lantian/)》这篇文章获取 Telnet 管理员密码。

然后 Telnet 进去，执行 `su` 并输入密码进入 Root Shell。进入后命令行应该会显示 `#`。

然后依次执行以下操作：

1. 输入 `cp /home/httpd/web/net_eth_links.asp /var/`，回车运行。
   - 我们准备修改这个文件，但这个文件放在一个只读的分区上，所以先把它复制一份到可以读写的地方。
2. 输入 `vi /var/net_eth_links.asp` 编辑这个文件。`vi` 是著名的非常难用的编辑器，因此我们一步步来：
   1. 输入 `/is_configurable` 然后回车，也就是查找 `is_configurable` 这个字符串。光标应该会跳转到这个位置：

      ```javascript
      //If connection type is TR069 return false, else return true
      function is_configurable()
      {
        var lk = document.forms[0].lkname.value;
        var province= <%checkWrite("PROVINCE");%>;
        /* 中间略去一些 */
        return true;
      }
      ```

   2. 按上下键把光标定位到 `var lk` 一行，然后按两次 D 键。这样这一行就被删掉了。
   3. 不停按 D 键删除，删到 `return true;` 的上一行为止（`return true;`这一行不要删），整个函数看起来就像这样：

      ```javascript
      //If connection type is TR069 return false, else return true
      function is_configurable()
      {
        return true;
      }
      ```

   4. 输入 `:wq` 回车，保存文件并退出编辑器。
3. 输入 `mount --bind /var/net_eth_links.asp /home/httpd/web/net_eth_links.asp`，回车运行。
   - 虽然我们没法修改原文件，但我们可以用新文件“取代”老文件的位置，让系统访问时自动走到新文件上。
   - 上面这一行就是干的这个事。
4. 用浏览器进入 8080 端口的光猫后台，此时 WAN 设置里的 TR069 连接已经可以编辑了。
   - 你可以选择删了它，或者把它的类型改成 Internet 或者 Other，或者把它也改桥接，都可以。
   - 这样光猫的 TR069 连接就失效了，连不上电信的管理后台了。
