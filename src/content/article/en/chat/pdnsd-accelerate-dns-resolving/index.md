---
title: 'Speed Up Your DNS Resolution with Pdnsd Caching'
categories: Chat
tags: [DNS]
date: 2013-09-14 15:42:40
autoTranslated: true
---


When you type a website address into your browser, the browser can't immediately locate the site. It first sends the address to a DNS server, which then queries other servers layer by layer until reaching the root servers to obtain the website's IP address. Only then can the browser establish a connection.

This process repeats every time you visit a new website, resulting in slow speeds. Additionally, DNS servers operated by Chinese telecom providers may hijack your requests to redirect you to pages like 114 Navigation.

To accelerate browsing and gain anti-interference benefits, we can set up a local DNS server on our computer. For Linux and Mac systems, Pdnsd is a lightweight solution. It queries other DNS servers via TCP or UDP to resolve domain names, caches the results, and significantly speeds up subsequent requests.

### 1. Installation

**For Linux (Ubuntu example):**
```bash
sudo apt-get install pdnsd
sudo gedit /etc/pdnsd.conf
```

**For Mac (requires Homebrew):**
```bash
ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go)"
brew install pdnsd
sudo nano /Library/LaunchDaemons/pdnsd.plist
```

Add the following content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>Label</key>
        <string>pdnsd</string>
        <key>Program</key>
        <string>/usr/local/sbin/pdnsd</string>
        <key>RunAtLoad</key>
        <true/>
        <key>ServiceDescription</key>
        <string>pdnsd dns caching daemon</string>
    </dict>
</plist>
```

```bash
sudo nano /usr/local/etc/pdnsd.conf
```

After these steps, the Pdnsd configuration file should be open for modification.

### 2. Configuring the DNS Server

First, clear the configuration file (if not already empty), then set up the basic configuration:

```bash
global {
        perm_cache=16384;
        cache_dir="/var/pdnsd";
        run_as="nobody";
        server_ip=127.0.0.1;
        status_ctl=on;
        paranoid=off;
        # Prefer TCP queries to resist interference
        query_method=tcp_udp;
        min_ttl=600;
        timeout=10;
}
```

In China, DNS queries for certain websites may encounter interference from faulty servers that return incorrect IP addresses. While standard DNS uses UDP port 53, switching to TCP queries avoids this interference. Pdnsd bridges TCP-based DNS to UDP usage.

`min_ttl` sets the minimum time-to-live (in seconds) for cached DNS records. For example, with 600 seconds (10 minutes), Pdnsd caches website IPs after the first request. Recommended value: 600-3600 seconds.

Next, configure upstream DNS servers. 114DNS is a clean and fast option with nationwide nodes in China:

```bash
server{
        # Prefer 114DNS for domestic resolution
        label="114 DNS";
        ip=114.114.114.114;
        # Skip if interference detected
        reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
                64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
                66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
                128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
                202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
                209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
                216.221.188.182,216.234.179.13,243.185.187.39;
        edns_query=on;
        reject_policy=fail;
}
```

These IPs are known to return invalid responses during DNS interference. Since 114DNS may also be affected, we filter these addresses.

Google DNS offers clean resolution via TCP but may route users to international CDN nodes, slowing access. Use it as a fallback:

```bash
server {
        # Google DNS via TCP
        label="Google DNS";
        ip=8.8.8.8,8.8.4.4;
        # Skip if interference detected
        reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
                64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
                66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
                128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
                202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
                209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
                216.221.188.182,216.234.179.13,243.185.187.39;
        edns_query=on;
        reject_policy=fail;
}
```

V2EX DNS corrects typos (e.g., `google.cmo` → `google.com`) and uses non-standard ports to resist interference:

```bash
server {
        # V2EX DNS for typo correction
        label="V2EX DNS";
        ip=199.91.73.222,178.79.131.110;
        port=3389;
        # Skip if interference detected
        reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
                64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
                66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
                128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
                202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
                209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
                216.221.188.182,216.234.179.13,243.185.187.39;
        edns_query=on;
        reject_policy=fail;
}
```

OpenDNS uses port 5353 to avoid interference:

```bash
server {
        # OpenDNS via port 5353
        label="OpenDNS";
        ip=208.67.222.222,208.67.220.220;
        port=5353;
        # Skip if interference detected
        reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
                64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
                66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
                128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
                202.181.7.85,203.98.7.65,203.161.230.171,207.极12.88.98,208.56.31.43,
                209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
                216.221.188.182,216.234.179.13,243.185.187.39,
                # Block OpenDNS navigation pages
                208.69.32.0/24,208.69.34.0/24,208.67.219.0/极24,208.67.217.0/24,
                208.67.216.0/24,67.215.82.0/24,67.215.65.0/24;
        edns_query=on;
        reject_policy=fail;
}
```

For .BIT domains (based on NameCoin, similar to Bitcoin), add specialized servers. Place this block directly under `global`:

```bash
server {
        # Special server for .BIT domains
        label="Bit DNS";
        ip=192.249.59.89,192.184.89.74,64.31.48.60,192.3.27.117;
        # Skip if interference detected
        reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
                64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
                66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
                128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
                202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
                209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
                216.221.188.182,216.234.179.13,243.185.187.39;
        reject_policy=fail;
        policy=excluded;
        include=".bit";
}
```

If all else fails, query root servers directly:

```bash
server {
        # Fallback to root servers
        label="Root DNS Servers";
        root_server=discover;
        randomize_servers=on;
        ip=198.41.0.4,192.228.79.201,192.33.4.12,199.7.91.13,192.203.230.10,
                192.5.5.241,192.112.36.4,128.63.2.53,192.36.148.17,192.58.128.30,
                193.0.14.129,199.7.83.42,202.12.27.33;
        # Skip if spoofing detected
        reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.极174.68,59.24.3.173,
                64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
                66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
                128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
                202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
                209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
                216.221.188.182,216.234.179.13,243.185.187.39;
        edns_query=on;
        reject_policy=fail;
}
```

Add local resolution for entries like `localhost`:

```bash
source {
        owner=localhost;
        file="/etc/hosts";
}

