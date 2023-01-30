---
title: 'DN42'
date: 1970-01-01 00:00:00
---

If you need assistance on DN42 configuration, you may refer to [DN42 Experimental Network: Intro and Registration](/en/article/modify-website/dn42-experimental-network-2020.lantian) and my previous posts on DN42.

Some Helpful Links for Debugging
--------------------------------

Here are some links that may assist you in diagnosing problems with our peering.

- [My Looking Glass](https://lg.lantian.pub/)
  - You can see BIRD routing software status across my nodes, including whether BGP session is established and whether any route is received.
  - You can perform traceroute to either public IP addresses or DN42 ones.
- Route ROA filtering stats
  - My network only accepts routes that are registered in DN42, and unknown routes (to accomodate newly registered users). Received invalid or unknown routes will be listed here.
  - Invalid route: this IP block is registered in DN42, but the actual source of the route is different from the registration.
    - For example, I registered IP block `172.22.76.184/29` and allowed 4242422547 (my AS) to announce it. If you tried to announce this route, your announcement would be shown here.
    - See the [list of invalid IPv4 routes](https://lg.lantian.pub/route_generic/local/table%20roa_fail_v4), and the [list of invalid IPv6 routes](https://lg.lantian.pub/route_generic/local/table%20roa_fail_v6).
  - Unknown route: this IP block isn't registered in DN42.
    - It usually means you announced your personal intranet (such as `192.168.0.0/16` or `10.0.0.0/8`) to others by mistake.
    - Or maybe you just registered, and my ROA information isn't updated yet. Please wait 4-8 hours and restart our peering.
    - Or maybe you only created inetnum/inet6num objects, but not route/route6 objects.
    - See the [list of unknown IPv4 routes](https://lg.lantian.pub/route_generic/local/table%20roa_unknown_v4), and the [list of unknown IPv6 routes](https://lg.lantian.pub/route_generic/local/table%20roa_unknown_v6).

"1xRTT" Peering
---------------

I live in China, and (many of) you may be on the opposite side of the planet. This means that due to timezone differences, one round of information exchange (you send an e-mail, I respond while you sleep, you see my reply after waking up) may need 24 hours or even more.

Here I provide instructions to perform "1xRTT" peering, which means we can peer with only one e-mail from you and one e-mail from me. Even if you and I are in the same time zone, this will still simplify things.

@include "_templates/dn42-experimental-network-2020/peer-en.md"

PS: It's not recommended to contact me over IRC. Although I leave my IRC client running, I only read messages once or twice per month, unless you ask me to do so in your e-mail. And IRC chat is unlikely to be instant due to timezone differences.

My Network
----------

- ASN: 4242422547
- IPv4 Pool: 172.22.76.184/29 and 172.22.76.96/27
- IPv6 Pool: fdbc:f9dc:67ad::/48
- My Side's Default Port: last 5 digits of your ASN
- Looking glass: [https://lg.lantian.pub](https://lg.lantian.pub/)

Servers
-------

1. Hong Kong, China, provider V.PS
   - Domain: `v-ps-hkg.lantian.pub`
   - Public IPv4: `95.214.164.82` / `v4.v-ps-hkg.lantian.pub`
   - Public IPv6: `2403:2c80:b::12cc` / `v6.v-ps-hkg.lantian.pub`
   - DN42 IPv4: `172.22.76.186` / `v4.v-ps-hkg.dn42.lantian.pub`
   - DN42 IPv6: `fdbc:f9dc:67ad:1::1` / `v6.v-ps-hkg.dn42.lantian.pub`
   - Link-local IPv6: `fe80::2547`
   - WireGuard Public Key: `xelzwt1j0aoKjsQnnq8jMjZNLbLucBPwPTvHgFH/czs=`

2. Tokyo, Japan, provider Oracle
   - Domain: `oracle-vm1.lantian.pub`
   - Public IPv4: `132.145.123.138` / `v4.oracle-vm1.lantian.pub`
   - Public IPv6: `2603:c021:8000:aaaa:2::1` / `v6.oracle-vm1.lantian.pub`
   - DN42 IPv4: `172.22.76.123` / `v4.oracle-vm1.dn42.lantian.pub`
   - DN42 IPv6: `fdbc:f9dc:67ad:5::1` / `v6.oracle-vm1.dn42.lantian.pub`
   - Link-local IPv6: `fe80::2547`
   - WireGuard Public Key: `JJUfHeE1ZgyXzo5aoE0tQfk6wZvnVU/d0V3/uSj61ns=`

3. San Jose, United States, provider V.PS
   - Domain: `v-ps-sjc.lantian.pub`
   - Public IPv4: `180.66.196.80` / `v4.v-ps-sjc.lantian.pub`
   - Public IPv6: `2604:a840:2::ed` / `v6.v-ps-sjc.lantian.pub`
   - DN42 IPv4: `172.22.76.185` / `v4.v-ps-sjc.dn42.lantian.pub`
   - DN42 IPv6: `fdbc:f9dc:67ad:3::1` / `v6.v-ps-sjc.dn42.lantian.pub`
   - Link-local IPv6: `fe80::2547`
   - WireGuard Public Key: `zyATu8FW392WFFNAz7ZH6+4TUutEYEooPPirwcoIiXo=`

4. New York, United States, provider VirMach
   - Domain: `virmach-ny1g.lantian.pub`
   - Public IPv4: `216.52.57.200` / `v4.virmach-ny1g.lantian.pub`
   - Public IPv6: `2001:470:1f07:54d::1` / `v6.virmach-ny1g.lantian.pub`
   - DN42 IPv4: `172.22.76.190` / `v4.virmach-ny1g.dn42.lantian.pub`
   - DN42 IPv6: `fdbc:f9dc:67ad:8::1` / `v6.virmach-ny1g.dn42.lantian.pub`
   - Link-local IPv6: `fe80::2547`
   - WireGuard Public Key: `a+zL2tDWjwxBXd2bho2OjR/BEmRe2tJF9DHFmZIE+Rk=`

5. Roost, Bissen, Luxemborg, provider BuyVM
   - Domain: `buyvm.lantian.pub`
   - Public IPv4: `107.189.12.254` / `v4.buyvm.lantian.pub`
   - Public IPv6: `2605:6400:30:f22f::1` / `v6.buyvm.lantian.pub`
   - DN42 IPv4: `172.22.76.187` / `v4.buyvm.dn42.lantian.pub`
   - DN42 IPv6: `fdbc:f9dc:67ad:2::1` / `v6.buyvm.dn42.lantian.pub`
   - Link-local IPv6: `fe80::2547`
   - WireGuard Public Key: `DkmSBCIgrxPPZmT07DraoCSD/jSByjPkYqHJWfVZ5hM=`

Recommended Config Templates (Default Parameters)
-------------------------------------------------

> These templates are from your perspective, and you don't need to swap sides when using them on your server.

OpenVPN:

@include "_templates/dn42-experimental-network-2020/openvpn-en.md"

WireGuard config (for use with `wg-quick up`):

@include "_templates/dn42-experimental-network-2020/wireguard-en.md"
