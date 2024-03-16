---
title: '静态编译制作微型 Docker 镜像'
categories: 网站与服务端
tags: [Docker]
date: 2020-11-29 23:04:46
---

Docker 镜像中存储的，可以看作是一个个小型 Linux 系统。它们大都以 Debian、Ubuntu 或是 Alpine 作为基础，再在上面安装额外的软件而成。

以完整的 Linux 作为基础的好处就是镜像中会自带常用的命令（`ls`，`cat` 等），在镜像构建过程中常常用到。另外它们也带有完善的包管理机制，简单使用 `apt-get` 就能装好软件，做出一份能用的镜像。但当镜像做出之后，上面这些工具就用不到了，占用了不必要的磁盘空间。另外，完整的操作系统也会带有 SystemD、OpenRC 等管理后台服务的程序，而 Docker 容器常常只用来运行一个程序，后台管理程序就多余了。

虽然 Docker 镜像采用分层设计，将基础的系统镜像（例如 Debian）和上层修改（例如安装的 nginx）分开存储并进行去重，从而减少了重复的空间占用，但没有完全解决问题。例如假设我先基于 Debian 构建了一个镜像 A，过了一个月又构建了镜像 B。但在这一个月中，Debian 的基础镜像进行了升级，于是 Docker 就会存储新旧两份镜像，占用了大量的空间。

可以看出，空间占用问题大都是基础系统镜像导致的。而且基础镜像也不小，Debian、Ubuntu 的都要 100 MB 以上，Alpine 好些，但也有 5-10 MB，而且它相比 Debian 等不常用。那么，能不能在做出的 Docker 镜像中，不使用基础操作系统，只留应用的可执行程序呢？

可以，但比较难。

Docker 分阶段构建
---------------

首先试着给一个 C 语言的 Hello World 程序做一个镜像，把这个文件保存为 `hello.c`：

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
}
```

我们打算放弃基础系统，只保留应用程序。于是我们开始写 Dockerfile：

```dockerfile
FROM scratch
# 然后呢？
```

此时我们发现，因为没有基础系统，我们根本没有 `ls`、`cat` 等命令可用，更不用说 `wget`、`gcc` 这些了。但好消息是，我们还有 `COPY` 命令可用：

```dockerfile
FROM scratch
COPY ./hello /
ENTRYPOINT [ "/hello" ]
```

我们把可执行文件 `hello` 复制进了镜像，然后把它设为 `ENTRYPOINT`，这样一个没有基础系统的镜像就做好了，是不是很简单？

等等，`hello` 这个文件怎么来？你需要在宿主机上安装好编译器和依赖，提前编译好程序。但这一是需要额外的步骤，二是不同程序需要的编译环境可能是冲突的（这也是 Docker 解决的问题之一）。如果我们能把编译过程也放在容器里完成就好了，最好还能写在同一个 Dockerfile 里。

好消息是，Docker 以“分阶段构建”的形式支持了这种操作：

```dockerfile
FROM gcc AS step_0
COPY hello.c /
RUN gcc /hello.c -o /hello

FROM scratch AS step_1
COPY --from=step_0 /hello /
ENTRYPOINT [ "/hello" ]
```

Docker 在容器构建过程中，会先创建一个装有 GCC 的容器运行编译命令，再 `FROM scratch` 创建一个空镜像，把可执行文件复制进去。而这一切都在同一个 Dockerfile 里完成。

但是为什么不行？
-------------

上面的 Dockerfile 看起来不错，我们实际构建一下：

```bash
> docker build -t xddxdd/test .
Sending build context to Docker daemon  3.072kB
# ...
Successfully built 92004f08c63f
Successfully tagged xddxdd/test:latest

