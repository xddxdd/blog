---
title: "Modifying FileZilla to Workaround Bambu 3D Printer's FTP Issue"
categories: Computers and Clients
tags: [FileZilla, FTP, '3D Printer', 'Bambu']
date: 2026-04-13 23:28:02
---

I recently bought a Bambu A1 Mini 3D printer to try out 3D printing. This printer offers a FTP server, allowing users to use FTP clients like FileZilla or WinSCP to upload model files for printing, and download timelapse videos.

However, when I tried connecting to the printer with FileZilla, I found that although the username and password were correct and login was successful, I couldn't retrieve the file list:

![FileZilla error when retrieving file list - connection refused](/usr/uploads/202604/filezilla-error.png)

Some users on the Bambu official forum have also reported this issue, such as [this reply](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/7) and [this reply](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/15).

Some users mentioned that [WinSCP works](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/137), but I use Linux daily and don't want to switch to Windows just to connect to the printer's FTP service. So I investigated the cause of the problem and found a solution for Linux.

# Introduction to FTP Protocol

To understand this problem, we first need to understand how the FTP protocol works. FTP (File Transfer Protocol) is an ancient file transfer protocol, born in 1971. It uses multiple TCP connections to separate control commands and data transfer:

- Control connection: The client actively connects to the server (usually on port 21), establishing a persistent TCP connection. All commands (such as login, change directory, list files) and server responses are transmitted through this connection.
- Data connection: Whenever file content needs to be transferred or file lists need to be retrieved, the client and server establish a new TCP connection. After the transfer is complete, this connection is closed.

Based on how the data connection is established, FTP can be divided into Active Mode and Passive Mode:

## Active Mode

1. The client sends a `PORT` command on the control connection, telling the server the IP and port it's listening on.
2. The server actively connects from port 20 to the IP and port specified by the client.
3. After data transfer is complete, the connection is closed.

The format of the `PORT` command is `PORT h1,h2,h3,h4,p1,p2`, where `h1-h4` are the four bytes of the IP address, and `p1-p2` form the port number (`p1*256+p2`). For example:

```bash
PORT 192,168,1,100,4,1
```

This means the client is waiting for a connection at `192.168.1.100:1025` (4*256+1=1025).

The problem with active mode is that if the client is behind NAT or a firewall, the server cannot actively connect to the client. Therefore, modern FTP clients use passive mode by default. Bambu 3D printers also don't support active mode - attempting to use the `PORT` command will simply return an error.

## Passive Mode

1. The client sends a `PASV` command on the control connection.
2. The server responds with a `227` status code, telling the client the IP and port it's listening on.
3. The client actively connects to the IP and port specified by the server.
4. After data transfer is complete, the connection is closed.

The format of the `PASV` response is the same as the `PORT` command, for example:

```bash
227 (192,168,1,1,7,232)
```

This means the server is listening for a connection at `192.168.1.1:2024` (7*256+232=2024).

Passive mode solves the problem of clients being behind NAT, since the connection is initiated by the client. However, if the IP address returned by the server is incorrect (for example, returning a private IP or invalid IP), the client won't be able to establish a data connection.

# Bambu Printer Firmware Issue

If we take another look of FileZilla's output, we can find that Bambu's FTP server returned some weird response for the PASV command:

```bash
> PASV
< 227 (0,0,0,0,7,232)
```

The first four segments of the return value are all 0, corresponding to the IP address `0.0.0.0`, meaning Bambu's FTP server instructs the client to connect to this IP address instead of the printer's actual IP address.

