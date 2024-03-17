---
title: 'Intel and NVIDIA GPU Passthrough on a Optimus MUXless Laptop'
categories: 'Computers and Clients'
tags: [GPU, Virtual Machine, Intel, NVIDIA, MUXless]
date: 2020-06-25 23:59:41
image: /usr/uploads/202007/linus-torvalds-nvidia.png
---

Changelog
---------

2022-07-21: Add starting GVT-g on startup. Thanks to comment from Owsmyf (on Chinese version of this post).
2022-01-22: Revisions on NVIDIA driver updates and comments.

> [I successfully passed through an Optimus MUXed GPU on my new laptop.](/en/article/modify-computer/laptop-muxed-nvidia-passthrough.lantian)

Abstract (Spoiler Alert!)
-------------------------

I successfully passed through Intel's GVT-g virtual GPU, as well as the dedicated NVIDIA GPU itself, into a virtual machine on Lenovo R720 gaming laptop.

However, due to the limitation of the architecture itself, this GPU passthrough scheme is severely limited. For example, the dGPU is unusable in many games, and the performance is still relatively worse despite the complicated setup it needs.

Therefore, you may attempt the passthrough purely for the fun of tinkering, but I don't recommend using it for anything important.

Why?
----

I do my daily routines, including web browsing and coding, on Arch Linux, and I rarely boot into the dual-booted Windows that exists alongside Linux. But sometimes I had to boot to Windows when, for example, I wanted to play games with my friends.

> Although there are compatibility layers, such as Wine and Proton, to run Windows programs, as well as DXVK that translates DirectX commands to Vulkan for some 3D performance boost, there are still lots of games that won't work under Wine, such as those games with DRM or anti-cheat protection, or some games that call ~~strange~~ private Windows APIs.

But dual-booting means I have to maintain two operating systems, including their system updates, data sharing, and synchronization. For instance, I had to run a Hyper-V virtual machine running Linux and passthrough the disk with the Linux ZFS partition and share the files over Samba in order to access them from Windows.

> Instant 1GB less memory, and it takes 2-3 minutes to connect to the share after logging on.

On the other hand, traditional virtual machine hypervisors (QEMU, VirtualBox, VMware, etc.) have **horrible** 3D performance.

- QEMU: What is 3D acceleration anyway?
  - For QXL, which only supports 2D acceleration
  - There is an attempt in 3D acceleration called Virtio-GPU, but it's incomplete and doesn't support Windows (yet)
- VirtualBox: Better than nothing
  - It supports a fraction of DirectX APIs but is incomplete
  - And on my system VirtualBox sometimes outputs corrupted images with 2D acceleration
  - And on my system VirtualBox sometimes freezes (compatibility problem with ZFS?)
- VMware: Best among the three
  - Still, not enough
  - And it's closed source and requires a fee

Another common solution is the PCIe passthrough functionality of the VM hypervisor, which gives full control of the high-performance GPU to the VM, where it directly runs the official drivers and talks to the GPU.

- You'll need a CPU that supports either VT-d (Intel) or AMD-Vi (AMD), but you'd be fine with CPUs made in recent years
  - Unless you are ~~filming Scrapyard Wars~~ picking up old PC components
- And you'll need at least 2 GPUs (including integrated ones)
  - Since the high-performance GPU is taken by the VM, the host system cannot display anything without another GPU
- And you'll need a hypervisor that supports PCIe passthrough
  - VirtualBox and VMware Workstation can't do this (as far as I know)
  - VMware ESXi (an OS dedicated to virtualization) can do this
    - Free for personal users with a simple web UI
    - But closed-source, picky on network cards, and is a resource hog (on RAM, for example)
  - Proxmox VE can do this as well
    - A Debian-based OS for virtualization
    - The system itself is open source and free, but it charges a fee on technical support
    - Based on QEMU
  - Or simply install QEMU on your Linux distribution
    - QEMU: free and open-source, ~~the chosen one (by multiple Linux VM solutions)~~
    - You need to type a long command to start the VM, but easier management is possible with Libvirt and Virt-manager

But for NVIDIA GPUs and laptops, things are more complicated:

- NVIDIA drivers refuse to load in VMs
  - NVIDIA doesn't want you to go with a consumer card that costs a mere few hundred dollars. They want you to spend thousands on a GRID GPU dedicated to virtualization.
    - ![Linus Torvalds Fxxk Nvidia](../../../../usr/uploads/202007/linus-torvalds-nvidia.png)
  - Therefore, you need a lot of hacks to hide the fact that you're running a VM and make NVIDIA drivers load.
    - Will be discussed in detail later.
