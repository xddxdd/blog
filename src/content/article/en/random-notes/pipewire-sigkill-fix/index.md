---
title: Preventing Pipewire from being SIGKILLed
categories: 'Random Notes'
tags: [Linux, Pipewire, SIGKILL, RTKit]
date: 2023-05-29 01:38:58
image: /usr/uploads/202305/pipewire.png
---

## Problem

I frequently encounter the situation that the Pipewire audio server is suddenly
stopped:

-   The problem usually appears when I connect/disconnect my laptop from the
    power adapter. My computer usually lags for a short time while switching
    between performance profiles.
-   `systemctl --user status pipewire.service` only shows that the Pipewire
    process was terminated by a `SIGKILL` signal, without any other useful log
    information.
-   Neither `coredumpctl` nor `dmesg` shows the existence of a core dump event.

## Cause

The Pipewire process runs with realtime priority, with which its scheduling
needs are satisfied first, so it can process audio data in time to prevent
stuttering. To increase its process priority, Pipewire uses its
`libpipewire-module-rt` module to send requests to the `RTKit` service running
as `root` in the system. `RTKit` then changes process priority with its
privileges.

However, if a process with realtime priority encountered a bug, for example an
infinite loop, it will consume all CPU resources. Since most of the other
processes (including but not limited to, SSH daemon, Xorg, and your shell) are
running with a lower priority, they won't get any CPU time slices, and won't be
able to handle any tasks, including your command inputs trying to fix the
system.

To mitigate this problem, Linux kernel limits the execution time of realtime
processes by default. Under the default settings, a realtime process must finish
its computations (like Pipewire's audio processing) within 200ms, and use the
`sched_yield` system call to return CPU time slices to other processes. It can
then wait for the next event in the background (like running out of audio buffer
on the sound card), when Linux kernel invokes this process again. If the
realtime process does not finish within 200ms, Linux kernel will send a SIGKILL
signal to terminate the process.

Because my computer was lagging while switching between performance profiles,
Pipewire spent more than 200ms on handling audio data, and thus was terminated
by Linux kernel.

## Solution

Since I'm unable to fix the lagging while switching performance profiles, I
decided to increase Pipewire's time limit to 5 seconds, enough for it to process
audio data even when the computer is lagging.

First we need to change the settings for Pipewire's `libpipewire-module-rt`
module, to make it request a longer time limit:

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

The unit for 5000000 is microseconds. Pipewire will now request a 5 second time
limit.

Then, since `RTKit` imposes an additional layer of execution time limit, we need
to add a startup argument to `RTKit` to increase that limit as well. Run
`systemctl edit rtkit-daemon.service`, and enter the following config:

```bash
[Service]
# First, clear the original ExecStart command.
ExecStart=
# Then replace with our command with additional arguments.
# If your distro puts rtkit-daemon elsewhere, change command to match.
ExecStart=/usr/lib/rtkit-daemon --rttime-usec-max=5000000
```

If you're using NixOS, you can use the following config instead:

```nix
let
  # Time limit in microseconds
  realtimeLimitUS = 5000000;
in {
  security.rtkit.enable = true;
  systemd.services.rtkit-daemon.serviceConfig.ExecStart = [
    "" # Override command in rtkit package's service file
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
