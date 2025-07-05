---
title: 'Host1Free VPS Memory Usage Optimization'
categories: Website and Servers
tags: [Tinkering, Host1Free, VPS]
date: 2013-02-06 20:04:05
autoTranslated: true
---


PS: After publishing the article for the first time, I realized I forgot to configure the connection between nginx and php5-fpm. When I tried to connect to my VPS to check the settings, I opened the terminal, pressed the up arrow and Enter, only to discover my last command was "exit"...

PS2: Folks using port 22 on VPS should be cautious – you might get disconnected mid-command. Switch to another port like 2222. (So 2-ish)

PS3: Today I set up a Debian 6 test environment on VirtualBox and discovered Lighttpd has plugin functionality... Revised accordingly.

For a VPS, resources like CPU and disk space are usually sufficient for running a personal blog like mine. The real headache is insufficient memory. A VPS provider might allocate one CPU core from the host machine to dozens of VPS instances (though only the most unscrupulous would do this), but if your host has 4GB RAM, you can never allocate twenty 256MB VPS instances – that would require 5GB. Plus, the host system needs to run virtualization technologies like OpenVZ and management interfaces like HyperVM, so you can't even allocate sixteen instances (exactly 4GB).

For us VPS users, when you get a VPS, you must ruthlessly optimize its memory usage. Otherwise, once memory maxes out, your VPS becomes useless. My Host1Free VPS has 128MB RAM and 640MB Swap (which feels practically useless). For that 128MB, careful optimization is essential. Those with 64MB or even 32MB VPS face even more tragic situations. (PS: I think people buying such VPS have too much money to burn)

### 1. OS Selection

For a Linux VPS, you can choose Debian, Ubuntu, CentOS, Gentoo, etc. Each distro has its pros: Debian has older but practical software (native repo's PHP doesn't even include FPM), Ubuntu has tons of software, CentOS's repos... well, they're great for practicing GCC compilation.

Among distros, Debian feels most memory-efficient. I recall once running a full system with nginx+php-fastcgi+mysql using just 10MB RAM. When I tried CentOS, the built-in OpenSSH was sluggish, and I couldn't get used to yum and compiling. Ubuntu's repos are too bloated – each `apt-get update` took over 5 minutes due to Host1Free's 100KB/s network throttle. Ultimately, I installed Debian 6.

Side note: Installing a 64-bit OS on a VPS will make your memory usage explode. Only consider this if you have ≥512MB RAM.

### 2. Web Server Selection

The three most famous Linux server software are: Nginx, Apache, Lighttpd. Apache is the oldest and most powerful – with plugins it supports PHP, Mono (ASP.NET on Linux), and even basic FTP servers. But for small-memory VPS, "powerful" is irrelevant. We need simplicity, speed, and memory efficiency.

Lighttpd is a streamlined server. It <del>lacks plugin functionality with all modules compiled directly into the code</del> (correction: Lighttpd has basic plugin functionality), making it faster. But it doesn't suit my workflow, so I haven't researched it deeply.

Nginx is more feature-rich than Lighttpd while maintaining better memory efficiency. Some claim that where Apache chokes at 1,000 concurrent connections, Nginx handles 100,000 effortlessly. This might be exaggerated, but Nginx's performance is undeniable. Apache uses the `select` network model: when a packet arrives, it scans all connections to find a match – inefficient by design. Nginx's `epoll` model maintains a lookup table for instant packet matching.

Nginx's lack of plugins also saves memory. I've run the LNMP stack in 10MB RAM. The downside? No built-in PHP support – it requires FastCGI forwarding. This creates 1-2 persistent processes that become major memory consumers, depending on your site's traffic.

### 3. System Component Selection

A VPS's core components are: Shell, OpenSSH, and log management.

Debian 6 defaults to Bash. It's powerful but memory-hungry like Apache. For light users like me (1-2 shells), it's fine, but some users open 6+ shells at once – that could eat half your RAM. Solution: switch shells.

Many recommend pdksh – tiny but functional. As before: power is useless; adequacy is key.

For SSH, all distros include OpenSSH. Its drawback: when logging in as root, it spawns one new SSH process; non-root logins spawn two. Most users (unlike my lazy root approach) will see significant memory overhead. OpenSSH also supports SFTP. DropBear is a lightweight alternative without SFTP, but it avoids spawning multiple processes.

Debian 6 uses sysklogd for logging – very lightweight. Debian 5 users aren't so lucky (default rsyslog is bloated). Fix: `apt-get install sysklogd && apt-get remove rsyslog`.

### 4. Blog Platform Selection

Among PHP platforms, WordPress is unmatched. Its plugins and customization let it power anything from blogs to corporate sites. But through its evolution to v3.5.1, WP became bloated – even loading the admin panel consumes 30MB+ RAM, straining small VPS.

An alternative is Typecho. This Chinese-built platform is just 300KB vs. WP's 5MB... Its reduced plugin support boosts speed. Most importantly: it saves memory.

---

### Optimization Walkthrough

1. Install Debian 6, SSH in.
2. Install pdksh:
```bash
apt-get install pdksh
chsh -s /bin/pdksh
```
Re-login to apply.

3. Install DropBear:
```bash
# Prevent OpenSSH from starting
touch /etc/ssh/sshd_not_to_be_run
# Install
apt-get install dropbear
nano /etc/default/dropbear
# Change NO_START=1 to 0
service dropbear start
```

4. Install LEMP Stack:
```bash
# Add DotDeb repo for php-fpm
nano /etc/apt/sources.list
# Add: deb http://packages.dotdeb.org stable all
cd ~
wget http://www.dotdeb.org/dotdeb.gpg
cat dotdeb.gpg | apt-key add -
rm dotdeb.gpg
# Add repo key
apt-get update
apt-get upgrade
apt-get install mysql-server nginx php5-fpm php5-mysql php5-gd
cd /etc/php5/fpm/pool.d
nano www.conf
# Customize settings:
# listen = /var/run/php5-fpm.sock  (Unix socket: resource-friendly but less stable)
# pm = static
# pm.max_children = 2
# pm.start_servers = 1
# pm.min_spare_servers = 1
# pm.max_spare_servers = 1
# pm.max_requests = 512
cd /etc/mysql
nano my.cnf
# Add before [mysqldump]:
# default-storage-engine = MyISAM
# skip-innodb  (InnoDB is memory-hogging; MyISAM handles 99% of WP/DZ needs)
# Note: Remove '#' when adding these lines!
cd /etc/nginx/sites-available
nano default
# Set root path (e.g., root /var/www)
# Add PHP handler:
# location ~ \.php$ {
#   if (!-f $request_filename){return 404;}  # Required for custom 404 pages
#   fastcgi_split_path_info ^(.+\.php)(/.+)$;
#   fastcgi_pass unix:/var/run/php5-fpm.sock;
#   fastcgi_index index.php;
#   include fastcgi_params;
# }
cd ..
nano nginx.conf
# worker_processes 2;
service nginx restart
service mysql restart
service php5-fpm restart
# Done! Idle memory <20MB. Running WP may use 70MB+, but 128MB is sufficient.
```
