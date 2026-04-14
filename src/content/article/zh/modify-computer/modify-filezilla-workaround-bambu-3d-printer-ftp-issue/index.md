---
title: '魔改 FileZilla 解决拓竹 3D 打印机的 FTP 问题'
categories: 计算机与客户端
tags: [FileZilla, FTP, '3D 打印机', '拓竹']
date: 2026-04-13 23:28:02
---

我最近为了尝试 3D 打印，买了一台拓竹 A1 Mini 3D 打印机。这台打印机支持 FTP 连接，用户可以使用 FileZilla、WinSCP 等 FTP 客户端上传需要打印的模型文件，以及下载延时摄影录像。

但是我尝试用 FileZilla 连接打印机时，却发现虽然用户名密码都正确，可以完成登录，但无法获取到文件列表：

![FileZilla 获取文件列表时报错连接被拒绝](/usr/uploads/202604/filezilla-error.png)

拓竹官方论坛上也有一些用户报告了这个问题，例如[这个回复](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/7)，以及[这个回复](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/15)。

有用户提到了 [WinSCP 可以用](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/137)，但我日常使用 Linux，不想专门为了连接打印机的 FTP 服务就切换到 Windows，就研究了一下问题的原因，以及 Linux 下的解决办法。

# FTP 协议简介

要理解这个问题，首先要了解 FTP 协议是如何工作的。FTP（File Transfer Protocol）是一种古老的文件传输协议，诞生于 1971 年。它使用多条 TCP 连接来分离控制命令和数据传输：

- 控制连接：客户端主动连接服务器（一般是 21 端口），建立一条持久的 TCP 连接。所有命令（如登录、切换目录、列出文件）和服务器响应都通过这条连接传输。
- 数据连接：每当需要传输文件内容或获取文件列表时，客户端和服务器会建立一条新的 TCP 连接。传输完成后，这条连接会被关闭。

根据数据连接的建立方式，FTP 分为主动模式（Active Mode）和被动模式（Passive Mode）：

## 主动模式

1. 客户端在控制连接上发送 `PORT` 命令，告知服务器自己监听的 IP 和端口。
2. 服务器主动从 20 端口连接客户端指定的 IP 和端口。
3. 数据传输完成后，连接关闭。

`PORT` 命令的格式为 `PORT h1,h2,h3,h4,p1,p2`，其中 `h1-h4` 是 IP 地址的四个字节，`p1-p2` 组成端口号（`p1*256+p2`）。例如：

```bash
PORT 192,168,1,100,4,1
```

表示客户端在 `192.168.1.100:1025`（4*256+1=1025）端口等待连接。

主动模式的问题是：如果客户端位于 NAT 或防火墙后面，服务器无法主动连接客户端。因此现代 FTP 客户端默认使用被动模式。拓竹 3D 打印机也不支持主动模式，尝试使用 `PORT` 命令时会直接返回错误。

## 被动模式

1. 客户端在控制连接上发送 `PASV` 命令。
2. 服务器响应 `227` 状态码，告知自己监听的 IP 和端口。
3. 客户端主动连接服务器指定的 IP 和端口。
4. 数据传输完成后，连接关闭。

`PASV` 响应的格式与 `PORT` 命令相同，例如：

```bash
227 (192,168,1,1,7,232)
```

表示服务器在 `192.168.1.1:2024`（7*256+232=2024）端口等待连接。

被动模式解决了客户端位于 NAT 后面的问题，因为连接由客户端主动发起。但如果服务器返回的 IP 地址不正确（例如返回内网 IP 或无效 IP），客户端将无法建立数据连接。

# 拓竹打印机的固件问题

如果我们仔细阅读 FileZilla 的输出，可以发现拓竹的 FTP 服务器在 PASV 命令中的返回值有点奇怪：

```bash
> PASV
< 227 (0,0,0,0,7,232)
```

