---
title: 'Compiling and Installing App Inventor on Ubuntu'
categories: Computers and Clients
tags: [Android]
date: 2014-10-18 17:37:03
autoTranslated: true
---


App Inventor is a simple Android programming tool developed by MIT. By dragging and dropping objects on a webpage and setting up code in a flowchart-like manner, you can generate your own Android applications. If you install App Inventor's companion software on your Android phone or tablet, you can modify the interface on your computer and see changes reflected instantly on your mobile device.

MIT provides an online version of App Inventor accessible through email registration. However, their website runs on Google App Engine. As we all know, Google's services have poor accessibility in China. Therefore, it's best to install it locally for uninterrupted programming.

1. Download the source code

First, you'll need a GitHub account. Visit  
[https://github.com/mit-cml/appinventor-sources](https://github.com/mit-cml/appinventor-sources)  
and click "Fork" in the top-right corner.

Then, open a terminal in Ubuntu and enter:

```bash
sudo apt-get install git openjdk-7-jdk ant
git clone https://github.com/(your GitHub username)/appinventor-sources.git
# 由于 GitHub 到天朝访问同样悲摧，上面这句可能要执行1h以上
cd appinventor-sources
git remote add upstream https://github.com/mit-cml/appinventor-sources.git
cp sample-.gitignore .gitignore
```

Visit  
[https://cloud.google.com/appengine/downloads](https://cloud.google.com/appengine/downloads)  
to download Google App Engine SDK for Java. Extract it, rename the folder to `appengine-java-sdk`, and copy it to the `appinventor-sources` directory created earlier.

2. Start compiling

```bash
cd appinventor-sources
ant
```

Compilation takes 2-10 minutes. On my 3rd-gen i5 CPU, it took 3 minutes.

3. Launch on Linux

Create `start.sh` with the following content:

```bash
#!/bin/sh
appengine-java-sdk/bin/dev_appserver.sh --port=8888 --address=0.0.0.0 appinventor/appengine/build/war/ &
cd appinventor/buildserver
ant RunLocalBuildServer &
cd ../..
```

Run in terminal:
```bash
./start.sh
```

Wait about 1 minute for startup, then access App Inventor at [http://127.0.0.1:8888](http://127.0.0.1:8888).

4. Launch on Windows (interface only, no APK build server)

Install JRE on Windows. Create `start.bat` in the `appinventor-sources` folder with:

```bash
appengine-java-sdk/bin/dev_appserver.cmd --port=8888 --address=0.0.0.0 appinventor/appengine/build/war/
```

Double-click to run. After 1 minute, access [http://127.0.0.1:8888](http://127.0.0.1:8888).
```