- Laptop NVIDIA GPUs are different from desktop GPUs
  - No, I don't just mean performance. The overall architecture is also different.
  - On a desktop, the GPU is connected in the following scheme:

    ```graphviz
    digraph {
      rankdir=LR
      node[shape=box]

      CPU -> NVIDIA
      NVIDIA -> HDMI
      NVIDIA -> Monitor
    }
    ```

    The GPU only connects to the CPU and monitors and doesn't care about other components.
  - But on laptops, things are different. They even differ between laptops.
    - If you spent a few hundred dollars on a low-to-mid-range gaming laptop, the connections may look like:

      ```graphviz
      digraph {
        rankdir=LR
        node[shape=box]

        CPU -> NVIDIA
        CPU -> "Intel GPU"
        {rank=same; NVIDIA -> "Intel GPU"; }
        "Intel GPU" -> HDMI
        "Intel GPU" -> Monitor
      }
      ```

      The difference is, instead of directly connecting to the monitor, the dGPU transfers the rendered image to iGPU, which in turn sends them to the monitor.

      It is called the MUXless scheme of NVIDIA Optimus.

      - Pros:
        - Saves battery juice (dGPU turns off when not needed)
        - Saves cost (compared to other schemes)
      - Cons:
        - High latency when rendering game frames (since an extra transfer is required)
        - Severe technical difficulty when passing through the GPU:
          - Windows prefers to run games on the GPU connected to the current monitor.
            - Since the dGPU isn't connected to any monitor, games won't prefer to use the dGPU. Instead, they will use the low-performance virtualized GPU (ex. QXL) or the Intel GVT-g virtual GPU (with Intel-level performance).
          - In the combination of Intel + NVIDIA Optimus, NVIDIA drivers are in charge of moving the workload to dGPU.
            - But NVIDIA drivers won't accept Intel GVT-g into the combination, and Optimus won't be enabled.
          - This means games will run on the integrated graphics unless the game engine proactively detects and uses the dGPU.
    - If you spent a bit more than a thousand on a mid-to-higher-range laptop, you may get:

      ```graphviz
      digraph {
        rankdir=LR
        node[shape=box]

        CPU -> NVIDIA
        CPU -> "Intel GPU"
        {rank=same; NVIDIA -> "Intel GPU" [dir=none]; }
        "Intel GPU" -> HDMI
        "Intel GPU" -> Monitor
        NVIDIA -> HDMI
        NVIDIA -> Monitor
      }
      ```

      Compared to the last scheme, there is a switch on the motherboard circuit, and the HDMI port and the monitor can be allocated to different GPUs on-demand.

      This is another scheme of NVIDIA Optimus, called MUXed scheme.

      - Pros:
        - Saves power (dGPU turns off when not needed)
        - Low frame latency (when the monitor is switched to run on dGPU)
        - Easier passthroughs.
          - For example, you may switch the HDMI port to the dGPU, and spend a few dollars on a fake HDMI dongle from Aliexpress, to let games in VM run on the dGPU; then you can see the outputs with remote desktop software.
      - Cons:
        - Expensive (with all those circuits)
    - If you spent thousands on a top-end laptop, you may get this:

      ```graphviz
      digraph {
        rankdir=LR
        node[shape=box]

        CPU -> NVIDIA
        NVIDIA -> HDMI
        NVIDIA -> Monitor
      }
      ```

      Wonder where the iGPU had gone? How come you need it on a multi-thousand-dollar laptop for gaming?

      Under this scheme, the manufacturer cuts power to the iGPU component, so all the power budget can be allocated to CPU and dGPU for better performance. This is basically the same as a desktop computer.

      - Pros:
        - High performance with low latency (direct connection from dGPU to monitor, and no unnecessary power budget on iGPU)
        - Saves cost (no complicated switching circuits)
      - Cons:
        - Costs more power (with the dGPU always on)
          - But you likely don't need it anyway with a multi-thousand-dollar laptop.
        - Catastrophic for GPU passthrough
          - Since you only have one GPU, your host OS won't get to use any GPU when it is passed through.
          - If you insist, you need to code your own switching scripts and find your way to debug without any display output.
          - Try this if you are brave enough (YOLO!)

    - How to determine the actual scheme:

      Run `lspci` on the Linux OS, and look for entries about Intel HD Graphics or NVIDIA.

      - If the dGPU starts with `3D Controller`, you have the first Optimus scheme (iGPU connected to monitor).
      - If the dGPU starts with `VGA Controller`, and there is an `HD Graphics` GPU, you have the second Optimus scheme (switching between two GPUs).
      - If the dGPU starts with `VGA Controller`, and there is no `HD Graphics` GPU, you have the last scheme without iGPU.

My Environment
--------------

When writing this post, I'm using this laptop and OS;

- Lenovo Legion R720-15IKBN (i7-7700HQ, GTX1050)
  - The first Optimus MUXless scheme, with the iGPU connected to the monitor.
- Host OS is Arch Linux, up to date when writing this article
- QEMU hypervisor with Libvirt and Virt-Manager for graphical management
- Windows 10 LTSC 2019 in VM

And here are my goals:

- Create an Intel GVT-g virtual GPU and pass it to VM
- Disable NVIDIA GPU on the host, and hand it over completely to VM

