---
title: 'pfSense Configuration for IPv6 Multi-WAN Automatic Failover'
categories: Website and Servers
tags: [pfSense, Tunnelbroker, IPv6]
date: 2018-11-17 03:29:00
image: /usr/uploads/2018/11/725695690.png
autoTranslated: true
---


Just a few days ago, HE.NET Tunnelbroker's French server experienced an outage. When I configured my Kimsufi server, I assigned the native IPv6 addresses to ESXi for exclusive use (as described in [this article][1]), leaving pfSense with only native IPv4 and obtaining IPv6 addresses through Tunnelbroker. Consequently, all virtual machines on the server lost IPv6 connectivity. More critically, since I had set up a NAT64 service on the server following [this article][2], and configured pfSense's DNS resolution to prioritize Google DNS's NAT64 servers (2001:4860:4860::64 and 2001:4860:4860::6464) with IPv4 as fallback, DNS resolution almost completely failed due to the IPv6 outage combined with pfSense's long DNS timeout settings.

To prevent such cascading failures from recurring, I plan to use multiple Tunnelbrokers for mutual backup and configure pfSense's Multi-WAN Failover feature. This will ensure immediate failover to alternate Tunnelbrokers if one fails, maintaining uninterrupted IPv6 connectivity.

## Setting Up Additional Tunnelbrokers

A current list of operational Tunnelbrokers can be found on the Wikipedia page: [List of IPv6 tunnel brokers][3]. Among these, I successfully registered with HE.NET, IP4Market, and NetAssist. Note that NetAssist's server, while previously functional, is now consistently unavailable.

IP4Market is a Russian website with an interface in Russian, but registration can be completed seamlessly using Google Translate.

After registration, you'll receive server and client IPv4/IPv6 address information (IPs truncated in screenshot below):

![IP4Market Interface Information][4]

Next, create the tunnel in pfSense. Under **Interfaces > Assignments > GIFs**, add a GIF tunnel (IPs truncated):

![pfSense Configuration Information][5]

Then assign this tunnel as an interface. Under **Interfaces > Assignments**, add the newly created tunnel and enable it in the interface settings:

![Enabling Interface in pfSense][6]

Verify tunnel connectivity by pinging the remote endpoint under **Status > Gateways**.

## Configuring Multi-WAN Automatic Failover

To enable automatic failover when a tunnel fails, navigate to **System > Routing > Gateway Groups**. This feature allows grouping multiple gateways (including tunnel endpoints) for load balancing or failover.

Add a gateway group and prioritize the tunnel gateways by assigning them Tier 1, Tier 2, etc. Set the **Trigger Level** to *Member Down*:

![pfSense Gateway Group Settings][7]

However, if you set this gateway group as the default route, you'll notice that when the primary gateway fails, internal machines still cannot access IPv6 despite the gateway group switching. This occurs because LAN devices typically obtain IPv6 addresses from the primary gateway's pool (e.g., HE.NET). Alternate Tunnelbrokers (like IP4Market) won't recognize these addresses and will block traffic. Even if packets pass through, return traffic would be routed to the offline primary gateway.

The solution is pfSense's NPt (Network Prefix Translation) feature, which performs 1:1 mapping between IPv6 subnets. Here, we map HE.NET addresses to IP4Market's address pool to ensure recognition and forwarding.

Under **Firewall > NAT > NPt**, add an entry to map LAN addresses to IP4Market's provided subnet:

![pfSense NPt Configuration][8]

LAN machines can now access the internet via IP4Market's Tunnelbroker.

[1]: /en/article/modify-website/kimsufi-dedi-esxi-software-router.lantian
[2]: /en/article/modify-computer/nat64-server-build.lantian
[3]: https://en.wikipedia.org/wiki/List_of_IPv6_tunnel_brokers
[4]: /usr/uploads/2018/11/725695690.png
[5]: /usr/uploads/2018/11/2702646429.png
[6]: /usr/uploads/2018/11/2363686930.png
[7]: /usr/uploads/2018/11/4028108843.png
[8]: /usr/uploads/2018/11/2438253327.png
```
