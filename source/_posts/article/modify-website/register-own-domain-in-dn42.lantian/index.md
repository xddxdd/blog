---
title: '在 DN42 中注册自己的域名'
categories: 网站与服务端
tags: [DN42,DNS]
date: 2018-04-26 21:54:00
image: /usr/uploads/2018/04/2335363675.png
---
DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 使用了大量在互联网骨干上应用的技术（例如 BGP），可以很好的模拟一个真实的网络环境。

我在[先前的一篇文章][1]中加入了 DN42 网络，并连接了大部分自己拥有的 VPS。（剩下几台是没有 Tun/Tap 的 OpenVZ VPS，无法加入）之前我就知道 DN42 拥有自己的域名体系，例如 DN42 的 Wiki 站（[https://wiki.dn42.us/Home][2]）就可以在 DN42 中以 [https://internal.dn42][3] 的域名访问，但是之前没有时间去完成域名注册，并且当时对 DN42 的了解还不够。这个月我完成了域名注册，就来分享一下过程。

搭建权威 DNS 服务器
------------

权威 DNS 服务器，就是指管理某个域名记录的服务器。例如本站主域名 lantian.pub 的权威服务器是 `lv3ns[1-4].ffdns.net`，就是 CloudXNS。在互联网上注册域名时，我们可以用现成的 CloudXNS、Cloudflare 等免费 DNS 服务，但是在 DN42 中，虽然有人提供这样的服务，但是需要在 IRC 上与他们交流申请，我觉得太麻烦，就干脆自建了。

Linux 下自建 DNS 一般使用 Bind 或 PowerDNS 两款软件。Bind 以文件形式保存 DNS 记录，跨服务器同步有些麻烦，而 PowerDNS 不仅可以用文件保存，还可以用 MySQL 等数据库形式保存，同时自己也提供记录同步功能。

由于我配置 PowerDNS 自带的记录同步功能总是失败，查不出原因，我就干脆设置了 MySQL 主从复制来进行同步。

搭建 DNS：设置 MySQL 主从同步
--------------------

首先，在每台服务器中安装一个 MySQL，并且在 my.cnf 设置上这些内容：

```bash
# 每台服务器的编号，随便设置，但不能重复
server-id=1
# 每台服务器的名称，设置后可以在 phpMyAdmin 中看到从服务器的名字
report-host=Master
# MySQL 日志文件的位置，主从复制的核心文件
log_bin=mysql-bin
log_error=mysql-bin.err
```

然后用 phpMyAdmin 登录主 MySQL 服务器，在“Replication / 主从复制”页面将这台服务器设置为 Master / 主服务器，并创建一个用于主从复制的用户（拥有 REPLICATION SLAVE 和 REPLICATION CLIENT 权限）。

设置完后你应该可以看到类似这样的状态：

![主服务器状态][4]

其中的“File / 文件名”就是日志文件名，“Position / 位置”就是当前记录的行数。记下这两个值。

然后，关闭所有服务器上的 MySQL，用 rsync 之类方法把数据库复制到从服务器上，覆盖掉各自的数据目录，再打开所有的 MySQL。如果是没什么数据库写入操作的站，例如个人小博客，可以尝试不关主服务器 MySQL，但是可能会造成复制出去的数据损坏。

然后，用 phpMyAdmin 登录从 MySQL 服务器。因为 phpMyAdmin 在设置从服务器时有奇怪的 bug，所以我没用它的向导来设置，而是直接执行 SQL：

```sql
change master to master_host='服务器 IP',
master_user='主从复制用户名',
master_password='主从复制用户密码',
master_log_file='主服务器日志文件名',
master_log_pos=主服务器记录行数;
start slave;
```

然后进入“Replication / 主从复制”页面，点击“See slave status table / 查看从服务器状态表”，确认 Slave_IO_Running 和 Slave_SQL_Running 均为 Yes，主从同步就已经开始了。

![主从同步正常状态][5]

搭建 DNS：设置 PowerDNS
------------------

设置完数据库，我们就可以设置 PowerDNS 了。先在 MySQL 给 PowerDNS 建立一个用户和数据库。

然后安装 PowerDNS，因为我是 Docker 用户，所以在主服务器上，直接用 docker-compose 下载镜像并启动：

```yaml
  powerdns:
    image: psitrax/powerdns
    container_name: powerdns
    restart: always
    entrypoint: "/entrypoint.sh --cache-ttl=120 --master=yes --slave=yes"
    environment:
      - MYSQL_HOST=数据库服务器地址
      - MYSQL_USER=数据库用户名
      - MYSQL_PASS=数据库密码
      - MYSQL_DB=数据库名字
    ports:
      - "DN42 内的 IP 地址:53:53"
      - "DN42 内的 IP 地址:53:53/udp"
```

然后 PowerDNS 可能会启动失败，提示在创建 comments 表时某些列过长。这是因为 MySQL 的一些配置被修改了，导致数据表的行为发生了变化，而这些列最长可达 64000 Bytes，修改后的数据表存不下。

解决这个问题不需要再改数据库配置，只需要把 64000 改小，例如 16000，然后手动创建表即可：

> 以下语句对于新版 PowerDNS 可能已经过时，请参照 [https://doc.powerdns.com/authoritative/backends/generic-mysql.html](https://doc.powerdns.com/authoritative/backends/generic-mysql.html) 查看新版的创建语句，并相应修改长度。

```sql
CREATE TABLE domains (
  id                    INT AUTO_INCREMENT,
  name                  VARCHAR(255) NOT NULL,
  master                VARCHAR(128) DEFAULT NULL,
  last_check            INT DEFAULT NULL,
  type                  VARCHAR(6) NOT NULL,
  notified_serial       INT DEFAULT NULL,
  account               VARCHAR(40) DEFAULT NULL,
  PRIMARY KEY (id)
) Engine=InnoDB;

CREATE UNIQUE INDEX name_index ON domains(name);

CREATE TABLE records (
  id                    INT AUTO_INCREMENT,
  domain_id             INT DEFAULT NULL,
  name                  VARCHAR(255) DEFAULT NULL,
  type                  VARCHAR(10) DEFAULT NULL,
  content               VARCHAR(16000) DEFAULT NULL,
  ttl                   INT DEFAULT NULL,
  prio                  INT DEFAULT NULL,
  change_date           INT DEFAULT NULL,
  disabled              TINYINT(1) DEFAULT 0,
  ordername             VARCHAR(255) BINARY DEFAULT NULL,
  auth                  TINYINT(1) DEFAULT 1,
  PRIMARY KEY (id)
) Engine=InnoDB;

CREATE INDEX nametype_index ON records(name,type);
CREATE INDEX domain_id ON records(domain_id);
CREATE INDEX recordorder ON records (domain_id, ordername);

CREATE TABLE supermasters (
  ip                    VARCHAR(64) NOT NULL,
  nameserver            VARCHAR(255) NOT NULL,
  account               VARCHAR(40) NOT NULL,
  PRIMARY KEY (ip, nameserver)
) Engine=InnoDB;

CREATE TABLE comments (
  id                    INT AUTO_INCREMENT,
  domain_id             INT NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  type                  VARCHAR(10) NOT NULL,
  modified_at           INT NOT NULL,
  account               VARCHAR(40) NOT NULL,
  comment               VARCHAR(16000) NOT NULL,
  PRIMARY KEY (id)
) Engine=InnoDB;

CREATE INDEX comments_domain_id_idx ON comments (domain_id);
CREATE INDEX comments_name_type_idx ON comments (name, type);
CREATE INDEX comments_order_idx ON comments (domain_id, modified_at);

CREATE TABLE domainmetadata (
  id                    INT AUTO_INCREMENT,
  domain_id             INT NOT NULL,
  kind                  VARCHAR(32),
  content               TEXT,
  PRIMARY KEY (id)
) Engine=InnoDB;

CREATE INDEX domainmetadata_idx ON domainmetadata (domain_id, kind);

CREATE TABLE cryptokeys (
  id                    INT AUTO_INCREMENT,
  domain_id             INT NOT NULL,
  flags                 INT NOT NULL,
  active                BOOL,
  content               TEXT,
  PRIMARY KEY(id)
) Engine=InnoDB;

CREATE INDEX domainidindex ON cryptokeys(domain_id);

CREATE TABLE tsigkeys (
  id                    INT AUTO_INCREMENT,
  name                  VARCHAR(255),
  algorithm             VARCHAR(50),
  secret                VARCHAR(255),
  PRIMARY KEY (id)
) Engine=InnoDB;

CREATE UNIQUE INDEX namealgoindex ON tsigkeys(name, algorithm);
```

这下 PowerDNS 就能成功启动了，但是它还没有任何记录。

搭建 DNS：安装 PowerAdmin
--------------------

PowerAdmin 是一个 PowerDNS 的控制面板，可以去 [https://github.com/poweradmin/poweradmin][6] 下载安装。安装过程只需要跟着向导走即可，在此略过。

安装完后，进入主界面：

![PowerAdmin 主界面][7]

点“Add Master Zone / 添加主区域”，这里是添加你要解析的域名的地方。在“Zone Name / 域名”中填入域名，然后直接确定。

返回主界面，点“List Zones / 域名列表”，点击域名左边的编辑按钮进行管理，进入如下界面，这里以我的 DN42 域名 lantian.dn42 为例：

![域名管理界面][8]

最开始装完 PowerAdmin 之后，创建的 SOA 记录开头可能是没有类似 ns1.lantian.dn42 一类的内容的，这样的 SOA 记录就不符合规范。我的 SOA 记录是“ns1.lantian.dn42 lantian.lantian.dn42 0 28800 7200 604800 60”，解释如下：

- ns1.lantian.dn42：主要 DNS 服务器的名字，一般就是你现在在操作的服务器之后要取的域名。
- lantian.lantian.dn42：DNS 服务器管理者的邮箱，但是 @ 符号被句点代替了，例如这里就是 lantian@lantian.dn42。在 DN42 中不一定需要真实地址。
- 0：记录编号，如果使用 AXFR 等进行 DNS 记录同步，从 DNS 服务器可能会根据这个编号判断记录有没有更改。我们使用 MySQL 主从复制，所以这里不重要。这里设置为 0 代表 PowerDNS 会自动管理这一项，无需人工操作。
- 28800：刷新时间，AXFR 从服务器两次拉取的间隔，同样不重要。
- 7200：重试时间，AXFR 从服务器拉取失败后，再次拉取的时间，同样不重要。
- 604800：过期时间，AXFR 从服务器拉取失败后，最多用先前最后一次拉取成功的记录继续提供服务这么长时间，之后停止应答。同样不重要。
- 60：最小 TTL，所有记录的最小刷新时间，至少过了这么长时间才会刷新。

点击 SOA 记录左边的编辑按钮，对应着设置好，保存。

接下来要设置 NS 记录，指明你的域名由这几台 DNS 服务器提供服务。我这次设置 3 台服务器，分别是 ns[1-3].lantian.dn42，需要分别创建相应的 NS 记录，这样填写即可：

![填写 NS 记录][9]

一一提交即可。

最后设置 A 记录 指明域名指向某台服务器，这样填写即可：

![填写 A 记录][10]

主 PowerDNS 服务器到此设置完成。因为设置了 MySQL 主从同步，所以你的配置也已经同步到了其它服务器上，在相应的服务器上安装 PowerDNS 即可。

最后 dig 一下自己的服务器测试：

![DIG 测试][11]

在 DN42 注册域名
-----------

DN42 最近进行了一次升级，弃用了原来的 Monotone 管理界面，改用 Git 管理。首先去 [https://git.dn42.us/explore/repos][12] 上面注册一个账号，Fork [dn42/registry][13]，Clone 到本地。

首先，DN42 要求 Git Commit 经过 GPG 数字签名。我在 Mac 上使用的软件是 GPG Keychain。大致流程是：创建密钥，将公钥提交到 SKS 等公开 GPG 服务器上供查询，然后复制下 Fingerprint。

然后设置 git，打开自动签名每次 commit 的功能：

```bash
git config --global user.signingKey [你的 Fingerprint]
git config --global commit.gpgSign true
```

因为我是 DN42 老用户，已经有了自己的 MNT Handle，就打开 data/mntner/LANTIAN-MNT，加入相应的指纹信息，类似如下：

```bash
mntner:             LANTIAN-MNT
admin-c:            LANTIAN-DN42
tech-c:             LANTIAN-DN42
mnt-by:             LANTIAN-MNT
source:             DN42
auth:               pgp-fingerprint 23067C13B6AEBDD7C0BB567327F31700E751EC22
```

然后创建 data/dns/lantian.dn42：

```bash
domain:             lantian.dn42
admin-c:            LANTIAN-DN42
tech-c:             LANTIAN-DN42
mnt-by:             LANTIAN-MNT
nserver:            ns1.lantian.dn42 172.22.76.186
nserver:            ns1.lantian.dn42 fdbc:f9dc:67ad::8b:c606:ba01
nserver:            ns2.lantian.dn42 172.22.76.185
nserver:            ns2.lantian.dn42 fdbc:f9dc:67ad::dd:c85a:8a93
nserver:            ns3.lantian.dn42 172.22.76.187
nserver:            ns3.lantian.dn42 fdbc:f9dc:67ad::18:ca0f:741d
source:             DN42
```

（2020-03-22 更新：在我最初写此文时，文件里还有如下一行：

```bash
status:             CONNECT
```

但是在 2018 年 11 月的一次更新中，这行被去掉了（不再需要）。

作此更新是因为看到 Telegram 群里的群友踩了坑。）

然后 git add，git commit，git push，然后发 Pull Request 等待合并，并根据管理员的提示修改可能出现的错误。

![DN42 Pull Request 记录][14]

因为 DN42 中采用 Anycast DNS，每个人都能建立递归 DNS 服务器，而每个人从中心库拉取配置的频率不一，因此可能要等最长一个星期的时间，你的域名才能生效。

![域名生效][15]

到此 DN42 域名就注册成功了，接下来就可以在上面配置网站、邮件、IRC、游戏服务器等等了。

  [1]: /article/modify-website/join-dn42-experimental-network.lantian
  [2]: https://wiki.dn42.us/Home
  [3]: https://internal.dn42
  [4]: /usr/uploads/2018/04/1826994756.png
  [5]: /usr/uploads/2018/04/3187246767.png
  [6]: https://github.com/poweradmin/poweradmin
  [7]: /usr/uploads/2018/04/3108492334.png
  [8]: /usr/uploads/2018/04/938836545.png
  [9]: /usr/uploads/2018/04/57781084.png
  [10]: /usr/uploads/2018/04/2476632371.png
  [11]: /usr/uploads/2018/04/3598285227.png
  [12]: https://git.dn42.us/explore/repos
  [13]: https://git.dn42.us/dn42/registry
  [14]: /usr/uploads/2018/04/3250696671.png
  [15]: /usr/uploads/2018/04/2335363675.png
