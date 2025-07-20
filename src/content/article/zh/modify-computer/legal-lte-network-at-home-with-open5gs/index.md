---
title: '用 Open5GS 搭建合法的 LTE 网络'
categories: 计算机与客户端
tags: [LTE, 4G, CBRS, Open5GS]
date: 2025-07-20 12:38:31
series: "蓝天移动（自建 LTE 网络）"
---

[在上一篇文章中](/article/modify-computer/legal-lte-network-at-home-for-100-bucks.lantian/)，我用美国的 CBRS 频段和 [Magma LTE 核心网软件](https://magmacore.org/)搭建了一套合法的 LTE 网络。

> 关于“合法”：我不是律师或者无线电专家。根据我对相关政策法规的研究，我的整套配置应当是合法的。但如果你按照本文操作后遇到了法律问题，我不负任何责任。

我当时选择 Magma，是因为我买的 CBRS LTE 基站原本用于 Helium Mobile 网络，而 [Nova Labs/Helium Mobile 使用的 CBRS 核心网就是 Magma](https://github.com/helium/HIP/blob/main/0139-phase-out-cbrs.md#what-to-do-with-cbrs-radios)。这保证了 Magma 一定兼容我手上的基站。但是，从在 Homelab 里自建核心网的角度来考虑，Magma 存在这些问题：

- Magma 的核心网依赖 Docker 或者 Kubernetes 进行部署，难以用常规的方式（例如 systemd 服务）在容器外部署。而我是 NixOS 用户，希望尽量避免臃肿的 Docker 容器，而是用 systemd 服务管理系统上的服务。
- Magma 的访问网关（Access Gateway）只能安装在 Ubuntu 20.04 系统上，系统管理方式与我常用的 NixOS 完全不同。这意味着我需要手工管理访问网关机器的配置以及系统升级，无法复用我现有的 NixOS 配置。
- Magma 有时会出一些奇怪的问题，例如：
  - Android 手机死活连不上基站但 iPhone 没问题；
  - 手机无法正常获取网络名称，网络名称总是显示为 MCC/MNC `315 010` 而不是我配置的网络名 `Lan Tian Mobile`；
  - 访问网关明明连上了核心网并且正常同步配置，但核心网管理界面中显示访问网关已经很久没连上了。

因此，在上一篇文章完成，确定自建 LTE 网络可行后，我就开始尝试用另一款开源 LTE 核心网软件 [Open5GS](https://open5gs.org/) 替换 Magma。

相比 Magma，Open5GS 有这些优点：

- Open5GS 不区分核心网和访问网关两套组件，只需要一台机器就可以完整部署。
- Nixpkgs 中已经有了 Open5GS 软件包（`pkgs.open5gs`），我不用自己打包就能直接在 NixOS 上安装使用，不需要 Docker 或者 Ubuntu。
- Open5GS 没有 Magma 那些奇怪的问题，一旦搭建完成就可以稳定运行。

本文记录我在 NixOS 系统上用 Open5GS 搭建核心网，并且用 FreedomFi/Sercomm 的 SCE4255W 基站连接核心网、发射 LTE 信号的过程。

# 安装 Open5GS

> 配置过程参考了以下资料：
> - [Open5GS 的官方文档](https://open5gs.org/open5gs/docs/)
> - 一套打包成开箱即用 Docker 容器的 Open5GS（以及一些附加组件）配置：[herlesupreeth/docker_open5gs](https://github.com/herlesupreeth/docker_open5gs)

## 准备工作

本文假定你已经按照我的[上一篇文章](/article/modify-computer/legal-lte-network-at-home-for-100-bucks.lantian/)准备好了这些硬件或软件配置。如果你没有完成这些配置，可以参考上一篇文章中的对应教程配置软件或者购买硬件：

- 一台 FreedomFi/Sercomm 的 SCE4255W 基站，已经解锁 Web 管理界面
- 基站已经注册到 CBRS SAS 上
- 一张已经写好认证信息（KI，OPC 等值）的 SIM 卡，并且你记录了这些认证信息（以便稍后注册到 Open5GS）

本文基于 NixOS 进行所有配置，但也提供了一些 Ubuntu 相关的命令，以便其它 Linux 发行版的用户参考。

## 了解 Open5GS 的组件

Open5GS 如其名，是一套主要实现 5G 核心网（但也实现了 LTE 核心网）的软件。由于 5G 时代的核心网协议和结构与 4G 时代相比有了较大不同，尤其是独立组网的 5G SA 网络，因此 Open5GS 大致上可以看作是一套 LTE/5G NSA 核心网软件，加上一套 5G SA 核心网软件，两者之间共享一小部分组件。

Open5GS 的 LTE/5G NSA 部分由如下组件组成：

- MME - Mobility Management Entity
- HSS - Home Subscriber Server
- PCRF - Policy and Charging Rules Function
- SGWC - Serving Gateway Control Plane
- SGWU - Serving Gateway User Plane
- SMF - Session Management Function
  - SMF 本身是 5G 核心网的组件，但 Open5GS SMF 也实现了 4G 核心网结构中的 Packet Gateway Control Plane
- UPF - User Plane Function
  - UPF 本身是 5G 核心网的组件，但 Open5GS UPF 也实现了 4G 核心网结构中的 Packet Gateway User Plane
- NRF - NF Repository Function
  - NRF 本身是 5G 核心网的组件，但是 SCP 依赖它
- SCP - ~~Secure, Contain, Protect~~ Service Communication Proxy
  - SCP 本身是 5G 核心网的组件，但是 SMF 依赖它

而 5G SA 部分由如下组件组成：

- NRF - NF Repository Function
- SCP - Service Communication Proxy
- SEPP - Security Edge Protection Proxy
- AMF - Access and Mobility Management Function
- SMF - Session Management Function
- UPF - User Plane Function
- AUSF - Authentication Server Function
- UDM - Unified Data Management
- UDR - Unified Data Repository
- PCF - Policy and Charging Function
- NSSF - Network Slice Selection Function
- BSF - Binding Support Function

这些组件之间以如下的结构互相通信：

![Open5GS 组件结构图](/usr/uploads/202507/Open5GS_CUPS-01.jpg)

（图源：[Open5GS 官方文档](https://open5gs.org/open5gs/docs/guide/01-quickstart/)）

4G/5G 核心网的各个组件之间通信走的是标准化的 [Diameter 协议](https://en.wikipedia.org/wiki/Diameter_(protocol))，它基于 TCP 或者 [SCTP](https://zh.wikipedia.org/wiki/%E6%B5%81%E6%8E%A7%E5%88%B6%E4%BC%A0%E8%BE%93%E5%8D%8F%E8%AE%AE) 协议，在 4G/5G 核心网的各个组件之间交换数据。这也意味着来自不同厂商的软硬件，只要支持 Diameter 协议，就都可以加入同一个核心网中，共同为移动用户提供服务。

但本文中我将全程使用 Open5GS 的组件，暂时不将别的组件加入核心网。

## 安装 Open5GS 软件包

如果你用的是 Ubuntu，可以参考 [Open5GS 的官方安装教程](https://open5gs.org/open5gs/docs/guide/01-quickstart/)：

```bash
# 安装 MongoDB
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update
sudo apt install mongodb-org

# 安装 Open5GS
sudo add-apt-repository ppa:open5gs/latest
sudo apt update
sudo apt install open5gs
```

这个过程中除了安装了 Open5GS 的二进制文件，还创建了一组 systemd 服务对应 Open5GS 的各个组件，以及将 Open5GS 的默认配置复制到了 `/etc` 下。

由于 NixOS 中只有 Open5GS 的软件包，没有对应的 NixOS 模块，因此我们需要模仿在 Ubuntu 等其它系统上安装的过程，手动为 Open5GS 创建 systemd 服务：

```nix
{ pkgs, lib, ... }:
let
  # 由于我们只搭建 4G 核心网，只开启 4G 核心网需要的服务
  services = [
    "hss"
    "mme"
    "nrf"
    "pcrf"
    "scp"
    "sgwc"
    "sgwu"
    "smf"
    "upf"
  ];
in
{
  # 开启 MongoDB，HSS、PCF、PCRF 组件需要用 MongoDB 保存配置
  services.mongodb = {
    enable = true;
    bind_ip = "127.0.0.1";
    package = pkgs.mongodb-ce;
  };

  # 创建 Open5GS 各组件的 systemd 服务
  systemd.services = builtins.listToAttrs (
    builtins.map (svc: {
      name = "open5gs-${svc}d";
      value = {
        description = "Open5GS ${lib.toUpper svc} Daemon";
        wantedBy = [ "multi-user.target" ];
        after = [
          "network.target"
          "mongodb.service"
        ];
        requires = [
          "network.target"
          "mongodb.service"
        ];
        serviceConfig = {
          # 这里指向的 open5gs 文件夹下的配置文件我们下一步再创建
          ExecStart = "${pkgs.open5gs}/bin/open5gs-${svc}d -c ${./open5gs}/${svc}.yaml";
          ExecReload = "${pkgs.coreutils}/bin/kill -HUP $MAINPID";
          LogsDirectory = "open5gs";
          User = "open5gs";
          Group = "open5gs";
          Restart = "always";
          RestartSec = "5";
          RestartPreventExitStatus = "1";
        };
      };
    }) services
  );

  # 创建一个单独的用户和组给 Open5GS
  users.users.open5gs = {
    group = "open5gs";
    isSystemUser = true;
  };
  users.groups.open5gs = { };

  # 创建一个名为 ogstun 的 TUN 接口，用于与 LTE 设备通信
  systemd.network.netdevs.open5gs = {
    netdevConfig = {
      Kind = "tun";
      Name = "ogstun";
    };
  };

  systemd.network.networks.open5gs = {
    # 这里用的 IP 地址和 Open5GS 默认配置中的相同
    address = [
      "10.45.0.1/16"
      "2001:db8:cafe::1/48"
    ];
    linkConfig = {
      MTUBytes = 1400;
      RequiredForOnline = false;
    };
    matchConfig.Name = "ogstun";
  };
}
```

## 创建 Open5GS 配置文件

如果你用的是 Ubuntu，上面的安装过程应该已经自动将默认配置文件安装到了 `/etc/freeDiameter` 和 `/etc/open5gs` 下。但在 NixOS 中，这个过程不会自动完成，我们需要手动复制配置文件，或者手动指定配置文件的路径。

由于 Nixpkgs 的 Open5GS 软件包已经自带了一组默认配置，我们可以直接从这个包里复制默认配置文件。首先构建软件包：

```bash
nix build nixpkgs#open5gs
```

不出意外，Nix 会从 Binary Cache 里下载预先编译好的 Open5GS，并且把它软链接到 `result` 目录下。此时我们在 `result/etc` 文件夹下就可以看到默认的配置文件了：

```bash
ls result/etc
```

然后我们就可以把它们复制到自己的 NixOS 配置中，以便后续修改：

```bash
cp -r result/etc/freeDiameter /path/to/your/nixos-config/freeDiameter
cp -r result/etc/open5gs /path/to/your/nixos-config/open5gs
# 从 Nix store 中复制出的文件默认是只读的，给它们加上写权限
chmod -R +w /path/to/your/nixos-config/freeDiameter /path/to/your/nixos-config/open5gs
```

对于 `freeDiameter` 文件夹中的文件，我们需要把它们放到 `/etc/freeDiameter` 下：

```nix
{
  environment.etc."freeDiameter".source = ./freeDiameter;
}
```

对于 `open5gs` 文件夹中的文件，可以在启动 Open5GS 时使用 `-c` 参数直接指定配置文件的为止：

```nix
{
  systemd.services = {
    # ...
    ExecStart = "${pkgs.open5gs}/bin/open5gs-${svc}d -c ${./open5gs}/${svc}.yaml";
    # ...
  };
}
```

不把它们放到 `/etc` 中，是为了保证修改配置文件后，Open5GS 服务会自动重启。

## 修复 NixOS 下 Open5GS 配置文件中的路径

由于 Nixpkgs 中打包的 Open5GS 默认安装到 `/nix/store` 中的一个路径下，因此它的配置文件中也默认包含了很多 `/nix/store` 下的路径。

首先获取 Open5GS 的实际安装路径：

```bash
nix build nixpkgs#open5gs --print-out-paths --no-link
# 输出类似：
# /nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/
```

然后在复制出来的配置文件中搜索这个路径，可以看到有很多处包含了完整的路径：

```bash
grep "/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/" freeDiameter/* open5gs/*
# ...
# 引用 Open5GS 构建过程中默认生成的 TLS 证书
# freeDiameter/hss.conf:TLS_Cred = "/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/etc/open5gs/tls/hss.crt", "/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/etc/open5gs/tls/hss.key";
# ...
# 引用 freeDiameter 的 Extension
# freeDiameter/hss.conf:LoadExtension = "/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/lib/freeDiameter/dbg_msg_dumps.fdx" : "0x8888";
# ...
# 默认日志路径被放到了 Nix store 中
# open5gs/hss.yaml:    path: /nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/var/log/open5gs/hss.log
# ...
# freeDiameter 的配置文件路径被设置到了 Nix store 中
# open5gs/hss.yaml:  freeDiameter: /nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/etc/freeDiameter/hss.conf
# ...
```

一旦 Open5GS 软件包或者它的依赖更新，Open5GS 在 Nix store 中的路径就会发生变动，导致以绝对路径指定的文件失效，从而导致 Open5GS 无法启动。因此，我们需要让这些路径和 Open5GS 的路径保持同步，或者指向 Nix store 之外，以防止未来出现问题。

我用的方法是，首先把 `pkgs.open5gs` 软件包链接一份到 `/etc` 里：

```nix
{
  environment.etc."open5gs-pkg".source = pkgs.open5gs;
}
```

然后修改上述路径：

```bash
# TLS 证书指向 /etc/open5gs-pkg。虽然这个证书是从 Nixpkgs Binary Cache 下载的，私钥可以视为公开，但我们单机部署，通信不经过外部网络，因此加密无关紧要
sed -i "s#/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/etc/open5gs/tls/#/etc/open5gs-pkg/etc/open5gs/tls/#g" freeDiameter/* open5gs/*
# freeDiameter Extension 指向 /etc/open5gs-pkg
sed -i "s#/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/lib/freeDiameter/#/etc/open5gs-pkg/lib/freeDiameter/#g" freeDiameter/* open5gs/*
# /var 中的路径指向实际的 /var
sed -i "s#/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/var/#/var/#g" freeDiameter/* open5gs/*
# freeDiameter 配置文件指向 /etc/freeDiameter
sed -i "s#/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/etc/freeDiameter/#/etc/freeDiameter/#g" freeDiameter/* open5gs/*
```

修改完成后，就可以保证 Open5GS 未来升级时不会出现问题，同时我们放在 `/etc` 的配置文件可以正常生效。

## （可选）重新生成 Diameter 的 TLS 证书

Nixpkgs 中打包的 Open5GS 自带了一份在构建过程中生成的 TLS 证书。如果你的 Open5GS 是从 Binary Cache 下载的，而不是本地编译的，那么其他人也可以从 Binary Cache 上下载到同一份密钥。

如果你按照本教程的流程单机部署，因为所有的通信都在本地，不会经过外部网络，所以有没有加密、私钥是否泄露对安全性没什么影响。

但如果你准备将一部分组件放到别的机器上，或者你不想使用这份已经泄露的密钥，你也可以用如下的脚本生成一份新的：

```nix
{
  pkgs,
  ...
}:
{
  systemd.services.open5gs-certs = {
    wantedBy = [ "multi-user.target" ];
    path = with pkgs; [ openssl ];
    script = ''
      mkdir -p demoCA
      if [ ! -f "demoCA/serial" ]; then
        echo 01 > demoCA/serial
      fi
      touch demoCA/index.txt

      # CA self certificate
      if [ ! -f "ca.crt" ]; then
        openssl req -new -x509 -days 3650 -newkey rsa:2048 -nodes -keyout ca.key -out ca.crt \
          -subj /CN=ca.epc.mnc010.mcc315.3gppnetwork.org/C=KO/ST=Seoul/O=NeoPlane
      fi

      for i in amf ausf bsf hss mme nrf scp sepp1 sepp2 sepp3 nssf pcf pcrf smf udm udr
      do
        if [ ! -f "$i.crt" ]; then
          openssl genpkey -algorithm rsa -pkeyopt rsa_keygen_bits:2048 \
              -out $i.key
          openssl req -new -key $i.key -out $i.csr \
              -subj /CN=$i.epc.mnc010.mcc315.3gppnetwork.org/C=KO/ST=Seoul/O=NeoPlane
          openssl ca -batch -notext -days 3650 \
              -keyfile ca.key -cert ca.crt \
              -in $i.csr -out $i.crt -outdir .
        fi
      done
    '';
    serviceConfig = {
      Type = "oneshot";
      User = "open5gs";
      Group = "open5gs";
      StateDirectory = "open5gs-certs";
      WorkingDirectory = "/var/lib/open5gs-certs";
    };
  };
}
```

当运行 `systemctl start open5gs-certs.service` 时，这个服务就会自动在 `/var/lib/open5gs-certs` 中生成缺失的密钥。

然后你就可以修改 Open5GS 的配置文件，将 TLS 密钥路径指向 `/var/lib/open5gs-certs`：

```bash
# 如果你在上一步没有替换 TLS 密钥的路径
sed -i "s#/nix/store/vbb0aa2mkjbfay7gdgaw5r23g0ss6kyz-open5gs-v2.7.6/etc/open5gs/tls/#/var/lib/open5gs-certs/#g" freeDiameter/* open5gs/*
# 如果你在上一步已经替换了 TLS 密钥的路径
sed -i "s#/etc/open5gs-pkg/etc/open5gs/tls/#/var/lib/open5gs-certs/#g" freeDiameter/* open5gs/*
```

你也可以把 `open5gs-certs.service` 加到 Open5GS 各个 systemd 服务的 `After` 和 `Requires` 里，从而保证 Open5GS 启动时密钥已经生成完毕。

```nix
{
  systemd.services = {
    # ...
    after = [
      "network.target"
      "open5gs-certs.service"
      "mongodb.service"
    ];
    requires = [
      "network.target"
      "open5gs-certs.service"
      "mongodb.service"
    ];
    # ...
  };
}
```

## 安装 Open5GS 的 Web 管理面板

上面的步骤配置了 Open5GS 核心网本身，但我们还需要安装管理面板 WebUI，以管理注册到 Open5GS 的 SIM 卡相关信息。

如果你用的是 Ubuntu，可以使用 Open5GS 官方的一键安装脚本：

```bash
# 下载 Nodesource 的 GPG 密钥
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# 添加 NodeJS 软件包仓库
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# 安装 NodeJS
sudo apt update
sudo apt install nodejs -y

# 安装 Open5GS WebUI
curl -fsSL https://open5gs.org/open5gs/assets/webui/install | sudo -E bash -
```

如果你用的是 NixOS，可以用以下配置安装：

```nix
{
  pkgs,
  config,
  ...
}:
{
  systemd.services.open5gs-webui = {
    description = "Open5GS WebUI";
    wantedBy = [ "multi-user.target" ];
    after = [
      "network.target"
      "mongodb.service"
    ];
    requires = [
      "network.target"
      "mongodb.service"
    ];
    path = with pkgs; [
      bash
      nodejs
      rsync
    ];
    environment = {
      HOSTNAME = "0.0.0.0";
      PORT = "9999";
    };
    preStart = ''
      export HOME=$(pwd)
      rsync -r --chmod=D755,F755 ${pkgs.open5gs.src}/webui/ .
      npm install
      npm run build
    '';
    serviceConfig = {
      ExecStart = "${pkgs.nodejs}/bin/npm run start";
      CacheDirectory = "open5gs";
      WorkingDirectory = "/var/cache/open5gs";
      User = "open5gs";
      Group = "open5gs";
      Restart = "always";
      RestartSec = "5";
    };
  };
}
```

## 启动 Open5GS

将上面的配置部署到你的 NixOS 机器上，不出意外这些服务都应该正常启动。

如果你用的是 Ubuntu，那么在安装 `open5gs` 软件包时，4G/5G 的所有服务都应该已经自动启动了。你可以禁用掉我们用不到的 5G SA 相关的服务，也可以不管它们，它们对后续配置没有任何影响。

## 创建管理面板的默认管理员

Open5GS 启动时并不会自动创建默认的管理员用户，所以在配置部署完成，MongoDB 已经启动之后，我们需要手动运行下面的命令来创建管理员：

```bash
cat <<EOF | mongosh open5gs
db = db.getSiblingDB('open5gs')
cursor = db.accounts.find()
if ( cursor.count() == 0 ) {
    db.accounts.insertOne({ salt: 'f5c15fa72622d62b6b790aa8569b9339729801ab8bda5d13997b5db6bfc1d997', hash: '402223057db5194899d2e082aeb0802f6794622e1cbc47529c419e5a603f2cc592074b4f3323b239ffa594c8b756d5c70a4e1f6ecd3f9f0d2d7328c4cf8b1b766514effff0350a90b89e21eac54cd4497a169c0c7554a0e2cd9b672e5414c323f76b8559bc768cba11cad2ea3ae704fb36abc8abc2619231ff84ded60063c6e1554a9777a4a464ef9cfdfa90ecfdacc9844e0e3b2f91b59d9ff024aec4ea1f51b703a31cda9afb1cc2c719a09cee4f9852ba3cf9f07159b1ccf8133924f74df770b1a391c19e8d67ffdcbbef4084a3277e93f55ac60d80338172b2a7b3f29cfe8a36738681794f7ccbe9bc98f8cdeded02f8a4cd0d4b54e1d6ba3d11792ee0ae8801213691848e9c5338e39485816bb0f734b775ac89f454ef90992003511aa8cceed58a3ac2c3814f14afaaed39cbaf4e2719d7213f81665564eec02f60ede838212555873ef742f6666cc66883dcb8281715d5c762fb236d72b770257e7e8d86c122bb69028a34cf1ed93bb973b440fa89a23604cd3fefe85fbd7f55c9b71acf6ad167228c79513f5cfe899a2e2cc498feb6d2d2f07354a17ba74cecfbda3e87d57b147e17dcc7f4c52b802a8e77f28d255a6712dcdc1519e6ac9ec593270bfcf4c395e2531a271a841b1adefb8516a07136b0de47c7fd534601b16f0f7a98f1dbd31795feb97da59e1d23c08461cf37d6f2877d0f2e437f07e25015960f63', username: 'admin', roles: [ 'admin' ], "__v" : 0})
}
EOF
```

（来源：<https://github.com/open5gs/open5gs/blob/main/docs/assets/webui/mongo-init.js>）

以上命令会创建一个用户名为 `admin`，密码为 `1423` 的管理员用户。

用浏览器打开 `http://[Open5GS 机器的 IP 地址]:9999`，就可以用上述用户名密码登录管理面板。

# 修改 Open5GS 的配置文件

Open5GS 安装完成后，就可以修改配置文件，使其符合我们的 CBRS LTE 网络的参数。我们只需要做如下修改：

- 将 MCC/MNC 从默认的 999/70 修改成 CBRS 的 315/010

直接全局搜索 `mcc: 999` 和 `mnc: 70`，然后将它们替换成 `mcc: 315` 和 `mnc: 010` 即可：

```bash
sed -i "s#mcc: 999#mcc: 315#g" open5gs/*
sed -i "s#mnc: 70#mnc: 010#g" open5gs/*
```

- 让 MME 组件在 `eth0`（或者你的实际网卡名）接口上监听，而不是 `127.0.0.2`，否则基站无法连上核心网

修改 `open5gs/mme.yaml`，将 `s1ap` 下原本的配置：

```yaml
mme:
  s1ap:
    server:
      - address: 127.0.0.2
```

修改成：

```yaml
mme:
  s1ap:
    server:
      - dev: eth0  # 或者你的实际网卡名
```

- （可选）自定义 MME 广播的网络名。

修改 `open5gs/mme.yaml`，找到 `network_name`：

```yaml
network_name:
  full: Open5GS
  short: Next
```

改成你想要的网络名即可，例如：

```yaml
network_name:
  full: Lan Tian Mobile
  short: LTMobile
```

最后，重启所有 Open5GS 相关的服务：

```bash
systemctl restart open5gs-\*
```

# 将 FreedomFi/Sercomm 基站连上 Open5GS

首先，请确保你可以通过 IP 地址登录 FreedomFi/Sercomm SCE4255 基站的 Web 管理面板。如果无法访问基站的 Web 管理面板，请参考[我的上一篇文章](/article/modify-computer/legal-lte-network-at-home-for-100-bucks.lantian/#%E8%A7%A3%E9%94%81%E5%AE%A4%E5%86%85%E5%9F%BA%E7%AB%99%E7%9A%84%E7%AE%A1%E7%90%86%E7%95%8C%E9%9D%A2)开启管理面板。

## 关闭 TR-069 远程管理

FreedomFi 出售的 Sercomm 基站默认会连接 `acs.freedomfi.com` 这个 TR-069 服务器，从 TR-069 服务器自动获取配置。虽然这个远程管理服务器随着 Helium Mobile 停用 CBRS 网络而关闭，但我们的基站仍然会不停尝试连接远程管理。在用 Magma 搭建核心网时，由于 Magma 核心网自带 TR-069 服务器的功能，所以我们可以保持远程管理开启，只需要将远程管理劫持到我们的 TR-069 服务器即可。但 Open5GS 没有 TR-069 的功能，所以我们要关闭基站的 TR-069 远程管理，避免不必要的请求，并防止基站的配置被意外覆盖。

在管理界面的顶部点击 `TR098`，然后点击 `MgntServer` 标签页，切换到基站的 TR-069 远程管理设置页面：

![Sercomm 基站的 TR-069 设置页面](/usr/uploads/202507/sercomm-tr069.png)

取消勾选 `EnableCWMP`，然后点击 `Save` 按钮保存设置。

由于 Sercomm 基站管理面板的 Bug 有点多，所以这里建议重启一次基站以保证设置生效。保存设置时基站可能会自动重启，但如果基站没有重启，可以点击管理界面右上角的电源按钮手动重启一次，或者手动断电重启。重启完后请再次回到此页面并保证 `EnableCWMP` 是关闭状态。

此时，基站的 TR-069 远程管理功能就关闭了，我们就可以随意修改设置，不怕被远程管理覆盖了。

## 修改基站的 CBRS SAS 连接配置

下一步是让基站连接 CBRS SAS 服务器，获取频段分配，从而避免和其它基站或者运营商的信号发生冲突，以及避免 FCC 上门和你玩彩虹六号。在使用 Magma 核心网时，CBRS SAS 的连接配置由 Magma 的 TR-069 服务器自动下发，但由于 Open5GS 没有 TR-069 的功能，这部分就需要我们手动设置了。

首先确保你的基站已经注册到了 SAS 上，可以参考[我的上一篇文章中，连接 SAS 的部分](/article/modify-computer/legal-lte-network-at-home-for-100-bucks.lantian/#%E5%9F%BA%E7%AB%99%E8%BF%9E%E6%8E%A5-sas)。

然后，在基站管理界面的顶部点击 `Manage`，然后点击 `SAS Configuration` 标签页：

![Sercomm 基站的 SAS 设置页面](/usr/uploads/202507/sercomm-sas.png)

- `Enable` 选项打勾。
- `Method` 选项输入 0。
- `Server` 选择 `Commercial-Google`，对应 Google SAS。此时 `Server Url` 应该会自动填充。
- `UserID` 输入你的 Google Cloud Project ID，可以在控制台主页看到：<https://console.cloud.google.com>
- `Category` 选择 `A`，对应室内基站。
- `ChannelType` 选择 `GAA`，对应 CBRS 三类用户中优先级最低的一类。
- `CertSubject` 输入 `/C=TW/O=Sercomm/OU=WInnForum CBSD Certificate/CN=P27-SCE4255W:%s`

![Sercomm 基站的 SAS 位置设置页面](/usr/uploads/202507/sercomm-sas-location.png)

- `Location` 选择 `indoor`，对应室内部署。
- 如果你的基站所在位置 GPS 信号良好，`Location Source` 可以选择 `GPS`。但如果 GPS 信号差，基站重启后需要等待 GPS 定位完成后才会连接 CBRS SAS 并开始发送信号。此时你可以选择 `Manual` 并手动输入基站的经纬度。
- `Latitude` 是纬度，正数为北纬，负数为南纬。注意 Sercomm 基站的经纬度单位是微度（即百万分之一度），所以如果你要设置北纬 40 度，请输入 `40000000`.
- `Longitude` 是经度，正数为东经，负数为西经。注意 Sercomm 基站的经纬度单位是微度（即百万分之一度），所以如果你要设置西经 80 度，请输入 `-80000000`.
  - 经纬度请用你的手机等设备实际定位得到，基站的位置需要比较精确，否则会影响到 CBRS SAS 的频段分配。同时这个经纬度应该和 CBRS SAS 平台上设置的经纬度一致。
- `HeightType` 选择 `AMSL`，即相对海平面的高度。
- `Elevation` 输入基站的海拔高度，单位是毫米，所以如果你要设置海平面以上 40 米，请输入 `40000`。

保存设置。暂时不用重启基站，下一步配置完基站到 Open5GS 核心网的连接后再一起重启。

## 修改基站的核心网连接配置

下一步是让基站连接 Open5GS 核心网，从而传输用户信息和数据流量。

在基站管理界面的顶部点击 `Manage`，然后点击 `LTE Basic Setting` 标签页：

![Sercomm 基站的 LTE 设置页面](/usr/uploads/202507/sercomm-sas-location.png)

- `Cell Configuration` 下：
  - `AdminStats` 选项打勾，代表启用信号发射。
  - `Carrier Number` 选择 1。
    - 如果选择 2 并相应调整下面的设置，可以启用载波聚合，让带宽翻倍，但是这种情况下 Sercomm 的 CBRS SAS 实现有点问题，可能会随机导致信号发射中断。
  - `Carrier Aggregation` 选项不要打勾。
    - 如果你想开载波聚合，此处打勾。
  - `BandWidth` 选择 20，把带宽拉满获得最高速度。
  - `CellIDentity` 输入 `0`。如果你有多个基站，可以依次输入 `1`，`2` 等等，基站之间不要重复。
    - 如果你想开载波聚合，输入 `0,1`，即逗号分隔的两个不同的 ID。
  - `PCI` 输入 `100`。如果你有多个基站，可以依次输入 `101`，`102` 等等，基站之间不要重复。
    - 如果你想开载波聚合，输入 `100,101`，即逗号分隔的两个不同的 ID。
  - `TxPower` 输入 `24`。

- `S1 Configuration` 下：
  - `Tunnel Type` 选择 IPv4。此时基站到核心网之间的数据是明文传输。
    - 由于我们的基站和核心网在同一个局域网下，都由我们物理控制，所以这里的安全风险不大。但如果你的基站需要通过互联网连接到核心网，你应该尝试使用 `IPSEC` 选项，但相应的你需要额外配置 IPSec 隧道的相关设置。
  - `MME IP Address` 输入 `Open5GS` 核心网机器的 IP 地址。
    - 如果你的 `Open5GS` 核心网的不同组件安装在不同机器上，此处输入运行 MME 组件机器的 IP 地址。
  - `PLMNID` 输入 `315010`，对应 CBRS 的 MCC/MNC。
  - `TAC` 输入 `1`。

- 如果你的基站所在位置 GPS 信号良好，`Sync Source` 可以选择 `GPS`。但如果 GPS 信号差，基站重启后需要等待 GPS 定位完成后才会开始发送信号。此时你可以选择 `FREE_RUNNING`。

保存设置，这里建议重启一次基站以保证设置生效。保存设置时基站可能会自动重启，但如果基站没有重启，可以点击管理界面右上角的电源按钮手动重启一次，或者手动断电重启。

重启完成后，稍等片刻，看一下基站的指示灯，最左侧的 LTE 状态指示灯应该是蓝灯常亮，代表此时已经在发射 LTE 信号。到这里，基站的配置就全部完成了。

拿出你的手机，随便选择一张 SIM 卡，关闭“自动选择网络”选项，手机就会自动搜索附近的移动网络。如果你的手机支持 LTE 48 频段，你应该就能看到一个名为 `Lan Tian Mobile`（或者你自己配置的网络名称）的网络，这就是你的基站发射的信号。

基站管理面板上也应该显示 `henb running`，代表基站运行正常：

![Sercomm 基站状态页面](/usr/uploads/202507/sercomm-status.png)

# 将 SIM 卡信息注册到 Open5GS 上

核心网和基站正常运行后，就可以将 SIM 卡注册到核心网上，让使用这些 SIM 卡的手机等设备连接 LTE 网络了。

准备几张可编程 SIM 卡，按照[上一篇文章中的写 SIM 卡教程](/article/modify-computer/legal-lte-network-at-home-for-100-bucks.lantian/#%E5%86%99-sim-%E5%8D%A1)给你的 SIM 卡写入认证信息。记录下 SIM 卡的 IMSI/KI/OPC 信息。

登录 Open5GS 的 Web 管理面板，然后点击 `Add a subscriber`：

![Open5GS 添加 SIM 卡界面](/usr/uploads/202507/open5gs-add-subscriber.png)

- `IMSI` 输入 SIM 卡对应的 IMSI 信息。
- `Subscriber Key` 输入 SIM 卡的 `KI`。
- `Operator Key` 输入 SIM 卡的 `OPC`。

其它选项全部保持默认，点击 Save 保存。

把 SIM 卡插到你的手机上，稍等片刻，手机就应该可以连上你的移动网络了。

# 总结

本文主要记录搭建 Open5GS 时与 Magma 核心网不同的步骤，以及在 NixOS 上搭建时特有的一些问题。相比 Magma，Open5GS 的安装流程更加简单，而且不依赖 Docker 等容器化管理工具。如果你用的是 Ubuntu，上面的大部分流程其实在 `apt install` 时就已经自动完成。

从 LTE 终端设备（例如手机）的角度来看，使用这两款核心网软件并没有什么区别，两者的延迟、网络带宽都没有大的差别，主要还是受到 LTE 通信本身的限制。（除了我使用 Magma 时遇到的，Android 手机无法正常认证的奇怪 Bug）

我切换到 Open5GS，也是为了开头提到的管理上的便利。你可以根据自己的喜好，选择 Open5GS 或者 Magma 之一。