返回值的前四段都是 0，对应的 IP 地址是 `0.0.0.0`，意味着拓竹的 FTP 服务器指示客户端连接到这个 IP 地址，而非打印机本身的 IP 地址。

`0.0.0.0` 是一个特殊的 IP 地址，通常用于表示"本机上的所有 IP 地址"。根据 [RFC 1122](https://datatracker.ietf.org/doc/html/rfc1122)，`0.0.0.0` 作为目标地址是无效的，只能作为一个特殊的源地址使用。

不同操作系统对连接 `0.0.0.0` 的行为有所不同：

- 在 Windows 上，连接 `0.0.0.0` 会失败，返回 `WSAEADDRNOTAVAIL` 错误（"The remote address is not a valid address"）。
- 在 macOS 和 Linux 上，到 `0.0.0.0` 会被自动重定向到本机，相当于 `127.0.0.1`。

因此，无论在哪个操作系统上，FTP 客户端收到 `0.0.0.0` 作为 PASV 响应时都无法正确连接到实际的 FTP 服务器。在[拓竹论坛上的这个回复](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/7)中，这名用户使用的是 Windows 系统，报错就是 `WSAEADDRNOTAVAIL`；而我使用的是 Linux，返回的错误就是 `ECONNREFUSED` 连接被拒绝，因为我的本地电脑上没有 FTP 服务器，没有开放对应的端口。

如果在 Windows 上，可以用 WinSCP 作为 FTP 客户端，并且可以参照[这个回复](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/137)，开启设置中的 `Force IP address for passive connections`（对于被动模式连接强制使用 IP 地址），实际上就是忽略 FTP 服务器在 PASV 命令中返回的 IP 地址部分，只使用端口号。

这个功能是为了支持一些配置错误的 FTP 服务器，在 PASV 命令时返回它们的内网 IP（例如 192.168.1.1）而非公网 IP。但是阴差阳错地也解决了拓竹打印机的问题。

但是我是 Linux 用户，没有 WinSCP 可用，因此只能看看怎么魔改 FileZilla。

# 魔改 FileZilla

FileZilla 也对这些配置错误的 FTP 服务器有特殊处理逻辑，在设置中的 Connection - FTP - Passive 选项卡中，可以设置当 FTP 服务器返回了内网 IP 时，是强制使用服务器的公网 IP，还是切换到主动模式。

这段逻辑对应 `src/engine/ftp/rawtransfer.cpp` 的 `CFtpRawTransferOpData::ParsePasvResponse()` 函数：

```cpp

bool CFtpRawTransferOpData::ParsePasvResponse()
{
  // 省略解析 PASV 返回内容的代码

  // CFtpRawTransferOpData 类中定义了 host_ 变量，保存 PASV 命令返回的 IP 地址
  std::wstring host_;

  // peerIP 是 FileZilla 主动连接 FTP 服务器时使用的服务器 IP 地址
  std::wstring const peerIP = fz::to_wstring(controlSocket_.socket_->peer_ip());

  // is_routable_address 函数位于 libfilezilla 库的 lib/iputils.cpp 文件中，
  // 判断 IP 地址是公网 IP（true）还是内网 IP（false）。
  // 其判断逻辑为如果 IP 位于 10.0.0.0/8，127.0.0.0/8，192.168.0.0/16
  // 169.254.0.0/16，172.16.0.0/12 中则返回内网 IP，否则返回公网 IP。
  // 注意其将 0.0.0.0 判断为了公网 IP。
  //
  // 这里的逻辑是：如果 FTP 服务器的 IP 是公网 IP，但是 PASV 返回的是内网 IP，则进入特殊处理逻辑。
  // 只对公网 FTP 服务器应用特殊处理，是因为内网 FTP 服务器确实有可能故意返回一个不同的 IP，
  // 为了在网络层进行负载均衡，或者在第一个 IP 的 65535 个端口用完时使用第二个 IP 继续提供服务。
  if (!fz::is_routable_address(host_) && fz::is_routable_address(peerIP)) {
    // 如果设置中开启了强制使用服务器公网 IP，则使用服务器 IP 而不是 PASV 返回的 IP
    if (options_.get_int(OPTION_PASVREPLYFALLBACKMODE) != 1 || bTriedActive) {
      log(logmsg::status, _("Server sent passive reply with unroutable address. Using server address instead."));
      log(logmsg::debug_info, L"  Reply: %s, peer: %s", host_, peerIP);
      host_ = peerIP;
    }
    // 否则返回 FTP 被动模式失败，FileZilla 会切换到主动模式重试
    else {
      log(logmsg::status, _("Server sent passive reply with unroutable address. Passive mode failed."));
      log(logmsg::debug_info, L"  Reply: %s, peer: %s", host_, peerIP);
      return false;
    }
  }
  // 这个模式在设置界面上被隐藏了，用户无法切换到这个模式
  else if (options_.get_int(OPTION_PASVREPLYFALLBACKMODE) == 2) {
    // 不管任何情况都强制使用主动连接 FTP 服务器时的 IP
    host_ = peerIP;
  }

  return true;
}
```

可以看到 FileZilla 没有把 `0.0.0.0` 这个 IP 当成内网 IP，导致这个逻辑对拓竹的 FTP 服务器没有生效。解决办法就是魔改 FileZilla 源码，增加一个对于 `0.0.0.0` 这个 IP 的特殊判断。由于 `0.0.0.0` 这个 IP 是无效 IP，因此不管服务器处在公网还是内网，都进入特殊处理逻辑：

```diff
Index: src/engine/ftp/rawtransfer.cpp
===================================================================
--- a/src/engine/ftp/rawtransfer.cpp  (revision 11406)
+++ b/src/engine/ftp/rawtransfer.cpp  (working copy)
@@ -399,7 +399,11 @@
   }

   std::wstring const peerIP = fz::to_wstring(controlSocket_.socket_->peer_ip());
-  if (!fz::is_routable_address(host_) && fz::is_routable_address(peerIP)) {
+  std::wstring const zeroIP = fz::to_wstring(std::string("0.0.0.0"));
+  if (
+    std::wcscmp(host_.c_str(), zeroIP.c_str()) == 0
+    || (!fz::is_routable_address(host_) && fz::is_routable_address(peerIP))
+  ) {
     if (options_.get_int(OPTION_PASVREPLYFALLBACKMODE) != 1 || bTriedActive) {
       log(logmsg::status, _("Server sent passive reply with unroutable address. Using server address instead."));
       log(logmsg::debug_info, L"  Reply: %s, peer: %s", host_, peerIP);
```

（由于我的博客系统破坏了 Tab 缩进的格式，原始补丁文件可以在这个链接下载：<https://github.com/xddxdd/nixos-config/blob/7a6abe1a61f84c430c92f3d97eb7be0c45da21d0/patches/filezilla-override-pasv-ip-for-zero-ip.patch>）

应用上述补丁后重新编译安装 FileZilla，然后重新尝试连接打印机：

![魔改的 FileZilla 可以正常获取文件列表](/usr/uploads/202604/filezilla-success-after-fix.png)

就可以正常访问打印机的 FTP 服务，上传下载文件了。

# 附录：连接拓竹 3D 打印机的 FTP 配置

- 主机（Host）：`ftps://192.168.12.34`，替换成你的打印机的 IP 地址
- 用户名：`bblp`
- 密码：可以在打印机的设置 - 局域网页面中找到，是一个 8 位数的访问码。**注意：不需要启用局域网模式也能使用 FTP，开启局域网模式会导致拓竹云端功能无法使用！**
- 端口号：`990`
- 在 FileZilla 中，可能需要在加密（Encryption）一栏中选择 `Require implicit FTP over TLS`。
