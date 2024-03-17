---
title: '树莓派 3B 折腾笔记'
categories: 计算机与客户端
tags: [Raspberry Pi]
date: 2017-10-13 19:39:00
image: /usr/uploads/2017/10/1043578273.jpg
---

国庆放假期间我在某宝上买了一只树莓派 3B 和一堆传感器，准备搞一波事情。因为是国
庆，所以各家店发货都有不同的延迟，导致我国庆长假后又过了好几天东西才到齐。

先上张完成体的图片：

![完成体][1]

我分了五家店买了这些东西：

1. 树莓派 3B（含外壳、风扇、散热片、电源套装）
2. 闪迪 32G TF卡
3. 树莓派传感器套装（支持树莓派的 3.3V 电平，总共 16 个）
4. 5 寸 800x480 触摸屏
5. DS3231 时钟模块和 GPIO 针脚标记板（后买）

## 树莓派本体

最先到的是树莓派 3B 本体，以及配套的外壳风扇散热片等等。然而我买的 TF 卡还没到……
所以这只树莓派暂时什么都干不了。不过我还是可以把外壳风扇等等先组装起来。

然而我很快发现了问题：店家的外壳内支撑柱的位置不准，同一侧的两根柱子同时只能有一
根插在树莓派电路板的孔里，另一根只能顶在电路板上，树莓派装不进去。

然后我就拿起剪刀把那两根柱子剪了。

![剪完柱子的外壳][2]

树莓派很顺利地放了进去。因为外壳大小刚好，所以没了柱子不影响树莓派的稳定性。

散热片居然是用双面胶粘在芯片上的，我不禁怀疑它们甚至会影响散热。或许之后我应该用
硅脂把双面胶替换掉。

风扇要接在树莓派的 4、6 针脚上（分别是 5V 和接地），它也给我一种仅仅作为安慰剂存
在的感觉。

上一下电，树莓派主板红灯亮起，风扇开始转动，说明启动成功。但因为 TF 卡还没到，树
莓派什么都干不了，所以还得等等。

## TF 卡

TF 卡在第二天到达。我只需要把树莓派的 Raspbian 系统 dd 进 TF 卡里就大功告成了。