Before starting, you need to prepare:

- A QEMU (Libvirt) virtual machine with Windows 10 installed
  - With UEFI (OVMF) firmware. Not guaranteed to work with BIOS (SeaBIOS) firmware.
  - With QXL virtual GPU.
- A Windows that boots on the physical computer
  - Dual boot, Windows To Go, etc.
  - Windows PE may work as long as you can use the Device Manager.
- Host OS displaying contents with the iGPU. dGPU either disabled or driver unloaded.
  - Or you cannot passthrough the GVT-g GPU (Virt-Manager will crash).
  - And you cannot passthrough the dGPU (taken by Host OS).

Important tips:

- Multiple reboots of the host OS is required, and your host OS may crash! Back up your data.
- You don't need to download any drivers manually. Windows will do it for you automatically.
  - If it doesn't, don't go any further than downloading the driver EXE and double-clicking
  - **Never** specify the exact driver to be used in Device Manager
  - Debugging will be harder if you do this

Stop Host OS from Tampering with NVIDIA GPU
-------------------------------------------

The NVIDIA driver on the Host OS will hold control of the dGPU, and stop VM from using it. Therefore you need to replace the driver with `vfio-pci`, built solely for PCIe passthrough.

Even if you don't plan to passthrough the dGPU, you need to switch the graphics display of Host OS to the iGPU, or later Virt-Manager will crash. You may disable NVIDIA drivers with the steps below or use software such as `optimus-manager` for management.

Here are the steps for disabling the NVIDIA driver and passing control to the PCIe passthrough module:

1. Run `lspci -nn | grep NVIDIA` and obtain an output similar to:

   ```bash
   01:00.0 3D controller [0302]: NVIDIA Corporation GP107M [GeForce GTX 1050 Mobile] [10de:1c8d] (rev a1)
   ```

   Here `[10de:1c8d]` is the vendor ID and device ID of the dGPU, where `10de` means this device is manufactured by NVIDIA, and `1c8d` means this is a GTX 1050.

2. Create `/etc/modprobe.d/lantian.conf` with the following content:

   ```bash
   options vfio-pci ids=10de:1c8d
   ```

   This configures `vfio-pci`, the kernel module responsible for PCIe passthrough, to manage the dGPU. `ids` is the vendor ID and device ID of the device to be passed through.
3. Modify `/etc/mkinitcpio.conf`, add the following contents to `MODULES`:

   ```bash
   MODULES=(vfio_pci vfio vfio_iommu_type1 vfio_virqfd)
   ```

   And remove anything related to NVIDIA drivers (such as `nvidia`)

   Now PCIe passthrough module will take control of the dGPU in the early booting process, preventing NVIDIA drivers from taking control.
4. Run `mkinitcpio -P` to update the initramfs.
5. Reboot.
   - Or you may wait until the first step of iGPU passthrough.

Setting up Intel GVT-g Virtual iGPU
-----------------------------------

Remember the multi-thousand-dollar NVIDIA GRID GPUs? If you get hold of one of these, the GPU driver itself will support creating multiple virtual GPUs to be used on different VMs, just like the CPU virtualization technology.

But different from NVIDIA, 5th gen and later Intel CPUs support this out of the box, and you don't need to pay the ransom for an expensive GPU. Although iGPU is weak, at least it allows for smooth web browsing in VM compared to QXL, etc.

Passing through this virtual Intel GPU is also relatively easy and may serve as a practice.

1. Enable kernel parameters for GVT-g, and load kernel modules
   - Modify your kernel parameters (Usually located at `/boot/loader/entries/arch.conf` if you use Systemd-boot), and add:

     ```bash
     i915.enable_gvt=1 kvm.ignore_msrs=1 intel_iommu=on
     ```

   - Modify `/etc/modules-load.d/lantian.conf` and add the next 3 lines:

     ```bash
     kvmgt
     vfio-iommu-type1
     vfio-mdev
     ```

     These 3 lines correspond to the required kernel modules.
   - Reboot.
2. Create virtual GPU
   - Run `lspci | grep "HD Graphics"` to look for the PCIe address of the iGPU. I get this output for example:

     ```bash
     00:02.0 VGA compatible controller: Intel Corporation HD Graphics 630 (rev 04)
     ```

     In this case, iGPU is located at `00:02.0` on the PCIe bus.
   - Run the following command to create the virtual GPU:

     ```bash
     # Must run as root
     sudo su
     echo "af5972fb-5530-41a7-0000-fd836204445b" > "/sys/devices/pci0000:00/0000:00:02.0/mdev_supported_types/i915-GVTg_V5_4/create"
     ```

     Pay attention to the iGPU PCIe bus location. In addition you can optionally replace the UUID.

     In addition, each time you restart the system, you need to run this command manually before starting the VM. You can also add this command to `/etc/rc.local` to create the virtual GPU on startup. It does not have performance impacts when the VM is off.

