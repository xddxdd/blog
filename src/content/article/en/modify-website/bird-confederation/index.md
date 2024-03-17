---
title:
  'Configure BGP Confederation & Fake Confederation in Bird (Updated 2020-06-07)'
categories: 'Website and Servers'
tags: [BGP, Bird, Confederation]
date: 2020-06-07 21:51:51
---

## Changelog

- 2020-10-01: Add warning to not filter private ASNs within the internal network
- 2020-06-07: Add limitations of Bird confederation and a way to simulate
  confederation
- 2020-05-17: Initial version

## Comparison of BGP Interconnection Schemes within an ISP

Most ISPs, or Internet Service Providers, use the BGP protocol to exchange their
route information. Each ISP will obtain an ASN (Autonomous System Number) from
the regional NIC (Network Information Center, e.g., APNIC, RIPE), like China
Telecom's ASN is 4134 for example. Then, ISPs connect their boundary routers via
physical links (copper line, fiber, satellite link, etc.), and configure BGP
protocol on the boundary routers, so they will tell the other part that: "I'm
AS4134, and I can provide access to the IP block of `202.101.0.0/18`". Routers
directly connected to China Telecom will proceed on repeating that message: "I'm
ASxxxx, and I'm 1 step from the source of `202.101.0.0/18`". And it goes on.
Routers of each ISP will then consider parameters, including distance to the
target, and send packets to the best target that this router can reach.

(Note: The scenario above is simplified, and there are more complicated rules
for ISP interconnection and best path selection in the real world.)

BGP can also be necessary within a large-scale AS. For example, China Telecom,
which operates a network across the entire Mainland China, has its core routers
in each city. Each core router is responsible for a small fraction of IP ranges
China Telecom owns. To make the routers aware of the responsible router for a
specific IP, there is a couple of ways:

1. Manually setting a static route.
   - This is the most simple and naive way, in which a human operator tells the
     router to send packets to an IP range to a specific router.
   - The downside is also apparent: for a network sized like China Telecom, the
     burden on operators is so much that errors can be easily made.
   - In addition, if there is a physical connection issue between two places,
     the static route will fail, and the network connection between them will
     stop working. Whenever this happens, human intervention is required to
     reroute the network traffic to another place.
2. Using iBGP

   - Just like peering with other ISPs, BGP sessions can be set up between
     routers where both ends use the same ASN. This type of BGP session is
     called iBGP, while sessions with different ASNs are called eBGP.
   - Only some one-time BGP session setup is needed on each of the routers. Then
     on a physical link failure, all routers will automatically remove the
     invalid route information and choose the next available best route.
   - But there is a severe limitation of iBGP: all routers should be connected
     to each other. The reason is that:

     - Suppose we have such a network topology:

       ```graphviz
       graph {
         rankdir=LR
         node[shape=box]

         subgraph cluster_1 {
           style=filled;
           color=lightgrey;
           label="AS1";
           node[style=filled,color=white]
           {rank=same; A -- "10.0.0.0/8"; }
           "10.0.0.0/8"[shape=oval]
         }

         subgraph cluster_2 {
           style=filled;
           color=lightgrey;
           label="AS2";
           node[style=filled,color=white]
           {rank=same; B -- C; }
           B -- D;
           C -- D;
         }

         A -- B
       }
       ```

       - A belongs to AS1, and B, C, D belong to AS2.
       - Now A broadcasts that it provides access to `10.0.0.0/8`.
       - B receives A's broadcast and tells C and D that it's 1 step away from
         `10.0.0.0/8`, with path `AS2 -> AS1`.
         - Note that for a BGP path, the information of exact routers chosen is
           not available; only the ASes (or ISPs) it has passed will be
           recorded.
       - C receives B's announcement and tells D that it's 2 steps away from the
         target, with path `AS2 -> AS2 -> AS1`. Meanwhile, D tells C the same
         thing.
       - Since BGP's path selection algorithm is not always minimizing the path
         length, and can be adjusted manually or via code assigning priority, C
         may route packets to D with path `AS2 -> AS2 -> AS2 -> AS1`.
       - Now, B thinks it can reach the target via either A or C. Then after
         running a weird selection algorithm, B gives up on the route to A (dumb
         but possible!) and routes packets to C.
       - Now, the path is `B -> C -> D -> B -> A`, where a loop is formed, and
         the packet will never reach its destination.
       - What's worse, this path will be further announced to D, then C, then
         B... With such an infinite loop going on, the RAM of each router will
         be exhausted, the system will crash, and all packet forwarding will
         come to a complete stop.

     - To prevent such an accident from happening, there is an additional
       limitation of iBGP: If a route is announced from an router from the same
       AS, the route will not be announced to other routers in the same AS. Now:
       - B sends the route to C and D.
       - Both C and D receive the route information but will not proceed to
         exchange this route.
       - Now, there is a unique path from either C or D to the target, and the
         infinite loop of forwarding won't happen anymore.
     - But now a disaster strikes, and B and D are disconnected.
       - Since C won't announce `10.0.0.0/8` to D, D doesn't know how to reach
         the target anymore.

   - This means that each and every pair of routers in an AS must be connected,
     with BGP sessions configured.
     - In an actual setup, a physical link between each pair is not necessary,
       and routing protocols such as OSPF, Babel, etc., can handle routing
       within an ISP. But since routes involving packet forwarding across ASes
       (ISPs) must be handled by BGP, there must be a configured session between
       each pair of routers.
     - Such a setup is unrealistic for a China-Telecom-level ISP. We need better
       solutions.