首先去 [https://www.raspberrypi.org/downloads/raspbian/][3] 下载 Raspbian。因为
我打算自己装桌面，所以我下载了 Lite 版。

因为我自己用的是 Mac OS X，所以不需要装额外的软件。先是打开磁盘工具把 TF 卡卸载
了，然后：

```bash
sudo dd bs=1m if=raspbian.img of=/dev/rdisk2 conv=sync
```

把卡从电脑上拔下来插进树莓派，上电，开机，一气呵成。

## 学校网络

但是……我是在学校里，所以我遇到了尴尬的情况：

1. 学校的有线网络和无线网络 A 需要通过网页登录。
2. 学校有 eduroam 无线网络，但是 eduroam 是 WPA2-EAP 企业级认证，需要输入用户名
   和密码。
3. 我的显示屏还没到。
4. 我有无线鼠标，但是没有无线键盘。

当务之急是先连进树莓派。那么用电脑把 Wi-Fi 共享到有线网端口就行了。不幸的是，Mac
OS X 拒绝共享 WPA2-EAP 的无线网络，所以我只能先用一下 Windows。

进入控制面板-网络与共享中心-WiFi连接-属性，选上“允许其它用户通过此计算机的
Internet 连接来连接”，再选择你的有线网卡，类似下图：（图片来自网络）

![允许其它用户通过此计算机的 Internet 连接来连接][4]

然后把树莓派用网线连到电脑上就可以了。那么怎么获知树莓派的 IP 呢？打开命令提示
符，输入 `arp -a`，然后去找 IP 为 192.168.137.xxx 的设备，它就是树莓派，用 PuTTY
等工具连上去吧。默认用户名 pi，密码 raspberry。

## 连接 eduroam

又一个问题出现了：我的树莓派必须能不依赖电脑自己上网，否则我买它没什么意义，还不
如直接买只 Arduino 接在 24 小时运行的电脑上。于是我 Google 了一通 wpa_supplicant
连接 WPA2-EAP 网络的配置，但是全都连不上。

我突然想到，我的手机是 Android 系统，Android 也是 Linux，连 Wi-Fi 同样是用
wpa_supplicant，把它的配置文件抄出来不就行了？于是我把手机的
`/data/misc/wifi/wpa_supplicant.conf` 里对应的段落抄进树莓派的
`/etc/wpa_supplicant/wpa_supplicant.conf`，成功连上了 eduroam。

配置文件如下：

```json
network={
    ssid="eduroam"
    key_mgmt=WPA-EAP IEEE8021X
    eap=PEAP
    identity="用户名"
    password="密码"
    phase2=""
}
```

## 端口映射

如同大多数公共 Wi-Fi 一样，学校的无线网络禁止无线设备之间访问。所以我需要一个工
具来帮我映射一下 SSH 端口，保证最基本的访问。

花生壳？看起来还可以，1M 的免费带宽给 SSH 也够了，但是即使是免费套餐也要付 6 块
钱开通。

于是我找了两家国内的免费 ngrok 服务提供商，把 22 端口映射了出去。类似的服务商都
有详细的步骤说明，且各家操作方法有一定区别，不再赘述。它们保证了基础访问，但是还
是不太稳定。

最后我还是在自己的腾讯云主机上装了 frp 来进行端口映射。直接参照[官方文档][5] 操
作即可。我还顺手在上面装了一个本博客之前经常提到的 ZeroTier One。

## 传感器

传感器终于到了。我先拿了一只 DHT11 温湿度传感器出来准备连上去。DHT11 总共有三个
针脚，分别是 Vcc（3.3V 供电）、GND（地线）和 DATA（信号）。

和 Arduino 不同，树莓派的电源和数据针脚全部混在了一起，并且没有标示各个针脚用
途。不过，树莓派里有软件可以查询。

首先 `apt-get install wiringpi`，再 `gpio readall`，你就能看到这样的输出：

```bash
+-----+-----+---------+------+---+---Pi 3---+---+------+---------+-----+-----+
| BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
+-----+-----+---------+------+---+----++----+---+------+---------+-----+-----+
|     |     |    3.3v |      |   |  1 || 2  |   |      | 5v      |     |     |
|   2 |   8 |   SDA.1 | ALT0 | 1 |  3 || 4  |   |      | 5v      |     |     |
|   3 |   9 |   SCL.1 | ALT0 | 1 |  5 || 6  |   |      | 0v      |     |     |
|   4 |   7 | GPIO. 7 |   IN | 1 |  7 || 8  | 1 | ALT5 | TxD     | 15  | 14  |
|     |     |      0v |      |   |  9 || 10 | 1 | ALT5 | RxD     | 16  | 15  |
|  17 |   0 | GPIO. 0 |   IN | 0 | 11 || 12 | 0 | IN   | GPIO. 1 | 1   | 18  |
|  27 |   2 | GPIO. 2 |   IN | 0 | 13 || 14 |   |      | 0v      |     |     |
|  22 |   3 | GPIO. 3 |   IN | 0 | 15 || 16 | 0 | IN   | GPIO. 4 | 4   | 23  |
|     |     |    3.3v |      |   | 17 || 18 | 0 | IN   | GPIO. 5 | 5   | 24  |
|  10 |  12 |    MOSI | ALT0 | 0 | 19 || 20 |   |      | 0v      |     |     |
|   9 |  13 |    MISO | ALT0 | 0 | 21 || 22 | 0 | IN   | GPIO. 6 | 6   | 25  |
|  11 |  14 |    SCLK | ALT0 | 0 | 23 || 24 | 1 | OUT  | CE0     | 10  | 8   |
|     |     |      0v |      |   | 25 || 26 | 1 | OUT  | CE1     | 11  | 7   |
|   0 |  30 |   SDA.0 |   IN | 1 | 27 || 28 | 1 | IN   | SCL.0   | 31  | 1   |
|   5 |  21 | GPIO.21 |   IN | 1 | 29 || 30 |   |      | 0v      |     |     |
|   6 |  22 | GPIO.22 |   IN | 1 | 31 || 32 | 0 | IN   | GPIO.26 | 26  | 12  |
|  13 |  23 | GPIO.23 |   IN | 0 | 33 || 34 |   |      | 0v      |     |     |
|  19 |  24 | GPIO.24 |   IN | 0 | 35 || 36 | 0 | IN   | GPIO.27 | 27  | 16  |
|  26 |  25 | GPIO.25 |   IN | 0 | 37 || 38 | 0 | IN   | GPIO.28 | 28  | 20  |
|     |     |      0v |      |   | 39 || 40 | 0 | IN   | GPIO.29 | 29  | 21  |
+-----+-----+---------+------+---+----++----+---+------+---------+-----+-----+
| BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
+-----+-----+---------+------+---+---Pi 3---+---+------+---------+-----+-----+
```

这就是各个针脚的意义，它们的状态，以及通过不同方式调用时的编号。你也可以买一块
GPIO 针脚标记板，它可以套在树莓派的 GPIO 上，标示出各个针脚的用途。

总之，把 Vcc 接到 1 号脚，GND 接到 9 号脚，DATA 接到 GPIO.7，传感器和树莓派就连
通了。

下一步是读取数据。由于 DHT11 输出数据时以微秒为单位变化输出，并且规律有些复杂，
我先用了现成的代码，例如 [https://github.com/szazo/DHT11_Python][6] 这
个。`git clone` 下来后，编辑 dht11_example.py，改掉针脚编号，就能看到这样的输
出：

```bash
Last valid input: 2017-10-13 18:37:13.232685
Temperature: 22 C
Humidity: 63 %
```

搞定。

## 触摸屏

触摸屏是最晚发货的一个，也是最晚到的。这块屏上有一个两排共 26 个针脚口（母座），
可以直接插到树莓派上提供触摸信号，然后通过一个 HDMI 转接头连接树莓派和屏幕的
HDMI 接口就可以显示图像。

不过，要使用这块屏幕还是要费一些功夫的，例如这块屏幕支持且仅支持 800x480 分辨
率，因此必须在 `/boot/config.txt` 里修改分辨率：

```ini
disable_overscan=1
framebuffer_width=800
framebuffer_height=480
hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=87
hdmi_cvt=800 480 60 6 0 0 0
```

并在 `/etc/lightdm/lightdm.conf` 里加上这句话，强制 800x480 分辨率：

```bash
display-setup-script=xrandr --output default --mode 800x480
```

另外这块屏幕设置触摸也要在 config.txt 里加几句话，但是店家产品详情里给的代码是！
错！的！我启用触摸失败后 Google 了好久，直到我在树莓派官方论坛上看到了一个同样被
坑的外国人的帖子。触摸芯片的型号是 ADS7846，而店家给成了 ADS7856，驱动加载失败，
自然无法触摸。

总之，加上这两句话：

```ini
dtoverlay=ads7846,penirq=22,speed=100000,xohms=150
dtparam=spi=on
```

然后装个触摸驱动，并启动 LightDM：

```bash
sudo apt-get install xserver-xorg-input-evdev
sudo service lightdm start
```

触摸屏就可以用了。最后，配置一下长按作右键处理，就像手机上一样：

```ini
Section "InputClass"
    Identifier    "calibration"
    MatchProduct    "ADS7846 Touchscreen"
    Option    "Calibration"    "254 3911 153 3962"
    Option    "SwapAxes"    "0"

    Option "EmulateThirdButton" "1"
    Option "EmulateThirdButtonTimeout" "700"
    Option "EmulateThirdButtonMoveThreshold" "100"
EndSection
```

不过这块屏幕还是有一些不足的地方：

1. 有时候会拖影。这个算小问题，毕竟屏幕还算便宜。
2. 耗电巨大，树莓派上只连接了屏幕时，右上角还会时不时出现黄色闪电图标（代表电压
   不足），如果插上移动硬盘，闪电图标就常亮了。我可能需要一块额外的电源板来给它
   供电，但我某宝上暂时没找到合适的。
3. 把 GPIO 的所有供电针脚全占了，而且在一大堆针脚空置的前提下整整占了 26 脚，导
   致我无法在无外部电源并且不焊接的情况下接传感器。

我又没法在寝室里焊接，对吧？emmmmm……（C）

于是我把它拔了然后暂时放了起来。等到需要用到的时候再装上用吧。

## 连接有线网

接下来我要把我的移动硬盘接上去，做一个简易 NAS。由于 NAS 流量较大，因此不能通过
外网服务转发，必须直连。由于 Wi-Fi 下各设备有隔离，因此我只能把树莓派接到有线网
上。

但是学校网络有登录页面，直接插上网线不登陆是连不上网的。并且即使 Wi-Fi 还连着，
一旦插上网线，所有流量都会从有线网络走，端口映射等等也就断了。emmmmm……

我用自己的电脑登录学校网络，然后用浏览器的开发者工具监测网络，记录下登陆请求提交
时 POST 的内容和地址。然后在树莓派上建立一个脚本，如果 ping 不通外网，就用 curl
模拟提交一次。然后 crontab 设置每分钟执行。

脚本内容如下：

```bash
#!/bin/bash
ping -c 1 -W 1 114.114.114.114 >/dev/null 2>/dev/null
if [ $? -eq 1 ]
then
    curl http://登陆页面 --connect-timeout 1 -F "key1=value1" -F "key2=value2"
fi
```

插上网线一分钟后，腾讯云主机的 frp 显示客户端连了上来。登进树莓派关掉无线网络
（就是注释掉 wpa_supplicant.conf）里的那几条，搞定。

## 做 NAS

树莓派的有线网卡是 100M 而非 1G 的，而且它的 USB 都是 2.0 的，这也使得它不怎么适
合做正经的 NAS。不过做一个玩玩级别的还是一点问题都没有的。

拔了屏幕后，我就有足够的电力去接移动硬盘了。插上移动硬盘，

```bash
mkfs.ext4 -E lazy_itable_init=0,lazy_journal_init=0 /dev/sda1
mount /dev/sda1 /mnt
```

分区挂载完成。然后是安装 Netatalk 做 AFP 文件共享和 Time Machine 备份
盘。Raspbian 软件源自带的 netatalk 太老了，不能用。

你可以下载现成的 deb 或是自行编译。如果你要现成的，从
[https://monal.im/netatalk/][7] 下载 netatalk 和 libatalk16 的 deb 文件并
`dpkg -i *.deb` 安装。

如果你要自己编译，参考
[https://samuelhewitt.com/blog/2015-09-12-debian-linux-server-mac-os-time-machine-backups-how-to][8]
这篇文章操作：

```bash
sudo apt-get install build-essential devscripts debhelper cdbs autotools-dev dh-buildinfolibdb-dev libwrap0-dev libpam0g-dev libcups2-dev libkrb5-dev libltdl3-dev libgcrypt11-devlibcrack2-dev libavahi-client-dev libldap2-dev libacl1-dev libevent-dev d-shlibs dh-systemd
git clone https://github.com/adiknoth/netatalk-debian
cd netatalk-debian
debuild -b -uc -us
cd ..
```

然后同样安装 netatalk 和 libatalk16 两个 deb。

安装完 Netatalk 后，再安装：

```bash
sudo apt-get install avahi-daemon libc6-dev libnss-mdns
```

修改 `/etc/netatalk/afp.conf`：

```ini
[Global]
vol preset = default_for_all
log file = /var/log/netatalk.log
uam list = uams_dhx2.so,uams_clrtxt.so
save password = no

[default_for_all]
file perm = 0664
directory perm = 0775
cnid scheme = dbd
valid users = 用户名

[Homes]
basedir regex = /home

[TimeMachine]
time machine = yes
spotlight = no
path = /mnt/timemachine
```

然后在 Mac 的终端下运行：

```bash
defaults write com.apple.systempreferences TMShowUnsupportedNetworkVolumes 1
```

并在 Time Machine 里选择树莓派即可。如果你在 Time Machine 里找不到树莓派，那么在
Mac 下：

```bash
sudo tmutil setdestination "afp://用户名:密码@树莓派/Time Machine"
```

完工。不过，我睡前（12 点左右）开始备份，第二天早上 7:30 查看状态，还剩 13 小时
……应该是学校网络限速的锅。

## DS3231 时钟模块和 GPIO 针脚标记板

你的电脑关机再开机仍然保持准时，是因为主板上有一个时钟模块，在断电的情况下也在默
默地走时。但是树莓派上没有，它每次开机都要网络对时。如果没有网络，时间就错乱了。

我买的那堆传感器里包括了一个 DS1307 时钟模块，但是没焊排针。我在学校里也没有电烙
铁用，所以干脆再买一块 DS3231（8 块钱），顺便买了块 GPIO 针脚标记板（7 块钱，上
面提到过）和一些杜邦线（5 块钱），解决针脚太多、担心数错的问题。

DS3231 安装极其简单，往 1、3、5、7、9 针脚上一插就行，不过 DHT11 就得换个位置：

![DS3231 安装][9]

进入树莓派系统后，首先删掉 fake-hwclock：

```bash
sudo apt-get purge fake-hwclock
```

然后继续改 `/boot/config.txt`：

```ini
dtoverlay=i2c-rtc,ds3231
```

注意如果你原来已经有了 dtoverlay，那么就要把这里的 dtoverlay 内容加到原有的
dtoverlay 里面去。例如我触摸屏+时钟模块的配置是：

```ini
dtoverlay=i2c-rtc,ds3231,ads7846,penirq=22,speed=100000,xohms=150 dtparam=spi=on
```

重启，`sudo hwclock -r` 可以读取时钟模块中的时间，这个时间肯定是错误的，因为没有
和外界对过时。执行 `sudo hwclock -w` 写入时间后，再次读取，时间就正确了。之后即
使树莓派在断网的情况下重启，也能保持走时准确。

## 总结

目前为止，我在树莓派上就折腾了这些。接下来我应该会往上面接更多的传感器，然后搞一
个状态页面或者通知系统来监控它们。

不过，树莓派终究只能玩玩，不适合运行正式的应用。

[1]: /usr/uploads/2017/10/1043578273.jpg
[2]: /usr/uploads/2017/10/2196120410.jpg
[3]: https://www.raspberrypi.org/downloads/raspbian/
[4]: /usr/uploads/2017/10/3108261224.jpg
[5]: https://github.com/fatedier/frp/blob/master/README_zh.md
[6]: https://github.com/szazo/DHT11_Python
[7]: https://monal.im/netatalk/
[8]:
    https://samuelhewitt.com/blog/2015-09-12-debian-linux-server-mac-os-time-machine-backups-how-to
[9]: /usr/uploads/2017/10/972854234.jpg