> docker images xddxdd/test
REPOSITORY          TAG                 IMAGE ID            CREATED              SIZE
xddxdd/test         latest              92004f08c63f        About a minute ago   16.4kB
```

镜像构建完成，16.4 KB，相当小。我们运行一下：

```bash
> docker run -it --rm xddxdd/test
standard_init_linux.go:219: exec user process caused: no such file or directory
```

等一下，找不到什么文件？这里只有一个 `hello` 程序，而且它也不会去打开其它文件啊。

等等，真的不会吗？

C 标准运行库与静态编译
------------------

虽然我们的 C 代码里程序不会去打开任何文件，但是这个可执行文件本身还要依赖其它文件。用 `ldd` 命令看一下：

```bash
> ldd hello
linux-vdso.so.1 (0x00007ffd3759d000)
libc.so.6 => /usr/lib/libc.so.6 (0x00007f5772a31000)
/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f5772c53000)
```

Linux 使用的 ELF 可执行文件可以在启动时加载其它的 .so 文件，使用这些文件中预先编译好的函数。这些 .so 文件称作“动态库”，因为它们是在程序启动时被动态加载的，这个过程叫做“动态链接”。相应的，调用它们的程序被称作“动态可执行文件”。

回头看我们的程序：

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
}
```

它使用的 `printf` 函数来自上面的 `libc.so.6` 这个运行库，它是 Glibc，拥有三十多年悠久历史的 C 语言标准运行库，集成在大多数的常用 Linux 发行版，被绝大多数程序依赖。而我们的 Docker 镜像中没有 Glibc，只有一个 `hello` 可执行文件，自然会运行失败。

那么有没有办法把 `printf` 这个函数直接包含在程序文件中呢？有的，就是静态编译：

```bash
> gcc hello.c -o hello-static -static
```

在给 gcc 加上 `-static` 参数后，GCC 会从 Glibc 提取 `printf` 函数（以及 printf 函数用到的函数），全部放到 `hello-static` 文件里。这样编译出来的程序就不用依赖 Glibc 等库文件了，被称作“静态可执行文件”。

```bash
> ldd hello-static
not a dynamic executable
```

在 Dockerfile 里的编译命令加上 `-static` 后，我们再试一遍：

```dockerfile
FROM gcc AS step_0
COPY hello.c /
RUN gcc /hello.c -o /hello -static

FROM scratch AS step_1
COPY --from=step_0 /hello /
ENTRYPOINT [ "/hello" ]
```

运行构建和运行命令：

```bash
> docker build -t xddxdd/test .
# ...
Successfully built 03a938aadafd
Successfully tagged xddxdd/test:latest

> docker run -it --rm xddxdd/test
Hello World
```

很好，运行成功了。我们再看一下这个镜像：

```bash
> docker images xddxdd/test
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
xddxdd/test         latest              03a938aadafd        2 minutes ago       945kB
```

等等，945 KB？刚才只有 16.4 KB 的，一个 `printf` 要占用这么多空间吗？

放弃 Glibc，换用 Musl
-------------------

问题还是出在 Glibc，它不适合被静态编译到程序里去，因为：

1. 它的功能过于复杂，静态编译后会大幅增加程序的大小。
2. 即使是静态编译，Glibc 还会调用其它动态库，例如用于 DNS 解析的 `nss` 库，如果找不到会导致 DNS 解析失败。这意味着我们的镜像里还得加入额外的文件。

当 Glibc 让问题变得复杂，我们可以换用简单一些的方案，例如 Musl 这个 C 语言标准库。Musl 和 Glibc 的功能相似，都是提供 C 语言里最基础的函数（例如 `printf` 这些），但 Musl 更加轻量，结构更加精简。另外，它也不依赖 `nss` 等额外的库，因此静态编译进程序后所有功能都可以正常使用。

但是 Musl 和 Glibc 并不完全兼容，程序必须要重新编译才能切换到另一个标准库。因此，我们不能直接用 Musl 的文件直接覆盖 Glibc，这会把整个系统搞挂。但我们仍然可以在常用的、基于 Glibc 的 Linux 发行版中装上 Musl：

