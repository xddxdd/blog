---
title: 'Cyclone IV FPGA Development Log'
categories: 'Computers and Clients'
tags: [FPGA, Development Log]
date: 2019-07-08 13:10:00
---

Last semester, the school offered a digital systems course, which involves
development on FPGAs. At the end of the course, we need to gather in groups and
achieve some complicated functionality with the flexible architecture of FPGA,
such as creating a game or running a convoluted neural network. We are free to
add extra functionalities as we wish.

Our group has done a game similar to Raiden, or controlling a fighter jet and
attacking enemies with bullets. In addition to course requirements, we
implemented these extra functionalities:

- A 640x480 VGA framebuffer with 16-bit color depth, stored on SRAM chip
  - Naturally, Simplified Chinese fonts are included (full UTF-8 Chinese range,
    but without punctuation marks, since they are out of that range and we're
    kinda lazy)
  - Fast screen scrolling by adjusting Y offset (for flying effects)
  - SRAM controller and chip are working at 2x bus frequency, so both the CPU
    and the VGA controller can access data simultaneously without competition or
    lockups
- Up to 8 jets (friend + enemy), fully customizable image (no palette or
  indexing involved), free movement across the screen
- Up to 56 bullets (friend + enemy), customizable size and color, free movement
  across the screen
- Loop playback of background music (~5min) with WM8731 sound chip, 2 channels,
  16-bit depth, 8000Hz sample rate
  - Used a module provided by course (written by former students) but had
    pitfalls; will be discussed later
