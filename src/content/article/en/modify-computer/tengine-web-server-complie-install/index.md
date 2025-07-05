---
title: 'Compilation and Installation of Tengine Web Server'
categories: Computers and Clients
tags: [server, web, Tengine, compilation]
date: 2013-07-31 16:19:50
autoTranslated: true
---


Tengine is a high-performance web server developed by Alibaba based on nginx. In addition to retaining nginx's original high-performance features, it adds the following capabilities:

<blockquote>
Inherits all features of Nginx-1.2.9 with 100% configuration compatibility;
Dynamic module loading (DSO) support. Adding modules no longer requires recompiling the entire Tengine;
Input filter mechanism support. Simplifies development of web application firewalls;
Lua dynamic scripting language support. Enables efficient and simple feature extensions;
Supports pipe and syslog (local/remote) logging with log sampling;
Combines multiple CSS/JavaScript file requests into a single request;
Enhanced load balancing with consistent hashing, session persistence, and active backend server health checks (automatic failover);
Automatically sets process count and CPU affinity based on CPU cores;
Protects system by monitoring load and resource usage;
More administrator-friendly error messages for easier troubleshooting;
Stronger anti-attack modules (access rate limiting);
Improved command-line parameters (e.g., listing compiled modules/supported directives);
Configurable expiration times based on file types;
</blockquote>

While ordinary users may not notice a difference, it's still great for experimentation. I've heard sites like Tudou or 56.com have already adopted Tengine.

Below are the compilation steps.

```bash
./configure --prefix=/usr --enable-mods-shared=all --with-rtsig_module --with-select_module --with-poll_module --with-file-aio --with-ipv6 --with-http_realip_module --with-http_addition_module --with-http_xslt_module --with-http_image_filter_module --with-http_geoip_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_slice_module --with-http_mp4_module --with-http_gzip_static_module --with-http_concat_module --with-http_random_index_module --with-http_secure_link_module --with-http_degradation_module --with-http_sysguard_module --with-http_lua_module --with-http_tfs_module --with-mail --with-mail_ssl_module --with-google_perftools_module --with-cpp_test_module --with-backtrace_module --with-pcre --with-pcre-jit --with-md5-asm --with-sha1-asm --with-libatomic --with-jemalloc
```

Note: Since Tengine is modular, we're enabling extra modules for flexibility (they load dynamically). Remove any `--with-...` option for modules you don't need.

If `configure` fails, it's usually due to missing `libxxx` dependencies. Search for them in Synaptic Package Manager. Remember to install `-dev` packages (base packages install automatically).

```bash
make -j4
sudo make install
```

Installation complete. Start with `nginx` in the terminal. Tengine configuration is similar to nginx – refer to nginx documentation for guidance.
```
