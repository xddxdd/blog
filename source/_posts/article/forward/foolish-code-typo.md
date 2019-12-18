---
lang: zh
title: '最傻的代码错误：一个空格酿成的血案'
label: foolish-code-typo
categories: 转载
tags: [BumbleBee,Bug,错误]
date: 2014-01-04 12:09:00
image: /usr/uploads/2014/01/723043973.png
---
Bumblebee是Linux平台上的一款NVidia显卡的辅助工具，它可以让NVidia显卡启用Optimus技术，就是在笔记本电脑平台上由独立显卡渲染，集成显卡显示。其实就是显卡硬件加速。

这是一款非常有用的工具，但是它曾经出过一次很严重的Bug（虽然是3年前），因为一个空格，大群Ubuntu用户的usr文件夹被删除了。

那是一次Git更新，变动位于install.sh：

```bash
@@ -37,7 +37,7 @@
  #    You should have received a copy of the GNU General Public License
  #    along with bumblebee.  If not, see <http://www.gnu.org/licenses/>.
  #
 -BUMBLEBEEVERSION=1.4.31
 +BUMBLEBEEVERSION=1.4.32
  
  
  ROOT_UID=0
 @@ -348,7 +348,7 @@ case "$DISTRO" in
    ln -s /usr/lib/mesa/ld.so.conf /etc/alternatives/gl_conf
    rm -rf /etc/alternatives/xorg_extra_modules
    rm -rf /etc/alternatives/xorg_extra_modules-bumblebee
 -  rm -rf /usr /lib/nvidia-current/xorg/xorg
 +  rm -rf /usr/lib/nvidia-current/xorg/xorg
    ln -s /usr/lib/nvidia-current/xorg /etc/alternatives/xorg_extra_modules-bumblebee
    ldconfig
   ;;
```

因为一个空格，删除指令从/usr/lib/nvidia-current/xorg/xorg变成了/usr和/lib/nvidia-current/xorg/xorg两个文件夹，而/usr目录就是你平时放你那一大堆程序的地方，包括apt-get。。。

<a href="https://github.com/MrMEEE/bumblebee-Old-and-abbandoned/commit/a047be85247755cdbe0acce6#diff-1" target="_blank">GitHub</a>上世界各地大批程序员疯狂吐槽这个Bug：

“所以我得先格式化我的硬盘？”“是的，我一般用Bumblebee格式化。”

<a href="/usr/uploads/2014/01/3298154581.png"><img src="/usr/uploads/2014/01/3298154581.png" alt="687474703a2f2f692e6d696e2e75732f69444848362e706e67.png" /></a>

“你有没有装Bumblebee？”“装了，但是我备份了usr文件夹。。。”

<a href="/usr/uploads/2014/01/2909647635.png"><img src="/usr/uploads/2014/01/2909647635.png" alt="687474703a2f2f692e6d696e2e75732f69444235652e706e67.png" /></a>

“他们会干掉我们，但他们不会干掉我们的usr”

<a href="/usr/uploads/2014/01/723043973.png"><img src="/usr/uploads/2014/01/723043973.png" alt="slash_usr.png" /></a>

“usr，为什么离开我？”

<a href="/usr/uploads/2014/01/1115107318.png"><img src="/usr/uploads/2014/01/1115107318.png" alt="687474703a2f2f696d673639302e696d616765736861636b2e75732f696d673639302f313731382f776879756c656176652e706e67.png" /></a>

“Bumblebee，我找你有些话想说”

<a href="/usr/uploads/2014/01/3261213394.jpg"><img src="/usr/uploads/2014/01/3261213394.jpg" alt="687474703a2f2f692e696d6775722e636f6d2f447546355a2e6a7067.jpg" /></a>

“usr？早在2011年6月就不见了，呵呵。”

<a href="/usr/uploads/2014/01/4006259684.png"><img src="/usr/uploads/2014/01/4006259684.png" alt="687474703a2f2f692e696d6775722e636f6d2f574b7437662e706e67.png" /></a>

SElinux和AppArmor都无语了。。。

<a href="/usr/uploads/2014/01/2872907203.jpg"><img src="/usr/uploads/2014/01/2872907203.jpg" alt="687474703a2f2f686162726173746f726167652e6f72672f73746f726167652f63306664356434622f31636233613637362f37373734636632642f64366635353064302e6a7067.jpg" /></a>

“我在公司服务器上装了Bumblebee，现在我需要工作。。。”

<a href="/usr/uploads/2014/01/2792998614.jpg"><img src="/usr/uploads/2014/01/2792998614.jpg" alt="687474703a2f2f6935352e74696e797069632e636f6d2f323073646c37392e6a7067.jpg" /></a>

“我不经常备份，但是我备份时总是太晚了。。。”

<a href="/usr/uploads/2014/01/2548332387.jpg"><img src="/usr/uploads/2014/01/2548332387.jpg" alt="687474703a2f2f66696c65732e6d796f706572612e636f6d2f416e746f6e4469617a2f636f6d6d656e74732f6e6f742d616c776179732d6261636b75702e6a7067.jpg" /></a>

乔布斯：“你听说过Bumblebee吗？”比尔盖茨：“我建议所有Linux用户都装一个。”

<a href="/usr/uploads/2014/01/1807140881.jpg"><img src="/usr/uploads/2014/01/1807140881.jpg" alt="687474703a2f2f7777342e73696e61696d672e636e2f6c617267652f35353663316363377477316469646c7432316634646a2e6a7067.jpg" /></a>

低轨道黄蜂（Bumblebee）加农炮：

<a href="/usr/uploads/2014/01/3115206340.png"><img src="/usr/uploads/2014/01/3115206340.png" alt="lazer.png" /></a>

“你在/usr后加了个空格怎么了？那路径不存在。”“我没把路径用双引号括起来。。。”

<a href="/usr/uploads/2014/01/1434800310.png"><img src="/usr/uploads/2014/01/1434800310.png" alt="687474703a2f2f746d702e6b72616c2e686b2f622e6275672e7370696465726d616e2e706e67.png" /></a>

“元首大人，我们在你的机器上装了Bumblebee。”

<a href="/usr/uploads/2014/01/1519896961.jpg"><img src="/usr/uploads/2014/01/1519896961.jpg" alt="687474703a2f2f7777772e746f64616e2e6e65742f696d616765732f62756d626c656265652e6a7067.jpg" /></a>
