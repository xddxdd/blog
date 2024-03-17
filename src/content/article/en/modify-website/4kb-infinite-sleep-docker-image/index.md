---
title: 'Make an Infinite Sleep Program in Only 4KB'
categories: 'Website and Servers'
tags: [Docker]
date: 2020-12-27 23:39:07
---

In my network configuration, some of my Docker containers, for example DNS, need
to achieve high availability with Anycast.
[In my previous post](/en/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian/),
I created a Busybox container and run `tail -f /dev/null`, in order to let it
persist infinitely, but without using any CPU cycles, to maintain a network
namespace used by both the server application and BIRD.

In short: I invented a Pod in Kubernetes on my own.

> I don't use K8S, since my nodes run individually rather than in a cluster, I
> don't need the cluster functionality of K8S at all. In addition, K8S is
> difficult to set up.

But on another thought, a Busybox container seems like an overkill for this
purpose, and I have to set the entrypoint manually. It would be great if I have
a tiny Docker image that only sleeps indefinitely.

## Plan A: Statically link one to Musl

The most straightforward way is to write an infinite loop in C, and call
functions like `sleep` to wait forever. In Linux, a `pause` function is provided
by C standard libraries such as Glibc or Musl. It will pause the program until
it receives an external signal.

So here's the infinite loop with `pause`:

```c
#include <unistd.h>

int main() {
        while(1) pause();
}
```

