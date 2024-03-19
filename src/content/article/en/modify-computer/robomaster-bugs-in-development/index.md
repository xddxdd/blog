---
title: 'RoboMaster Development Log (Updated 2018-05-28)'
categories: 'Computers and Clients'
tags: [ChibiOS, STM32, RoboMaster, Development Log]
date: 2018-03-31 09:44:00
---

Our school organized a RoboMaster team and planned to attend the competition
this year. Since we are all new students at a new campus, we do not have any
reference materials available from previous students, and we have to figure out
bugs after bugs on our own.

This post describes some of the problems we met during software development.

> Hardware: RoboMaster Official Development Board MCU Model: STM32F427IIHx
> Software: ChibiOS 18.2.0

## Board Has 12 MHz HSE Clock Instead of Commonly Seen 8MHz

The pitfall is that neither the manual nor the hardware schematics mentioned the
clock frequency.

Due to this problem, the actual frequency we programmatically set with
STM32CubeMX or other software is much higher than expected. This caused the
following problems:

- Mysterious failure in setting frequency (Board unresponsive after setting a
  core frequency well below maximum, had to short a resistor to recover)
- USART timing error (Receiving or sending garbage despite same baud-rate /
  format, unable to use the remote controller)
- Cannot respond to CAN data (Both board and motors are sending CAN frames, and
  the oscilloscope can decode them, but neither the board nor the motor ACKs
  successful transmission)

All of the problems are solved by readjusting the clock frequency.

## Delay Required Sending CAN Frames in `while(true);` Loop

Kinda a minor problem. During CAN communication, all devices are connected to
the same bus, and only one device can send data simultaneously. If you are
sending frames in a `while(true);` loop without delay, other devices will not
have a chance to send out messages, and naturally, the development board cannot
respond to them.

A simple addition of `chThdSleepMilliseconds(100);` solves the problem.

## CAN and USB Cannot be Used Simultaneously on Our STM32

The UART port on the development board is some kind of connector instead of bare
pins, and we don't have wires for it, so we tried to use the Serial over USB
feature of ChibiOS, or emulating a serial port over the USB connection, for
debugging.

After testing and searching for information for 2 hours without success, we
finally found out that CAN and USB cannot be enabled simultaneously on this
specific STM32 board.

However, CAN is necessary for us since we need it to talk to the motors.
Therefore... we reverted back to debugging with blinking LEDs.

## `while(true);` in Main Thread Blocks Execution of Sub Threads

My teammate wrote the main logic (checking button status and driving motors) in
another thread, and the main thread is expected to do nothing with
`while(true);` after initializing everything. Later he found out that the other
thread should have a priority of at least (2 + normal priority), or it wouldn't
run.

After a quick investigation, I concluded that ChibiOS sets the priority of main
thread to (1 + normal priority). `while(true);` is still some code consuming CPU
cycles, and it blocks other threads with same or lower priority. The solution is
`while(true) chThdSleepMilliseconds(1000);`, which tells the main thread to
sleep and ChibiOS to schedule other tasks.

## Key Sequence Error in DJI Documentation

The status of 4 keys (Q, E, Shift, and Ctrl) are sent as 4 bits to the
development board with one-to-one correspondence. The document states that the
order from high bit to low bit is Q, E, Shift, and Ctrl, but an actual test
shows that it is Ctrl, Shift, E, and Q.

(Almost hit by the robot)

## Weird Data Type Conversion

My teammate wrote code for PID adjustment of chassis motors, but the motors will
always accelerate to full "reverse" speed once they are turned on, no matter
what direction they are supposed to be running.

After 2 hours of debugging, I found out that my teammate has written the
following code:

```c
uint8_t x = 0xff; // Example response data from motor,
uint8_t y = 0x8f; // splitted to 2 uint8_t's
int a = (x << 8 | y); // What my teammate has done
```

The int here is int32_t.

What we expect to get is 0xffffff8f, or -113; but while executing the code
above, C pads 0 to the beginning of a, and the result is 0x0000ff8f, or 65423.
Therefore, PID thinks the motor is running at tremendous "forward" speed and
behaves weirdly.

C does this since a 4 byte variable is generated at statement `x << 8`:

```c
int c = sizeof(x << 8); // c = 4
```

And the actual operand of the OR operation is 0x0000ff00 and 0x8f，resulting in
0x0000ff8f.

On the other hand, such phenomenon will not occur with uint16_t's:

```c
uint16_t x = 0xffff;
uint16_t y = 0xff8f;
int64_t a = (x << 16 | y); // a = -113
```

Since x << 16 = 0xffff0000, a = 0xffffff8f = -113.

For the original problem, the solution is replacing int to int16_t:

```c
int16_t a = (x << 8 | y);
```

This time a = 0xff8f, or -113, which meets expectations.