3. Using BGP Route Reflector
   - Route Reflector is a router with special configurations. It collects route
     information from all other routers within the same AS and distributes them
     to all other routers.
   - In this case, only one BGP session from each other router to the route
     reflector is needed.
   - But this also means that if the Route Reflector crashes, other routers will
     not have complete route information anymore, and the network will fail.
   - Of course, you can set up multiple Route Reflectors for redundancy, but
     undeniably the concept of Route Reflector is opposing to the decentralized
     nature of the Internet.
4. Applying for a lot of ASNs from NIC, assign different ASNs to each router,
   and configure eBGP
   - Yes, this does result in a fully decentralized architecture. No matter the
     connectivity status between any two routers, each router will obtain full
     routing information, and a single point failure will not kill the whole
     network.
   - The downside is obvious: Lots of ASN adds to the workload of ISP and NIC
     staff, and there is a high handling fee to pay.
5. Using BGP Confederation

   - In BGP Confederation, each router also gets a different ASN. But unlike 4,
     these internally-used ASNs do not have to be assigned from a NIC.
     - The range of ASN 4200000000 - 4294967295 is reserved for "internal use",
       and ISPs can directly use them internally. Of course, these ASNs aren't
       recognized by a NIC and (usually) cannot be announced to other ISPs.
       - [DN42 Experimental Network](/en/article/modify-website/dn42-experimental-network-2020.lantian),
         for example, takes a small fraction of the ASN space.
   - Then, the ISP assigned a different internal ASN from the range to each
     router. While BGP routing only does bookkeeping on ASNs passed, since each
     router has a different ASN, it's the same as keeping the list of routers
     passed, and therefore a loop will not happen.
   - But these private ASNs aren't recognized by other networks and may even
     conflict with them (when other ISPs are using them for testing, for
     example), so when sending the router information to another ISP, all
     private ASNs need to be removed and replaced with the official ASN of the
     ISP assigned from NIC.
   - But since each router has a different ASN, how can they know if a router is
     "friendly" (within the same ISP) or "hostile" (from another ISP)? A common
     identifier can be assigned to all routers in the same ISP (called
     Confederation Identifier) to assist.
   - Suppose we have such a network topology:

     ```graphviz
     graph {
       rankdir=LR
       node[shape=box]

       subgraph cluster_1 {
         style=filled;
         color=lightgrey;
         label="AS1";
         node[style=filled,color=white]
         {rank=same; A -- "10.0.0.0/8"; }
         "10.0.0.0/8"[shape=oval]
       }

       subgraph cluster_2 {
         style=filled;
         color=lightgrey;
         label="AS2";
         node[style=filled,color=white]
         {rank=same; B -- C; }
         B -- D;
         C -- D;
       }

       subgraph cluster_3 {
         style=filled;
         color=lightgrey;
         label="AS3";
         node[style=filled,color=white]
         E
       }

       A -- B
       D -- E
     }
     ```

     - A belongs to AS1, B, C, D belongs to AS2, and E belongs to AS3.
     - AS2 has BGP Confederation configured, and B, C, D has private ASNs 21,
       22, and 23.
     - A announces `10.0.0.0/8`, and when B, C, D receives that, they obtain the
       path:
       - B: `AS21 -> AS1`.
       - C: `AS22 -> AS21 -> AS1` or `AS22 -> AS23 -> AS21 -> AS1`.
       - D: `AS23 -> AS21 -> AS1` or `AS23 -> AS22 -> AS21 -> AS1`.
     - When C sends route information to E, it removes the confederation route
       within AS2 and replaces it with `AS2`, the identifier for the whole AS.
       - E: `AS3 -> AS2 -> AS1`.
     - Now, when a disaster strikes and cuts connection from B to D, D can still
       obtain the path `AS23 -> AS22 -> AS21 -> AS1`, and maintain normal packet
       forwarding.

   - This solution preserves the decentralized nature of the Internet against a
     single point failure while also reducing the workload of NIC.
   - But there is some problem when using Confederation in Bird:
     - Bird won't consider the confederation part while calculating distance,
       which leads to weird routing results.
       - For example C receives `A -> B -> C` and `A -> B -> D -> C` at the same
         time, and they have the same priority. Now Bird thinks the two paths
         have **equal** lengths, and selects a route **randomly**, which may
         lead to unnecessary traffic detours.
     - Bird neither provides a variable for the filter to calculate
       confederation length and make manual adjustments.
       - `bgp_path.len` in Bird doesn't contain the length of Confederation, as
         stated above;
       - The functionality that is most similar to my need is AIGP, a path cost
         that accumulates across AS. But the value cannot be accessed by a
         filter.
         - ~~The `bgp_aigp` variable is of void type. Dunno what developers are
           thinking.~~

