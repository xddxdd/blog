---
title: 'Setting Up IP Reverse Lookup in DN42'
categories: Website and Servers
tags: [DNS, DN42]
date: 2018-05-05 21:58:00
image: /usr/uploads/2018/05/2031962398.png
autoTranslated: true
---


DN42, short for Decentralized Network 42, is a large-scale VPN network. Unlike traditional VPNs, DN42 utilizes technologies commonly deployed in internet backbones (such as BGP), effectively simulating a real-world network environment.

In [a previous article][1], I joined the DN42 network, and in [another article][2], I registered my own domain and configured my DNS server. With a DNS server in place, we can now set up reverse lookup records for our IP addresses. Reverse lookup primarily aids in spam prevention and improves the appearance of outputs in network tools like ping and traceroute.

## Setting Up the Resolver for IP Ranges

The first step is to delegate reverse resolution for your IP ranges to your DNS server. My servers are ns[1-3].lantian.dn42. While all could theoretically be specified, DN42 currently requires pull requests for configuration changes—a lengthy process—so I retained only the initial DNS server ns1.lantian.dn42 registered with this IP.

After cloning DN42's data repository, add this line to your IP range file:

    nserver:            ns1.lantian.dn42

The complete file should resemble:

    inetnum:            172.22.76.184 - 172.22.76.191
    netname:            LANTIAN-IPV4
    remarks:            Peer with me at dn42@lantian.pub
    descr:              Peer with me at dn42@lantian.pub
    country:            CN
    admin-c:            LANTIAN-DN42
    tech-c:             LANTIAN-DN42
    mnt-by:             LANTIAN-MNT
    nserver:            ns1.lantian.dn42
    status:             ASSIGNED
    cidr:               172.22.76.184/29
    source:             DN42

Next, `git add`, `git commit`, submit a pull request, and await merging and recursive DNS propagation.

## Configuring PowerDNS

While waiting, set up the resolver. Following [this guide][3], we already have a PowerDNS server. Reverse IP resolution resembles resolving a special domain: 

- For a /24 range, the domain is `[reverse-IP].in-addr.arpa` (e.g., `0.168.192.in-addr.arpa` for 192.168.0.0/24). 
- Most DN42 users have smaller ranges (/26-/29). For 172.22.76.184/29, the domain becomes `184/29.76.22.172.in-addr.arpa`.

Add this domain in PowerDNS as shown:

![PowerDNS Domain Settings][4]

Then create PTR records for each IP. For 172.22.76.185, the record is `185.184/29.76.22.172.in-addr.arpa`:

![PowerDNS PTR Record Settings][5]

After DN42's recursive DNS propagates, query reverse records using `dig -x [IP] @172.23.0.53`:

![Querying Reverse Record][6]

For IPv6 reverse resolution in DN42, see [this article][7].

[1]: /en/article/modify-website/join-dn42-experimental-network.lantian
[2]: /en/article/modify-website/register-own-domain-in-dn42.lantian
[3]: /en/article/modify-website/register-own-domain-in-dn42.lantian
[4]: /usr/uploads/2018/05/717887706.png
[5]: /usr/uploads/2018/05/1880640802.png
[6]: /usr/uploads/2018/05/2031962398.png
[7]: /en/article/modify-website/dn42-reverse-record-ipv6.lantian
