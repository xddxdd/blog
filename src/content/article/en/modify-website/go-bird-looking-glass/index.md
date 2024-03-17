---
title: 'Bird-lg in Go (Bird Looking Glass)'
categories: 'Website and Servers'
tags: [Bird-lg]
date: 2019-01-08 23:40:00
image: /usr/uploads/2019/01/2163803638.png
---

## What's BIRD? And What's Bird-lg?

BIRD is a popular BGP routing software used on Linux. I mainly use [Bird in the
DN42 network][1], to establish connections with other users.

[Bird-lg][2] is a Python 2 based program developed by GitHub user sileht. It
provides a web interface to show the status of BIRD routing software on each
server, as well as query routes to specified IPs.

## Why Rewrite in Go?

-   Bird-lg is based on Python 2 and Flask and takes more memory (20-30MB).

    Bird-lgproxy also takes around 20MB and is required on every server. On the
    512MB VPS where this site is hosted, there had been multiple cases where
    memory ran out, and the on-disk SWAP was too slow. In this case, Docker,
    Nginx, MySQL, PHP would crash one after one, and a reboot would be
    necessary.

-   The rewritten version in Go takes only 6 MB.

-   Bird-lg queries status of multiple servers in **series** rather than
    parallel. Sometimes when the network condition was being subpar, or ZeroTier
    One had a glitch, it would take a long time to read all the statuses.

-   The rewritten version in Go uses Goroutines to query multiple servers in
    **parallel** rather than serial. Page loading latency is reduced by
    magnitudes when there are many servers or when the network is bad.

-   This is also my practice in programming in Go.

## What Functionalities are Done?

For Bird-lgproxy the following things are done:

-   Sending requests to Bird
-   Running Traceroute and returning the result

For Bird-lg the following things are done:

-   Basic status display:

    ![Basic Status Display][3]

-   Querying route information to specified IP:

    ![Querying Route Information to Specified IP][4]

-   IP & ASN highlighting in results, and WHOIS lookups:

    ![WHOIS Domain Queries][5]

    ![WHOIS ASN Queries][6]

-   Traceroute (which shows a routing issue to DN42 right now):

    ![Traceroute Output][7]

## What Aren't Done?

Compared to the [Bird-lg in Python][8], Bird-lgproxy lacks the following
functionalities:

-   IP source restriction

Bird-lg lacks:

-   Query history on the right of the page

I don't implement these features since I don't need them. For example, I simply
set Bird-lgproxy to listen on a specific network interface and use this as a way
of source restriction.

## Demonstration

Project site & Source code: [https://github.com/xddxdd/bird-lg-go][9]

Simply `go build` in the corresponding directory. Use `-h` parameter to see
available parameter items. The program doesn't have a configuration file, and
all configuration is done via parameters.

Demo site: [https://lg.lantian.pub][10]

I also modified the Python bird-lg and added parallel requests with `grequests`.
The project is available at [https://github.com/xddxdd/bird-lg][11]

By the way, the Go Bird-lgproxy is a direct replacement for Python Bird-lgproxy,
and can work together with the Python Bird-lg.

[1]: /article/modify-website/join-dn42-experimental-network.lantian
[2]: https://github.com/sileht/bird-lg
[3]: /usr/uploads/2019/01/2163803638.png
[4]: /usr/uploads/2019/01/3361004803.png
[5]: /usr/uploads/2019/01/2074591260.png
[6]: /usr/uploads/2019/01/1327536764.png
[7]: /usr/uploads/2019/01/408903664.png
[8]: https://github.com/sileht/bird-lg
[9]: https://github.com/xddxdd/bird-lg-go
[10]: https://lg.lantian.pub
[11]: https://github.com/xddxdd/bird-lg
