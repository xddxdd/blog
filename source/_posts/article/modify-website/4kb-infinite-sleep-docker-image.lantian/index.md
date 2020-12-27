---
title: '制作只有 4KB 大小的永久挂起程序'
categories: 网站与服务端
tags: [Docker]
date: 2020-12-27 23:39:07
---

在我的网络配置中，部分 Docker 容器的服务需要用 Anycast 的方式实现高可用，例如 DNS。[在之前的文章中](/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian/)，我的做法是，创建了一个 Busybox 容器运行 `tail -f /dev/null` 这条命令，永久挂起，不占用 CPU 也永远不会退出，来维持一份网络命名空间给服务程序和 BIRD 共享。

用人话说就是：我自己发明了一遍 Kubernetes 的 Pod。

> 我不使用 K8S，因为我的节点都是独立的，不组成集群，因此不使用 K8S 的集群功能，另外它的配置也比较复杂。

但是我转念一想，为了网络命名空间建一个 Busybox 容器好像有些大材小用，我还需要手动配置一个 Entrypoint。如果有一个极小的 Docker 镜像，唯一干的事情是等待，那就更好了。

方案一：直接用 Musl + 静态编译做一个
------------------------------

最容易想到的方法就是写一个死循环的 C 程序，不断的用 `sleep` 之类命令等待。Linux 系统中，Glibc、Musl 等 C 语言运行库提供了一个 `pause` 函数，暂停程序运行直到程序收到了外部信号。

所以我写了一个死循环调用 `pause`：

```c
#include <unistd.h>

int main() {
        while(1) pause();
}
```

然后把它静态链接到 Musl。不要用 Glibc，[原因我在上次制作微型 Docker 镜像时讲了](/article/modify-website/static-build-tiny-docker-images.lantian/)：

```bash
musl-gcc sleep.c -Os -static -o sleep
```

然后我们得到了一个 17KB 大小的可执行文件：

```bash
> ls -alh sleep
-rwxr-xr-x 1 lantian lantian 17K Dec 27 22:27 sleep
```

已经挺小了，Busybox 的镜像要 1MB 多一点。但是我们还可以做得更好。

方案二：汇编！
-----------

如果我们反编译一下刚才的 `sleep` 程序，可以看到一大堆函数：

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

这是因为 Musl 的一部分在静态链接时被带进来了。但是一个除了永远挂起外，不干任何其它事的程序，也不需要这些 Musl 的函数。那么可不可以把它们都删掉？

可以，一种方法就是直接用汇编直接去调用 pause 对应的系统调用。不用一看到汇编就发慌，我们的程序只有六行：

```c
.text
.global _start
_start:
    mov $34, %rax
    syscall
    jmp _start
```

- 第一行表示把下面的代码放在 Linux ELF 可执行文件的 `.text` 段（即可执行代码段）。
- 第二行和第三行定义了一个 `_start` 函数。
  - 虽然我们写 C 程序时主函数是 `main`，但是 Linux 运行程序时执行的第一个函数其实不是它，而是从 C 语言标准库中复制来的 `_start` 函数，它会在加载一些环境配置（例如解析命令行参数）后，再调用我们写的 `main` 函数。但我们不需要 C 标准库帮我们干这些，我们只要不停地挂起自己就可以。
- 第四行和第五行调用了编号为 34 的系统调用，对应 Linux 的 `pause` 系统调用，就是先前提到的、挂起自身直到收到外部信号为止的调用。
- 第六行跳回 `_start` 函数开头，成为一个死循环。

把它“编译”（其实与编译 C 等语言的过程不同，只需要翻译成机器码）：

```bash
as sleep.asm -o sleep.obj
ld -s -o sleep sleep.obj
```

我们就获得了一个 4.3 KB 的可执行文件，而且可以正常的一直挂起。