6. Manual Emulation of BGP Confederation
   - It's the same thing as Confederation, but instead of assigning a common
     Confederation Identifier, all routers still run individually.
   - Then while broadcasting routes to other ASes, a filter is used to remove
     private ASNs to simulate the effect of Confederation.
     - **WARNING:** Do not filter your private ASNs within your network! Or you
       will end up with a routing loop.
   - The advantage is that all goodness of Confederation is kept, and the path
     length is calculated normally (no more detours);
   - The disadvantage is that it's easier to make configuration mistakes, like
     broadcasting routes without removing private ASNs.

Next I will first introduce the configuration of native Confederation in Bird,
then the emulation of Confederation.

## Confederation in Bird

I will take my DN42 network as an example. Except the
[4 nodes that I publically accept peerings](/en/page/dn42), I have 14 other
nodes that aren't open to peerings due to duplicated region, stability, or
system configuration reasons. However all of them are still connected to DN42
and run Bird to exchange BGP routes.

Before I setup Confederation, it's cumbersome to monitor and maintain BGP
sessions between 18 nodes. The ZeroTier One VPN has stability issues from time
to time, and a BGP session disconnection will occur, stopping nodes from
obtaining full route information.

I had a configuration file similar to:

```bash
template bgp lantian_internal {
  local as DN42_AS;
  path metric 1;
  direct;
  enable extended messages on;
  ipv4 {
    next hop self yes;
    import filter { ltnet_filter_v4(); };
    export filter { ltnet_filter_v4(); };
  };
  ipv6 {
    next hop self yes;
    import filter { ltnet_filter_v6(); };
    export filter { ltnet_filter_v6(); };
  };
};

protocol bgp ltnet_other_server from lantian_internal {
  neighbor NEIGHBOR_IP as DN42_AS;
};
```

This is a standard iBGP configuration (except that I enabled extended message
and next-hop self).

For Confederation I need to assign a private ASN to each node. Since my nodes
are connected to both DN42 and NeoNetwork, which occupy `424242XXXX` and
`420127XXXX` respectively, I chose `422547XXXX` as my private ASN range to avoid
conflicts.

(No hobby network will take this range right? Right?)

