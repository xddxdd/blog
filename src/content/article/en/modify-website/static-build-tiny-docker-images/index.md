---
title: 'Static Build Tiny Docker Images'
categories: 'Website and Servers'
tags: [Docker]
date: 2020-11-29 23:04:46
---

What's stored in Docker images can be seen as numerous tiny Linux systems. Most
of them are based on Debian, Ubuntu, or Alpine, with extra software installed on
top.

Using a complete Linux distribution as the basis gives the benefit of having
commonly used commands available, such as `ls` and `cat`. They are often used in
the image-building process. In addition, they have comprehensive libraries of
software packages, allowing users to create images that "just work" with
`apt-get`. However, as soon as the image is built, these utilities become
unnecessary burdens for disk space. In addition, a full Linux contains a service
managing daemon, like SystemD or OpenRC, useless for Docker containers running
only one program at a time.

Although Docker images are "overlaid", having the base system and upper-level
changes (such as installing a program) split into layers and stored separately
in order to deduplicate and minimize storage use, this doesn't fully resolve the
problem. For example, assume I created an image A based on Debian, then one
month layer created image B. During the month, the base Debian image had an
upgrade, so Docker started to store two copies of Debian, both new and old ones,
and consumes a significant amount of space.

It's obvious that base system images are responsible for most of the storage
consumption. In addition, they're large, with over 100MB for Debian and Ubuntu.
While Alpine's image is smaller, it still takes 5-10MB and is less commonly
used. What if we remove the base system completely from the created image, only
keeping the executables of our programs?

Yes, we can do that, although it does have its difficulty.

## Docker Multi-stage Build

First, let's try building an image for a Hello World program written in C. Save
this file as `hello.c`:

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
}
```

Since we plan to remove the base system and only keep the program, we begin to
write the Dockerfile:

```dockerfile
FROM scratch
# Then what?
```

Now we realize that without a basic system, we don't even have `ls` or `cat`,
let alone `wget` and `gcc`. Good news is that we can still `COPY` stuff in:

```dockerfile
FROM scratch
COPY ./hello /
ENTRYPOINT [ "/hello" ]
```

We copied the executable `hello` into the image and set it as the `ENTRYPOINT`.
Now we have an image with no base system. Isn't that easy?

Wait, where did the `hello` file come from? You'll need to install compilers and
dependencies and run the compilation beforehand. But this is an extra step
needed, and different programs may have conflicting needs for the environment
(which is one of the problems that Docker solves). It would be better if we
could also put the compilation process in a container. Even better if it's in
the same Dockerfile.

The good news is, Docker supports this in the form of "multistage build":

```dockerfile
FROM gcc AS step_0
COPY hello.c /
RUN gcc /hello.c -o /hello

FROM scratch AS step_1
COPY --from=step_0 /hello /
ENTRYPOINT [ "/hello" ]
```

Docker first created a container with GCC to compile the program, then created
an empty image `FROM scratch` and copied the executable. All these were done in
a single Dockerfile.

## But It Doesn't Work, Why?

Since the Dockerfile looks good, let's actually build it:

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

The image is built with 16.4 KB in size, really small. Let's run it:

```bash
> docker run -it --rm xddxdd/test
standard_init_linux.go:219: exec user process caused: no such file or directory
```

Wait, no what file or directory? There's only a single `hello` executable which
isn't supposed to look for other files.

Or is it?

## C Standard Library and Static Builds

Although our C code doesn't access any files, the executable itself needs to
depend on other files. Let's take a look with `ldd`:

```bash
> ldd hello
linux-vdso.so.1 (0x00007ffd3759d000)
libc.so.6 => /usr/lib/libc.so.6 (0x00007f5772a31000)
/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f5772c53000)
```

ELF executables used by Linux support loading other .so files during startup to
use precompiled functions in such files. These .so files are called "dynamic
libraries" since they're dynamically loaded on program startup. The process is
called "dynamic linking". Correspondingly, the executables are called "dynamic
executables".

Back to our program:

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
}
```

The `printf` function comes from the dynamic library `libc.so.6`. It is Glibc, a
C standard library with over 30 years of history, which exists in most of the
commonly used Linux distributions, and is depended on by most programs. Since
there's no Glibc in our Docker image, the single `hello` executable won't work
naturally.

Is there any way to simply include the `printf` function in the executable? Yes,
it's called "static linking":

```bash
> gcc hello.c -o hello-static -static
```

With `-static` parameter added to GCC, it will extract the `printf` function (as
well as functions `printf` use) from Glibc and put all of them in the
`hello-static` file. Now the created executable won't depend on external
libraries such as Glibc. It's called a "static executable".

```bash
> ldd hello-static
not a dynamic executable
```

Let's try again with `-static` included in Dockerfile:

