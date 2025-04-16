---
title: '$100，DIY 搭建合法的 LTE 网络'
categories: 计算机与客户端
tags: [LTE, 4G, CBRS, Magma]
date: 2025-04-06 02:56:34
---

是的，你没看错，不需要法拉第笼等信号屏蔽措施，只需要大概 100 美元，你就可以在（美国的）家里搭建一个合法的 LTE 网络，可以 24 小时连续发射。

> 关于“合法”：我不是律师或者无线电专家。根据我对相关政策法规的研究，我的整套配置应当是合法的。但如果你按照本文操作后遇到了法律问题，我不负任何责任。

# CBRS 频段：美国的免授权 LTE/5G 频段

自建 LTE 网络的难点不在技术部分，而是在于合法地获取无线电频谱资源。软件方面，早在 2014 年就有了 [srsRAN](https://www.srslte.com/) 等基于 SDR（软件定义无线电）的 LTE 发射方案，也有 [Magma](https://magmacore.org/)、[Open5GS](https://open5gs.org/) 等开源的核心网软件。

但是在无线电频谱方面，LTE、5G 等移动网络使用的无线电频率都处在授权频段，需要向当地政府的无线电管理机构提出申请，并缴纳昂贵的频段使用费（一般根据覆盖范围和当地人口数）才能合法使用。除非你所在的地方人烟稀少，否则绝大部分爱好者都会被挡在这一步。如果你未经授权就占用频段强行发射，就会对使用同一频段的运营商造成干扰，而业务受损的运营商有很强的动力联合无线电执法部门搜查干扰源并且对你高额罚款。

不过 2017 年，美国联邦通信委员会（FCC）向公众开放了 3550-3700 MHz 这段无线电频谱，称为 CBRS（Citizens Broadband Radio Service，公民宽带无线电服务）频段。任何人只要满足简单的限制条件，都可以在这个频段上进行发射，不需要提前申请频段授权。由于这段频段正好是 LTE 的 48 频段和 5G 的 n48 频段，你可以在这段频段上发射 LTE 或者 5G 信号，让支持 48 频段的手机连接，从而合法地建立自己的 LTE/5G 网络。

如果大量设备未经协调就在同一个频段上发射信号，就会造成严重的信号干扰，导致大家都无法正常使用这个频段。为了解决这个问题，CBRS 引入了 SAS 系统（Spectrum Access System，频谱访问系统）管理所有在 CBRS 频段上发射的无线电设备。SAS 将 CBRS 的用户分成了三个级别：

- Incumbent Access（现有用户）：在 2017 年前就已经获得授权使用这段频段的用户，优先级最高。一般是卫星控制站，以及美国海军的雷达。如果这些用户在 CBRS 频段上发射，其它所有用户都要避让。
- Priority Access（优先用户）：通过竞拍获得 CBRS 频段内部分频段优先使用权的用户，优先级低于现有用户，但高于其它所有用户。
- General Authorized Access（通用授权用户）：其它未经事先授权的用户，优先级最低，需要避让其它所有用户。

除了美国海军以外的所有 CBRS 频段用户开始发射时都需要向 SAS 申请授权许可，因此 SAS 可以动态调整各地的频段分配，保证频段上不出现互相干扰。对于美国海军的雷达干扰，SAS 则是通过在美国海岸安装信号接收器，来判断美国海军是否在使用频段。

因此，只要有一台支持 CBRS 频段，并且能连接到 SAS 获取频段分配的 LTE/5G 基站，就可以合法发射信号，自建移动网了。

但是，这样的设备在哪里可以买到呢？

## 从 eBay 上购买二手基站

CBRS 频段开放后，吸引了许多公司的兴趣。[截至今天，已有 95 家公司加入了 CBRS 联盟](https://ongoalliance.org/members/)，其中包括美国御三家运营商 AT&T、T-Mobile、Verizon，运营 SAS 系统的 Google 和 Federated Wireless，基站设备制造商 Baicells 和 Sercomm 等。

美国一家名为 Nova Labs 的公司也对 CBRS 感兴趣。Nova Labs 运营一家名为 Helium Mobile 的虚拟运营商（MVNO），通过 T-Mobile 的移动网络提供服务。为了追求比其它虚拟运营商更低的成本和更低的套餐价格，他们：

- 出售 Helium Mobile 网络专用的 Wi-Fi 热点和 CBRS 基站，让用户共享自己已有的宽带。
- 让 Helium Mobile 用户优先使用这些 Wi-Fi 热点和 CBRS 基站，从而绕开 T-Mobile 降低数据流量成本。
- 发行数字货币 HNT，使用 HNT 支付 Wi-Fi 热点和 CBRS 基站的流量费。

但是，Nova Labs 始终无法解决漫游到 CBRS 基站的稳定性问题，并最终在 2025 年 3 月完全放弃了 CBRS 网络，全面转向使用 Wi-Fi 热点。原本上千刀的 CBRS 基站就被换了下来，挂在 eBay 上以 \$60 左右一台的价格出售。而这些基站在刷回原版固件、解锁管理界面后，就可以连接我们用 Magma、Open5GS 等自建的核心网，发射自己的 LTE 网络。

[在 eBay 上搜索“CBRS”](https://www.ebay.com/sch/i.html?_nkw=cbrs&_sacat=0&_sop=15)，就可以找到很多 Helium Mobile 网络的 CBRS 基站。

要注意的是，Helium Mobile 出售两种 CBRS 基站：

- Sercomm 公司生产，FreedomFi 或者 MosoLabs 公司贴牌的室内基站，型号为 `SCE4255W`，其特征是外壳上只有 FreedomFi 或 MosoLabs 公司字样的 Logo。

![FreedomFi/Sercomm 室内基站外观](/usr/uploads/202504/cbrs-indoor-radio.jpg)

（图源：Amazon）

- Baicells 公司生产的 `Nova 430h` 室外基站，特征是外壳上有橙色的 Baicells 公司 Logo。

![Baicells 室外基站外观](/usr/uploads/202504/cbrs-outdoor-radio.jpg)

（图源：Amazon）

如果你是在家部署，**一定要购买室内基站**，不能买室外基站。两种基站的区别在于：

- 室内基站只能在室内使用，只需连接 SAS，无需额外步骤。
- 室外基站只能在室外使用，连接 SAS 的授权费更贵，而且安装时还需要 CBRS 联盟的授权安装人员检查安装情况，审批通过后才能开始发射。如果你想在室外装基站，却找不到授权安装人员，[你也可以自己花 \$600 考一个授权安装人员的证](https://www.coursera.org/learn/google-cbrs-cpi-training)，有效期 3 年，然后就可以审批自己的基站，想装多少基站就装多少了。

我不想花 \$600 考一个基本没别的用处的证，就直接买了室内基站。

## 解锁室内基站的管理界面

你从 eBay 上买到 FreedomFi/Sercomm 的 SCE4255W 室内基站，插电开机后，会发现连不上基站的 Web 管理界面，无法修改配置。这是为了防止用户架设基站时乱改设置，影响网络稳定性，但是也防止了我们把基站用在别的地方。

不过，这些基站会通过基于 HTTP 的 TR-069 协议连接中央服务器获取配置，如果你自己破解过运营商的光猫或路由器应该会很熟悉这个名词。我们可以把默认控制服务器的地址劫持到我们自己的控制服务器上，就可以随意修改基站的配置了。

如果你准备使用 Magma 搭建核心网，可以先跳过这一步。Magma 自带一个 TR-069 服务器，可以给基站下发配置，而且 Helium Mobile 和 FreedomFi 的工程师已经给 Magma 添加了这款基站的支持，所以我们稍后把基站的控制服务器 `acs.freedomfi.com` 通过 DNS 劫持到 Magma 上就可以了。

如果你准备使用 Open5GS 或者其它不支持 TR-069 的软件搭建核心网，可以使用我的脚本模拟一个 TR-069 服务器，给基站下发开启 Web 管理界面的指令：

1. 从 <https://github.com/xddxdd/freedomfi-cbrs-enable-webui> 下载 `tr069.py` 脚本。
2. 安装 Python 3，然后运行 `python3 tr069.py`
3. 修改你的路由器的 DNS 设置，把 `acs.freedomfi.com` 的 IP 劫持到运行 `tr069.py` 脚本的电脑 IP 上。我的路由器用的是 OpenWRT，可以在 Dnsmasq 配置页面中添加一条规则：`/acs.freedomfi.com/192.168.4.2`
4. 拿出基站，接上网线，插电开机。
5. 稍等片刻，运行 `tr069.py` 脚本的窗口中会出现一大片 XML 输出，这些都是基站给服务器发送的指令。如果一直没收到请求，请检查 DNS 配置是否正确，以及电脑上有没有防火墙，是否开放了 8443 端口。
6. 看到带有 `cwmp:SetParameterValuesResponse` 的输出，就代表 Web 管理界面开启成功了。完整输出应该类似：

```xml
<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap-enc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:cwmp="urn:dslforum-org:cwmp-1-0">
  <soap-env:Header>
    <cwmp:ID soap-env:mustUnderstand="1">null</cwmp:ID>
  </soap-env:Header>
  <soap-env:Body>
    <cwmp:SetParameterValuesResponse>
      <Status xsi:type="xsd:int">0</Status>
    </cwmp:SetParameterValuesResponse>
  </soap-env:Body>
</soap-env:Envelope>
```

开启管理界面后，就可以通过 HTTPS 访问基站的管理界面了，类似 `https://192.168.1.123/`。

![室内基站登录界面](/usr/uploads/202504/sercomm-login.png)

默认用户名密码是 `sc_femto` 和 `tsFid2wz`（[来自 Helium Mobile 的 Discord](https://discord.com/channels/404106811252408320/836735476659912754/1355330850232995861)）

![室内基站管理界面](/usr/uploads/202504/sercomm-status.png)

## 购买可编程 SIM 卡

LTE 网络建成后，你还需要一批 SIM 卡，写入自己网络的配置，才可以让手机连上自己的网络。由于普通 SIM 卡的信息都在生产时直接写死了，你不能随便买 SIM 卡来用，必须用可编程的专用 SIM 卡。

在 Amazon、Aliexpress 等购物网站上搜索 `Programmable SIM` 可以找到这种卡，例如：<https://www.amazon.com/s?k=Programmable+SIM>

![可编程 SIM 卡外观](/usr/uploads/202504/programmable-sim-card.jpg)

（图源：Amazon）

我在 Amazon 上花 \$38.99 买了一套 SIM 卡，包括 5 张可编程 SIM 卡，一个写卡器，一个装了 Windows 写卡软件的 U 盘，和一个 Micro SIM/Nano SIM 转完整 SIM 卡大小的转换器。

# 搭建 Magma 核心网

要搭建自己的 LTE 网络，我们首先需要一套核心网。LTE 核心网主要管理用户设备（例如手机）的认证信息，控制计费、流量限速等功能。

Magma 是 Meta（Facebook）公司开发的开源 4G/5G 核心网，在 Docker/Kubernetes 上运行，上可以快速横向扩展以支持大量移动网络流量，下可以跑在树莓派等低配设备上提供简单的网络服务。

由于我不需要 Kubernetes 复杂的容器调度功能，我选择简单的用 Docker 搭建 Magma 的各个组件。

> 配置过程参考了以下资料：
> - 核心网（Orchestrator 和 NMS）部分：[[Study Note] How To Install Magma Core (Orchestrator)](https://hackmd.io/@RaffieWinata/rJ5oHgk3a#1-Install-Orchestrator-and-NMS)
> - 核心网（Orchestrator 和 NMS）部分：[How To Configure Magma Orchestrator & NMS - RakWireless](https://learn.rakwireless.com/hc/en-us/articles/26476385758615-How-To-Configure-Magma-Orchestrator-NMS)
> - 访问网关（Access Gateway）部分：[Install Docker-based Access Gateway on Ubuntu - Magma](https://magma.github.io/magma/docs/lte/deploy_install_docker)

## 搭建 Magma 核心网（Orchestrator 和 NMS）

首先准备一个运行核心网的系统。我选择在 Proxmox VE 上开了个虚拟机。安装完成后系统服务和 Magma 总计占用 4GB 左右内存，所以虚拟机开 8GB 左右内存应该足够。

我安装的是 Ubuntu 24.04 系统，但是其它系统理论上也可以。

然后，安装 Docker 和 Docker-compose。

然后，执行以下操作：

```bash
# 以下命令都假设你在 HOME 目录下操作
cd ~

# 下载 Magma v1.8.0 源码，如果有更新版本可以自行替换版本号
git clone https://github.com/magma/magma.git
cd magma
git checkout v1.8.0

# 生成核心网的 SSL 证书
mkdir -p ~/secrets/certs
cd ~/secrets/certs
# 此处 magma.test 可以替换成你自己的域名或者子域名，但因为我们生成的是自签名证书，域名不能开启 HSTS
bash ~/magma/orc8r/cloud/deploy/scripts/self_sign_certs.sh magma.test
bash ~/magma/orc8r/cloud/deploy/scripts/create_application_certs.sh magma.test
# 把 SSL 证书复制到 Magma Docker 容器需要的配置
mkdir -p ~/magma/.cache/test_certs/
cp -r * ~/magma/.cache/test_certs/
chmod -R +r ~/magma/.cache/test_certs/

# 构建调度器（Orchestrator）组件的 Docker 容器
cd ~/magma/orc8r/cloud/docker
python3 build.py --all
# 等待 Docker 镜像构建完成，大约需要 30 分钟

# 修改 docker-compose.yml 中的配置
nano docker-compose.yml
# 需要修改的项目：
# - 如果你生成 SSL 证书时用的域名不是 magma.test，搜索 magma.test，替换成你自己的域名
# - 给 `kibana` 和 `fluentd` 容器加上 `restart: always`，开机自启

# 启动调度器（Orchestrator）
python3 run.py

# 确认所有容器都已启动成功
docker ps -a
# 除了 orc8r-test 容器以外，其它容器都应该在 Up 状态
# 如果有容器启动失败，用 `docker logs [容器名]` 查看日志并相应解决问题

# 修改 DNS 服务器的配置，将 magma.test（或者你自己的域名）以及所有子域名指向这台机器的 IP
# 例如我的 Dnsmasq 规则是：/magma.test/192.168.0.7

# 准备搭建 Web 管理界面（NMS）
cd ~/magma/nms

# 修改 docker-compose.yml 中的配置
nano docker-compose.yml
# 需要修改的项目：
# - 给所有容器加上 `restart: always`，开机自启

# 修改 docker/docker_ssl_proxy/proxy_ssl.conf 中一处新版 nginx 不再支持的配置
nano docker/docker_ssl_proxy/proxy_ssl.conf
# 删除 `listen 443;` 和 `ssl on;` 两行，替换成 `listen 443 ssl;`

# 启动 Web 管理界面的 Docker 容器
docker-compose up -d
# 等待 Docker 镜像构建完成，大约需要 20 分钟

# 确认所有容器都已启动成功
docker ps -a
# 所有 nms 开头的容器都应该在 Up 状态
# 如果有容器启动失败，用 `docker logs [容器名]` 查看日志并相应解决问题

# 创建默认管理员
bash scripts/dev_setup.sh
```

然后，在你本地的浏览器上访问 <https://magma-test.magma.test> （或者 `magma-test.[你自己的域名]`），应该可以看到登录界面。如果显示地址未找到等错误，请确认域名是否正确解析。

![Magma 登录界面](/usr/uploads/202504/magma-login.png)

输入默认用户名 `admin@magma.test` 和密码 `password1234` 登录系统。

在左侧 `Network` 标签页，添加一个网络，并填写以下内容：

- 在 `Config` 标签页，`Network ID` 和 `Network Name` 可以随意填写。

![Magma 添加网络界面](/usr/uploads/202504/magma-add-network.png)

- 在 `Epc` 标签页，将 MCC 修改成 `315`，MNC 修改成 `010`，TAC 修改成 `1`。MCC/MNC 是移动运营商的编号，例如 AT&T 的 MCC/MNC 是 `310/410`，T-Mobile 的 MCC/MNC 是 `310/260`。`315/010` 这一组 MCC/MNC 则是专门分配给 CBRS 网络用的编号，所有使用 CBRS 频段的移动网络都可以使用。

![Magma 添加网络界面 Epc 标签页](/usr/uploads/202504/magma-add-network-epc.png)

- 在 `Ran` 标签页，将 `Bandwidth` 修改成 20 MHz 以获得最快的网速。`Band Type` 选择 `TDD`，因为 LTE 48/5G n48 频段的模式都是 TDD 时分复用。
- EARFCNDL 填写 `55540`，这代表 CBRS 频段内的 3580 MHz 频点，但实际上 CBRS 基站会使用从 SAS 分配到的频段，而不是这里的频率。
- 其它配置均保持默认即可。

![Magma 添加网络界面 Ran 标签页](/usr/uploads/202504/magma-add-network-ran.png)

完成以上配置后，你就有了一个 LTE 核心网。但是你的基站不能直接连接到核心网上，而是需要另一个组件：访问网关（Access Gateway）。

## 搭建 Magma 访问网关（Access Gateway）

Magma 的访问网关负责管理基站，并将基站的数据流量转发到互联网。注意 Magma 的核心网只管理用户信息，不处理数据流量，访问网关的流量也不会经过核心网。

首先准备一个运行访问网关的系统。这个系统需要配置两张网卡，其中 `eth0` 用于远程管理和连接核心网，`eth1` 用于连接基站。如果你用的是一台单独的电脑，后续就要把基站的网线插到 `eth1` 网卡上，Magma 会自动配置好 DHCP，让基站连上访问网关。但因为我是在 Proxmox VE 上开虚拟机，所以我选择把额外添加的 `eth1` 网卡放在一个 VLAN 中，然后在主路由器上也添加对应的 VLAN 和 IP。这样我在局域网中的任何机器上都可以 ping 通 `eth1` 的 IP，也就是基站可以插到我的主交换机的任何一个接口上。

这个系统必须安装 Ubuntu 20.04 系统，因为 Magma 访问网关安装时会修改很多系统配置，而这些修改步骤只支持 Ubuntu 20.04。

安装完成后系统服务和 Magma 总计占用 1GB 左右内存，所以虚拟机开 2-4GB 左右内存应该足够。

然后，安装 Docker 和 Docker-compose。

然后，执行以下操作：

```bash
# 把核心网的 rootCA.pem 复制到访问网关上
# 在访问网关机器上运行：
mkdir -p /var/opt/magma/certs
# 在你的本地电脑上运行：
scp root@[核心网机器]:~/magma/.cache/test_certs/rootCA.pem .
scp rootCA.pem root@[访问网关机器]:/var/opt/magma/certs/rootCA.pem

# 创建连接核心网的配置文件，在访问网关机器上运行：
# 如果你的核心网域名不是 magma.test，对应替换
cat << EOF | sudo tee /var/opt/magma/configs/control_proxy.yml
cloud_address: controller.magma.test
cloud_port: 7443
bootstrap_address: bootstrapper-controller.magma.test
bootstrap_port: 7444
fluentd_address: fluentd.magma.test
fluentd_port: 24224

rootca_cert: /var/opt/magma/certs/rootCA.pem
EOF

# 运行一键安装脚本，在访问网关机器上运行：
wget https://github.com/magma/magma/raw/v1.8/lte/gateway/deploy/agw_install_docker.sh
bash agw_install_docker.sh
# 由于 Magma 官方的 GPG 证书过期，不出意外的话，第一次安装会失败。下面我们解决这个问题
# 解决方法来自 https://github.com/magma/magma/issues/15572

# 关闭 apt-get 的 GPG 校验
echo "Acquire::AllowInsecureRepositories true;" > /etc/apt/apt.conf.d/99AllowInsecureRepositories
echo "APT::Get::AllowUnauthenticated true;" >> /etc/apt/apt.conf.d/99AllowInsecureRepositories
apt update

# 删除有问题的步骤
nano /opt/magma/lte/gateway/deploy/roles/magma_deploy/tasks/main.yml
# 删除 `Add unvalidated Apt signing key.` 和 `Add validated Apt signing key.` 两个步骤

# 修改安装脚本，跳过已经运行过的部分
nano agw_install_docker.sh
# 把 `RERUN=0` 改成 `RERUN=1`，跳过已经运行过的部分

# 重新运行安装脚本
bash agw_install_docker.sh

# 不出意外，安装应该成功。重启机器
reboot

# 按需修改 eth1 接口的 IP 地址配置
cat << EOF | sudo tee /etc/netplan/70-secondary-itf.yaml
network:
  ethernets:
    eth1:
      addresses:
      - 192.168.4.2/24
      routes:
      - to: 0.0.0.0/0
        via: 192.168.4.1
        metric: 1000
      nameservers:
        addresses:
        - 192.168.4.1
        search: []
  version: 2
EOF
netplan apply

# 确认所有容器都已启动成功
docker ps -a
# 除了 liagentd 容器以外，其它容器都应该在 Up 状态
# 如果有容器启动失败，用 `docker logs [容器名]` 查看日志并相应解决问题

# 获取访问网关的密钥，稍后连接核心网需要用到
docker exec magmad show_gateway_info.py
```

回到核心网的管理界面 <https://magma-test.magma.test> （或者 `magma-test.[你自己的域名]`），进入左侧 `Equipment` 标签页，确认右上角选择了你之前创建的网络。

点击右上角的 `Add New` 按钮添加访问网关，并填写以下内容：

- 在 `Config` 标签页，`Gateway Name` 和 `Gateway ID` 可以随意填写。
- 在 `Config` 标签页，`Hardware UUID` 填写你从访问网关上获取的 `Hardware ID`。
- 在 `Config` 标签页，`Challenge Key` 填写你从访问网关上获取的 `Challenge key`。
- 其它配置均保持默认即可。

![Magma 添加访问网关界面](/usr/uploads/202504/magma-add-agw.png)

保存后稍等片刻，管理界面上应该会显示这个访问网关的状态 `Health` 为 `Good`。如果状态一直为 `Bad`，可以尝试重启访问网关，或者在访问网关上查询 DNS，确定 `magma.test`（或者你的域名）是否指向核心网。

![Magma 访问网关状态界面](/usr/uploads/202504/magma-agw-status.png)

## 基站连接 Magma 访问网关

拿起你的 CBRS 基站，看一眼背面的标签，上面应该写着一个序列号，类似 `2112CW5012345`。

在核心网的管理界面，进入左侧 `Equipment` 标签，然后进入 `eNodeB` 标签。点击右上角的 `Add New` 按钮添加基站，并填写以下内容：

- 在 `Config` 标签页，`Name` 可以随意填写。
- 在 `Config` 标签页，`Serial number` 填写基站标签上的序列号。

![Magma 添加基站界面](/usr/uploads/202504/magma-add-enodeb.png)

- 在 `Ran` 标签页，**不要选择**`eNodeB Managed Externally`（禁止 Magma 管理基站）
- 在 `Ran` 标签页，`Device Class` 选择 `FreedomFi One`（对应 FreedomFi/Sercomm 的室内基站）
- 在 `Ran` 标签页，`Cell ID` 填写 `0`（如果你有多台基站，依次加一）
- 在 `Ran` 标签页，`Bandwidth` 选择 20 MHz 以获得最快的网速。
- 在 `Ran` 标签页，`PCI` 填写 `100`（如果你有多台基站，依次加一）
- 在 `Ran` 标签页，`TAC` 填写 `1`
- 在 `Ran` 标签页，`Transmit` 选择 `Enabled`（启用）

![Magma 添加基站界面 Ran 标签页](/usr/uploads/202504/magma-add-enodeb-ran-1.png)

![Magma 添加基站界面 Ran 标签页](/usr/uploads/202504/magma-add-enodeb-ran-2.png)

虽然我们在 Magma 上添加了基站，但因为基站设备默认连接 Helium Mobile 的服务器获取配置，它还是无法正常连上我们的访问网关。因此我们还需要把基站的控制服务器 `acs.freedomfi.com` 通过 DNS 劫持到 Magma 访问网关的 `eth1` IP 上。修改你的路由器的 DNS 设置，把 `acs.freedomfi.com` 的 IP 劫持到运行访问网关的机器 `eth1` IP 上。我的路由器用的是 OpenWRT，可以在 Dnsmasq 配置页面中添加一条规则：`/acs.freedomfi.com/192.168.4.2`

然后，因为 Magma 访问网关的 TR-069 服务器端口号和 Helium Mobile 的不同，我们还需要在访问网关上修改端口号，和一些其它的配置。

在访问网关上 `nano /etc/magma/enodebd.yml`，做如下修改：

```yaml
# 把 tr069 下的 port 修改成 8443，以匹配 Helium Mobile 的控制服务器端口号
tr069:
  port: 8443

# 修改基站连接 SAS 服务器的配置，这里的配置对应连接到 Google SAS 的配置
sas:
  # 让基站自己连接 SAS 服务器，不经过 Magma 代理。Magma 代理 SAS 连接需要安装额外的组件，过于复杂
  dp_mode: False
  # SAS 服务器地址，此处为 Google SAS
  sas_server_url: "https://sas.goog/v1.2/"
  # 你的 Google Cloud Project ID 可以在控制台主页看到：https://console.cloud.google.com
  sas_uid: "[改成你自己的 Google Cloud Project ID]"
  # A 代表室内，B 代表室外
  sas_category: "A"
  # GAA 代表最低优先级的 General Authorized Access（通用授权用户）
  sas_channel_type: "GAA"
  # indoor 为室内，outdoor 为室外
  sas_location: "indoor"
  # FreedomFi/Sercomm 的室内基站用这个值，如果你的基站是其它品牌可能不同
  sas_cert_subject: "/C=TW/O=Sercomm/OU=WInnForum CBSD Certificate/CN=P27-SCE4255W:%s"
  # 以下两项保持不变
  sas_icg_group_id: ""
  sas_height_type: "AMSL"

# 把 LTE 同步来源改成 FREE_RUNNING，否则 GPS 信号太差时，室内基站迟迟不发射信号
prim_src: "FREE_RUNNING"

# 把你的基站序列号加到这里，可以开启基站的 Web 管理界面
web_ui_enable_list: ["2112CW5012345"]

# 其余配置保持不变即可
```

保存配置文件后，重启整个访问网关系统。我测试时发现单独重启访问网关的单个 Docker 容器可能会造成奇怪的问题，例如基站死活连不上访问网关。直接重启可以解决大部分奇怪的问题。

稍等片刻，核心网管理界面上应该会显示这个基站的状态 `Health` 为 `Good`。如果状态一直为 `Bad`，可以尝试重启访问网关。

![Magma 基站状态界面](/usr/uploads/202504/magma-enodeb-status.png)

如果你把室内基站的序列号加入 `web_ui_enable_list` 开启了管理界面，此时就可以通过 HTTPS 访问基站的管理界面了，类似 `https://192.168.1.123/`。默认用户名密码是 `sc_femto` 和 `tsFid2wz`（[来自 Helium Mobile 的 Discord](https://discord.com/channels/404106811252408320/836735476659912754/1355330850232995861)）

## 基站连接 SAS

此时基站已经连上了你的核心网，但由于它还没有连上 CBRS 的 SAS 系统（Spectrum Access System，频谱访问系统），没有获得频段授权，所以仍然不会发射 LTE 信号。

我们还需要注册一个 SAS 系统的账号，把自己的基站注册上去，才能让基站获得频段授权。

我用的是 [Google SAS](https://cloud.google.com/products/spectrum-access-system)，由 Google Cloud 运行的 SAS 系统。Google SAS 是目前你能找到的注册最简单的 SAS 系统，其它厂商的 SAS 系统大都需要联系销售，签订企业级服务合同，才能使用。而且 Google SAS 的价格极其便宜，本文写作时，[室内基站的价格是每台每月 \$2.64，室外基站的价格是每台每月 \$13.15](https://cloud.google.com/products/spectrum-access-system#pricing)。

你需要先注册一个 Google Cloud 账号，然后访问[控制台的 SAS 配置页面](https://console.cloud.google.com/spectrum-access)按照如下步骤进行配置。

1. 确定你的经纬度。如果你用的是 Android 手机，可以从 Google Play 下载 [GPS Status & Toolbox](https://play.google.com/store/apps/details?id=com.eclipsim.gpsstatus2) 软件查看你的经纬度。如果你用的是 iPhone，可以从自带的指南针查看经纬度。
2. 在控制台上选择顶上的添加站点按钮（带有加号的按钮），在地图上随便点一个点。屏幕右侧会弹出一个侧边栏，让你输入基站的相关信息。

![Google SAS 添加站点按钮](/usr/uploads/202504/google-sas-add-button.png)

3. 首先在右侧栏切换到第一个标签页（位置），输入你的正确的经纬度。不需要非常精准，基站本身也会上传自己的 GPS 位置。

![Google SAS 输入经纬度界面](/usr/uploads/202504/google-sas-enter-location.png)

4. 然后切换到第二个标签页（基站信息），填写以下内容：
   - `CBSD category` 根据实际情况，室内基站选择 `A`，室外基站选择 `B`。
   - `FCC ID` 填写基站机身标签上的 FCC ID。
   - `Serial number` 填写基站机身标签上的序列号。
   - `Device type` 根据实际情况选择 `Indoor`（室内）或者 `Outdoor`（室外）。
   - `Air Interface` 下的 `Radio technology` 选择 `E_UTRA`（对应 LTE）。
   - `Antenna` 下的 `Height` 一项，填写你的 GPS 海拔高度。
   - `Antenna` 下的 `Height type` 一项，选择 `AMSL`（高度以海平面为参考）。
   - `Antenna` 下的 `Azimuth` 一项，输入基站面向的指南针朝向。
     - 如果是 FreedomFi/Sercomm 室内基站，由于这款基站的天线是 360 度发射的，方向无关紧要，则可以直接填写 `0`。
   - `Antenna` 下的 `Mech downtilt` 一项，输入基站向下倾斜的度数，如果没有倾斜可以直接填写 `0`。
   - `Antenna` 下的 `Horiz accuracy` 一项，输入 `10`。
   - `Antenna` 下的 `Vert accuracy` 一项，输入 `3`。
5. 你还需要根据基站的数据手册填写以下内容。如果你用的是 FreedomFi/Sercomm 室内基站，可以直接抄我的配置：
   - `Max EIRP` 一项，FreedomFi/Sercomm 室内基站此处填写 `29`。
   - `Antenna` 下的 `Max gain` 一项，FreedomFi/Sercomm 室内基站此处填写 `5`。
   - `Antenna` 下的 `Beamwidth` 一项，FreedomFi/Sercomm 室内基站此处填写 `360`。
   - `Antenna` 下的 `Azimuth` 一项，FreedomFi/Sercomm 室内基站此处填写 `360`。
   - `Measurement capability` 下，对于 FreedomFi/Sercomm 室内基站，`RX w/ grant` 不要打勾，`RX w/o grant` 需要打勾。
   - `Air Interface` 下的 `Supported spec`，FreedomFi/Sercomm 室内基站此处填写 `FFS`。
6. 其余配置都可以空着不写，点击 `Ready for CPI`。
7. 此时页面上会显示“The new configuration must be signed by a CPI before the CBSD registers with the SAS.”（基站再次注册到 SAS 之前，需要认证安装人员 CPI 审批配置）。如果你装的是室内基站，不用管它。但如果你装的是室外基站，就要找一个认证安装人员来审批配置了，或者[自己花 \$600 考一个授权安装人员的证](https://www.coursera.org/learn/google-cbrs-cpi-training)。

![Google SAS 基站信息界面 1](/usr/uploads/202504/google-sas-radio-info-1.png)

![Google SAS 基站信息界面 2](/usr/uploads/202504/google-sas-radio-info-2.png)

重启以下基站：把你的基站电源拔掉，等几秒再插上。等几分钟后基站启动完成、GPS 定位完成后，Google SAS 配置页面上应该会出现一些标黄的 `Active config value`，代表这些配置和你输入的有偏差，不用管它们。

切换到 `Status` 标签页查看设备状态，应该可以看到基站状态 `Authorized`，以及对应频段分配了。

此时看一下基站的指示灯，最左侧的 LTE 状态指示灯应该是蓝灯常亮，代表此时已经在发射 LTE 信号。到这里，基站的配置就全部完成了。

拿出你的手机，随便选择一张 SIM 卡，关闭“自动选择网络”选项，手机就会自动搜索附近的移动网络。如果你的手机支持 LTE 48 频段，你应该就能看到一个名为 315010 的网络，这就是你的基站发射的信号。

# 写 SIM 卡

有了 LTE 网络，下一步就是向 SIM 卡中写入自己网络的认证信息，从而让手机可以连上自己的网络。

我购买可编程 SIM 卡时，商家提供了我这款 SIM 卡适用的 Windows 写卡软件。我试过在 Linux 下使用 pySim 写卡，但是写出来的 SIM 卡无法正常连接网络认证，因此这一步我还是使用 Windows 进行写卡。

把 SIM 卡写卡器插到电脑上，并取出一张可编程 SIM 卡插到写卡器上。

打开写卡软件，先点击右上角的 `Read Card` 尝试读取卡中的信息，以确保写卡器连接正常。

随后，在右侧 `LTE/WCDMA Paramater` 中输入如下信息：

- 选择 `IMSI15`，输入 `3150109999XXXXX`，其中前十位固定，后五位可以自行编号。
  - 前六位 `315010` 是 CBRS 网络的 MCC/MNC。
  - 接下来的四位 `9999` 是 CBRS 网络中的 IBN（IMSI 区块编号），`9999` 是 CBRS 预留的测试编号。完整的 IBN 分配表可以在 [CBRS Assignments](https://imsiadmin.com/assignments/cbrs/) 网页上查到。
  - 最后五位可以是任意数字编号。
- 确保 `AD` 输入框的值是 `00000003`。如果这个值不同，点击右侧的编辑按钮，确保 MNC 长度设置为 3。
- 在 `KI` 和 `OPC` 框中各输入一个随机的 32 字符长的 16 进制字符串。这两个字符串是 SIM 卡的认证密钥，一旦写入 SIM 卡中就无法再被读出来。
  - 备份好 `KI` 和 `OPC`，稍后我们需要把它们输入到 Magma 核心网管理页面上。
- 点击 `PLMNwAct` 右侧的 `Auto` 按钮，左侧的四个输入框应该会自动填入如图所示的值。
- 把 `SPN` 修改成你想要在手机上显示的运营商名，例如 `Lan Tian Mobile`.

最后，点击右上角 `Write Card` 写卡。

如果你想多写几张 SIM 卡，可以如法炮制，但是必须保证所有卡的 `IMSI15`，`KI`，`OPC` 这三个值不同。

## 创建网络套餐

回到核心网的管理界面 <https://magma-test.magma.test> （或者 `magma-test.[你自己的域名]`），进入左侧 `Traffic` 标签页，再进入顶部 `APNs` 标签页，点击 `Create New APN` 创建一个 APN。

- `APN ID` 输入 `internet`。
- `Max Required Bandwidth`，上传下载各输入 `1000000000`（1 Gbps，远超 LTE 能提供的速度）。
- `PDN Type` 选择 `IPV4V6`。
- 其它配置均保持默认即可。

![Magma 添加 APN 界面](/usr/uploads/202504/magma-add-apn.png)

然后点击顶部的 `Data Plans` 标签页，点击 `Create New Data Plan`。

- `Data Plan ID` 可以随意填写。
- `Download` 和 `Upload` 都保持 Unlimited 即可。

![Magma 添加网络套餐界面](/usr/uploads/202504/magma-add-data-plan.png)

此时，网络套餐已经创建完成，可以开始注册 SIM 卡了。

## 注册 SIM 卡

进入管理界面左侧 `Subscriber` 标签页，点击 `Manage Subscribers` - `Add Subscribers`。

对于你要添加的每张 SIM 卡，点击右上角的 `Add New Row`，然后输入 SIM 卡的信息：

- `IMSI` 一栏先输入 `IMSI` 四个字母，再输入写卡时的 `IMSI15`。例如：`IMSI315010999925470`
- `Subscriber Name` 可以随意填写。
- `Auth Key` 填写写卡时的 `KI`。
- `Auth OPC` 填写写卡时的 `OPC`。
- `Service` 选择 `ACTIVE`，启用 SIM 卡。
- `Data Plan` 选择你刚才创建的套餐。
- `Active APNs` 选择你刚才创建的 APN。
- 点击右侧对勾保存。

![Magma 添加 SIM 卡界面](/usr/uploads/202504/magma-add-sim.png)

此时，你的 SIM 卡就成功注册到 Magma 核心网上了，稍等片刻数据同步后就可使用。

# 插手机联网

把 SIM 卡插到你的手机上。我的测试机是 iPhone SE 2022。

插入 SIM 卡后稍等片刻，iPhone 就连上了我的基站，左上角信号满格，网络显示为 `315 010`，即 CBRS 的 MCC/MNC：

![iPhone 网络状态](/usr/uploads/202504/iphone-non-public-network-zh.jpg)

使用 Speedtest 进行测速，可以跑到下行 100 Mbps，上行 10 Mbps：

![iPhone 测速](/usr/uploads/202504/iphone-speedtest.jpg)

我还试了一个 Android 手机，设备是 Motorola Edge+ 2023。虽然这个手机能搜索到我的 LTE 网络，但无法正常连接，即使是用 iPhone 上试过的 SIM 卡也不行，还需要继续研究。

# 总结

我搭建这套 LTE 网络的所有设备及总花费（不计消费税）如下：

- 用来开虚拟机的 Proxmox VE 主机，是我的现有设备 \$0
- FreedomFi/Sercomm 室内基站设备，设备 \$49 + 运费 \$12.3 = \$61.3
- 可编程 SIM 卡及写卡器，\$38.99
- Google SAS \$2.64/月，计一个月
- 总价 \$102.93

这个价格对于 Homelabber 来说根本不算贵，远低于传统上认为的搭建 LTE 网络需要几百上千刀的花销，并且所有设备和服务都可以简单的买到。
