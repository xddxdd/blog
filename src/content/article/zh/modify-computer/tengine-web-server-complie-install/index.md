---
title: 'Tengine 网页服务器编译以及安装'
categories: 计算机与客户端
tags: [服务器,网页,Tengine,编译]
date: 2013-07-31 16:19:50
---
Tengine是阿里巴巴基于nginx开发的一款高性能网页服务器，除了保留nginx原有的高性能特性外，还增加了这堆东西：

<blockquote>
继承Nginx-1.2.9的所有特性，100%兼容Nginx的配置；
动态模块加载（DSO）支持。加入一个模块不再需要重新编译整个Tengine；
输入过滤器机制支持。通过使用这种机制Web应用防火墙的编写更为方便；
动态脚本语言Lua支持。扩展功能非常高效简单；
支持管道（pipe）和syslog（本地和远端）形式的日志以及日志抽样；
组合多个CSS、JavaScript文件的访问请求变成一个请求；
更加强大的负载均衡能力，包括一致性hash模块、会话保持模块，还可以对后端的服务器进行主动健康检查，根据服务器状态自动上线下线；
自动根据CPU数目设置进程个数和绑定CPU亲缘性；
监控系统的负载和资源占用从而对系统进行保护；
显示对运维人员更友好的出错信息，便于定位出错机器；
更强大的防攻击（访问速度限制）模块；
更方便的命令行参数，如列出编译的模块列表、支持的指令等；
可以根据访问文件类型设置过期时间；
</blockquote>

虽然对于普通用户没什么区别，但是拿来玩玩还是不错的，听说土豆还是56已经用上Tengine了。

下面是编译步骤。

```bash
./configure --prefix=/usr --enable-mods-shared=all --with-rtsig_module --with-select_module --with-poll_module --with-file-aio --with-ipv6 --with-http_realip_module --with-http_addition_module --with-http_xslt_module --with-http_image_filter_module --with-http_geoip_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_slice_module --with-http_mp4_module --with-http_gzip_static_module --with-http_concat_module --with-http_random_index_module --with-http_secure_link_module --with-http_degradation_module --with-http_sysguard_module --with-http_lua_module --with-http_tfs_module --with-mail --with-mail_ssl_module --with-google_perftools_module --with-cpp_test_module --with-backtrace_module --with-pcre --with-pcre-jit --with-md5-asm --with-sha1-asm --with-libatomic --with-jemalloc
```

插一句：因为Tengine是模块化的，所以自然地我们就把模块多开一点，反正动态加载。如果看哪个模块不顺眼不想要，把对应的with。。。删掉就可以。

如果configure报错，一般是少libxxx，直接到新立得软件包管理去搜就行了。安装时要安装-dev包，原始包也会自动安装。

```bash
make -j4
sudo make install
```

安装完成。命令行输入nginx启动。Tengine配置与nginx类似，可以参考nginx相关文档。
