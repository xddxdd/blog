---
title: 'Reverse Engineered Linux Driver for HP OMEN Macro Keys'
categories: 'Computers and Clients'
tags: [HP, OMEN, Macro Keys, Linux]
date: 2022-04-04 05:16:16
---

I got a new laptop some time ago, an HP OMEN 17t-ck000. While it's a nice laptop with excellent build quality and performance, it has one problem: it's drivers under Linux are far from complete.

1. No support for fan speed control. You can see the fan speed but that's it. In addition, HP's default fan control strategy is very agressive, in the sense that even with fan spin down enabled in BIOS, the fan keeps running with the CPU being around 40 degrees celsius and GPU being idle.

   - Actually, [NBFC](https://github.com/hirschmann/nbfc) can be used to control the fan speed by directly writing to EC registers, but [in an unfortunate accident](/en/article/chat/how-i-nuked-my-btrfs-partition.lantian/) I lost my configuration file.
   - I was trying NixOS on my new laptop when I set up NBFC. When the accident happened, I had removed NixOS from the laptop, and the config files were never uploaded to GitHub.
   - I may write that config file again in the future.

2. No support for tuning keyboard backlight color, which is controlled by OMEN Command Center on Windows. Sometimes my system crash, and I press the power button to force a shutdown, only to find that BIOS has reset the backlight into the colorful default setting. Whenever that happens, I'll have to set it back on Windows.

   - The good news is that there's a modified Linux `hp_wmi` kernel module on GitHub, with support for controlling keyboard backlight on Linux.
   - It's developed by James Churchill (pelrun), and can be downloaded from <https://github.com/pelrun/hp-omen-linux-module>.

3. There's a row of macro keys on the left side of the keyboard. They're controlled by OMEN Command Center on Windows, and can be set up with macro definitions to simulate a series of keystrokes on keypress. Of course, it doesn't work on Linux.

   - [HP has no plan to develop an OMEN Command Center for Linux](https://h30434.www3.hp.com/t5/Gaming-Notebooks/HP-Omen-keyboard-control-on-Linux/td-p/4890663).

Having unusable keys on your keyboard is frustrating. Although I'm not a heavy gamer and don't need macro keys, I can still use them for shortcuts to apps, like the browser or the terminal.

Therefore, I started my journey of reverse engineering OMEN Command Center.

# The Reverse Engineering Journey

OMEN Command Center is written with Microsoft's .NET technology, which means the decompilation process is trivial. As a .NET program, each and every of its DLL are named after their class names, which means their functions can be determined after their file name. In addition, [dotPeek from JetBrains](https://www.jetbrains.com/decompiler/) can decompile .NET programs into C# code with original function and variable names, so I don't need to read assembly code to figure out what each function does, like the experience with C programs.

In the process decompiling the DLLs with dotPeek, I noticed `HP.Omen.MacrosModule.dll`, which seems to be the DLL for the keyboard macro function. After a bit of searching, I found my target of a class: `HP.Omen.MacrosModule.Models.MacroModel`. It's responsible for translating macro definitions of OMEN Command Center to binary representations understood by EC, and writing them to the EC via [WMI ACPI](https://docs.microsoft.com/en-us/samples/microsoft/windows-driver-samples/wmi-acpi-sample/) interface.

First, let's take a look of the `OnEditorPageSaveClick` function:

```csharp
private void OnEditorPageSaveClick(string obj)
{
  // Unrelated parts are removed
  switch (this.platformInfo.Platform)
  {
    case DeviceEnums.DeviceType.Dragons10:
      // Logic related to Dragons10 devices
      break;
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      // Logic related to Marlins devices
      break;
    default:
      goto case DeviceEnums.DeviceType.Marlins10;
  }
}
```

Now the problem is, is my laptop the Dragons variant or the Marlins variant? The device type is actually determined by `DeviceList.json` in `HP.Omen.DeviceLib`, and the IDs in that JSON are the PCI Subsystem Device IDs. First, I determine the ID of my laptop:

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

So my ID is `88f7`. Now into that JSON file:

```json
// Unrelated parts are removed
{
  "Name": "Cybug",
  "DisplayName": "OMEN 17",
  "ProductNum": [
    {
      "SSID": "88F7" // GN20E (E3/E5/E7) non DDS
    }
  ],
  "Feature": [ "SystemInfo", "NetworkBooster", "FourZone", "DraxLighting", "PerformanceControl", "GraphicsSwitcher", "Macros" ],
  "BackgroundFeature": [ "NetworkBooster", "OmenKey", "FourZone", "DraxLightingBg", "PerformanceControl", "MarlinsMacro", "DragonKBMcu" ]
}
```

There's `MarlinsMacro` in the feature list, so I guess my laptop is of type Marlins. Back to the logic for Marlins devices:

```csharp
private void OnEditorPageSaveClick(string obj)
{
  // Unrelated parts are removed
  switch (this.platformInfo.Platform)
  {
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      // Non-critical logic are removed
      setValue = this.SetBytesToEC(this._tmpSeletcItemSrc.InputKeysRecordDelay);
      ec = this.SetBytesToEC(this._tmpSeletcItemSrc.InputKeysCustomDelay);
      break;
  }
}
```

`SetBytesToEC` function is called, which is in charge of translating keystroke sequence to EC's binary representation:

```csharp
public byte[] SetBytesToEC(ObservableCollection<InputKeyInfo> Items)
{
  List<byte> byteList = new List<byte>();
  // Return [1] if the sequence is empty
  if (Items == null)
  {
    byteList.Insert(0, (byte) (byteList.Count + 1));
    return byteList.ToArray();
  }
  for (int index = 0; index < Items.Count; ++index)
  {
    // For a special function key (Home, End, Insert, Delete, arrows, Win, Right Ctrl and Right Alt), add 0xE0 in front
    // This means the keys are represented with PS/2 Scan Code Set 1 (but not fully)
    if (this.ExtensionKeyMap.ContainsKey(Items[index].VKey))
      byteList.Add((byte) 224);
    // Based on type of keystroke:
    switch (Items[index].Type)
    {
      case KeyInfoType.DelayTime:
        // Delay, wait a moment before pressing the next key
        // Format: [255, Time (ms)]
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
        // Key press, simply store the Scan Code
        // According to Scan Code Set 1, key release code = key press code | 0x80
        byteList.Add(this.GetECScanCode(Items[index]));
        break;
    }
  }
  // Add an 1-byte sequence length at front (including the length byte itself)
  byteList.Insert(0, (byte) (byteList.Count + 1));
  return byteList.ToArray();
}
```

With a [reference table for PS/2 Scan Code Set 1](https://wiki.osdev.org/PS/2_Keyboard#Scan_Code_Set_1), we can encode a few sequences:

1. Press and release A: `[3, 0x1e, 0x9e]`
2. Press A, wait 100ms, and release: `[5, 0x1e, 255, 100, 0x9e]`
3. Press A, wait 300ms, and release: `[7, 0x1e, 255, 255, 255, 45, 0x9e]`
   - Each wait is up to 255ms because of limitations of byte data type. The wait of 300ms needs to be done with two waits.

Back to the logic of `OnEditorPageSaveClick`:

```csharp
private void OnEditorPageSaveClick(string obj)
{
  // Unrelated parts are removed
  switch (this.platformInfo.Platform)
  {
    case DeviceEnums.DeviceType.Marlins10:
    case DeviceEnums.DeviceType.Marlins11:
      this.SetMacrosToSystemInfoService(this.platformInfo.Platform);
      break;
  }
}
```

`SetMacrosToSystemInfoService` writes the encoded key sequences to EC:

```csharp

private void SetMacrosToSystemInfoService(
  DeviceEnums.DeviceType _pType,
  EnumMacroKeyDragons dKey = EnumMacroKeyDragons.P1,
  MacroKeyItem iKey = null)
{
  // Unrelated parts and error checks are removed
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
          // For each macro key except Fn:
          if (macroKeyItem != null)
          {
            // Append the encoded sequence to bMacroKeyRawArray
            num = ((IEnumerable<byte>) source).Count<byte>();
            for (int index2 = 0; index2 < num; ++index2)
              this.platformInfo.bMacroKeyRawArray[index1 + index2] = source[index2];
          }
          else
          {
            // No sequence for this key, append [1] (the encoded value for empty sequence)
            num = 1;
            this.platformInfo.bMacroKeyRawArray[index1] = (byte) 1;
          }
          index1 += num;
        }
      }
      // Add an extra 1 for unknown reason
      this.platformInfo.bMacroKeyRawArray[index1] = (byte) 1;
      // WMI write. HPWMICommand = 0x20008, HPWMICMDTypeSet = 15, MacroKeyBufferSize = 4096
      this.ExcuteBIOSWmiCommandAsync(this.platformInfo.HPWMICommand, this.platformInfo.HPWMICMDTypeSet, this.platformInfo.MacroKeyBufferSize, this.platformInfo.bMacroKeyRawArray, 0);
      // WMI write to enable macro key function (write 0 to disable)
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

This logic combines the encoded key sequence of all function keys together, and sends them to EC with a WMI write.

The order of keys are stored in `HP.Omen.MacrosModule.Models.EnumMacroKeyMarlins`:

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

Now it's pretty clear what we need to do:

1. Encode the keystroke sequence for each macro key;
2. Combine all of them into an array of size 4096 bytes;
3. Call the WMI ACPI command to send the array to EC.

# Writing Linux Driver

I'm already using a modified Linux `hp_wmi` driver for keyboard backlight support, so I decided to make my modifications on top.

(Modified driver can be downloaded at <https://github.com/pelrun/hp-omen-linux-module>)

First I need a key sequence. Due to hardware limitations of HP, special function keys (like volume adjustments and media controls) are not supported in the key sequence. Therefore, I cannot send keystrokes for keys not present on a regular keyboard, like F13-F24, to avoid conflicts. Because my laptop doesn't have a numpad, I decided to map the macro keys to numpad keys instead:

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

> Currently my module uses a fixed keystroke sequence. I can add configuration interfaces in the future, allowing users to set their own key sequences.

Next I need two functions, one for enabling macro keys on module load, and one for disabling them:

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

Finally, call these functions in the module's load and unload functions.

# Download

I uploaded the modified module to <https://github.com/xddxdd/hp-omen-linux-module>. Those changes related to this post can be found at <https://github.com/xddxdd/hp-omen-linux-module/commit/macro_keys>.

Or, you can directly integrate the macro key function (and keyboard backlight function) to the kernel by applying this patch: <https://github.com/xddxdd/nur-packages/blob/master/pkgs/linux-xanmod-lantian/patches/0004-hp-omen-fourzone.patch>