```bash
# Arch Linux
> pacman -S musl
# Debian
> apt-get install musl-dev musl-tools
```

安装后，Musl 会提供一个命令，`musl-gcc`。它会向 GCC 添加合适的参数，让编译的程序使用 Musl 而非 Glibc。例如我们来改一下 Dockerfile：

```dockerfile
FROM gcc AS step_0
RUN apt-get update && apt-get install -y musl-dev musl-tools
COPY hello.c /
RUN musl-gcc /hello.c -o /hello -static

FROM scratch AS step_1
COPY --from=step_0 /hello /
ENTRYPOINT [ "/hello" ]
```

和上面一样构建、运行，并查看大小：

```bash
> docker build -t xddxdd/test .
# ...
Successfully built c3ee94508e4e
Successfully tagged xddxdd/test:latest

> docker run -it --rm xddxdd/test
Hello World

> docker images xddxdd/test
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
xddxdd/test         latest              c3ee94508e4e        49 seconds ago      26kB
```

26 KB，毕竟多了几个函数，比动态链接的版本大了一些，但比 Glibc 的版本小太多了。

但使用 Musl 也不总是这么简单的。因为系统上所有的程序、库文件都是基于 Glibc 编译的，当程序依赖其它库文件，我们不能直接用包管理装上完事，而是必须自己编译使用 Musl 的版本。例如我的 `Bird` 镜像中，就先后额外编译了 `ncurses` 和 `readline，可以在` [https://github.com/xddxdd/dockerfiles/blob/8b0484073c7ffd8926247688ba12425d3953f051/dockerfiles/bird/template.Dockerfile](https://github.com/xddxdd/dockerfiles/blob/8b0484073c7ffd8926247688ba12425d3953f051/dockerfiles/bird/template.Dockerfile) 看到。

静态编译与 Go 语言
----------------

说到静态编译，就不能不提 Go 语言的程序。我们先创建一个 Go 语言的 Hello World：

```go
package main
import "fmt"
func main() {
    fmt.Println("Hello World")
}
```

然后编译：

```bash
> go build main.go
> ldd main
not a dynamic executable
```

Go 语言编译出来的程序直接就是一个静态可执行文件，不需要调用 Glibc。这也意味着它可以直接单独一个文件放入 Docker 镜像中，还能正常运行。

稍微复杂一些的 Go 程序可能还是会调用 Glibc，例如我的 [Bird-lg-go 项目](https://github.com/xddxdd/bird-lg-go)：

```bash
> cd frontend
> go build
> ldd frontend
linux-vdso.so.1 (0x00007fff2ffe9000)
libpthread.so.0 => /usr/lib/libpthread.so.0 (0x00007fc81014a000)
libc.so.6 => /usr/lib/libc.so.6 (0x00007fc80ff81000)
/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007fc8101c0000)
```

同样是 Go 程序，它就用到了 Glibc，以及 Pthread 多线程库。但与其它语言不同的是，Go 语言可以非常方便地禁止它链接 Glibc：

```bash
> CGO_ENABLED=0 go build
> ldd frontend
not a dynamic executable
```

只要添加 `CGO_ENABLED=0` 这个环境变量就可以了。另外，Go 编译出的文件与 GCC 静态编译出的不同。Go 的静态程序完全不包含 Glibc 的指令，不像 GCC 只是把 Glibc 的指令复制了一份到程序里。因此，它也不存在 Glibc 导致的调用 `nss`、后续功能受限的问题。

因此，Go 程序可以非常容易地打成无基础系统的 Docker 镜像，大部分情况下不需要修改任何代码。

总结
----

静态编译法可以让你的 Docker 镜像从带有完整基础系统的 100 MB 往上，降低到只含一个可执行文件的几 MB 甚至 KB。从此你的服务器里再也不用为七八个 Docker 镜像存上七八份不同版本的 Debian 了。