Then statically link it to Musl. Don't use Glibc,
[I've mentioned why when I was trying to create tiny Docker images](/en/article/modify-website/static-build-tiny-docker-images.lantian).

```bash
musl-gcc sleep.c -Os -static -o sleep
```

And we have an executable that's 17KB in size:

```bash
> ls -alh sleep
-rwxr-xr-x 1 lantian lantian 17K Dec 27 22:27 sleep
```

It's pretty small, compared to Busybox's image that's over 1MB in size. But we
can do better.

## Plan B: Assembly!

If we try to decompile the `sleep` program, we'll get a bunch of functions:

```bash
> objdump -x sleep

sleep:     file format elf64-x86-64
sleep
architecture: i386:x86-64, flags 0x00000112:
EXEC_P, HAS_SYMS, D_PAGED
start address 0x000000000040103a

Program Header:
    LOAD off    0x0000000000000000 vaddr 0x0000000000400000 paddr 0x0000000000400000 align 2**12
         filesz 0x0000000000000190 memsz 0x0000000000000190 flags r--
    LOAD off    0x0000000000001000 vaddr 0x0000000000401000 paddr 0x0000000000401000 align 2**12
         filesz 0x00000000000006d5 memsz 0x00000000000006d5 flags r-x
    LOAD off    0x0000000000002000 vaddr 0x0000000000402000 paddr 0x0000000000402000 align 2**12
         filesz 0x0000000000000040 memsz 0x0000000000000040 flags r--
    LOAD off    0x0000000000002fe8 vaddr 0x0000000000403fe8 paddr 0x0000000000403fe8 align 2**12
         filesz 0x0000000000000040 memsz 0x00000000000002c8 flags rw-
   STACK off    0x0000000000000000 vaddr 0x0000000000000000 paddr 0x0000000000000000 align 2**4
         filesz 0x0000000000000000 memsz 0x0000000000000000 flags rw-
   RELRO off    0x0000000000002fe8 vaddr 0x0000000000403fe8 paddr 0x0000000000403fe8 align 2**0
         filesz 0x0000000000000018 memsz 0x0000000000000018 flags r--

Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .init         00000003  0000000000401000  0000000000401000  00001000  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
  1 .text         000006c2  0000000000401010  0000000000401010  00001010  2**4
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
  2 .fini         00000003  00000000004016d2  00000000004016d2  000016d2  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
  3 .rodata       0000000a  0000000000402000  0000000000402000  00002000  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  4 .eh_frame     00000030  0000000000402010  0000000000402010  00002010  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  5 .init_array   00000008  0000000000403fe8  0000000000403fe8  00002fe8  2**3
                  CONTENTS, ALLOC, LOAD, DATA
  6 .fini_array   00000008  0000000000403ff0  0000000000403ff0  00002ff0  2**3
                  CONTENTS, ALLOC, LOAD, DATA
  7 .got          00000008  0000000000403ff8  0000000000403ff8  00002ff8  2**3
                  CONTENTS, ALLOC, LOAD, DATA
  8 .got.plt      00000018  0000000000404000  0000000000404000  00003000  2**3
                  CONTENTS, ALLOC, LOAD, DATA
  9 .data         00000010  0000000000404018  0000000000404018  00003018  2**3
                  CONTENTS, ALLOC, LOAD, DATA
 10 .bss          00000270  0000000000404040  0000000000404040  00003028  2**5
                  ALLOC
 11 .comment      00000012  0000000000000000  0000000000000000  00003028  2**0
                  CONTENTS, READONLY
SYMBOL TABLE:
0000000000401000 l    d  .init  0000000000000000 .init
0000000000401010 l    d  .text  0000000000000000 .text
00000000004016d2 l    d  .fini  0000000000000000 .fini
0000000000402000 l    d  .rodata        0000000000000000 .rodata
0000000000402010 l    d  .eh_frame      0000000000000000 .eh_frame
0000000000403fe8 l    d  .init_array    0000000000000000 .init_array
0000000000403ff0 l    d  .fini_array    0000000000000000 .fini_array
0000000000403ff8 l    d  .got   0000000000000000 .got
0000000000404000 l    d  .got.plt       0000000000000000 .got.plt
0000000000404018 l    d  .data  0000000000000000 .data
0000000000404040 l    d  .bss   0000000000000000 .bss
0000000000000000 l    d  .comment       0000000000000000 .comment
0000000000000000 l    df *ABS*  0000000000000000 exit.lo
0000000000401353 l     F .text  0000000000000001 dummy
0000000000401354 l     F .text  0000000000000023 libc_exit_fini
0000000000000000 l    df *ABS*  0000000000000000 sleep.c
0000000000000000 l    df *ABS*  0000000000000000 Scrt1.c
0000000000000000 l    df *ABS*  0000000000000000 crtstuff.c
0000000000401080 l     F .text  0000000000000000 deregister_tm_clones
00000000004010b0 l     F .text  0000000000000000 register_tm_clones
00000000004010f0 l     F .text  0000000000000000 __do_global_dtors_aux
0000000000404040 l     O .bss   0000000000000001 completed.0
0000000000403ff0 l     O .fini_array    0000000000000000 __do_global_dtors_aux_fini_array_entry
0000000000401140 l     F .text  0000000000000000 frame_dummy
0000000000403fe8 l     O .init_array    0000000000000000 __frame_dummy_init_array_entry
0000000000000000 l    df *ABS*  0000000000000000 __libc_start_main.lo
0000000000401149 l     F .text  0000000000000001 dummy
000000000040114a l     F .text  0000000000000001 dummy1
00000000004012c9 l     F .text  0000000000000020 libc_start_init
00000000004012e9 l     F .text  000000000000002e libc_start_main_stage2
0000000000000000 l    df *ABS*  0000000000000000 __init_tls.lo
000000000040148c l     F .text  0000000000000185 static_init_tls
0000000000404100 l     O .bss   0000000000000030 main_tls
0000000000404140 l     O .bss   0000000000000168 builtin_tls
0000000000000000 l    df *ABS*  0000000000000000 __syscall_cp.lo
0000000000401695 l     F .text  000000000000001a sccp
0000000000000000 l    df *ABS*  0000000000000000 crtstuff.c
000000000040203c l     O .eh_frame      0000000000000000 __FRAME_END__
0000000000000000 l    df *ABS*  0000000000000000
0000000000403ff8 l       .fini_array    0000000000000000 __fini_array_end
0000000000403ff0 l       .fini_array    0000000000000000 __fini_array_start
0000000000403ff0 l       .init_array    0000000000000000 __init_array_end
0000000000404000 l     O .got.plt       0000000000000000 _GLOBAL_OFFSET_TABLE_
0000000000403fe8 l       .init_array    0000000000000000 __init_array_start
00000000004042a8 g     O .bss   0000000000000004 .hidden __thread_list_lock
0000000000401377 g     F .text  0000000000000029 pause
000000000040114b g     F .text  000000000000017e .hidden __init_libc
0000000000401630 g     F .text  0000000000000033 .hidden __syscall_ret
0000000000404060 g     O .bss   0000000000000008 .hidden __hwcap
0000000000401663 g     F .text  0000000000000000 memcpy
0000000000404028 g     O .data  0000000000000000 .hidden __TMC_END__
0000000000401695  w    F .text  000000000000001a .hidden __syscall_cp_c
0000000000404080 g     O .bss   0000000000000068 .hidden __libc
0000000000404018 g     O .data  0000000000000000 .hidden __dso_handle
00000000004016b4 g     F .text  0000000000000000 .hidden __set_thread_area
000000000040140b g     F .text  0000000000000081 .hidden __copy_tls
00000000004040e8  w    O .bss   0000000000000008 _environ
00000000004016c4  w    F .text  000000000000000e .hidden ___errno_location
00000000004040e8 g     O .bss   0000000000000008 __environ
0000000000401611 g     F .text  0000000000000016 _Exit
000000000040148c  w    F .text  0000000000000185 .hidden __init_tls
0000000000401000 g       .init  0000000000000000 _init
0000000000401353  w    F .text  0000000000000001 .hidden __funcs_on_exit
0000000000401663 g       .text  0000000000000000 .hidden __memcpy_fwd
00000000004040e8  w    O .bss   0000000000000008 environ
00000000004040e8  w    O .bss   0000000000000008 ___environ
0000000000404058 g     O .bss   0000000000000008 __progname
000000000040103a g       .text  0000000000000000 _start
0000000000401050 g     F .text  0000000000000024 _start_c
0000000000404058  w    O .bss   0000000000000008 program_invocation_short_name
00000000004012c9  w    F .text  0000000000000020 .hidden __libc_start_init
00000000004013a0 g     F .text  000000000000006b .hidden __init_tp
000000000040114a  w    F .text  0000000000000001 .hidden __init_ssp
0000000000404028 g       .bss   0000000000000000 __bss_start
0000000000401032 g     F .text  0000000000000008 main
0000000000401353  w    F .text  0000000000000001 __stdio_exit
00000000004016af g     F .text  0000000000000005 .hidden __syscall_cp
00000000004016d2 g       .fini  0000000000000000 _fini
0000000000401354  w    F .text  0000000000000023 .hidden __libc_exit_fini
0000000000404028 g       .data  0000000000000000 _edata
00000000004042b0 g       .bss   0000000000000000 _end
00000000004016c4 g     F .text  000000000000000e __errno_location
0000000000401010 g     F .text  0000000000000022 exit
0000000000401317 g     F .text  000000000000003c __libc_start_main
0000000000404050  w    O .bss   0000000000000008 program_invocation_name
0000000000404024 g     O .data  0000000000000004 .hidden __default_stacksize
0000000000404020 g     O .data  0000000000000004 .hidden __default_guardsize
0000000000404048 g     O .bss   0000000000000008 .hidden __sysinfo
0000000000404050 g     O .bss   0000000000000008 __progname_full
```

This is because a portion of Musl is copied over in the static linking process.
But for a program that does nothing other than waiting forever, it doesn't need
any of them. Can we remove them:

Sure. One way is to call the system call for `pause` directly in assembly. Don't
be frightened by assembly though, our program is only 6 lines long:

```c
.text
.global _start
_start:
    mov $34, %rax
    syscall
    jmp _start
```

-   Line 1 indicates that all the code should be put to the `.text` section
    (executable code section) of the Linux ELF executable.
-   Line 2 and Line 3 define a `_start` function.
    -   Although the main function is `main` when we write C code, it's not the
        first function that Linux calls when it starts the program. Instead, it
        runs the `_start` function copied over from C standard library. It will
        load some environment settings (such as parsing command-line arguments)
        and call our `main` function. But we don't need all these steps. We just
        need to `sleep` forever.
-   Line 4 and Line 5 call the system call numbered 34, or the `pause` call for
    Linux. It's the one that I mentioned before, sleep indefinitely until a
    signal is received.
-   Line 6 jumps to the beginning of `_start` to create an infinite loop.

"Compile" it (technically it's not, it's only translating to machine code):

```bash
as sleep.asm -o sleep.obj
ld -s -o sleep sleep.obj
```

And we have a 4.3 KB executable that does sleep forever.

But problems arise again: The code we just created, as well as the executable,
only supports x86_64. I have a Raspberry Pi and a Tinker Board, which means I
need to support ARM. And if I ever come across a machine that only does x86 32
bits, or RISC-V got popular somehow in the future, I'll have to install an
assembler and write a version of code for each and every architecture.

To make matters worse, Linux numbers its system calls differently under
different architectures. I'll have to look them up for each architecture.

Can this be simplified?

## Plan C: Use Musl's Source Code

Remember the C standard libraries like Musl? One of their jobs is to wrap up
Linux system calls, so programmers can use them without writing assembly.
Wouldn't it be better if we could reuse the wrapping part, without other junks
that we don't need?

First, we need to grab a copy of Musl's code:

```bash
wget https://musl.libc.org/releases/musl-1.2.1.tar.gz
tar xvf musl-1.2.1.tar.gz
mv musl-1.2.1 musl
```

Musl has assembly code, inlined in C files, for system calls in different
architectures, under the `arch` folder. For example, the code for x86_64 is at
`arch/x86_64/syscall_arch.h`:

```c
static __inline long __syscall0(long n)
{
        unsigned long ret;
        __asm__ __volatile__ ("syscall" : "=a"(ret) : "a"(n) : "rcx", "r11", "memory");
        return ret;
}
```

In addition, there's a system call table in `cat arch/x86_64/bits/syscall.h.in`:

```c
#define __NR_pause 34
```

Neither of them depends on external stuff, and we can include them directly.
Therefore we can create this piece of code:

> `pause` system call isn't supported on all architectures. When this happens, I
> use `sched_yield` instead to tell the OS to allocate CPU cycles to other
> programs. This consumes more CPU cycles than `pause`.
>
> Like assembly, a `_start` function is created. We don't need other stuff from
> C standard libraries.

```c
#include "bits/syscall.h"
#include "syscall_arch.h"

void _start() {
    while(1) {
#ifdef SYS_pause
        __syscall0(SYS_pause);
#else
        __syscall0(SYS_sched_yield);
#endif
    }
}
```

Then compile:

```bash
# Copied from Musl's install script, replace names in syscall.h.in to common ones
sh -c "sed -n -e s/__NR_/SYS_/p < musl/arch/x86_64/bits/syscall.h.in >> musl/arch/x86_64/bits/syscall.h"
gcc -Os -static -nostdlib -Imusl/arch/x86_64 -o sleep sleep.c
```

Which will give us a `sleep` file that's 8.9 KB in size:

```bash
> ls -alh sleep
-rwxr-xr-x 1 lantian lantian 8.9K Dec 27 23:00 sleep
```

That is not the limit. If some assembly can get us to 4.3 KB, we can do similar
with C. Let's run `objdump -x sleep` to see the ELF Sections:

```bash
Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .note.gnu.build-id 00000024  0000000000400158  0000000000400158  00000158  2**2
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  1 .text         0000000c  0000000000401000  0000000000401000  00001000  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
  2 .eh_frame     0000002c  0000000000402000  0000000000402000  00002000  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  3 .comment      00000012  0000000000000000  0000000000000000  0000202c  2**0
                  CONTENTS, READONLY
```

There are four parts in `sleep`, in which only `.text` is needed by use, so we
need to remove the other ones. GCC supports not generating `.node.gnu.build-id`
with flag `-Wl,--build-id=none`, and not generating `.eh_frame` with
`-fno-asynchronous-unwind-tables`:

```bash
gcc -Os -static -nostdlib -Imusl/arch/x86_64 -Wl,--build-id=none -fno-asynchronous-unwind-tables -o sleep sleep.c
```

Now the file is sized at 4.7 KB. We can further remove `.comment`:

```bash
strip -s -R ".comment" sleep
```

And we got to 4.3 KB, exactly the same as that assembly. Let's check by doing a
disassembly:

```bash
> objdump -D sleep

sleep:     file format elf64-x86-64


Disassembly of section .text:

0000000000401000 <.text>:
  401000:       ba 22 00 00 00          mov    $0x22,%edx
  401005:       48 89 d0                mov    %rdx,%rax
  401008:       0f 05                   syscall
  40100a:       eb f9                   jmp    0x401005
```

It's almost the same size as the assembly code. If you take a look with hexdump,
you will see tons of 0s in the file. But they cannot be removed since a memory
page in x86 is 4KB, and ELF file sections have to be aligned to 4KB.

Finally, put all of them into a Dockerfile, and we have a Docker image.
[You can take a look at my Dockerfile here at this commit.](https://github.com/xddxdd/dockerfiles/tree/eecbb766176852ead16a6066017772161c59e502/dockerfiles/sleep/template.Dockerfile)

## But Was It Worth It?

Good question. I want to find out too.