Since I use ZeroTier One for my internal network, and each node gets an
automatically assign IP in `172.18.0.0/24`, I simply format the ASN as
`4225470000 + Last digits of IP`.

Next, let's modify Bird configuration. First set Confederation Identifier to
identify friendlies:

```bash
confederation DN42_AS;
confederation member yes;
```

I simply used my DN42 ASN (4242422547) as Confederation Identifier and enabled
`confederation member` option to tell Bird that it's a fellow peer on the other
side.

Then change the local ASN from what's assigned from DN42 into something in the
private range:

```bash
local as LTNET_AS;
```

The next problem is deciding the ASN for the neighbor (the other side). Yes, I
can fill in the neighbor ASNs one by one, but this is too much of a hassle.
Luckily Bird supports setting a neighbor as "External" without specifying an
ASN. Now, as long as the neighbor ASN isn't the same as yours, a BGP session can
be established:

```bash
neighbor NEIGHBOR_IP external;
```

The updated configuration file looks like:

```bash
template bgp lantian_internal {
  local as LTNET_AS;
  confederation DN42_AS;
  confederation member yes;
  path metric 1;
  direct;
  enable extended messages on;
  ipv4 {
    next hop self yes;
    import filter { ltnet_filter_v4(); };
    export filter { ltnet_filter_v4(); };
  };
  ipv6 {
    next hop self yes;
    import filter { ltnet_filter_v6(); };
    export filter { ltnet_filter_v6(); };
  };
};

protocol bgp ltnet_other_server from lantian_internal {
  neighbor NEIGHBOR_IP external;
};
```

## Checking Confederation Status

After modifying all configuration and running `birdc configure`, check the route
on one of the nodes:

```bash
# birdc show route for 172.23.0.53 all
# Only one route is kept to shorten the paragraph
BIRD 2.0.7 ready.
Table master4:
172.23.0.53/32       unicast [ltnet_hostdare 20:16:32.922 from fcf9:a876:eddd:c85a:8a93::1] * (100) [AS4242422601i]
        via 172.18.0.65 on ztppir7etp
        Type: BGP univ
        BGP.origin: IGP
        BGP.as_path: (4225470065) 4242422601
        BGP.next_hop: 172.18.0.65
        BGP.med: 0
        BGP.local_pref: 9103
        BGP.community: (64511,6) (64511,24) (64511,33) (64511,44)
        BGP.large_community: (4242422601, 120, 26)

```

Now an ASN is put into brackets in `BGP.as_path`, which is the private ASN in
Confederation. From the perspective of another ASN, this route looks like:

```bash
# birdc show route for 172.23.0.53 all
# Only one route is kept to shorten the paragraph
BIRD 2.0.7 ready.
Table master4:
172.23.0.53/32       unicast [ltnet_gigsgigscloud 16:39:43.377 from fcf9:a876:ed8b:c606:ba01::1] * (100) [AS4242422601i]
        via 172.18.0.1 on zt0
        Type: BGP univ
        BGP.origin: IGP
        BGP.as_path: 4242422547 4242422601
        BGP.next_hop: 172.18.0.1
        BGP.local_pref: 9103
        BGP.community: (64511,6) (64511,24) (64511,33) (64511,44)
        BGP.large_community: (4242422601, 120, 26)
```

The private ASN previously in brackets is automatically replaced with
4242422547, the ASN assigned by DN42. Now when viewed outside, the whole AS is
still a whole AS.

## Emulating a Confederation

The internal network configuration is mostly the same as Bird Confederation,
assigning different ASNs and updating neighbor definitions:

```bash
# See Bird Confederation for details
local as LTNET_AS;
neighbor NEIGHBOR_IP external;
```

But **do not** add the following lines which enable Bird's own Confederation:

```bash
confederation DN42_AS;
confederation member yes;
```

Instead, we modify all external BGP sessions and add this filter:=

```bash
export filter {
  # Add this line which removes all internal ASNs
  # Remember to change to your own range!
  bgp_path.delete([4225470000..4225479999]);
  # Other rules may exist here, but omitted
  accept;
}
```

**WARNING Again:** Do not add this filter to internal peerings, or you will end
up with a loop.

You need to make sure that **every** external BGP session is properly
configured, or something interesting will happen.
