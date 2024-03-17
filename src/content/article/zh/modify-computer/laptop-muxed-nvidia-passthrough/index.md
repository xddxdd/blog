---
title: 'Optimus MUXed 笔记本上的 NVIDIA 虚拟机显卡直通（2023-05 更新）'
categories: 计算机与客户端
tags: [显卡, 虚拟机, NVIDIA, MUXed]
date: 2023-05-08 00:28:52
---

一年前，为了能够一边用 Arch Linux 浏览网页、写代码，一边用 Windows 运行游戏等没
法在 Linux 上方便地完成的任
务，[我试着在我的联想 R720 游戏本上进行了显卡直通](/article/modify-computer/laptop-intel-nvidia-optimus-passthrough.lantian)。
但是由于那台电脑是 Optimus MUXless 架构（前文有各种架构的介绍），也就是独显没有
输出端口、全靠核显显示画面，那套配置的应用受到了很大的阻碍，最后被我放弃。

但是现在，我换了台新电脑。这台电脑的 HDMI 输出接口是直连 NVIDIA 独立显卡的，也就
是 Optimus MUXed 架构。在这种架构下，有办法让虚拟机识别到一个“独显上的显示器”，
从而正常启用大部分功能。于是，我终于可以配置出一套可以长期使用的显卡直通配置。

# 更新日志

-   2023-05-08：针对新版 Looking Glass B6 更新部分内容。
-   2022-01-26：PCIe 省电补丁实测无效。

# 准备工作

在按照本文进行操作前，你需要准备好：

1. 一台 Optimus MUXed 架构的笔记本电脑。我的电脑型号是 HP OMEN
   17t-ck000（i7-11800H，RTX 3070）。

    - （2022-01）我用的操作系统是 Arch Linux，更新到最新版本。
    - （2023-05）本次更新时我用的操作系统是 NixOS，但大部分步骤同样适用于其它
      Linux 发行版。
    - 建议关闭安全启动功能，但既然你已经装上了 Linux，你大概率已经关掉了。安全启
      动理论上可能会对 PCIe 直通功能造成一定的限制。

2. 用 Libvirt（Virt-Manager）配置好一台 Windows 10 或 Windows 11 的虚拟机，我用
   的是 Windows 11。

    - 我的虚拟机用的是 UEFI（OVMF）模式启动，但理论上用 BIOS 方式（SeaBIOS）也可
      以。这次的步骤没有必须用 UEFI 启动方式的地方。
    - **一定要关闭虚拟机的安全启动！不然有些驱动装不上！**
        - Windows 11 安装程序会检测安全启动是否开启，关闭安全启动后可能会提示计
          算机不兼容，拒绝安装。此时可以参照这篇文章解决问
          题：<https://sysin.org/blog/windows-11-no-tpm/>
    - 先配置好 QXL 虚拟显卡，保证自己可以看得到虚拟机的视频输出。

3. （可选）根据电脑视频输出接口的不同，一个 HDMI，DP，或 USB Type-C 接口的假显示
   器（诱骗接头），淘宝上一般几块到十几块钱一个。

    - （2023-05）或者你也可以选择安装虚拟显示器驱动。
    - ![HDMI 假显示器](../../../../usr/uploads/202201/hdmi-dummy-plug.jpg)

4. （可选）外接一套 USB 键鼠套装。

开始操作之前，预先提醒：

-   整个步骤中会多次重启宿主系统，同时一些操作存在导致宿主系统崩溃的风险，请备份
    好你的数据。
-   整个步骤中你不需要手动下载任何 NVIDIA 显卡驱动，交给 Windows 自动下载就好。
    -   如果 Windows 自动下载失败，手动安装驱动的底线是下载驱动 EXE 然后双击安
        装。
    -   千万不要在设备管理器中手动指定设备安装。
    -   手动安装显卡驱动有时反而会干扰判断。

## 购买 Optimus MUXed 架构的新电脑

如果你有兴趣尝试显卡直通，并正准备购买一台新电脑，你可以参考以下我的选择方法。

显卡直通的前提条件是：

1. NVIDIA 独立显卡本身要具有视频输出功能
2. 机身上至少有一个连接到独立显卡的视频接口

但是，游戏本厂商很少会在宣传页上写明视频接口连接的是独显还是核显。因此我们只能根
据常见的参数进行推测：

1. 优先选择支持“独显直连内屏”的电脑，因为这种情况下独显一定具有视频输出功能，并
   且厂家大概率会将机身视频接口连接到独显上。

    - 典型的例子包括：2020 和 2021 款的联想拯救者系列、惠普暗影精灵系列，以及戴
      尔游侠 G15。
    - **但我不保证这些例子是准确的！**请自行查阅资料或询问客服，确保电脑支持“独
      显直连”功能。

2. 或者选择带有中高端独立显卡的电脑，一般 NVIDIA 显卡型号要以 60 或以上结尾。

    - 中高端 NVIDIA 显卡一般都有视频输出功能，此时厂家大概率会将机身视频接口连接
      到独显上。
    - 请勿购买显卡型号以 50 或以下结尾的电脑，例如 RTX 3050，GTX 1650 Ti 等等。
      它们大概率不支持视频输出。

3. 用好七天无理由退货服务。

    - 因为厂家不会宣传、甚至不会特别在意视频输出接口的连接方式，我们只能看配置参
      数和宣传页盲猜。因此，你完全可能按照以上规则挑选到一台无法进行显卡直通的电
      脑，此时可以考虑退货或者转卖。
    - 在一些国家（包括中国），笔记本电脑厂家对无理由退货的要求都是“电脑自带的
      Windows 和 Office 都没有联网激活”，而最新的 Windows 11 在首次启动的配置向
      导中会强制联网激活，因此可以考虑用 U 盘或移动硬盘上的 Linux 启动电脑测试，
      通过后再激活 Windows。