但问题又来了：我们刚才的代码和可执行文件只支持 x86_64 指令集。我还有树莓派和 Tinker Board，也要支持 ARM。万一后续我遇到了只支持 x86 32 位指令集的机器，或者未来 RISC-V 崛起，我还得为每个架构装一个汇编器，写一次汇编代码。

更麻烦的是，Linux 在不同的架构下系统调用的编号是不同的，每个架构都得去查一次系统调用表。

有没有简单一点的方案？

方案三：源代码级调用 Musl
---------------------

还记得刚才提到的 Musl 等 C 标准库吗？它们的作用之一就是包装 Linux 的系统调用给程序使用，这样我们写程序时就不用用汇编来做系统调用了。如果我们能复用它们包装调用的代码，并且去掉其它的我们不需要的东西，不是更好？

我们先下载一份 Musl 的代码：

```bash
wget https://musl.libc.org/releases/musl-1.2.1.tar.gz
tar xvf musl-1.2.1.tar.gz
mv musl-1.2.1 musl
```

Musl 的代码里，`arch` 文件夹下就有不同架构系统调用的汇编代码，内联在 C 文件里。例如 x86_64 的代码在 `arch/x86_64/syscall_arch.h`：

```c
static __inline long __syscall0(long n)
{
        unsigned long ret;
        __asm__ __volatile__ ("syscall" : "=a"(ret) : "a"(n) : "rcx", "r11", "memory");
        return ret;
}
```

另外，`cat arch/x86_64/bits/syscall.h.in` 里还有系统调用的编号表：

```c
#define __NR_pause 34
```

这两个文件都没有额外的依赖，可以直接 include。因此我们可以写出这样的代码：

> `pause` 系统调用不是在所有指令集上都支持的，这时我会使用 `sched_yield` 告知系统把 CPU 分给其它程序。这相比 `pause` 会多占一些 CPU。
>
> 和汇编一样，这里直接写一个 `_start` 函数，我们不需要 C 标准库的其它东西。

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

然后编译：

```bash
# 从 Musl 的编译指令里抄来的，替换 syscall.h.in 里的名称为更常用的名称
sh -c "sed -n -e s/__NR_/SYS_/p < musl/arch/x86_64/bits/syscall.h.in >> musl/arch/x86_64/bits/syscall.h"
gcc -Os -static -nostdlib -Imusl/arch/x86_64 -o sleep sleep.c
```

我们得到了一个 8.9 KB 的 `sleep` 文件：

```bash
> ls -alh sleep
-rwxr-xr-x 1 lantian lantian 8.9K Dec 27 23:00 sleep
```

这还不是极限，汇编程序可以做到 4.3 KB，C 程序也可以做到相近的程度。我们 `objdump -x sleep` 看一下 ELF Section：

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

`sleep` 文件中有四个部分，其中只有 `.text` 是我们需要的，因此我们要去除别的部分。GCC 可以用 `-Wl,--build-id=none` 参数去掉 `.note.gnu.build-id`，用 `-fno-asynchronous-unwind-tables` 去掉 `.eh_frame`：

```bash
gcc -Os -static -nostdlib -Imusl/arch/x86_64 -Wl,--build-id=none -fno-asynchronous-unwind-tables -o sleep sleep.c
```

此时文件大小 4.7 KB。我们再去掉 `.comment` 部分：

```bash
strip -s -R ".comment" sleep
```

此时文件只有 4.3 KB，与汇编版本完全相同。我们反编译看下：

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

和刚才写的汇编代码基本上是一个东西。如果用 hexdump 看一下，可以看到文件中有大量的 0，但是这些空间已经没法精简了，因为 x86 下内存的一页就是 4KB，ELF Section 要向 4KB 对齐。

最后把刚才的过程全部写进 Dockerfile，做成镜像就可以了。[Dockerfile 可以在我的这个 commit 看到。](https://github.com/xddxdd/dockerfiles/tree/eecbb766176852ead16a6066017772161c59e502/dockerfiles/sleep/template.Dockerfile)

但这一切值得吗？
-------------

好问题，我也想知道。
