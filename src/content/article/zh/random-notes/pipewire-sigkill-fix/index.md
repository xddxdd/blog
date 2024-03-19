---
title: 解决 Pipewire 被 SIGKILL 的问题
categories: 随手记
tags: [Linux, Pipewire, SIGKILL, RTKit]
date: 2023-05-29 01:38:58
image: /usr/uploads/202305/pipewire.png
---

## 症状

我频繁遇到 Pipewire 音频框架突然停止运行的情况：

- 问题通常出现在我的笔记本电脑连接/断开电源的时候，此时我的电脑会因为切换性能模
  式卡顿一小段时间；
- `systemctl --user status pipewire.service` 只能看到 Pipewire 进程被 `SIGKILL`
  信号终止，没有其它有用的日志信息；
- `coredumpctl` 和 `dmesg` 里也找不到 Coredump 内存转储事件的记录。

## 原因

Pipewire 进程运行时具有实时优先级，其调度需求被最优先满足，以便及时处理音频数
据，避免音频卡顿。Pipewire 提高进程优先级是通过它的 `libpipewire-module-rt` 模块
请求系统中以 `root` 权限运行的 `RTKit`（Realtime Kit）服务，然后 `RTKit` 以特权
修改进程优先级来达成的。

但是，如果一个具有实时优先级的进程出了 Bug，进入了死循环，那么它会占用所有的 CPU
资源。系统上绝大部分其它进程（包括但不限于 SSH 服务端，Xorg，还有你的 Shell）由
于优先级更低，就无法得到任何 CPU 时间片，无法处理任何任务，包括你尝试修复系统时
输入的命令。

为了避免这个问题，Linux 内核默认对实时进程的运行时长做了限制。在默认设置下，实时
进程必须在 200 毫秒内完成这一次的计算（例如 Pipewire 的音频处理），调用
`sched_yield` 系统调用把 CPU 时间片交还给其它进程。之后这个进程就可以在后台等待
下一次事件触发（例如声卡的音频缓冲区即将耗尽），Linux 内核再次调度这个实时进程。
如果实时进程在 200 毫秒后仍未完成计算，Linux 内核会直接发送 SIGKILL 信号结束进
程。

由于我的电脑在切换性能模式时发生卡顿，Pipewire 处理音频数据的耗时超过了 200 毫
秒，就被 Linux 内核直接结束了进程。

## 解决方法

由于我没法解决电脑切换性能模式时卡顿的问题，我选择把 Pipewire 的运行时长限制提升
到 5 秒，足够电脑卡顿时 Pipewire 处理音频数据。

首先需要修改 Pipewire `libpipewire-module-rt` 模块的参数，让 Pipewire 申请更长的
时间限制：

```json
{
  "context.modules": [
    {
      "args": {
        "nice.level": -11,
        "rt.prio": 88,
        "rt.time.hard": 5000000,
        "rt.time.soft": 5000000
      },
      "flags": ["ifexists", "nofail"],
      "name": "libpipewire-module-rt"
    }
  ]
}
```

其中 5000000 的单位是微秒，换算成秒数为 5 秒整。

然后，由于 `RTKit` 还有一层运行时长限制，我们还需要给 `RTKit` 添加启动参数，提高
它的限制。运行 `systemctl edit rtkit-daemon.service`，然后输入以下内容：

```bash
[Service]
# 先清除掉原先的 ExecStart 命令
ExecStart=
# 然后换成我们的加了参数的命令，如果你的发行版 rtkit-daemon 路径不同，请自行修改
ExecStart=/usr/lib/rtkit-daemon --rttime-usec-max=5000000
```

如果你用的是 NixOS 系统，可以直接使用下面的配置：

```nix
let
  # 时间限制，单位是微秒
  realtimeLimitUS = 5000000;
in {
  security.rtkit.enable = true;
  systemd.services.rtkit-daemon.serviceConfig.ExecStart = [
    "" # 清除掉原先的 ExecStart 命令
    "${pkgs.rtkit}/libexec/rtkit-daemon --rttime-usec-max=${builtins.toString realtimeLimitUS}"
  ];

  services.pipewire.enable = true;

  environment.etc = {
    "pipewire/pipewire.conf.d/rtprio.conf".text = builtins.toJSON {
      "context.modules" = [
        {
          name = "libpipewire-module-rt";
          args = {
            "nice.level" = -11;
            "rt.prio" = 88;
            "rt.time.soft" = realtimeLimitUS;
            "rt.time.hard" = realtimeLimitUS;
          };
          flags = ["ifexists" "nofail"];
        }
      ];
    };
  };
}
```
