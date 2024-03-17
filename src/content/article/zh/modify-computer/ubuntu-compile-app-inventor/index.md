---
title: 'Ubuntu 下编译安装 App Inventor'
categories: 计算机与客户端
tags: [Android]
date: 2014-10-18 17:37:03
---

App Inventor 是一款由麻省理工开发的简单的 Android 编程工具，只需要在网页上拖动一
个个对象，用流程图的方式设置好代码，就可以生成自己的 Android 程序。如果你在你的
Android 手机或平板上安装 App Inventor 的自带软件，还可以做到在电脑上修改界面，在
手机或平板上即时显示的效果。

麻省理工提供了一个在线版本的 App Inventor，只要用邮箱注册就可以使用所有功能，问
题是，他们的网站运行在 Google App Engine 上。Google 在天朝悲摧的访问情况大家也是
知道的。因此，我们最好在自己的电脑上安装一个，做到随时编程。

1.下载源代码

首先，你要有一个 GitHub 账户。然后，进入
[https://github.com/mit-cml/appinventor-sources](https://github.com/mit-cml/appinventor-sources)，
点击右上角的 Fork。

然后，在你的 Ubuntu 系统里打开一个终端，输入如下命令：

```bash
sudo apt-get install git openjdk-7-jdk ant
git clone https://github.com/（你的 GitHub 用户名）/appinventor-sources.git
# 由于 GitHub 到天朝访问同样悲摧，上面这句可能要执行1h以上
cd appinventor-sources
git remote add upstream https://github.com/mit-cml/appinventor-sources.git
cp sample-.gitignore .gitignore
```

去
[https://cloud.google.com/appengine/downloads](https://cloud.google.com/appengine/downloads)
下载Google App Engine SDK for Java，解压，把这个解压开的文件夹改名
appengine-java-sdk复制到前几步创建的appinventor-sources文件夹中。

2.开始编译

```bash
cd appinventor-sources
ant
```

编译花费2-10分钟不等，我的i5 3代CPU花费了3分钟。

3.在 Linux 下启动

创建start.sh，内容如下：

```bash
#!/bin/sh
appengine-java-sdk/bin/dev_appserver.sh --port=8888 --address=0.0.0.0 appinventor/appengine/build/war/ &
cd appinventor/buildserver
ant RunLocalBuildServer &
cd ../..
```

在终端输入：

```bash
./start.sh
```

等待1分钟左右即启动成功，访问 [http://127.0.0.1:8888](http://127.0.0.1:8888) 进
入 App Inventor。

4.在 Windows 下启动（仅主界面，不包括APK编译服务器）

在 Windows 下装好 JRE，在 appinventor-sources 文件夹下创建start.bat，内容如下：

```bash
appengine-java-sdk/bin/dev_appserver.cmd --port=8888 --address=0.0.0.0 appinventor/appengine/build/war/
```

双击启动，等待1分钟，访问 [http://127.0.0.1:8888](http://127.0.0.1:8888)。