rr {
        name=localhost;
        reverse=on;
        a=127.0.0.1;
        owner=localhost;
        soa=localhost,root.localhost,42,86400,900,86400,86400;
}
```

After configuration, restart your computer and set your DNS to `127.0.0.1`.

### Complete Configuration File (with HiNet backup):

```bash
global {
    perm_cache=16384;
    cache_dir="/var/pdnsd";
    run_as="nobody";
    server_ip=127.0.0.1;
    status_ctl=on;
      paranoid=off;
    # Prefer TCP queries to resist interference
    query_method=tcp_udp;
    min_ttl=600;
    timeout=10;
}

server {
    # Special server for .BIT domains
    label="Bit DNS";
    ip=192.249.59.89,192.184.89.74,64.31.48.60,192.3.27.117;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,极72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39;
    reject_policy=fail;
    policy=excluded;
    include=".bit";
}


server{
    # Prefer 114DNS for domestic resolution
    label="114 DNS";
    ip=114.114.114.114;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39;
    edns_query=on;
    reject_policy=fail;
}

server {
    # Google DNS via TCP
    label="Google DNS";
    ip=8.8.8.8,8.8.4.4;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39;
    edns_query=on;
    reject_policy=fail;
}

server {
    # OpenDNS via port 5353
    label="OpenDNS";
    ip=208.67.222.222,208.67.220.220;
    port=5353;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39,
        # Block OpenDNS navigation pages
        208.69.32.0/24,208.69.34.0/24,208.67.219.0/24,208.67.217.0/24,
        208.67.216.0/24,67.215.82.0/24,67.215.65.0/24;
    edns_query=on;
    reject_policy=fail;
}

server {
    # V2EX DNS for typo correction
    label="V2EX DNS";
    ip=199.91.73.222,178.79.131.110;
    port=3389;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39;
    edns_query=on;
    reject_policy=fail;
}

server {
    # HiNet DNS (Taiwan backup)
    label="HiNet DNS";
    ip=168.95.1.1,168.95.192.1,168.95.192.2;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39;
    edns_query=on;
    reject_policy=fail;
}

server {
    # Fallback to root servers
    label="Root DNS Servers";
    root_server=discover;
    randomize_servers=on;
    ip=198.41.0.4,192.228.79.201,192.33.4.12,199.7.91.13,192.203.230.10,
        192.5.5.241,192.112.36.4,128.63.2.53,192.36.148.17,192.58.128.30,
        193.0.14.129,199.7.83.42,202.12.27.33;
    # Skip if interference detected
    reject=4.36.66.178,8.7.198.45,37.61.54.158,46.82.174.68,59.24.3.173,
        64.33.88.161,64.33.99.47,64.66.163.251,65.104.202.252,65.160.219.113,
        66.45.252.237,72.14.205.99,72.14.205.104,78.16.49.15,93.46.8.89,
        128.121.126.139,159.106.121.75,169.132.13.103,192.67.198.6,202.106.1.2,
        202.181.7.85,203.98.7.65,203.161.230.171,207.12.88.98,208.56.31.43,
        209.36.73.33,209.145.54.50,209.220.30.174,211.94.66.147,213.169.251.35,
        216.221.188.182,216.234.179.13,243.185.187.39;
    edns_query=on;
    reject_policy=fail;
}

source {
    owner=localhost;
    file="/etc/hosts";
}

rr {
    name=localhost;
    reverse=on;
    a=127.0.0.1;
    owner=localhost;
    soa=localhost,root.localhost,42,86400,900,86400,86400;
}
```
```