3. Modify the VM configuration to expose the virtual GPU
   - Run `virsh edit Win10`, where `Win10` is the name of your VM. Insert the following contents above `</devices>`:

     ```xml
     <hostdev mode='subsystem' type='mdev' managed='no' model='vfio-pci' display='off'>
       <source>
         <address uuid='af5972fb-5530-41a7-0000-fd836204445b'/>
       </source>
     </hostdev>
     ```

     Replace the UUID to match the last step. Also, `display` here is set to `off`, which is intentional (normal).
   - Do not remove the QXL GPU yet.
   - Start the VM and open Device Manager. You should see a `Microsoft Basic Display Adapter`.
   - Connect the VM to the Internet and wait. Windows will automatically install the iGPU drivers, and you will see the Intel Control Panel in Start Menu.
     - If the driver isn't installed after a long time, you may download the iGPU driver (just the regular ones) from the Intel website, copy it to the VM, and try to install it.
     - If it still doesn't work, it means you've done something wrong, or there is a hypervisor bug.
   - After the driver is installed, the VM can use the Intel GPU now. But since the current monitor is displaying images from QXL GPU, and Intel GPU is not the primary GPU, Windows hasn't set any program to run on Intel GPU yet.
     - We will disable the QXL GPU next.
4. Shut down the VM and edit the configuration again:
   - In the `<hostdev>` added above, change `display='off'` to `display='on'`.
   - Remove everything in `<graphics>...</graphics>` and `<video>...</video>`, and replace with:

     ```xml
     <graphics type='spice'>
       <listen type='none'/>
       <image compression='off'/>
       <gl enable='yes'/>
     </graphics>
     <video>
       <model type='none'/>
     </video>
     ```

   - Add these lines before `</domain>`:

     ```xml
     <qemu:commandline>
         <qemu:arg value='-set'/>
         <qemu:arg value='device.hostdev0.ramfb=on'/>
         <qemu:arg value='-set'/>
         <qemu:arg value='device.hostdev0.driver=vfio-pci-nohotplug'/>
         <qemu:arg value='-set'/>
         <qemu:arg value='device.hostdev0.x-igd-opregion=on'/>
         <qemu:arg value='-set'/>
         <qemu:arg value='device.hostdev0.xres=1920'/>
         <qemu:arg value='-set'/>
         <qemu:arg value='device.hostdev0.yres=1080'/>
         <qemu:arg value='-set'/>
         <qemu:arg value='device.hostdev0.romfile=/vbios_gvt_uefi.rom'/>
         <qemu:env name='MESA_LOADER_DRIVER_OVERRIDE' value='i965'/>
     </qemu:commandline>
     ```

     The `vbios_gvt_uefi.rom` can be downloaded from [http://120.25.59.132:3000/vbios_gvt_uefi.rom](http://120.25.59.132:3000/vbios_gvt_uefi.rom), or [from this site](../../../../usr/uploads/202007/vbios_gvt_uefi.rom), and should be put to root folder. If you moved it elsewhere, you need to modify the `romfile` parameter correspondingly.
   - Change the first line of the configuration file, `<domain type='kvm'>`, to `<domain type='kvm' xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'>`.
5. Reboot the VM, and you should see normal graphics output. Now the VM is using the GVT-g virtual GPU.

Setting up NVIDIA dGPU Passthrough
----------------------------------

In previous steps, the official NVIDIA drivers on the host OS are disabled, and the dGPU is managed by `vfio-pci` for PCIe passthrough.

Passing through the dGPU itself is simple, but NVIDIA added a lot of driver limitations for money:

- GPU must be on the correct PCIe bus location.
- System should not expose VM characteristics.
- System must have a battery.
- GPU BIOS must be available in the ACPI table.
- etc...

So we have to hack through all these pitfalls.

> Update on 2022-01-22:

> [Since version 465, NVIDIA lifted most of the restrictions](https://nvidia.custhelp.com/app/answers/detail/a_id/5173), so theoretically, you pass a GPU into the VM, and everything should just work.
>
> But that's just the theory.
>
> I still recommend everyone to follow all the steps and hide the VM characteristics, because:
>
> 1. Not all restructions are lifted for laptops.
>
>    - At least in my tests, an incorrect PCIe bus address for the GPU and the absence of a battery still causes passthrough to fail, and the driver will error out with the infamous code 43.
>
> 2. Even if NVIDIA driver isn't detecting VMs, the programs you run might. Hiding VM characteristics increases the chance to run them successfully.
>
>    - Examples include online games with anti-cheat systems, or commercial software that require online activation.
>
> 3. Because of architectural limitations of Optimus MUXless, you still need to modify the UEFI firmware so the VM can see the GPU vBIOS.

1. First reboot the physical machine to Windows and do the following things:
   - (Optionally) Download GPU-Z and export the GPU vBIOS.
   - Find your dGPU in Device Manager and look for its Hardware ID, such as `PCI\VEN_10DE&DEV_1C8D&SUBSYS_39D117AA&REV_A1`, and record this somewhere.
2. Then reboot back to Linux. If you haven't exported the GPU vBIOS, you may use `VBiosFinder` software to extract it from the BIOS update of your computer.

   ```bash
   # Download VBiosFinder
   git clone https://github.com/coderobe/VBiosFinder.git
   # Download BIOS update from your computer's manufacturer site, usually an EXE file.
   # My BIOS update is named as BIOS-4KCN45WW.exe, replace accordingly
   mv BIOS-4KCN45WW.exe VBiosFinder/
   # Install dependencies
   pikaur -S ruby ruby-bundler innoextract p7zip upx
   # Install rom-parser
   git clone https://github.com/awilliam/rom-parser.git
   cd rom-parser
   make
   mv rom-parser ../VBiosFinder/3rdparty
   cd ..
   # Install UEFIExtract
   git clone https://github.com/LongSoft/UEFITool.git -b new_engine
   cd UEFITool
   ./unixbuild.sh
   mv UEFIExtract/UEFIExtract ../VBiosFinder/3rdparty
   cd ..
   # Extract vBIOS
   cd VBiosFinder
   bundle update --bundler
   bundle install --path=vendor/bundle
   ./vbiosfinder extract BIOS-4KCN45WW.exe
   ls output
   # There will be a few files in the output folder:
   # - vbios_10de_1c8c.rom
   # - vbios_10de_1c8d.rom
   # - vbios_10de_1c8e.rom
   # - ...
   # Find the one corresponding to the vendor ID and device ID, which is your vBIOS.
   ```

3. Then add the vBIOS to VM's UEFI firmware (or OVMF).

   On an Optimus laptop, NVIDIA drivers will search for the vBIOS from the system's ACPI table and load it to the GPU. The ACPI table is managed by the UEFI firmware, so it needs to be modified to add the vBIOS.

   ```bash
   # Based on reports on GitHub, UEFI firmware shouldn't be moved once built
   # So find somewhere to permanently store the files
   cd /opt
   git clone https://github.com/tianocore/edk2.git
   # Install dependencies
   pikaur -S git python2 iasl nasm subversion perl-libwww vim dos2unix gcc5
   # Assuming your vBIOS is at /vbios.rom
   cd edk2/OvmfPkg/AcpiPlatformDxe
   xxd -i /vbios.rom vrom.h
   # Modify vrom.h, and rename the unsigned char array to VROM_BIN
   # and modify the length variable at the end to VROM_BIN_LEN, and record the number, 167936 in my case
   wget https://github.com/jscinoz/optimus-vfio-docs/files/1842788/ssdt.txt -O ssdt.asl
   # Modify ssdt.asl, change line 37 to match VROM_BIN_LEN
   # Run the following commands. Errors may pop up, but they're fine as long as Ssdt.aml is generated
   iasl -f ssdt.asl
   xxd -c1 Ssdt.aml | tail -n +37 | cut -f2 -d' ' | paste -sd' ' | sed 's/ //g' | xxd -r -p > vrom_table.aml
   xxd -i vrom_table.aml | sed 's/vrom_table_aml/vrom_table/g' > vrom_table.h
   # Switch back to edk2's folder and apply a patch
   cd ../..
   wget https://gist.github.com/jscinoz/c43a81882929ceaf7ec90afd820cd470/raw/139799c87fc806a966250e5686e15a28676fc84e/nvidia-hack.diff
   patch -p1 < nvidia-hack.diff
   # Compile OVMF
   make -C BaseTools
   . ./edksetup.sh BaseTools
   # Modify these variables in Conf/target.txt:
   # - ACTIVE_PLATFORM       = OvmfPkg/OvmfPkgX64.dsc
   # - TARGET_ARCH           = X64
   # - TOOL_CHAIN_TAG        = GCC5
   build
   # Wait until compilation is complete, and verify file's existence in Build/OvmfX64/DEBUG_GCC5/FV:
   # - OVMF_CODE.fd
   # - OVMF_VARS.fd
   # Replace UEFI variables of your VM, remember to change VM names
   cp Build/OvmfX64/DEBUG_GCC5/FV/OVMF_VARS.fd /var/lib/libvirt/qemu/nvram/Win10_VARS.fd
   ```

4. Modify your VM configuration, `virsh edit Win10`, and do the following changes:

   ```xml
   <!-- Modify the os section, remember to match the path to OVMF_CODE.fd -->
   <os>
     <type arch='x86_64' machine='pc-q35-4.2'>hvm</type>
     <loader readonly='yes' type='pflash'>/opt/edk2/Build/OvmfX64/DEBUG_GCC5/FV/OVMF_CODE.fd</loader>
     <nvram>/var/lib/libvirt/qemu/nvram/Win10_VARS.fd</nvram>
   </os>
   <!-- Modify the features section, so QEMU will hide the fact that this is a VM -->
   <features>
     <acpi/>
     <apic/>
     <hyperv>
       <relaxed state='on'/>
       <vapic state='on'/>
       <spinlocks state='on' retries='8191'/>
       <vendor_id state='on' value='GenuineIntel'/>
     </hyperv>
     <kvm>
       <hidden state='on'/>
     </kvm>
     <vmport state='off'/>
   </features>
   <!-- Add the PCIe passthrough device, must be below the hostdev for iGPU -->
   <hostdev mode='subsystem' type='pci' managed='yes'>
     <source>
       <address domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
     </source>
     <rom bar='off'/>
     <!-- The PCIe bus address here MUST BE EXACTLY 01:00.0 -->
     <!-- If there is a PCIe bus address conflict when saving config changes, -->
     <!-- Remove <address> of all other devices -->
     <!-- And Libvirt will reallocate PCIe bus addresses -->
     <address type='pci' domain='0x0000' bus='0x01' slot='0x00' function='0x0' multifunction='on'/>
   </hostdev>
   <!-- Add these parameters before </qemu:commandline> -->
   <qemu:arg value='-set'/>
   <qemu:arg value='device.hostdev1.x-pci-vendor-id=0x10de'/>
   <qemu:arg value='-set'/>
   <qemu:arg value='device.hostdev1.x-pci-device-id=0x1c8d'/>
   <qemu:arg value='-set'/>
   <qemu:arg value='device.hostdev1.x-pci-sub-vendor-id=0x17aa'/>
   <qemu:arg value='-set'/>
   <qemu:arg value='device.hostdev1.x-pci-sub-device-id=0x39d1'/>
   <qemu:arg value='-acpitable'/>
   <qemu:arg value='file=/ssdt1.dat'/>
   ```

   The IDs here should match the hardware ID from Device Manager, `PCI\VEN_10DE&DEV_1C8D&SUBSYS_39D117AA&REV_A1`. Replace accordingly.

   The ssdt1.dat corresponds to the Base64 below. It can be converted to a binary file with [Base64 decoding website](https://base64.guru/converter/decode/file) or [downloaded from this site](../../../../usr/uploads/202007/ssdt1.dat). Put it in the root folder. If you moved its location, you should modify the file parameter accordingly. It's also an ACPI table, and it emulates a fully-charged battery, but instead of being merged to OVMF, it simply works as a QEMU argument addition.

   ```bash
   U1NEVKEAAAAB9EJPQ0hTAEJYUENTU0RUAQAAAElOVEwYEBkgoA8AFVwuX1NCX1BDSTAGABBMBi5f
   U0JfUENJMFuCTwVCQVQwCF9ISUQMQdAMCghfVUlEABQJX1NUQQCkCh8UK19CSUYApBIjDQELcBcL
   cBcBC9A5C1gCCywBCjwKPA0ADQANTElPTgANABQSX0JTVACkEgoEAAALcBcL0Dk=
   ```

   **Do not miss any steps, or you will be welcomed by Code 43 (Driver load failure).**

5. Start the VM and wait a while. Windows will automatically install NVIDIA drivers.
   - If Device Manager shows the dGPU with an exclamation sign and code 43 or driver load failure, you need to check if you've missed any steps and if you've configured everything correctly.
     - Switch Device Manager to `Device by Connection`, and verify that dGPU is at Bus 1, Slot 0, Function 0. The parent PCIe port to the dGPU should be at Bus 0, Slot 1, Function 0.
     - Yes, that's how harsh NVIDIA drivers' checks are.
     - If they don't match, you need to reallocate PCIe addresses with the method above.
   - If the OS didn't automatically install the NVIDIA driver, and your manually downloaded driver installer also shows that the system is incompatible, or the GPU cannot be found, you need to check if the hardware ID matches what's found on the host.
   - Even if dGPU is working correctly, you still won't be able to open NVIDIA Control Panel (which tells you monitors aren't found). This is normal.

What's Next?
------------

Even if you've done every step above and got both iGPU and dGPU working in VM, this is still not very helpful to gaming:

- Since Windows thinks the primary monitor is connected to GVT-g virtual iGPU, the OS will let the weak iGPU handle all 3D applications.
  - If you didn't passthrough the GVT-g iGPU, then QXL will be in charge.
  - Exceptions: it is reported that some Unreal Engine games will actively detect and use the dGPU.
- Since a MUXless Optimus dGPU isn't connected to monitors, there is no way to select dGPU as the primary GPU.
- Since GVT-g iGPU and NVIDIA dGPU cannot form Optimus configuration, NVIDIA drivers won't move game workloads to dGPU.
- If you only leave the dGPU in VM, although Windows will put render works on the dGPU (there were no other choices), the resolution will be limited to 640x480, and you will have to rely on remote desktop software.

Therefore, Optimus GPU passthrough is currently more for tinkerers than actual gamers. If you are experienced in driver development, you may research in the following directions;

1. Let GVT-g iGPU and NVIDIA dGPU form Optimus configuration normally
2. Let QXL and NVIDIA dGPU form Optimus configuration
3. Modify NVIDIA drivers and add a virtual monitor

References
----------

Huge thanks to previous explorers on the topic of GPU passthrough. Without their efforts, this post won't have existed in the first place.

Here are the sources I referenced when I did my configuration:

- Intel GVT-g virtual GPU
  - Arch Linux Wiki [https://wiki.archlinux.org/index.php/Intel_GVT-g](https://wiki.archlinux.org/index.php/Intel_GVT-g)
  - Gentoo Wiki / Shunlir's VM configuration [https://wiki.gentoo.org/wiki/User:Shunlir/Intel_GVT-g#Install_Intel_driver_in_Guest](https://wiki.gentoo.org/wiki/User:Shunlir/Intel_GVT-g#Install_Intel_driver_in_Guest)
- NVIDIA dGPU passthrough
  - GitHub Misairu-G's NVIDIA Optimus MUXed passthrough guide [https://gist.github.com/Misairu-G/616f7b2756c488148b7309addc940b28](https://gist.github.com/Misairu-G/616f7b2756c488148b7309addc940b28)
  - GitHub jscinoz's Optimus MUXless passthrough exploration [https://github.com/jscinoz/optimus-vfio-docs](https://github.com/jscinoz/optimus-vfio-docs)
  - GitHub arne-claeys' OVMF patches and related discussion [https://github.com/jscinoz/optimus-vfio-docs/issues/2](https://github.com/jscinoz/optimus-vfio-docs/issues/2)
  - Reddit r/VFIO's guide compilation [https://www.reddit.com/r/VFIO/comments/8gv60l/current_state_of_optimus_muxless_laptop_gpu/](https://www.reddit.com/r/VFIO/comments/8gv60l/current_state_of_optimus_muxless_laptop_gpu/)
  - Reddit r/VFIO's emulated battery patch [https://www.reddit.com/r/VFIO/comments/ebo2uk/nvidia_geforce_rtx_2060_mobile_success_qemu_ovmf/](https://www.reddit.com/r/VFIO/comments/ebo2uk/nvidia_geforce_rtx_2060_mobile_success_qemu_ovmf/)

Appendix: Final Libvirt XML File
--------------------------------

```xml
<domain type='kvm' xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'>
  <name>Win10</name>
  <uuid>6f0e09e1-a7d4-4d33-b4f8-0dc69eaaed9b</uuid>
  <metadata>
    <libosinfo:libosinfo xmlns:libosinfo="http://libosinfo.org/xmlns/libvirt/domain/1.0">
      <libosinfo:os id="http://microsoft.com/win/10"/>
    </libosinfo:libosinfo>
  </metadata>
  <memory unit='KiB'>4194304</memory>
  <currentMemory unit='KiB'>4194304</currentMemory>
  <vcpu placement='static'>8</vcpu>
  <os>
    <type arch='x86_64' machine='pc-q35-4.2'>hvm</type>
    <loader readonly='yes' type='pflash'>/opt/edk2/Build/OvmfX64/DEBUG_GCC5/FV/OVMF_CODE.fd</loader>
    <nvram>/var/lib/libvirt/qemu/nvram/Win10_VARS.fd</nvram>
  </os>
  <features>
    <acpi/>
    <apic/>
    <hyperv>
      <relaxed state='on'/>
      <vapic state='on'/>
      <spinlocks state='on' retries='8191'/>
      <vendor_id state='on' value='GenuineIntel'/>
    </hyperv>
    <kvm>
      <hidden state='on'/>
    </kvm>
    <vmport state='off'/>
  </features>
  <cpu mode='host-model' check='partial'>
    <topology sockets='1' dies='1' cores='4' threads='2'/>
  </cpu>
  <clock offset='localtime'>
    <timer name='rtc' tickpolicy='catchup'/>
    <timer name='pit' tickpolicy='delay'/>
    <timer name='hpet' present='no'/>
    <timer name='hypervclock' present='yes'/>
  </clock>
  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>destroy</on_crash>
  <pm>
    <suspend-to-mem enabled='no'/>
    <suspend-to-disk enabled='no'/>
  </pm>
  <devices>
    <emulator>/usr/bin/qemu-system-x86_64</emulator>
    <disk type='file' device='disk'>
      <driver name='qemu' type='raw'/>
      <source file='/var/lib/libvirt/images/Win10.img'/>
      <target dev='vda' bus='virtio'/>
      <boot order='1'/>
      <address type='pci' domain='0x0000' bus='0x07' slot='0x00' function='0x0'/>
    </disk>
    <disk type='file' device='cdrom'>
      <driver name='qemu' type='raw'/>
      <source file='/mnt/files/LegacyOS/Common/virtio-win-0.1.141.iso'/>
      <target dev='sda' bus='sata'/>
      <readonly/>
      <boot order='2'/>
      <address type='drive' controller='0' bus='0' target='0' unit='0'/>
    </disk>
    <controller type='usb' index='0' model='qemu-xhci' ports='15'>
      <address type='pci' domain='0x0000' bus='0x04' slot='0x00' function='0x0'/>
    </controller>
    <controller type='sata' index='0'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x1f' function='0x2'/>
    </controller>
    <controller type='pci' index='0' model='pcie-root'/>
    <controller type='pci' index='1' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='1' port='0x10'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x0' multifunction='on'/>
    </controller>
    <controller type='pci' index='2' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='2' port='0x11'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x1'/>
    </controller>
    <controller type='pci' index='3' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='3' port='0x12'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x2'/>
    </controller>
    <controller type='pci' index='4' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='4' port='0x13'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x3'/>
    </controller>
    <controller type='pci' index='5' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='5' port='0x14'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x4'/>
    </controller>
    <controller type='pci' index='6' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='6' port='0x15'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x5'/>
    </controller>
    <controller type='pci' index='7' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='7' port='0x8'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x6'/>
    </controller>
    <controller type='pci' index='8' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='8' port='0x9'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x7'/>
    </controller>
    <controller type='pci' index='9' model='pcie-to-pci-bridge'>
      <model name='pcie-pci-bridge'/>
      <address type='pci' domain='0x0000' bus='0x02' slot='0x00' function='0x0'/>
    </controller>
    <controller type='pci' index='10' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='10' port='0xa'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0' multifunction='on'/>
    </controller>
    <controller type='pci' index='11' model='pcie-root-port'>
      <model name='pcie-root-port'/>
      <target chassis='11' port='0xb'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x1'/>
    </controller>
    <controller type='virtio-serial' index='0'>
      <address type='pci' domain='0x0000' bus='0x05' slot='0x00' function='0x0'/>
    </controller>
    <controller type='scsi' index='0' model='virtio-scsi'>
      <address type='pci' domain='0x0000' bus='0x06' slot='0x00' function='0x0'/>
    </controller>
    <interface type='bridge'>
      <mac address='52:54:00:b0:65:5a'/>
      <source bridge='br0'/>
      <model type='virtio'/>
      <address type='pci' domain='0x0000' bus='0x03' slot='0x00' function='0x0'/>
    </interface>
    <serial type='pty'>
      <target type='isa-serial' port='0'>
        <model name='isa-serial'/>
      </target>
    </serial>
    <console type='pty'>
      <target type='serial' port='0'/>
    </console>
    <channel type='spicevmc'>
      <target type='virtio' name='com.redhat.spice.0'/>
      <address type='virtio-serial' controller='0' bus='0' port='1'/>
    </channel>
    <input type='tablet' bus='usb'>
      <address type='usb' bus='0' port='1'/>
    </input>
    <input type='mouse' bus='ps2'/>
    <input type='keyboard' bus='ps2'/>
    <graphics type='spice'>
      <listen type='none'/>
      <image compression='off'/>
      <gl enable='yes'/>
    </graphics>
    <sound model='ich9'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x1b' function='0x0'/>
    </sound>
    <video>
      <model type='none'/>
    </video>
    <hostdev mode='subsystem' type='mdev' managed='no' model='vfio-pci' display='on'>
      <source>
        <address uuid='af5972fb-5530-41a7-0000-fd836204445b'/>
      </source>
      <address type='pci' domain='0x0000' bus='0x0a' slot='0x00' function='0x0'/>
    </hostdev>
    <hostdev mode='subsystem' type='pci' managed='yes'>
      <source>
        <address domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
      </source>
      <rom bar='off'/>
      <address type='pci' domain='0x0000' bus='0x01' slot='0x00' function='0x0' multifunction='on'/>
    </hostdev>
    <redirdev bus='usb' type='spicevmc'>
      <address type='usb' bus='0' port='2'/>
    </redirdev>
    <redirdev bus='usb' type='spicevmc'>
      <address type='usb' bus='0' port='3'/>
    </redirdev>
    <memballoon model='virtio'>
      <address type='pci' domain='0x0000' bus='0x08' slot='0x00' function='0x0'/>
    </memballoon>
  </devices>
  <qemu:commandline>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev0.ramfb=on'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev0.driver=vfio-pci-nohotplug'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev0.x-igd-opregion=on'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev0.xres=1920'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev0.yres=1080'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev0.romfile=/vbios_gvt_uefi.rom'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev1.x-pci-vendor-id=0x10de'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev1.x-pci-device-id=0x1c8d'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev1.x-pci-sub-vendor-id=0x17aa'/>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.hostdev1.x-pci-sub-device-id=0x39d1'/>
    <qemu:arg value='-acpitable'/>
    <qemu:arg value='file=/ssdt1.dat'/>
    <qemu:env name='MESA_LOADER_DRIVER_OVERRIDE' value='i965'/>
  </qemu:commandline>
</domain>
```