## 关于 Intel GVT-g 虚拟核显

Intel 第五代到第九代的 CPU 核显都支持对显卡本身进行虚拟化，也就是划分出几个虚拟
的显卡，将虚拟显卡直通进虚拟机、让虚拟机享受显卡加速的同时，允许宿主机同时使用显
卡进行显示。

但是 Linux 下的 GVT-g 驱动不支持第十代及更新的
CPU，[而且 Intel 也没有支持的计划](https://github.com/intel/gvt-linux/issues/126)。
再加上 GVT-g 虚拟显卡无法和 NVIDIA 独显组成 Optimus 结构，它也没有什么用。

所以，我们不用管 GVT-g 了，只直通 NVIDIA 独显就好。

## （2023-05）关于 Intel 核显 SR-IOV 虚拟化

Intel 十一代及之后的 CPU 核显使用另一种虚拟化方式：SR-IOV。Intel 官
方[已经发布了 SR-IOV 的内核模块代码](https://github.com/intel/linux-intel-lts/tree/lts-v5.15.49-adl-linux-220826T092047Z/drivers/gpu/drm/i915)，
但尚未合入 Linux 主
线。[有第三方项目将这部分内核代码移植成 DKMS 模块](https://github.com/strongtz/i915-sriov-dkms)，
但根据 Issues 反馈成功率不高，我在 i7-11800H 上测试也没成功。所以，本文将不涉及
Intel 核显的 SR-IOV 功能。

# 操作步骤

## 禁止宿主系统管理 NVIDIA 独显

> 这一段的大部分内容和
> [2021 年的这篇文章](/article/modify-computer/laptop-intel-nvidia-optimus-passthrough.lantian)是
> 一样的。

宿主系统上的 NVIDIA 的驱动会占用独显，阻止虚拟机调用它，因此需要先用 PCIe 直通用
的 `vfio-pci` 驱动替换掉它。

禁用 NVIDIA 驱动，把独显交给处理虚拟机 PCIe 直通的内核模块管理的步骤如下：

1. 运行 `lspci -nn | grep NVIDIA`，获得类似如下输出：

    ```bash
    0000:01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA104M [GeForce RTX 3070 Mobile / Max-Q] [10de:249d] (rev a1)
    0000:01:00.1 Audio device [0403]: NVIDIA Corporation GA104 High Definition Audio Controller [10de:228b] (rev a1)
    ```

    这里的 `[10de:249d]` 就是独显的制造商 ID 和设备 ID，其中 `10de` 代表这个
    PCIe 设备由 NVIDIA 生产，而 `249d` 代表这是张 3070。`228b` 是 HDMI 接口的音
    频输出，也需要用 `vfio-pci` 驱动接管。

2. 创建 `/etc/modprobe.d/lantian.conf`，添加如下内容：

    ```bash
    options vfio-pci ids=10de:249d,10de:228b
    ```

    给 `vfio-pci` 这个负责 PCIe 直通的内核驱动一个配置，让它去管理独显。`ids` 参
    数就是要直通的独显的制造商 ID 和设备 ID。

3. 修改 `/etc/mkinitcpio.conf`，在 `MODULES` 中添加以下内容：

    ```bash
    MODULES=(vfio_pci vfio vfio_iommu_type1 vfio_virqfd)
    ```

    删除 `nvidia` 等与 NVIDIA 驱动相关的内核模块，或者确保它们排在 VFIO 驱动后
    面。这样 PCIe 直通模块就会在系统启动的早期抢占独显，阻止 NVIDIA 驱动后续占用
    独显。

4. 运行 `mkinitcpio -P` 更新 initramfs。
5. 重启电脑。

（2023-05）如果你用的是 NixOS 系统，可以直接使用下面的配置：

```nix
{
  boot.kernelModules = ["vfio-pci"];
  boot.extraModprobeConfig = ''
    # 这里改成你的显卡的制造商 ID 和设备 ID
    options vfio-pci ids=10de:249d
  '';

  boot.blacklistedKernelModules = ["nouveau" "nvidiafb" "nvidia" "nvidia-uvm" "nvidia-drm" "nvidia-modeset"];
}
```

## 配置 NVIDIA 独显直通

在
[2021 年的这篇文章](/article/modify-computer/laptop-intel-nvidia-optimus-passthrough.lantian)中，
我在这里介绍了一大堆绕过 NVIDIA 驱动限制的内
容。[但是从 465 版本开始，NVIDIA 解除了大部分的限制](https://nvidia.custhelp.com/app/answers/detail/a_id/5173)，
理论上来说现在直接把显卡直通进虚拟机就能用。

但也只是理论上而已。

我依然建议大家做完所有的隐藏虚拟机的步骤，因为：

1. （2022-01）对于笔记本电脑来说，NVIDIA 并没有解除所有的限制。

    - ~~至少在我测试时，显卡的 PCIe 总线位置和系统是否存在电池依然会导致直通失
      败、驱动报错代码 43。~~
    - （2023-05）这次测试时，PCIe 总线位置和是否存在电池不再影响直通结果。

2. 即使 NVIDIA 驱动不检测虚拟机，你运行的程序也会检测虚拟机，隐藏虚拟机特征可以
   提高成功运行这些程序的概率。

    - 典型例子包括带有反作弊系统的网游，或者部分需要联网激活的商业软件。

那么，开始操作：

1. 与 Optimus MUXless 架构不同，我这次没有手动提取显卡 BIOS、修改 UEFI 固件就成
   功进行了显卡直通。

    - 如果你的显卡直通进虚拟机后无法安装驱动，包括 Windows 不会自动下载安装、手
      动下载 NVIDIA 官网驱动安装器也提示找不到兼容的显卡，那么你大概率仍然需要提
      取显卡 BIOS。
    - 为了二次确认，你可以在虚拟机里进入设备管理器，找到你的显卡，查看它的硬件
      ID，类似 `PCI\VEN_10DE&DEV_1C8D&SUBSYS_39D117AA&REV_A1`。如果 `SUBSYS` 后
      面跟着的是一串 0，这就意味着显卡 BIOS 加载失败，你需要手动提取显卡 BIOS。
    - 具体步骤请
      看[去年的文章](/article/modify-computer/laptop-intel-nvidia-optimus-passthrough.lantian)的
      “配置 NVIDIA 独显直通”一段。

2. 编辑你的虚拟机配置，`virsh edit Windows`，做如下修改：

    ```xml
    <!-- 把 features 一段改成这样，就是让 QEMU 隐藏虚拟机的特征 -->
    <features>
      <acpi/>
      <apic/>
      <hyperv mode="custom">
        <relaxed state="on"/>
        <vapic state="on"/>
        <spinlocks state="on" retries="8191"/>
        <vpindex state="on"/>
        <runtime state="on"/>
        <synic state="on"/>
        <stimer state="on"/>
        <reset state="on"/>
        <vendor_id state="on" value="GenuineIntel"/>
        <frequencies state="on"/>
        <tlbflush state="on"/>
      </hyperv>
      <kvm>
        <hidden state="on"/>
      </kvm>
      <vmport state="off"/>
    </features>
    <!-- 添加显卡直通的 PCIe 设备 -->
    <hostdev mode='subsystem' type='pci' managed='yes'>
      <source>
        <address domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
      </source>
      <rom bar='off'/>
      <!-- 注意这里的 PCIe 总线地址必须是 01:00.0，一点都不能差 -->
      <!-- 如果保存时提示 PCIe 总线地址冲突，就把其它设备的 <address> 全部删掉 -->
      <!-- 这样 Libvirt 会重新分配一遍 PCIe 地址 -->
      <address type='pci' domain='0x0000' bus='0x01' slot='0x00' function='0x0' multifunction='on'/>
    </hostdev>
    <!-- 添加一块在虚拟机和宿主机之间共享的内存，以便将虚拟机显示内容传回宿主机 -->
    <shmem name='looking-glass'>
      <model type='ivshmem-plain'/>
      <!-- 这里内存大小的公式是：分辨率宽 x 分辨率高 / 131072，然后向上取到 2 的 n 次方 -->
      <!-- 因为大部分 HDMI 假显示器的分辨率都是 3840 x 2160，计算结果是 63.28MB，向上取到 64MB -->
      <size unit='M'>64</size>
    </shmem>
    <!-- 禁用内存 Balloon，也就是内存动态伸缩，严重影响性能 -->
    <memballoon model="none"/>
    <!-- 在 </qemu:commandline> 之前添加这些参数 -->
    <qemu:arg value='-acpitable'/>
    <qemu:arg value='file=/ssdt1.dat'/>
    ```

    此处的 ssdt1.dat 是一个修改后的 ACPI 表，用来模拟一块满电的电池。它对应如下
    Base64，可以用
    [Base64 解码网站](https://base64.guru/converter/decode/file)转换成二进制文
    件，放在根目录，或者[从本站下载](../../../../usr/uploads/202007/ssdt1.dat)。

    ```bash
    U1NEVKEAAAAB9EJPQ0hTAEJYUENTU0RUAQAAAElOVEwYEBkgoA8AFVwuX1NCX1BDSTAGABBMBi5f
    U0JfUENJMFuCTwVCQVQwCF9ISUQMQdAMCghfVUlEABQJX1NUQQCkCh8UK19CSUYApBIjDQELcBcL
    cBcBC9A5C1gCCywBCjwKPA0ADQANTElPTgANABQSX0JTVACkEgoEAAALcBcL0Dk=
    ```

3. 修改共享内存文件的权限。

    1. 修改 `/etc/apparmor.d/local/abstractions/libvirt-qemu` 文件增加一行：

        ```bash
        /dev/shm/looking-glass rw,
        ```

        然后运行 `sudo systemctl restart apparmor` 重启 AppArmor。

    2. 创建 `/etc/tmpfiles.d/looking-glass.conf`，写入以下内容，把 `lantian` 换
       成你的用户名：

        ```bash
        f /dev/shm/looking-glass 0660 lantian kvm -
        ```

        然后运行
        `sudo systemd-tmpfiles /etc/tmpfiles.d/looking-glass.conf --create` 生
        效。

4. 启动虚拟机，等一会，Windows 会自动装好 NVIDIA 驱动。

    - 如果设备管理器里显卡打感叹号，显示代码 43，即驱动程序加载失败，你需要检查
      上面的步骤有没有遗漏，所有配置是否正确。
        - （2022-01）将设备管理器切换到 `Device by Connection`（按照连接方式显示
          设备），确认显卡的地址是总线 Bus 1，接口 Slot 0，功能 Function 0，并且
          确认显卡上级的 PCIe 接口是总线 Bus 0，接口 Slot 1，功能 Function 0。
        - 如果对不上，你需要按上面的方法重新分配一遍设备的 PCIe 地址。
        - （2023-05）我这次尝试时不再需要进行这一步骤。
    - 如果系统没有自动安装 NVIDIA 驱动，并且你手动下载的也显示系统不兼容/找不到
      显卡，那么你需要查看显卡的属性，其硬件 ID 中，`SUBSYS` 后是否跟着一串 0。
        - 如果是一串 0，请参照第一步。

5. 关闭虚拟机并再次启动，**注意不是直接重启**，再次在设备管理器里确认显卡工作正
   常。

    - 如果此时出现代码 43 了，检查你有没有添加好第二步最后的模拟电池。
    - 我第一次尝试用的是 Windows 10 LTSC 2019，也是重启后出现了代码 43。但因为当
      时我没有添加模拟电池，我无法确认是 NVIDIA 驱动不兼容系统版本，还是模拟电池
      的原因。建议使用最新版本的 Windows 10 或 Windows 11。

6. 以下步骤二选一：

    1. （2022-01）把你的 HDMI 假显示器插入电脑，虚拟机应该识别到一个新的显示器。
    2. （2023-05）安装虚拟显示器驱动：
        1. 下载 [ge9/IddSampleDriver](https://github.com/ge9/IddSampleDriver) 这
           份虚拟显示器驱动，解压到 `C:\IddSampleDriver`。注意这个文件夹不能移动
           到其它位置！
        2. 打开 `C:\IddSampleDriver\option.txt`，你会看到第一行是一个数字 1（不
           要修改），然后是分辨率/刷新率列表。只保留你想要的一项分辨率/刷新率，
           把其它的分辨率/刷新率都删掉。
        3. 打开设备管理器，在菜单中选择“操作 - 添加过时硬件”，点击“从列表中选
           择 - 全部 - 我有驱动磁盘”，然后选择
           `C:\IddSampleDriver\IddSampleDriver.inf` 并一路下一步完成安装。
        4. 此时 Windows 系统应该检测到了一个新的显示器。
        5. 在我的测试中，使用虚拟显示器时，Looking Glass 显示的内容会有部分像素
           出错。有条件的话，还是建议使用 HDMI 假显示器。

7. （2023-05）现在新版 Looking Glass 会自动安装 IVSHMEM 驱动（虚拟机和宿主机共享
   内存的驱动），你无需再手动安装驱动。这里保留手动安装步骤以供参考：

    1. （2022-01）下载这份 Virtio 驱动复制到虚拟机内解压，**注意一定是这份，其它
       的版本大都没有 IVSHMEM 驱动**：

        <https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/upstream-virtio/virtio-win10-prewhql-0.1-161.zip>

    2. 在虚拟机里进入设备管理器，找到系统设备 - PCI 标准内存控制器
       （`PCI standard RAM controller`）：
        1. 右键选择“更新驱动”
        2. 点击“浏览我的电脑查找驱动程序”
        3. 点击“从列表中选择”
        4. 点击“我有驱动磁盘”按钮
        5. 选择 `Virtio 驱动/Win10/amd64/ivshmem.inf` 文件
        6. 一路下一步安装驱动，此时它的名字应该已经变成了 `IVSHMEM`

8. 安装 [Looking Glass](https://looking-glass.io/downloads)，这是一个将虚拟机的
   显示画面传输到宿主机的工具。

    - 我们插入的假显示器将成为虚拟机唯一能识别到的显示器。如果不安装 Looking
      Glass，就看不到虚拟机的画面了。
    - 在上面的链接点击“Windows Host Binary”下载，在虚拟机内双击安装。

9. （2023-05）如果按照 2022-01 的步骤操作，虚拟机开机过程中、Looking Glass 启动
   前你将无法看到开机画面。因此我推荐在设备管理器中直接禁用 QXL 虚拟显卡。以下旧
   版步骤保留以供参考。

    - （2022-01）关闭虚拟机，`virsh edit Windows` 编辑虚拟机配置。

        找到 `<video><model type="qxl" ...></video>`，将 `type` 改为 `none`，以
        禁用 QXL 虚拟显卡：

        ```xml
        <video>
          <model type="none"/>
        </video>
        ```

10. 在宿主机上安装 Looking Glass 的客户端，Arch Linux 用户可以直接从 AUR 安装
    `looking-glass` 包。运行 `looking-glass-client` 命令启动客户端。
11. 回到 Virt-Manager，关掉虚拟机的窗口（就是查看虚拟机桌面、编辑配置的窗口），
    在 Virt-Manager 主界面右键选择你的虚拟机，点击启动。
12. 稍等片刻，Looking Glass 的客户端就会显示出虚拟机的画面，此时显卡直通就配置完
    成了。

# 性能和体验优化

虽然显卡直通已经完成，但是虚拟机的体验还需要优化。具体来说：

1. （2022-01）Looking Glass 可以传输鼠标键盘操作，但无法传输声音，意味着虚拟机无
   法发声；
    - （2023-05）最新的 Looking Glass 已经可以传输声音。
2. （2022-01）Looking Glass 传输鼠标键盘操作有时会丢键；
    - （2023-05）最新的 Looking Glass 已经可以稳定传输鼠标键盘操作。
3. IVSHMEM 共享内存功能其实有一个宿主机的内核模块，可以让宿主机的 Looking Glass
   使用 DMA 模式提高性能；
4. 关闭虚拟机后，独立显卡会被设置成 PCIe D3hot 模式，在该模式下显卡仍会消耗 10W
   左右的电力，影响电池续航。

我们将一个个解决以上问题。

## 传输虚拟机声音

（2023-05）新版 Looking Glass 已经可以传输声音。以下步骤保留以供参考。

{% interactive_buttons %} sound_hide|隐藏sound_show|查看 2022-01 的旧版步骤
{% endinteractive_buttons %}

{% interactive sound_show %}

虽然 Virt-Manager 本身可以通过 SPICE 协议连接虚拟机，从而传输虚拟机的声音，但是
Looking Glass 也会通过 SPICE 传输键鼠操作，而虚拟机上同时只能有一个 SPICE 连接。
这就意味着我们无法使用 Virt-Manager 来听声音了。

我们可以安装 [Scream](https://github.com/duncanthrax/scream)，一个 Windows 下的
虚拟声卡软件，将声音通过虚拟机的网卡来传输，然后在宿主机上用 Scream 的客户端接
收。

在虚拟机上，从
[Scream 的下载页面](https://github.com/duncanthrax/scream/releases)下载 Scream
安装程序，解压后右键以管理员身份运行 `Install-x64.bat` 脚本安装驱动，然后重启。

在宿主机上安装 Scream 客户端，Arch Linux 用户可以安装 AUR 中的 `scream` 软件包。

在宿主机上开一个终端运行 `scream -v`，在虚拟机中播放音频，测试能不能听到。如果无
法听到，尝试指定 Scream 客户端监听的网卡，例如 `scream -i virbr0 -v`，其中
`virbr0` 对应 Virt-Manager 默认的 NAT 网络，是你的虚拟机与宿主机通信的网卡。

最后，可以创建一个 SystemD 服务，来方便地启动 Scream 客户端。创建
`~/.config/systemd/user/scream.service`，写入以下内容：

```bash
[Unit]
Description=Scream

[Service]
Type=simple
Restart=always
RestartSec=1
ExecStart=/usr/bin/scream -i virbr0 -v

[Install]
WantedBy=graphical-session.target
```

以后使用时就只需要运行 `systemctl --user start scream` 了。

{% endinteractive %}

## 直通键盘鼠标操作

（2023-05）新版 Looking Glass 已经可以稳定传输鼠标键盘操作。以下步骤保留以供参
考。

{% interactive_buttons %} keyboardmouse_hide|隐藏keyboardmouse_show|查看 2022-01
的旧版步骤 {% endinteractive_buttons %}

{% interactive keyboardmouse_show %}

Looking Glass 的键盘鼠标传输不太稳定，有时会丢失一些操作，因此如果你想在虚拟机里
玩游戏，就需要用更稳定的方法将键鼠操作传进虚拟机。

我们有两种方法：让 Libvirt 虚拟机直接捕获宿主机的键鼠操作，或者把一套 USB 键鼠直
接直通进虚拟机。

1. 捕获宿主机键鼠操作。

    在 Linux 系统上，所有的键鼠操作都是通过 `evdev`（即 `Event Device`）框架传输
    给桌面环境的。Libvirt 可以监听你的键鼠操作，将你的操作传给虚拟机。同
    时，Libvirt 可以在你按下左 Ctrl + 右 Ctrl 这套组合键的时候，在虚拟机和宿主机
    之间切换，这样你就可以用同一套键盘鼠标同时操作宿主机和虚拟机了。

    首先在宿主机上运行 `ls -l /dev/input/by-path` 查看你现有的 `evdev` 设备，例
    如我就有：

    ```bash
    pci-0000:00:14.0-usb-0:1:1.1-event-mouse               # USB 外接鼠标
    pci-0000:00:14.0-usb-0:1:1.1-mouse
    pci-0000:00:14.0-usb-0:6:1.0-event
    pci-0000:00:15.0-platform-i2c_designware.0-event-mouse # 电脑内置的触摸板
    pci-0000:00:15.0-platform-i2c_designware.0-mouse
    pci-0000:00:1f.3-platform-skl_hda_dsp_generic-event
    platform-i8042-serio-0-event-kbd                       # 电脑内置的键盘
    platform-pcspkr-event-spkr
    ```

    名字中带有 `event-mouse` 的就是鼠标，带有 `event-kbd` 的就是键盘。

    然后，`virsh edit Windows` 编辑虚拟机配置，在 `<devices>` 中添加一段：

    ```xml
    <input type="evdev">
      <!-- 根据上面 ls 的结果，修改鼠标或键盘的路径 -->
      <source dev="/dev/input/by-path/platform-i8042-serio-0-event-kbd" grab="all" repeat="on"/>
    </input>
    <!-- 有多个鼠标键盘时，重复即可 -->
    <input type="evdev">
      <source dev="/dev/input/by-path/pci-0000:00:15.0-platform-i2c_designware.0-event-mouse" grab="all" repeat="on"/>
    </input>
    ```

    启动虚拟机，这时你会发现键鼠操作没反应了，因为它们被虚拟机捕获了。按下左
    Ctrl + 右 Ctrl 组合键就可以恢复宿主机键鼠控制，再按一次就可以控制虚拟机。

    然后，我们就可以禁用 Looking Glass 的键鼠传输功能了。创建
    `/etc/looking-glass-client.ini`，写入以下内容：

    ```ini
    [spice]
    enable=no
    ```

2. USB 键鼠直通

    捕获键鼠操作并不是万能的，例如我的触摸板就无法被正常捕获，体现为无法移动虚拟
    机内的光标。

    如果你也遇到了这种情况，并且你有一套 USB 键鼠，就可以将它们直通进虚拟机，专
    门用它们控制虚拟机。虚拟机的 USB 直通技术非常成熟，你遇到问题的概率非常小。

    在 Virt-Manager 里选择添加硬件（`Add Hardware`） - USB 宿主设备
    （`USB Host Device`），选择你的鼠标键盘即可。

{% endinteractive %}

## 用内核模块加速 Looking Glass

> 这段内容大都来自 <https://looking-glass.io/docs/B6/module/>

Looking Glass 提供了一个内核模块，可以用于 IVSHMEM 共享内存设备，让 Looking
Glass 能使用 DMA 技术高效地读取虚拟机画面，从而提高帧率。

1. 安装 Linux 内核头文件和 DKMS，在 Arch Linux 上就是安装 `linux-headers` 和
   `dkms` 两个包。

2. 从 AUR 安装 `looking-glass-module-dkms`。

3. 配置 Udev 规则：创建 `/etc/udev/rules.d/99-kvmfr.rules`，写入以下内容：

    ```bash
    SUBSYSTEM=="kvmfr", OWNER="lantian", GROUP="kvm", MODE="0660"
    ```

    将 `lantian` 替换成你自己的用户名。

4. 配置内存大小：创建 `/etc/modprobe.d/looking-glass.conf`，写入以下内容：

    ```bash
    # 这里的内存大小计算方法和虚拟机的 shmem 一项相同。
    options kvmfr static_size_mb=64
    ```

5. 开机自动加载模块：创建 `/etc/modules-load.d/looking-glass.conf`，写入一行
   `kvmfr`。

6. 运行 `sudo modprobe kvmfr` 加载模块，此时 `/dev` 下会多出一个 `kvmfr0` 设备，
   就是 Looking Glass 的内存设备了。

7. 修改 `/etc/apparmor.d/local/abstractions/libvirt-qemu` 文件增加一行：

    ```bash
    /dev/kvmfr0 rw,
    ```

    以允许虚拟机访问这个设备。运行 `sudo systemctl restart apparmor` 重启
    AppArmor。

8. `virsh edit Windows` 编辑虚拟机配置：

    1. 在 `<devices>` 中删除 `<shmem>` 一段：

        ```xml
        <shmem name='looking-glass'>
          <model type='ivshmem-plain'/>
          <size unit='M'>64</size>
        </shmem>
        ```

    2. 在 `<qemu:commandline>` 中增加下面几行：

        ```xml
        <qemu:arg value="-device"/>
        <qemu:arg value="{&quot;driver&quot;:&quot;ivshmem-plain&quot;,&quot;id&quot;:&quot;shmem-looking-glass&quot;,&quot;memdev&quot;:&quot;looking-glass&quot;}"/>
        <qemu:arg value="-object"/>
        <!-- 下一行有一个 67108864，对应 64MB * 1048576 -->
        <!-- 如果你之前设置的内存大小不同请相应修改 -->
        <qemu:arg value="{&quot;qom-type&quot;:&quot;memory-backend-file&quot;,&quot;id&quot;:&quot;looking-glass&quot;,&quot;mem-path&quot;:&quot;/dev/kvmfr0&quot;,&quot;size&quot;:67108864,&quot;share&quot;:true}"/>
        ```

    3. 启动虚拟机。

9. 修改 `/etc/looking-glass-client.ini`，添加以下内容：

    ```ini
    [app]
    shmFile=/dev/kvmfr0
    ```

10. 启动 Looking Glass，此时应该可以看到虚拟机画面。

11. （2023-05）如果你用的是 NixOS，可以直接使用下面的配置：

```nix
{
  boot.extraModulePackages = with config.boot.kernelPackages; [
    kvmfr
  ];
  boot.extraModprobeConfig = ''
    # 这里的内存大小计算方法和虚拟机的 shmem 一项相同。
    options kvmfr static_size_mb=64
  '';
  boot.kernelModules = ["kvmfr"];
  services.udev.extraRules = ''
    SUBSYSTEM=="kvmfr", OWNER="root", GROUP="libvirtd", MODE="0660"
  '';

  environment.etc."looking-glass-client.ini".text = ''
    [app]
    shmFile=/dev/kvmfr0
  '';
}
```

## 不使用虚拟机时给独立显卡断电

**2022-01-26 更新：实测应用这个补丁后，NVIDIA 显卡仍未完全断电，耗电量与未使用补
丁前相同。本段内容失效。**

{% interactive_buttons %} power_hide|失效内容已隐藏power_show|点此查看
{% endinteractive_buttons %}

{% interactive power_show %}

> 这一段只适用于 20 系及以上的 NVIDIA 显卡，当使用 NVIDIA 官方驱动时，它们也可以
> 自动断电。10 系及以下的 NVIDIA 显卡不支持此功能。
>
> 这一段涉及自行编译内核，和**使用未经严格检查和测试的内核补丁**，不建议不熟悉
> Linux 的用户操作。请自行衡量风险。

当你不使用虚拟机时，管理 PCIe 直通的 `vfio-pci` 驱动会将设备设置成 `D3` 模式，也
就是 PCIe 设备的省电模式。但是 `D3` 模式也分两种：`D3hot`，此时设备仍然通电，和
`D3cold`，此时设备完全断电。现在内核中的 `vfio-pci` 驱动只支持 `D3hot`，此时
NVIDIA 独立显卡由于芯片未断电，仍会消耗 10W 左右的功率，从而导致笔记本电脑续航下
降。

一位 NVIDIA 的工程师在 Linux 内核的邮件列表上发布了一组让 `vfio-pci` 支持
`D3cold` 模式的补丁。应用此补丁后，当虚拟机关机时，NVIDIA 独立显卡会被彻底断电，
从而节省电量。

这组补丁可以在
<https://lore.kernel.org/lkml/20211115133640.2231-1-abhsahu@nvidia.com/T/> 看
到。它总共由三个补丁组成，我将三个补丁合并后上传到了
<https://github.com/xddxdd/pkgbuild/blob/master/linux-xanmod-lantian/0007-vfio-pci-d3cold.patch>。

对于 Arch Linux 来说，给内核打补丁是比较简单的。AUR 中大部分内核的 PKGBUILD 都可
以自动打补丁，只需要下载一个内核的 PKGBUILD，然后把这个补丁加入 PKGBUILD 的
`source` 部分就可以了。具体修改可以看我的这个
commit：<https://github.com/xddxdd/pkgbuild/commit/406adb7bf5657cfe07bb17ff561d11ed97ebab39>

**要注意的是，这个补丁无法保证稳定。**

根据邮件列表的讨论：

1. 它是一个 RFC 补丁，也就是测试版补丁，邮件列表的标题上写着一个大大的 `[RFC]`。
2. 如果虚拟机中的显卡驱动想把显卡切换成 `D3cold` 模式，这个补丁存在将显卡
   reset，导致状态丢失，继而导致虚拟机崩溃的风险。虽然目前我使用 Windows 11 虚拟
   机暂时没有发现类似的问题，但是你需要了解其中的隐患。
3. 目前开发者只测试了 NVIDIA 的部分显卡，不保证对其它 PCIe 设备的支持。

**风险自负。** {% endinteractive %}

# 资料来源

感谢前人在显卡直通上做出的努力，没有他们的努力本文不可能存在。

以下是我配置时参考的资料：

-   NVIDIA 独显直通
    -   GitHub Misairu-G 的 NVIDIA Optimus MUXed 直通教程
        <https://gist.github.com/Misairu-G/616f7b2756c488148b7309addc940b28>
    -   Reddit VFIO 版块的虚拟电池补丁
        <https://www.reddit.com/r/VFIO/comments/ebo2uk/nvidia_geforce_rtx_2060_mobile_success_qemu_ovmf/>
    -   Arch Linux Wiki
        <https://wiki.archlinux.org/title/PCI_passthrough_via_OVMF>
-   Looking Glass 的文档
    -   安装文档 <https://looking-glass.io/docs/B6/install/>
    -   内核模块文档 <https://looking-glass.io/docs/B6/module/>
-   虚拟显示器驱动
    -   文中使用的可以修改分辨率和刷新率的版本
        <https://github.com/ge9/IddSampleDriver>
    -   分辨率和刷新率固定的原版 <https://github.com/roshkins/IddSampleDriver>
-   VFIO D3cold 模式补丁
    -   Phoronix 的报道
        <https://www.phoronix.com/scan.php?page=news_item&px=NVIDIA-Runtime-PM-VFIO-PCI>
    -   Linux 内核邮件列表的链接
        <https://lore.kernel.org/lkml/20211115133640.2231-1-abhsahu@nvidia.com/T/>

## 附录：最终 Libvirt XML 文件

{% interactive_buttons %} xml_hide|隐藏xml_show|显示完整的 XML 文件
{% endinteractive_buttons %}

{% interactive xml_show %}

```xml
<domain xmlns:qemu="http://libvirt.org/schemas/domain/qemu/1.0" type="kvm">
  <name>Windows11</name>
  <uuid>5d5b00d8-475a-4b6c-8053-9dda30cd2f95</uuid>
  <metadata>
    <libosinfo:libosinfo xmlns:libosinfo="http://libosinfo.org/xmlns/libvirt/domain/1.0">
      <libosinfo:os id="http://microsoft.com/win/11"/>
    </libosinfo:libosinfo>
  </metadata>
  <memory unit="KiB">16777216</memory>
  <currentMemory unit="KiB">16777216</currentMemory>
  <vcpu placement="static">16</vcpu>
  <os>
    <type arch="x86_64" machine="pc-q35-8.0">hvm</type>
    <loader readonly="yes" type="pflash">/run/libvirt/nix-ovmf/OVMF_CODE.fd</loader>
    <nvram template="/run/libvirt/nix-ovmf/OVMF_VARS.fd">/var/lib/libvirt/qemu/nvram/Windows11_VARS.fd</nvram>
  </os>
  <features>
    <acpi/>
    <apic/>
    <hyperv mode="custom">
      <relaxed state="on"/>
      <vapic state="on"/>
      <spinlocks state="on" retries="8191"/>
      <vpindex state="on"/>
      <runtime state="on"/>
      <synic state="on"/>
      <stimer state="on"/>
      <reset state="on"/>
      <vendor_id state="on" value="GenuineIntel"/>
      <frequencies state="on"/>
      <tlbflush state="on"/>
    </hyperv>
    <kvm>
      <hidden state="on"/>
    </kvm>
    <vmport state="off"/>
  </features>
  <cpu mode="host-passthrough" check="none" migratable="on">
    <topology sockets="1" dies="1" cores="8" threads="2"/>
  </cpu>
  <clock offset="localtime">
    <timer name="rtc" tickpolicy="catchup"/>
    <timer name="pit" tickpolicy="delay"/>
    <timer name="hpet" present="no"/>
    <timer name="hypervclock" present="yes"/>
  </clock>
  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>destroy</on_crash>
  <pm>
    <suspend-to-mem enabled="no"/>
    <suspend-to-disk enabled="no"/>
  </pm>
  <devices>
    <emulator>/run/libvirt/nix-emulators/qemu-system-x86_64</emulator>
    <disk type="file" device="disk">
      <driver name="qemu" type="qcow2" discard="unmap"/>
      <source file="/var/lib/libvirt/images/Windows11.qcow2"/>
      <target dev="vda" bus="virtio"/>
      <boot order="1"/>
      <address type="pci" domain="0x0000" bus="0x04" slot="0x00" function="0x0"/>
    </disk>
    <disk type="file" device="cdrom">
      <driver name="qemu" type="raw"/>
      <source file="/mnt/root/persistent/media/LegacyOS/Common/virtio-win-0.1.215.iso"/>
      <target dev="sdb" bus="sata"/>
      <readonly/>
      <address type="drive" controller="0" bus="0" target="0" unit="1"/>
    </disk>
    <controller type="usb" index="0" model="qemu-xhci" ports="15">
      <address type="pci" domain="0x0000" bus="0x02" slot="0x00" function="0x0"/>
    </controller>
    <controller type="pci" index="0" model="pcie-root"/>
    <controller type="pci" index="1" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="1" port="0x10"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x0" multifunction="on"/>
    </controller>
    <controller type="pci" index="2" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="2" port="0x11"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x1"/>
    </controller>
    <controller type="pci" index="3" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="3" port="0x12"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x2"/>
    </controller>
    <controller type="pci" index="4" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="4" port="0x13"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x3"/>
    </controller>
    <controller type="pci" index="5" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="5" port="0x14"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x4"/>
    </controller>
    <controller type="pci" index="6" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="6" port="0x15"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x5"/>
    </controller>
    <controller type="pci" index="7" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="7" port="0x16"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x6"/>
    </controller>
    <controller type="pci" index="8" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="8" port="0x17"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x02" function="0x7"/>
    </controller>
    <controller type="pci" index="9" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="9" port="0x18"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x03" function="0x0" multifunction="on"/>
    </controller>
    <controller type="pci" index="10" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="10" port="0x19"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x03" function="0x1"/>
    </controller>
    <controller type="pci" index="11" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="11" port="0x1a"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x03" function="0x2"/>
    </controller>
    <controller type="pci" index="12" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="12" port="0x1b"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x03" function="0x3"/>
    </controller>
    <controller type="pci" index="13" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="13" port="0x1c"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x03" function="0x4"/>
    </controller>
    <controller type="pci" index="14" model="pcie-root-port">
      <model name="pcie-root-port"/>
      <target chassis="14" port="0x1d"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x03" function="0x5"/>
    </controller>
    <controller type="sata" index="0">
      <address type="pci" domain="0x0000" bus="0x00" slot="0x1f" function="0x2"/>
    </controller>
    <controller type="virtio-serial" index="0">
      <address type="pci" domain="0x0000" bus="0x03" slot="0x00" function="0x0"/>
    </controller>
    <interface type="network">
      <mac address="52:54:00:f4:bf:15"/>
      <source network="default"/>
      <model type="virtio"/>
      <address type="pci" domain="0x0000" bus="0x01" slot="0x00" function="0x0"/>
    </interface>
    <serial type="pty">
      <target type="isa-serial" port="0">
        <model name="isa-serial"/>
      </target>
    </serial>
    <console type="pty">
      <target type="serial" port="0"/>
    </console>
    <channel type="spicevmc">
      <target type="virtio" name="com.redhat.spice.0"/>
      <address type="virtio-serial" controller="0" bus="0" port="1"/>
    </channel>
    <input type="mouse" bus="ps2"/>
    <input type="mouse" bus="virtio">
      <address type="pci" domain="0x0000" bus="0x06" slot="0x00" function="0x0"/>
    </input>
    <input type="keyboard" bus="ps2"/>
    <input type="keyboard" bus="virtio">
      <address type="pci" domain="0x0000" bus="0x07" slot="0x00" function="0x0"/>
    </input>
    <tpm model="tpm-crb">
      <backend type="passthrough">
        <device path="/dev/tpm0"/>
      </backend>
    </tpm>
    <graphics type="spice" autoport="yes">
      <listen type="address"/>
      <image compression="off"/>
    </graphics>
    <sound model="ich9">
      <audio id="1"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x1b" function="0x0"/>
    </sound>
    <audio id="1" type="spice"/>
    <video>
      <model type="qxl" ram="65536" vram="65536" vgamem="16384" heads="1" primary="yes"/>
      <address type="pci" domain="0x0000" bus="0x00" slot="0x01" function="0x0"/>
    </video>
    <hostdev mode="subsystem" type="pci" managed="yes">
      <source>
        <address domain="0x0000" bus="0x01" slot="0x00" function="0x0"/>
      </source>
      <address type="pci" domain="0x0000" bus="0x05" slot="0x00" function="0x0"/>
    </hostdev>
    <redirdev bus="usb" type="spicevmc">
      <address type="usb" bus="0" port="2"/>
    </redirdev>
    <redirdev bus="usb" type="spicevmc">
      <address type="usb" bus="0" port="3"/>
    </redirdev>
    <watchdog model="itco" action="reset"/>
    <memballoon model="none"/>
  </devices>
  <qemu:commandline>
    <qemu:arg value="-device"/>
    <qemu:arg value="{&quot;driver&quot;:&quot;ivshmem-plain&quot;,&quot;id&quot;:&quot;shmem0&quot;,&quot;memdev&quot;:&quot;looking-glass&quot;}"/>
    <qemu:arg value="-object"/>
    <qemu:arg value="{&quot;qom-type&quot;:&quot;memory-backend-file&quot;,&quot;id&quot;:&quot;looking-glass&quot;,&quot;mem-path&quot;:&quot;/dev/kvmfr0&quot;,&quot;size&quot;:67108864,&quot;share&quot;:true}"/>
    <qemu:arg value="-acpitable"/>
    <qemu:arg value="file=/etc/ssdt1.dat"/>
  </qemu:commandline>
</domain>
```

{% endinteractive %}
