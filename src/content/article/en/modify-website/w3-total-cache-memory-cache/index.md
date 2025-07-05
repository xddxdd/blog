---
title: 'W3 Total Cache Implements Memory Caching'
categories: Website and Servers
tags: [VPS, Website, Tinkering]
date: 2013-02-23 21:30:05
autoTranslated: true
---


W3 Total Cache uses disk-based caching by default. For shared hosting users, this may be the only option available. However, VPS users have significantly more flexibility, especially when using VPS providers with efficient overselling techniques (Host1Free?) where disk speeds are relatively slow. In such cases, you can leverage your surplus memory for caching.

I've set up three WordPress test sites on SAE, OpenShift, and Host1Free VPS respectively. Among these, only the VPS allows for full customization, making it our focus today. (Note: SAE's file read/write restrictions prevent W3 Total Cache from even saving configurations.)

Additionally, W3TC supports PHP Opcode caching solutions (such as Zend Optimizer (not Zend Guard), eAccelerator, XCache, APC, etc.) as an alternative memory caching method, though with slightly reduced performance.

1. Installing Memcache Server and PHP Components

```bash
apt-get install memcached php5-memcached php5-memcache
# For LNMP or LLsMP (FastCGI) users, run this
service php5-fpm restart
# For LAMP or LLsMP (LiteSpeed SAPI) users, run this
service apache2 restart
```

By default, Memcache allocates up to 64MB memory (not constantly used - this is a maximum limit). Actual usage depends on stored data. For typical traffic (~1000 IPs), it rarely exceeds 20MB. If your VPS has only 64MB RAM, edit `/etc/memcached.conf` and change `-m 64` to `-m 16` or similar. Remember to restart with `service memcached restart`.

2. Configuring W3TC

Navigate to **WP Admin > Performance > General Settings**. Change all cache methods to **Memcached**. If options appear grayed out, your Memcache setup requires verification. After selecting Memcached for all sections, save settings and purge caches.

3. Using Opcode Component Caching

During testing, W3TC failed to recognize eAccelerator properly, so I installed XCache:

```bash
apt-get install php5-xcache
# For LNMP or LLsMP (FastCGI) users, run this
service php5-fpm restart
# For LAMP or LLsMP (LiteSpeed SAPI) users, run this
service apache2 restart
```

In **WP Admin > Performance > General Settings**, switch all cache methods to **Opcode: XCache**. Grayed-out options indicate XCache misconfiguration. Select XCache for all sections, save settings, and purge caches to complete.
```