```dockerfile
FROM gcc AS step_0
COPY hello.c /
RUN gcc /hello.c -o /hello -static

FROM scratch AS step_1
COPY --from=step_0 /hello /
ENTRYPOINT [ "/hello" ]
```

Build and run the image:

```bash
> docker build -t xddxdd/test .
# ...
Successfully built 03a938aadafd
Successfully tagged xddxdd/test:latest

> docker run -it --rm xddxdd/test
Hello World
```

Great, it works. Let's take another look at the image:

```bash
> docker images xddxdd/test
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
xddxdd/test         latest              03a938aadafd        2 minutes ago       945kB
```

Wait, 945 KB? It was 16.4 KB before. Does a simple `printf` really take up that
much space?

## Replacing Glibc With Musl

It's still Glibc's fault since it isn't designed to be statically linked to
programs. The reasons are:

1. Its functionalities are too complex and will greatly increase the size of the
   final executable.
2. Even with static linking, Glibc will still call external dynamic libraries,
   such as `nss` library used for DNS resolution. If it doesn't exist, DNS
   resolution won't work. This means we still have to include extra files in the
   container.

When Glibc complicates things too much, we can replace it with simpler
solutions, such as Musl, another C standard library. Musl works similar to
Glibc, both providing the most basic functions in C (such as `printf`), but Musl
is more lightweight with a simplified structure. In addition, it doesn't depend
on external libraries such as `nss`, so everything will continue to work with
static linking.

But Musl isn't completely compatible with Glibc, and programs have to be
recompiled to switch to another C standard library. Therefore we cannot simply
replace the Glibc file with Musl, which will crash the system. But we can still
install Musl alongside Glibc in the commonly used Linux distributions:

```bash
# Arch Linux
> pacman -S musl
# Debian
> apt-get install musl-dev musl-tools
```

After installation, Musl provides a command, `musl-gcc`, that adds proper
parameters to GCC to create Musl-linked programs instead of Glibc ones. Let's
modify the Dockerfile again:

```dockerfile
FROM gcc AS step_0
RUN apt-get update && apt-get install -y musl-dev musl-tools
COPY hello.c /
RUN musl-gcc /hello.c -o /hello -static

FROM scratch AS step_1
COPY --from=step_0 /hello /
ENTRYPOINT [ "/hello" ]
```

Build, run, and check the image, same as above:

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

26 KB, a bit larger than the dynamically linked version since there are extra
functions included, but it's way smaller than the Glibc version.

But using Musl isn't always this easy. With all programs and libraries compiled
against Glibc, when our program needs other libraries, we cannot simply install
them with the package manager. We'll have to compile our own with Musl. For
example, my `Bird` container compiled `ncurses` and `readline` manually as a
consequence of using Musl:
[https://github.com/xddxdd/dockerfiles/blob/8b0484073c7ffd8926247688ba12425d3953f051/dockerfiles/bird/template.Dockerfile](https://github.com/xddxdd/dockerfiles/blob/8b0484073c7ffd8926247688ba12425d3953f051/dockerfiles/bird/template.Dockerfile)

## Static Linking and the Go Language

There's simply no way to not mention Go programs when talking about static
linking. First, let's create a Hello World in Go:

```go
package main
import "fmt"
func main() {
    fmt.Println("Hello World")
}
```

Then compile:

```bash
> go build main.go
> ldd main
not a dynamic executable
```

The compiled executable of Go is simply a static one, with no dependency on
Glibc. This means it can be added alone to a Docker container and work
correctly.

More complicated Go programs may still call Glibc, for example my
[Bird-lg-go](https://github.com/xddxdd/bird-lg-go):

```bash
> cd frontend
> go build
> ldd frontend
linux-vdso.so.1 (0x00007fff2ffe9000)
libpthread.so.0 => /usr/lib/libpthread.so.0 (0x00007fc81014a000)
libc.so.6 => /usr/lib/libc.so.6 (0x00007fc80ff81000)
/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007fc8101c0000)
```

While it is still Go, it uses Glibc, and Pthread the multithreading library. But
unlike other languages, you can easily disallow linking to Glibc in Go:

```bash
> CGO_ENABLED=0 go build
> ldd frontend
not a dynamic executable
```

All you have to add is the `CGO_ENABLED=0` environment variable. By the way, Go
static executables are different from GCC ones. Go static executables contain
zero instructions from Glibc, unlike GCC, which simply copies Glibc instructions
into the executable. As a result, Go programs do not suffer from the problem of
`nss` and limited functionality for using Glibc.

So, Go programs can be packed to Docker images without base systems easily,
which no code modification required in most circumstances.

## Conclusion

With static linking, you can reduce your Docker image from over 100 MB with the
base system to a few MB or even KB for a single executable. Now your server
don't have to hold dozens of different Debian copies for your dozens of images.