`0.0.0.0` is a special IP address, typically used to represent "all IP addresses on this machine". According to [RFC 1122](https://datatracker.ietf.org/doc/html/rfc1122), `0.0.0.0` as a destination address is invalid, and can only be used as a special source address.

Different operating systems behave differently when connecting to `0.0.0.0`:

- On Windows, connecting to `0.0.0.0` will fail, returning a `WSAEADDRNOTAVAIL` error ("The remote address is not a valid address").
- On macOS and Linux, connections to `0.0.0.0` are automatically redirected to the local machine, equivalent to `127.0.0.1`.

Therefore, regardless of the operating system, when an FTP client receives `0.0.0.0` in a PASV response, it cannot correctly connect to the actual FTP server. In [this reply on the Bambu forum](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/7), the user was using Windows and got the `WSAEADDRNOTAVAIL` error. But since I'm using Linux, the error returned was `ECONNREFUSED` (connection refused), because there's no FTP server on my local computer and no corresponding port is open.

On Windows, you can use WinSCP as an FTP client, and per [this comment](https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464/137) enable the `Force IP address for passive connections` setting in the options, which essentially ignores the IP address portion returned by the FTP server in the PASV command and only uses the port number.

This feature was designed to support some misconfigured FTP servers that return their private IP (e.g., 192.168.1.1) instead of their public IP in the PASV command. But coincidentally, it also solves the problem in Bambu's case.

However, as a Linux user, I don't have WinSCP available, so I have to figure out how to modify FileZilla.

# Modifying FileZilla

FileZilla also has special handling logic for these misconfigured FTP servers. In the settings under Connection - FTP - Passive tab, you can configure what to do when the FTP server returns a private IP: either force using the server's public IP or switch to active mode.

This logic is implemented in the `CFtpRawTransferOpData::ParsePasvResponse()` function in `src/engine/ftp/rawtransfer.cpp`:

```cpp

bool CFtpRawTransferOpData::ParsePasvResponse()
{
  // Omitted code for parsing PASV response content

  // The CFtpRawTransferOpData class defines a host_ variable that stores the IP address returned by the PASV command
  std::wstring host_;

  // peerIP is the server IP address used when FileZilla actively connects to the FTP server
  std::wstring const peerIP = fz::to_wstring(controlSocket_.socket_->peer_ip());

  // The is_routable_address function is located in the libfilezilla library's lib/iputils.cpp file,
  // determining whether an IP address is a public IP (true) or a private IP (false).
  // Its logic is: if the IP is in 10.0.0.0/8, 127.0.0.0/8, 192.168.0.0/16,
  // 169.254.0.0/16, 172.16.0.0/12, it returns private IP, otherwise public IP.
  // Note that it judges 0.0.0.0 as a public IP.
  //
  // The logic here is: if the FTP server's IP is a public IP, but PASV returns a private IP, then enter special handling logic.
  // Special handling is only applied to public FTP servers because private FTP servers might intentionally return a different IP,
  // for load balancing at the network layer, or to use a second IP when the first IP's 65535 ports are exhausted.
  if (!fz::is_routable_address(host_) && fz::is_routable_address(peerIP)) {
    // If the setting to force using the server's public IP is enabled, use the server IP instead of the PASV-returned IP
    if (options_.get_int(OPTION_PASVREPLYFALLBACKMODE) != 1 || bTriedActive) {
      log(logmsg::status, _("Server sent passive reply with unroutable address. Using server address instead."));
      log(logmsg::debug_info, L"  Reply: %s, peer: %s", host_, peerIP);
      host_ = peerIP;
    }
    // Otherwise, return FTP passive mode failed, and FileZilla will switch to active mode and retry
    else {
      log(logmsg::status, _("Server sent passive reply with unroutable address. Passive mode failed."));
      log(logmsg::debug_info, L"  Reply: %s, peer: %s", host_, peerIP);
      return false;
    }
  }
  // This mode is hidden in the settings interface, users cannot switch to this mode
  else if (options_.get_int(OPTION_PASVREPLYFALLBACKMODE) == 2) {
    // Force using the IP when actively connecting to the FTP server regardless of any situation
    host_ = peerIP;
  }

  return true;
}
```

As you can see, FileZilla doesn't treat `0.0.0.0` as a private IP, causing this logic to not work for Bambu's FTP server. The solution is to modify FileZilla's source code to add special handling for the `0.0.0.0` IP. Since `0.0.0.0` is an invalid IP, we can always use the special logic, regardless of whether the server is on a public or private network:

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

(Due to my blog system breaking the tab indentation format, the original patch file can be obtained from this link: <https://github.com/xddxdd/nixos-config/blob/7a6abe1a61f84c430c92f3d97eb7be0c45da21d0/patches/filezilla-override-pasv-ip-for-zero-ip.patch>)

After applying the above patch, recompile and install FileZilla, then try connecting to the printer again:

![Modified FileZilla can successfully retrieve file list](/usr/uploads/202604/filezilla-success-after-fix.png)

Now you can normally access the printer's FTP service to upload and download files.

# Appendix: FTP Configuration for Connecting to Bambu 3D Printer

- Host: `ftps://192.168.12.34`, replace with your printer's IP address
- Username: `bblp`
- Password: Can be found in the printer's settings - LAN page, it's an 8-digit access code. **Note: You don't need to enable LAN mode to use FTP, enabling LAN mode will cause Bambu cloud features to stop working!**
- Port: `990`
- In FileZilla, you may need to select `Require implicit FTP over TLS` in the Encryption field.