- Internet connection with Marvell 88E1111 chip and RJ45 connectors, for
  uploading gameplay records and downloading rankings
  - Used open source code on GitHub for data transmission
    ([https://github.com/alexforencich/verilog-ethernet][1])
  - Custom MDIO communication code for modifying network chip registers
  - LwIP as TCP/IP protocol stack
- User input via USB keyboard, connected to onboard USB chip
  - Since the keyboards in our lab are unstable, we used a separate CPU for
    controlling the keyboard so they can be reset and debugged separately. The
    main CPU can also be reset less frequently

Here is the demonstration video (in Chinese):

<video width="100%" controls>
  <source src="/usr/uploads/2019/07/3087632729.mp4" type="video/mp4">
</video>

We used the `DE2-115` development board with an FPGA chip of
`Cyclone IV EP4CE115F29C7`, and `Quartus Prime 18.1 Free Edition` as development
software.

Thie post is a record of problems I encountered and resolved when implementing
the extra features.

# Academic Integrity Alert & Open Source

**WARNING:** This post does not contain any materials covered in the course, and
is **NOT HELPFUL** to other projects except the final project. If you referenced
this post or our code, you **MUST** list it in your report, or you may be
punished for plagiarism.

We open-sourced the code at [https://github.com/xddxdd/zjui-ece385-final][3].

# Networking

We implemented networking on the development board to upload gameplay records
and generate score rankings. It is the extra feature we consider the most
important. This part involves pitfalls we had with the following components:

- Intel Triple Speed Ethernet IP (The 10/100/100M Adaptive Ethernet module that
  comes with Quartus)
- Ethernet IP by GitHub User [Alex Forencich][4]
  ([https://github.com/alexforencich/verilog-ethernet][5])
- LwIP Embedded TCP/IP Protocol Stack
  ([https://savannah.nongnu.org/projects/lwip/][6])

## Intel Triple Speed Ethernet IP Won't Work

DE2-115 development board comes with 2 Marvell 88E1111 network chips,
corresponding to the 2 RJ45 ethernet jacks. While interfacing with the chip, we
found that Quartus has provided an Ethernet IP with a rich list of options, and
went for it.

We had to admit that such official Intel IPs have comprehensive functionalities,
such as support for various interfaces such as GMII and RGMII, built-in FIFO
buffers, easy MDIO communication with Ethernet chip, and a lot of stuff we
didn't need. But when we added the IP and tried to use it, no data was sent from
the Ethernet chip, TX LED wasn't blinking, and despite that RX LED was blinking,
no data was received. It still wouldn't work even if we followed the official
Intel guide
[ftp://ftp.intel.com/pub/fpgaup/pub/Intel_Material/17.0/Tutorials/DE2-115/Using_Triple_Speed_Ethernet.pdf][7]
step by step.

After debugging for as long as 3 days, we found that this Ethernet IP by Intel
needs to be paid for. Since we apparently didn't do that, the IP worked in trial
mode, and would only work when **the development board was connected to PC** and
**the Licensing window was open on Quartus Programming UI**. In any other
circumstance, it would disable itself by not sending any data and not processing
any received data.

Out of rage and frustration, we decided to replace it with an open-source IP on
GitHub, the second one listed above. While the IP is open source and free, it
does have its pitfalls; read on.

## Lacking MDIO Support with Open Source Module

Marvell 88E1111 Ethernet chip has an MDIO interface, providing read/write access
to 32 registers. They are used to set link speed (10/100/1000M), obtain
connection status (plugged in or not), etc. But we dug into the open-source IP
and found no trace of MDIO support.

Intel does provide an independent MDIO module free of charge, but it works with
a newer protocol version of Clause 45, and cannot communicate with the chip
normally, which speaks older Clause 22.

So we managed to create our own.
[https://github.com/xddxdd/zjui-ece385-final/blob/master/comp/lantian_mdio/lantian_mdio.sv][8]

This module directly exposes MDIO registers on Avalon-MM memory bus, and allows
direct memory operations on them.

## Open Source IP Receives but Doesn't Send, TX LED Not Blinking

Now we have received packets on the FPGA, which means we are close to success.
But we did a packet capture with Wireshark on the computer connected to the
other end and got nothing.

If the TX LED doesn't blink, it means that the data transferred from FPGA to
Ethernet chip is corrupted, and the Ethernet chip will not send anything it
doesn't recognize. Investigation shows that the `IFG Delay` parameter of the
Open Source IP is set incorrectly. This parameter controls the number of gap
cycles between two Ethernet frames over the cable, and is usually set to 12. We
had removed the parameter previously and ignored it...

## Open Source IP Receives but Doesn't Send, TX LED Blinking

... And we're here, adding that parameter.

After a 3-hour reading of the code of the Open Source IP, we found that it
requires data from the same packet to be sent continuously, not accepting delay
in any of the cycles. The 1000Mb Ethernet module runs at 125 MHz and sends 8
bits of data to the Ethernet chip every time, but our CPU and DMA run at 50 MHz
and also send 8 bits each cycle. Therefore the Open Source IP needs to wait for
data, and when this happens, it simply tells the Ethernet chip that "data is
corrupted". Ethernet chip on the FPGA board proceeds to send the "corrupted"
signal, and the computer network card on the other end silently drops the packet
before the operating system is aware of anything.

The solution is also simple: the DMA module supports 32-bit width on the sender
side, so 32-bit width is used with DMA and input side of FIFO (output side
connected to Open Source IP is still 8 bits). We also increased the DMA FIFO
buffer size a bit out of stability considerations and simple convenience. This
time, the bandwidth of DMA is increased from 400 Mbps to 1600 Mbps, and the Open
Source IP no longer needs to wait for data.

# Audio

Since a WM8731 driver module written by former students is provided on the
course website, we thought adding audio was pretty easy.

We were wrong.

## Audio Chip Outputs Noise

In the operating systems course I took in the previous semester (previous to
this FPGA course), I added Sound Blaster 16 sound card support to our group's
operating system. At the beginning I designed the interface of the sound module
to be the same as SB16, providing a memory region where audio data is stored,
and triggering an interrupt whenever half of the data is read.

And the audio chip output only noise.

We thought that this interface was too complicated and did it again with DMA and
FIFO, similar to Ethernet.

Still only noise.

We began to read through the driver module, but the module is written in VHDL, a
totally different language from SystemVerilog taught in the course. The design
is also quite weird, as we traced an input signal and found that it ended up
unused!?

We finally discovered that a signal, which we expect to be an 8000 Hz pulse
signal (equal to sample rate) that indicates ready for the next sample point, is
not what we thought it to be.

We had to find our own 8000 Hz signal source, and we saw Intel's Interval Timer
IP.

For the sake of simplicity (and laziness), we added an 8000 Hz interrupt to the
main CPU and outputted the audio signal via PIO in the interrupt handler. Simple
but effective.

> Our finished game doesn't consume a lot of CPU cycles and can handle
> interrupts at such high frequency.

The CPU handled one interrupt and stopped.

We read through the datasheet of Interval Timer and found we need to write to a
register after each interrupt.

After one rich day of debugging, we finally heard beautiful music coming from
our board.

# Video

The video part is the difficult part of the whole project. We began with a pure
frame buffer without sprites, yet our mere 50 MHz **FREE** CPU core, without
cache, pipelining, or instruction prediction, couldn't handle the workload of
refreshing each pixel. Here the problem came:

## FPS Less Than 1

Yes, that's how bad the performance went. Due to the limitation of SRAM (10 ns
per operation, or 100 MHz; bus at 50 MHz max since SRAM has double the frequency
with the multiplexer module), we cannot overclock it anymore.

We were not going to try the paid version of CPU IP, since we were scared of
what happened with our Ethernet module.

We thought compiler optimizations might do something and added `-O2`. FPS
instantly increased to around 7-8.

## FPS Less Than 30

But this is definitely not enough for a shooter game. The minimum acceptable FPS
is 30, and reaching 60 will be the best. Because of this, we had to build a
sprite system, where each object could be moved quickly by modifying its
coordinates. Thanks to this, we reached a framerate of 60, and the game could be
played normally.

In addition, we added a DMA controller to the architecture. The DMA controller
is a dedicated module for memory copy, and is much more efficient than the
**FREE** CPU.

But we're not done yet:

## 64 Sprites Cause Logical Timeouts

Fighter jets and bullets have their transparency. When processing each pixel, a
long combinational logic processing each layer is required. This means that the
logic cannot properly finish in 40 ns (or 25 MHz, the pixel frequency of 640x480
VGA), and the VGA output may have artifacts.

We ended up with a tree-shaped design. Since the Cyclone IV FPGA has 4 input
LUTs, we designed such a structure:

1. All 64 objects are split into 32 groups. Transparency is handled in each
   group, and 32 outputs are generated;
2. Split 32 outputs into 16 groups and repeat;
3. Split 16 outputs into 8 groups and repeat;
4. Split 8 outputs into 4 groups and repeat;
5. Split 4 outputs into 2 groups and repeat;
6. Process the last 2 outputs and generate the final output.

The combinational logic path is reduced from 64 comparisons to 6.

## Storing Data to SDRAM

Lastly, we need a way to store all the data, including fighter jets,
backgrounds, and audio data, to SDRAM.

In the course, we are suggested to use the `DE2-115 Control Panel`, which loads
a custom program to the FPGA and writes to SDRAM. But in a previous homework, we
found that the data on SDRAM may be randomly corrupted after switching back to
our own programs.

What we did was write to the SDRAM when we uploaded the program to the CPU.
Create a new ELF section in the `BSP Editor` in Eclipse, name it anything
starting with a dot, such as `.resources`, but not the same name as anything in
`Platform Designer`. Then, assign it to be stored in SDRAM.

Arrays can be created similar to this:

```c
unsigned char arr[1000000] __attribute__((section(".resources"))) = { 0, 1, ... };
```

The array will be uploaded to and stored in SDRAM in this case. Since no extra
programming on the FPGA itself is required, there is no risk of data damage.

# Keyboard

Although this part is covered by course materials, the USB keyboard was
extremely unstable when we simply followed the guides. We often had to reset the
keyboard dozens of times so it could be recognized, but when it works, it works
stably until the next reset.

## Avoid Reset's Interference of Debugging

The first thing we thought of was to split the reset functionality of the main
program and the USB keyboard part to debug them individually.

To be precise, we created an individual CPU that is solely used to communicate
with the keyboard. The keyboard CPU and the USB chip are reset with an
individual button, so it will not interfere with the main program. The two CPUs
communicate with a dual-port on-chip memory without locking mechanisms
(unnecessary since it's write-only on one end and read-only on the other end).

## Avoid Reset's Interference of Muscle Health

We added a timeout to the USB CPU's program. The CPU will reset itself if it
cannot connect to the keyboard after a time period.

Actual testing shows that it is helpful, but not much. But since we were unable
to solve the USB keyboard issue (even the professor couldn't fix it), we had to
live with such a workaround.

[1]: https://github.com/alexforencich/verilog-ethernet
[2]: /usr/uploads/2019/07/3087632729.mp4
[3]: https://github.com/xddxdd/zjui-ece385-final
[4]: https://github.com/alexforencich
[5]: https://github.com/alexforencich/verilog-ethernet
[6]: https://savannah.nongnu.org/projects/lwip/
[7]:
  ftp://ftp.intel.com/pub/fpgaup/pub/Intel_Material/17.0/Tutorials/DE2-115/Using_Triple_Speed_Ethernet.pdf
[8]:
  https://github.com/xddxdd/zjui-ece385-final/blob/master/comp/lantian_mdio/lantian_mdio.sv
