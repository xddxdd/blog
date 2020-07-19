---
title: 'Host1Free VPS 内存占用优化'
categories: 网站与服务端
tags: [折腾,Host1Free,VPS]
date: 2013-02-06 20:04:05
---
PS：第一次发完文章发现忘了写nginx和php5-fpm的对接，准备连上自己的VPS去看设置，打开终端-上键-回车，才发现自己打的上一行代码居然是exit……

PS2：VPS用22端口的童鞋请小心，你很有可能敲命令敲到一半断掉，换个端口就行，比如2222。（好2）

PS3：今天自己在VBox上搭了一个Debian 6实验，结果发现Lighttpd有插件功能……修改。

对于一个VPS来说，CPU、硬盘等对于像建一个像我这样的博客，一般已经足够，但是最烦的就是内存不足。一个VPS商可以把母鸡的一个CPU核心划给十几台VPS来用（虽然只有最坑爹的VPS商才会这样做），但是比如你主机的内存是4G，你永远无法分出20台256M内存的VPS，因为那会占你5G内存。而且，你的主系统还要跑OpenVZ之类的虚拟化技术和HyperVM之类的管理界面，你连16台（刚好占满4G）都分不出。

对于我们这些VPS用户来说，当你拿到一台VPS，你一定要把它的内存占用精简精简再精简，否则一旦内存爆满，你的VPS也就废了。我自己的Host1Free VPS有128M内存和640M Swap（感觉没什么用），对于那128M内存，就得好好优化一番。一些VPS内存64M甚至32M的人，就更加杯具。（PS：我觉得买这种VPS的人都是钱多的没处花）

1.OS的选择

对于一台Linux的VPS，你可以选择Debian，Ubuntu，CentOS，Gentoo等等。不同发行版各有不同，Debian的软件比较古老（原生源里的PHP连FPM都没有）但是都很实用，Ubuntu软件暴多，CentOS的软件源……反正可以让你练习GCC编译程序。

在各个发行版中，个人感觉Debian最省内存，因为我记得上次弄出过整个系统跑nginx+php-fastcgi+mysql才占10M内存的状况。我试用CentOS时，内置的OpenSSH反映很慢，而且我用不习惯yum和编译程序，而Ubuntu的软件源太多太杂，每次apt-get update都会占用我5分钟以上的时间，因为Host1Free对于每一台VPS都做了100K的网络限速。最终，我安装了Debian 6。

另外罗嗦一句，在VPS上装64位操作系统可以让你的内存直接炸掉。当然你有512M及以上的内存那么随你。

2.网站程序的选择

现在Linux平台上最著名的服务器软件有3款：Nginx，Apache，Lighttpd。Apache是最古老也是功能最强大的一款，通过插件，它可以支持PHP，可以支持Mono（Linux下运行ASP.NET），还可以搭建一个简单的FTP服务器。但是在一台小内存VPS上，“功能强大”完全不是我们所考虑的。我们需要一个更加简单，速度快，而且省内存的方案。

Lighttpd是一个简化过的服务器软件，它<del>没有插件功能，所有模块都直接编译在源代码中</del>（纠正：Lighttpd有简单的插件功能），所以速度也会快一些，但是这东西不符合我的使用习惯，所以我没有深入地查过关于它的资料。

Nginx比Lighttpd功能强一些，但是内存和执行效率也同样比Lighttpd好。据网上有人说，在同一台服务器上跑网站，如果Apache在1000并发下会卡死服务器，那么Nginx上10万并发毫无压力。这也许有夸张的成分，但是Nginx性能高是毋庸置疑的。Apache的网络架构是select，就是当客户端发出一个数据包，服务器收到后，Apache需要从现有的连接中找到数据包对应的连接，这就需要一条条地找，性能自然上不去。但Nginx的epoll网络模型则维护一张表，数据包到达时查表而不是查连接，从而获得了更高的效率。

在高效率的同时，Nginx由于没有插件功能，更省内存。所以我可以用10M内存跑上LNMP三件套。但是Nginx的缺点是不支持插件，所以PHP无法直接集成到Nginx里，必须通过FastCGI进行转发。转发也会留1-2个内存，这两个进程是占服务器内存的大户，具体看你的网站程序决定。

3.系统基础程序的选择

