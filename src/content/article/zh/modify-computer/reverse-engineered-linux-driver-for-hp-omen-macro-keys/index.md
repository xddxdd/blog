---
title: '用逆向工程方式给惠普暗影精灵宏按键编写 Linux 驱动'
categories: 计算机与客户端
tags: [惠普, 暗影精灵, 宏按键, Linux]
date: 2022-04-04 05:16:16
---

我前段时间换了台新电脑，惠普的暗影精灵 17t-ck000（美版，应该对应的是国内的暗影精
灵 7 Plus）。这台电脑好是好，做工优秀，性能强大，就是有一个问题：它在 Linux 下的
驱动支持实在是太烂了。

1. 不支持调节风扇转速，你能看到风扇转速，但仅此而已。再加上惠普的默认风扇策略非
   常激进，即使我开启了 BIOS 中的低温风扇停转功能，它依然在 CPU 温度只有 40 度、
   显卡空载的情况下转得非常欢快。

   - 其实可以用 [NBFC](https://github.com/hirschmann/nbfc) 直接写 EC 寄存器来控
     制，但
     在[某次不幸的事故中](/article/chat/how-i-nuked-my-btrfs-partition.lantian/)当
     时的配置方案丢失了。
   - 我配置 NBFC 时正在新电脑试用 NixOS。事故发生时新电脑上的 NixOS 被我删掉了，
     而且当时的配置没上传 GitHub。
   - 过段时间再重新写一遍（咕咕咕）

2. 不支持调整键盘背光颜色，它们在 Windows 下由 OMEN Command Center 软件控制。有
   时系统崩溃、我长按电源键断电重启时，BIOS 会将键盘背光恢复成默认的五彩斑斓的颜
   色，此时我只能回到 Windows 进行调节。

   - 好在 GitHub 有一个修改版的 Linux `hp_wmi` 内核模块，支持了在 Linux 下控制背
     光颜色。
   - 它是由 James Churchill（pelrun）开发的，可以在
     <https://github.com/pelrun/hp-omen-linux-module> 下载。

3. 键盘左边有一排宏按键 P1-P6。它们在 Windows 下由 OMEN Command Center 软件控
   制，可以配置宏定义，在按下按键时模拟一段键盘输入。当然，这个功能 Linux 下是用
   不了的。

   - [惠普没有开发 Linux 版 OMEN Command Center 的计划](https://h30434.www3.hp.com/t5/Gaming-Notebooks/HP-Omen-keyboard-control-on-Linux/td-p/4890663)。

键盘上有几个用不了的按键，这就让人很不爽。虽然我不是重度游戏玩家，用不到宏按键，
但即使把它们设置成一些程序的快捷键，用来快速打开浏览器、终端，也是好的。

于是我就开始了对 OMEN Command Center 的逆向之旅。

# 逆向之旅

OMEN Command Center 是一个用微软 .NET 技术写成的软件。这就意味着对它的逆向非常简
单。作为 .NET 程序，OMEN Command Center 的每个 DLL 文件都被命名为它的类名，可以
直接根据文件名称确定它的作用。另外，用
[JetBrains 的 dotPeek 软件](https://www.jetbrains.com/decompiler/)，可以直接把
.NET 程序反编译成带有原始函数变量名的 C# 代码，不用像反编译 C 程序一样读汇编、猜
测函数作用。

在用 dotPeek 逐个反编译 DLL 文件的过程中，我注意到了 `HP.Omen.MacrosModule.dll`
文件，它似乎是键盘宏功能的 DLL 文件。一番查找后，我定位到了
`HP.Omen.MacrosModule.Models.MacroModel` 这个类，它负责将 OMEN Command Center 的
宏定义翻译成 EC 能看懂的二进制表示，并通过
[WMI ACPI](https://docs.microsoft.com/en-us/samples/microsoft/windows-driver-samples/wmi-acpi-sample/)
功能写入 EC。

首先来看 `OnEditorPageSaveClick` 函数：

```csharp
private void OnEditorPageSaveClick(string obj)
{
  // 略过了无关部分
  switch (this.platformInfo.Platform)
  {
    case DeviceEnums.DeviceType.Dragons10:
      // 与 Dragons10 设备相关的逻辑
      break;
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      // 与 Marlins 设备相关的逻辑
      break;
    default:
      goto case DeviceEnums.DeviceType.Marlins10;
  }
}
```

那么问题来了，我的电脑的版本是 Dragons 还是 Marlins？这里的版本实际上是读取
`HP.Omen.DeviceLib` 里的 `DeviceList.json` 设备列表而来的，这份 JSON 中的设备编
号对应的是电脑的 PCI Subsystem Device ID。首先确定我的电脑的编号：

```bash
# lspci -nnk | grep VGA -A 2
0000:00:02.0 VGA compatible controller [0300]: Intel Corporation TigerLake-H GT1 [UHD Graphics] [8086:9a60] (rev 01)
        DeviceName:  Onboard IGD
        Subsystem: Hewlett-Packard Company Device [103c:88f7]
--
0000:01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA104M [GeForce RTX 3070 Mobile / Max-Q] [10de:249d] (rev a1)
        DeviceName: NVIDIA Graphics Device
        Subsystem: Hewlett-Packard Company Device [103c:88f7]
```

我的编号是 `88f7`。再去查询那份 JSON 文件：

```json
// 略过了无关部分
{
  "Name": "Cybug",
  "DisplayName": "OMEN 17",
  "ProductNum": [
    {
      "SSID": "88F7" // GN20E (E3/E5/E7) non DDS
    }
  ],
  "Feature": [
    "SystemInfo",
    "NetworkBooster",
    "FourZone",
    "DraxLighting",
    "PerformanceControl",
    "GraphicsSwitcher",
    "Macros"
  ],
  "BackgroundFeature": [
    "NetworkBooster",
    "OmenKey",
    "FourZone",
    "DraxLightingBg",
    "PerformanceControl",
    "MarlinsMacro",
    "DragonKBMcu"
  ]
}
```

功能列表里有 `MarlinsMacro`，看来我的电脑属于 Marlins。继续读 Marlins 相关的逻
辑：

```csharp
private void OnEditorPageSaveClick(string obj)
{
  // 略过了无关部分
  switch (this.platformInfo.Platform)
  {
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      // 只保留了关键逻辑
      setValue = this.SetBytesToEC(this._tmpSeletcItemSrc.InputKeysRecordDelay);
      ec = this.SetBytesToEC(this._tmpSeletcItemSrc.InputKeysCustomDelay);
      break;
  }
}
```

调用了 `SetBytesToEC` 函数，它负责将按键序列翻译成 EC 的二进制表示：

```csharp
public byte[] SetBytesToEC(ObservableCollection<InputKeyInfo> Items)
{
  List<byte> byteList = new List<byte>();
  // 如果按键序列为空，直接返回 [1]
  if (Items == null)
  {
    byteList.Insert(0, (byte) (byteList.Count + 1));
    return byteList.ToArray();
  }
  for (int index = 0; index < Items.Count; ++index)
  {
    // 如果是特殊功能键（Home，End，Insert，Delete，方向键，Win 键，右 Ctrl 和右 Alt），在前面加一个 0xE0
    // 这说明这里的按键编码是 PS/2 的 Scan Code Set 1（但不完全是）
    if (this.ExtensionKeyMap.ContainsKey(Items[index].VKey))
      byteList.Add((byte) 224);
    // 根据按键类型：
    switch (Items[index].Type)
    {
      case KeyInfoType.DelayTime:
        // 延迟，等待一段时间再按下一个键
        // 格式为 [255, 时间（ms）]
        double num;
        for (delayTime = Items[index].DelayTime; delayTime - (int) byte.MaxValue > 0; delayTime -= (int) byte.MaxValue)
        {
          byteList.Add(byte.MaxValue);
          byteList.Add(byte.MaxValue);
        }
        byteList.Add(byte.MaxValue);
        byteList.Add((byte) num);
        break;
      case KeyInfoType.KeyDown:
      case KeyInfoType.KeyUp:
        // 按键，直接把 Scan Code 写进去
        // 根据 Scan Code Set 1，松开按键的编码 = 按下按键的编码 | 0x80
        byteList.Add(this.GetECScanCode(Items[index]));
        break;
    }
  }
  // 在序列开头加上 1 byte 的序列长度（包含长度 byte 本身）
  byteList.Insert(0, (byte) (byteList.Count + 1));
  return byteList.ToArray();
}
```

根据
[PS/2 Scan Code Set 1 的对照表](https://wiki.osdev.org/PS/2_Keyboard#Scan_Code_Set_1)，
我们可以简单地编码几份按键序列：

1. 按下再松开 A 键：`[3, 0x1e, 0x9e]`
2. 按下 A 键，等 100 毫秒，再松开：`[5, 0x1e, 255, 100, 0x9e]`
3. 按下 A 键，等 300 毫秒，再松开：`[7, 0x1e, 255, 255, 255, 45, 0x9e]`
   - 由于 byte 数据类型限制，每次最多等 255 毫秒，因此等 300 毫秒要分两次完成。

继续分析 `OnEditorPageSaveClick` 的逻辑：

```csharp
private void OnEditorPageSaveClick(string obj)
{
  // 略过了无关部分
  switch (this.platformInfo.Platform)
  {
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      this.SetMacrosToSystemInfoService(this.platformInfo.Platform);
      break;
  }
}
```

`SetMacrosToSystemInfoService` 函数负责将按键序列编码写入 EC：

```csharp

private void SetMacrosToSystemInfoService(
  DeviceEnums.DeviceType _pType,
  EnumMacroKeyDragons dKey = EnumMacroKeyDragons.P1,
  MacroKeyItem iKey = null)
{
  // 略过了无关部分，和不重要的错误检查部分
  int index1 = 0;
  switch (_pType)
  {
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      foreach (EnumMacroKeyMarlins enumMacroKeyMarlins in Enum.GetValues(typeof (EnumMacroKeyMarlins)))
      {
        EnumMacroKeyMarlins enumValue = enumMacroKeyMarlins;
        if (enumValue != EnumMacroKeyMarlins.FN)
        {
          // 对每个除 Fn 以外的宏按键：
          if (macroKeyItem != null)
          {
            // 把编码后的按键序列追加到 bMacroKeyRawArray 上
            num = ((IEnumerable<byte>) source).Count<byte>();
            for (int index2 = 0; index2 < num; ++index2)
              this.platformInfo.bMacroKeyRawArray[index1 + index2] = source[index2];
          }
          else
          {
            // 这个按键没有对应序列，直接追加 [1]（就是空按键序列编码后的值）
            num = 1;
            this.platformInfo.bMacroKeyRawArray[index1] = (byte) 1;
          }
          index1 += num;
        }
      }
      // 最后多加一个 1，意义不明
      this.platformInfo.bMacroKeyRawArray[index1] = (byte) 1;
      // WMI 写入，其中 HPWMICommand = 0x20008，HPWMICMDTypeSet = 15，MacroKeyBufferSize = 4096
      this.ExcuteBIOSWmiCommandAsync(this.platformInfo.HPWMICommand, this.platformInfo.HPWMICMDTypeSet, this.platformInfo.MacroKeyBufferSize, this.platformInfo.bMacroKeyRawArray, 0);
      // WMI 写入，开启宏按键功能（写入 0 是关闭）
      this.ExcuteBIOSWmiCommandAsync(this.platformInfo.HPWMICommand, 23, 4, new byte[4]
      {
        (byte) 1,
        (byte) 0,
        (byte) 0,
        (byte) 0
      }, 0);
      break;
  }
}
```

这段逻辑就是将所有宏按键的序列编码按顺序合并在一起，最后执行 WMI 命令写入 EC。

按键的顺序在 `HP.Omen.MacrosModule.Models.EnumMacroKeyMarlins`：

```csharp
public enum EnumMacroKeyMarlins
{
  FN,
  P1,
  P2,
  P3,
  P4,
  P5,
  P6,
  CTRL_P1,
  CTRL_P2,
  CTRL_P3,
  CTRL_P4,
  CTRL_P5,
  CTRL_P6,
  ALT_P1,
  ALT_P2,
  ALT_P3,
  ALT_P4,
  ALT_P5,
  ALT_P6,
  SHIFT_P1,
  SHIFT_P2,
  SHIFT_P3,
  SHIFT_P4,
  SHIFT_P5,
  SHIFT_P6,
  FN_P1,
  FN_P2,
  FN_P3,
  FN_P4,
  FN_P5,
  FN_P6,
}
```

我们要做的事已经很明确了：

1. 将每个宏按键的按键序列编码；
2. 将所有按键序列组合到一个 4096 字节大的数组里；
3. 调用 WMI ACPI 命令将数组内容写入 EC。

# 编写 Linux 驱动

为了支持调整键盘按键背光，我已经在用一份修改版的 Linux `hp_wmi` 驱动，因此我选择
直接在它的基础上修改。

（修改版驱动地址：<https://github.com/pelrun/hp-omen-linux-module>）

首先是编写一份按键序列。受到惠普的硬件限制，宏按键功能无法发送特殊功能键（例如音
量调整，媒体控制等），这也意味着无法将它们映射到一般键盘上没有的键，例如
F13-F24，来避免冲突。由于我的电脑没有小键盘，我选择退而求其次，将宏按键映射到小
键盘的按键上：

```c
#include <linux/input-event-codes.h>
#define MACRO_KEY_RELEASE 0x80

static u8 macro_profile_bytes[4096] = {
  /* P1 */        0x03, KEY_KP1, KEY_KP1 | MACRO_KEY_RELEASE,
  /* P2 */        0x03, KEY_KP2, KEY_KP2 | MACRO_KEY_RELEASE,
  /* P3 */        0x03, KEY_KP3, KEY_KP3 | MACRO_KEY_RELEASE,
  /* P4 */        0x03, KEY_KP4, KEY_KP4 | MACRO_KEY_RELEASE,
  /* P5 */        0x03, KEY_KP5, KEY_KP5 | MACRO_KEY_RELEASE,
  /* P6 */        0x03, KEY_KP6, KEY_KP6 | MACRO_KEY_RELEASE,

  /* Ctrl+P1 */   0x05, KEY_LEFTCTRL, KEY_KP1, KEY_KP1 | MACRO_KEY_RELEASE, KEY_LEFTCTRL | MACRO_KEY_RELEASE,
  /* Ctrl+P2 */   0x05, KEY_LEFTCTRL, KEY_KP2, KEY_KP2 | MACRO_KEY_RELEASE, KEY_LEFTCTRL | MACRO_KEY_RELEASE,
  /* Ctrl+P3 */   0x05, KEY_LEFTCTRL, KEY_KP3, KEY_KP3 | MACRO_KEY_RELEASE, KEY_LEFTCTRL | MACRO_KEY_RELEASE,
  /* Ctrl+P4 */   0x05, KEY_LEFTCTRL, KEY_KP4, KEY_KP4 | MACRO_KEY_RELEASE, KEY_LEFTCTRL | MACRO_KEY_RELEASE,
  /* Ctrl+P5 */   0x05, KEY_LEFTCTRL, KEY_KP5, KEY_KP5 | MACRO_KEY_RELEASE, KEY_LEFTCTRL | MACRO_KEY_RELEASE,
  /* Ctrl+P6 */   0x05, KEY_LEFTCTRL, KEY_KP6, KEY_KP6 | MACRO_KEY_RELEASE, KEY_LEFTCTRL | MACRO_KEY_RELEASE,

  /* Alt+P1 */    0x05, KEY_LEFTALT, KEY_KP1, KEY_KP1 | MACRO_KEY_RELEASE, KEY_LEFTALT | MACRO_KEY_RELEASE,
  /* Alt+P2 */    0x05, KEY_LEFTALT, KEY_KP2, KEY_KP2 | MACRO_KEY_RELEASE, KEY_LEFTALT | MACRO_KEY_RELEASE,
  /* Alt+P3 */    0x05, KEY_LEFTALT, KEY_KP3, KEY_KP3 | MACRO_KEY_RELEASE, KEY_LEFTALT | MACRO_KEY_RELEASE,
  /* Alt+P4 */    0x05, KEY_LEFTALT, KEY_KP4, KEY_KP4 | MACRO_KEY_RELEASE, KEY_LEFTALT | MACRO_KEY_RELEASE,
  /* Alt+P5 */    0x05, KEY_LEFTALT, KEY_KP5, KEY_KP5 | MACRO_KEY_RELEASE, KEY_LEFTALT | MACRO_KEY_RELEASE,
  /* Alt+P6 */    0x05, KEY_LEFTALT, KEY_KP6, KEY_KP6 | MACRO_KEY_RELEASE, KEY_LEFTALT | MACRO_KEY_RELEASE,

  /* Shift+P1 */  0x05, KEY_LEFTSHIFT, KEY_KP1, KEY_KP1 | MACRO_KEY_RELEASE, KEY_LEFTSHIFT | MACRO_KEY_RELEASE,
  /* Shift+P2 */  0x05, KEY_LEFTSHIFT, KEY_KP2, KEY_KP2 | MACRO_KEY_RELEASE, KEY_LEFTSHIFT | MACRO_KEY_RELEASE,
  /* Shift+P3 */  0x05, KEY_LEFTSHIFT, KEY_KP3, KEY_KP3 | MACRO_KEY_RELEASE, KEY_LEFTSHIFT | MACRO_KEY_RELEASE,
  /* Shift+P4 */  0x05, KEY_LEFTSHIFT, KEY_KP4, KEY_KP4 | MACRO_KEY_RELEASE, KEY_LEFTSHIFT | MACRO_KEY_RELEASE,
  /* Shift+P5 */  0x05, KEY_LEFTSHIFT, KEY_KP5, KEY_KP5 | MACRO_KEY_RELEASE, KEY_LEFTSHIFT | MACRO_KEY_RELEASE,
  /* Shift+P6 */  0x05, KEY_LEFTSHIFT, KEY_KP6, KEY_KP6 | MACRO_KEY_RELEASE, KEY_LEFTSHIFT | MACRO_KEY_RELEASE,

  /* Fn+P1 */     0x03, KEY_KP7, KEY_KP7 | MACRO_KEY_RELEASE,
  /* Fn+P2 */     0x03, KEY_KP8, KEY_KP8 | MACRO_KEY_RELEASE,
  /* Fn+P3 */     0x03, KEY_KP9, KEY_KP9 | MACRO_KEY_RELEASE,
  /* Fn+P4 */     0x03, KEY_KP0, KEY_KP0 | MACRO_KEY_RELEASE,
  /* Fn+P5 */     0x03, KEY_KPMINUS, KEY_KPMINUS | MACRO_KEY_RELEASE,
  /* Fn+P6 */     0x03, KEY_KPPLUS, KEY_KPPLUS | MACRO_KEY_RELEASE,
};
```

> 目前我的模块固定了一份按键序列。后续我可以暴露一套配置接口，允许用户设置自己的
> 按键序列。

然后写两个函数，分别用来在模块加载时启用宏按键，和在模块卸载时禁用：

```c
static int macro_key_setup(struct platform_device *dev)
{
  int ret;
  u32 macro_enable = 1;

  ret = hp_wmi_perform_query(HPWMI_MACRO_PROFILE_SET, HPWMI_MACRO,
                             macro_profile_bytes, sizeof(macro_profile_bytes), 0);
  pr_debug("macro key setup ret 0x%x\n", ret);

  ret = hp_wmi_perform_query(HPWMI_MACRO_MODE_SET, HPWMI_MACRO,
                             &macro_enable, sizeof(macro_enable), 0);
  pr_debug("macro key enable ret 0x%x\n", ret);

  return 0;
}

static int macro_key_remove(struct platform_device *dev)
{
  int ret;
  u32 macro_disable = 0;

  ret = hp_wmi_perform_query(HPWMI_MACRO_MODE_SET, HPWMI_MACRO,
                             &macro_disable, sizeof(macro_disable), 0);
  pr_debug("macro key disable ret 0x%x\n", ret);

  return 0;
}
```

然后在相应的初始化、卸载函数中调用它们即可。

# 下载

我将修改后的模块上传到了 <https://github.com/xddxdd/hp-omen-linux-module>。其中
与本文相关的修改可以在
<https://github.com/xddxdd/hp-omen-linux-module/commit/macro_keys> 看到。

或者，你也可以直接使用这个内核补丁，将宏按键功能（和键盘背光功能）直接集成到内核
中：<https://github.com/xddxdd/nur-packages/blob/master/pkgs/linux-xanmod-lantian/patches/0004-hp-omen-fourzone.patch>