对于一个VPS，系统最基础的程序就是Shell，OpenSSH和日志管理。

Debian 6默认集成了Bash，其功能强大，但是和Apache一个德行，内存占用也偏大。对于我这种平时只开一两个Shell的人还好，听说有的人一登VPS就要连开6个Shell，那内存占用可以吃掉你一半的内存。所以我们需要换Shell。

网上一些文章推荐了pdksh，它的特点就是小。它没有Bash强大，但是我在前面说过，强大一点用也没有，够用就行。

对于SSH，所有发行版都带了OpenSSH，但是它也有不足：你登上Shell的时候，如果你是root，那么会给你新开一个SSH进程，但是如果你不是root，那就是两个。相信大家都不会像我这样偷懒直接root的，所以内存占用也较可观。另外，OpenSSH支持SFTP，功能强大，我就不解释了。DropBear则是一个替代品，它不支持SFTP，但是内存占用也小，最重要的是不会开上好几个进程耗你内存。

日志管理中Debian 6带了sysklogd，本身非常轻量，但是Debian 5没那么幸运，自带的rsyslog过分强大。这时可以直接apt-get install sysklogd，apt-get remove rsyslog就可以了。

4.博客程序的选择。

现在以PHP为语言的建站程序中，WordPress简直空前绝后，它的插件功能和强大的自定义设置让它的功能有了很大的提高，它可以搭建个人博客，也可以搭建企业官方网站等等。但是一路走到3.5.1的路上，WP已经变得非常臃肿，连打开后台都会耗掉服务器30多M内存，对于一个VPS来说有些吃不消。

另一个选择是Typecho。作为一款国人的作品，它的代码也就300多K，相比于WP的5M……而且它的插件功能有所减弱，这也使它有了更快的速度。最重要的是省内存。

接下来就可以开始实战优化了。

1.安装好Debian 6，SSH登上。

2.安装pdksh

```bash
apt-get install pdksh
chsh -s /bin/pdksh
```

重新登录，搞定。

3.安装DropBear

```bash
#不让OpenSSH启动
touch /etc/ssh/sshd_not_to_be_run
#安装
apt-get install dropbear
nano /etc/default/dropbear
#找到NO_START=1一行，改成0
service dropbear start
```

4.安装LAMP组合

```bash
#增加DotDeb软件源以获得php-fpm软件包
nano /etc/apt/sources.list
#在末尾增加一行deb http://packages.dotdeb.org stable all
cd ~
wget http://www.dotdeb.org/dotdeb.gpg
cat dotdeb.gpg | apt-key add -
rm dotdeb.gpg
#以上增加软件源证书
apt-get update
apt-get upgrade
apt-get install mysql-server nginx php5-fpm php5-mysql php5-gd
cd /etc/php5/fpm/pool.d
nano www.conf
#自己修改设置
#listen = /var/run/php5-fpm.sock
#用Unix套接字，比TCP省资源，但是稳定性略差
#pm = static
#pm.max_children = 2
#pm.start_servers = 1
#pm.min_spare_servers = 1
#pm.max_spare_servers = 1
#pm.max_requests = 512
#以上是我的设置
cd /etc/mysql
nano my.cnf
#在[mysqldump]前面加上
#default-storage-engine = MyISAM
#skip-innodb
#InnoDB占内存巨大，MyISAM可以满足常用WP、DZ等99%以上需求，禁止掉！
#注意：这里加#号是为了语法高亮不乱，加进去时别忘了删掉#！
cd /etc/nginx/sites-available
nano default
#root行改成root /var/www或者你喜欢的路径
#加上这堆代码（PHP用）
#location ~ \.php$ {
#if (!-f $request_filename){return 404;}
# #不加上面这行一旦找不到文件只能显示File not found，连Nginx里定义的404错误页也弄不出来
#fastcgi_split_path_info ^(.+\.php)(/.+)$;
#fastcgi_pass unix:/var/run/php5-fpm.sock;
#fastcgi_index index.php;
#include fastcgi_params;
#}
cd ..
nano nginx.conf
#worker_processes 2;
service nginx restart
service mysql restart
service php5-fpm restart
#搞定！看你内存占用，空载一般不超过20M，当然跑上WP占个70M+没问题，但是128M绝对够
```
