---
title: 'Self-hosting a DNS Root Server'
categories: 'Website and Servers'
tags: [DNS, Root Server]
date: 2020-09-05 21:59:46
---

With the scale of conflict between China and the United States increasing, on
some social media websites in China, some users started expressing concerns for
the United States cutting China's access to DNS root servers or removing China's
domains in the root servers in order to break China's Internet.

By now, there is much analysis on the matter that states that this is unlikely
to happen. Most of them focus on the following two points:

- DNS root servers use Anycast to broadcast their IPs, and there are root
  servers present in China that won't be affected by the network cut;
- For the United States, shutting down root servers cause more trouble than
  benefit, both economically and politically.

Yet today, I'm going to present another point:

- You can set up your own DNS root server and make your recursive DNS servers
  use it in a short time.

Yes. The root server you're going to self-host is functionally equivalent to the
root servers as fundamental Internet infrastructure.

## Changelog

- 2020-10-01: Also preserve DS records while filtering root zone file to better
  support DNSSEC enabled recursive servers.
- 2020-09-05: Initial version.

## DNS Resolving Process

First, let's take a look at the procedures of DNS resolve:

1. You turned on your computer, entered `https://www.lantian.pub` in order to
   visit my blog.
   - Although my blog doesn't have `www` in its URL, for demonstration purposes,
     let's temporarily assume that it has one.
2. Your browser cannot directly talk to the domain. It needs to know the IP
   address associated with the domain. Therefore, your browser sends a DNS
   request to a "recursive DNS resolver" configured in your operating system,
   like `8.8.8.8`.
   - The DNS request will contain: request the DNS server to **perform
     recursion**, and return the **A record** (or IPv4 address) associated with
     `www.lantian.pub`.
   - The IP address of the recursive resolver is configured in OS beforehand,
     usually obtained from your router via DHCP, or you may have set it
     manually.
   - How do routers obtain DNS servers' IP addresses? They will also use DHCP,
     PPPoE, or similar protocols to obtain DNS servers from their upstream. The
     process goes through to your ISP (like China Telecom), where it sets up its
     own DNS server and configures the IP addresses in its core routers.
3. The recursive DNS resolver (or the recursor) get the request and starts
   **recursion**.
   - Note the **recursion** here. Another type of DNS server is **authoritative
     DNS server** that doesn't perform recursion. This means that if you point
     the OS resolver address to an authoritative resolver, it's very unlikely
     that you can complete the DNS resolving process.
4. Recursor first asks the **DNS root server** if it knows the IP address of
   `www.lantian.pub`.
5. The root server looks up its database and finds that it doesn't know about
   it. But it does have NS records of the `pub` domain, which contain the IP
   addresses of the authoritative resolver in charge of `pub`.
   - Then it replies: "You can ask authoritative servers of `pub`. Here are
     their IP addresses."
     - What gets replied is the NS records (or the domain of the authoritative
       resolver) of the `pub` domain, optionally with their A/AAAA records (IP
       addresses).
   - DNS root servers are not in charge of all domains in the universe. They
     only handle top-level domains, like the NS records of `com`, `net`, `org`,
     etc., and tell recursors to ask another server.
   - DNS root servers **DO NOT** perform recursion!
6. Recursor then asks the authoritative server of `pub` about the IP address of
   `www.lantian.pub`.
7. The authoritative server of `pub` looks up its database and replies: "No, but
   you can ask this server (along with `lantian.pub`'s NS records, and
   optionally A/AAAA records)"
8. Recursor then asks `lantian.pub`'s authoritative server about
   `www.lantian.pub`.
9. The authoritative server of `lantian.pub` looks up its database and replies:
   "Yes I do! the IP address is this (along with `www.lantian.pub`'s A record"
10. Recursor finally gets the IP, and sends a reply to your browser about the
    IP.
11. Your browser got the IP address for the domain and initiated a TCP
    connection. What happens later isn't relevant to DNS anymore.

In short, DNS root servers are "guides" to recursors, telling them the
authoritative servers they should ask for a domain suffix.

Although it looks like the root servers will be under a lot of pressure, it
isn't the case. DNS servers (including recursors and authoritative servers)
usually send a Time-To-Live (TTL) with their replies that tell browsers
(clients) or recursors to simply use this result for the time period and not
annoy the server again.

## Selfhosting DNS Root Server

In the previous steps, the DNS root server, the authoritative server of `pub`,
and that of `lantian.pub`, do similar things: they receive a request and send
back a NS record or A/AAAA records. It seems that they can be backed by the same
software. This is indeed the case.

Therefore with some general authoritative DNS resolver software, like PowerDNS
or Bind9, you can set up your own root server.

1. Install PowerDNS.

   ```bash
   apt install pdns-server pdns-backend-mysql
   ```

2. Modify PowerDNS's config, `/etc/powerdns/pdns.conf`. The key modifications
   are:

   ```bash
   # Enable Bind Backend, so PowerDNS can recognize DNS record data in Bind format
   # Bind is the de-facto standard format for DNS records
   launch=bind
   # Tell Bind Backend to load this config
   bind-config=/etc/powerdns/bind.conf
   # Check the config for updates every few moments (60 seconds)
   bind-check-interval=60
   # Ignore problematic records, so even if you made a mistake,
   # other normal records can still be served
   bind-ignore-broken-records=yes
   ```

3. Go to [IANA's official website](https://www.iana.org/domains/root/files),
   click on `Root Zone File` to download the root server's DNS record file. Save
   it to `/etc/powerdns/root.zone`.
   - Yes, this file of around 2 MB is all that's in charge of DNS root servers.
4. Open the downloaded `root.zone` file. The content within separates into 5
   columns. Perform some modifications:

   - Remove all lines with a dot `.` in the 1st column and `NS` in the 4th
     column.
     - These lines are at the beginning of the file.
   - Remove all lines where the content in the 4th column is not `A`, `AAAA`,
     `SOA`, `NS` or `DS`. This can be achieved with:

     ```bash
     cat root.zone | awk '{if ($4=="A" || $4=="AAAA" || $4=="SOA" || $4=="NS" || $4=="DS") print $0}' > root.zone.2
     ```

     What's removed is DNSSEC relevant, used to prevent DNS records from being
     modified. But since we do need to modify, these records will be invalid, so
     we'd better remove them all.

   - Add an IP address of your own server. Assume your server's IP is
     `192.168.0.1` and `fd00::1`, with a domain `server.example.com` pointing to
     it, add these lines to the end of the file:

     ```bash
     # Comments in Bind DNS files start with semicolons,
     # so no lines starting with number (hashtag) signs.
     #
     # Remove all these comments while copying contents!
     #
     # Note the extra dot at the end of the line. IT MUST BE THERE.
     . 86400 IN NS server.example.com.
     # Also note the extra dot in the 1st column. MUST BE THERE, TOO.
     server.example.com. 86400 IN A 192.168.0.1
     server.example.com. 86400 IN AAAA fd00::1
     # 86400 is TTL, the time period that the record is valid in cache.
     # Adjust if you need
     ```

     These records indicate that your server is "in charge" of the root zone
     records of DNS.

     If you have multiple servers you plan to set up as root servers, repeat the
     step a few times.

5. Create file `/etc/powerdns/bind.conf` and add these contents, so PowerDNS
   knows that the file above is in charge of the root DNS zone:

   ```bash
   zone "." { type native; file "/etc/powerdns/root.zone"; };
   ```

   That's correct, only one line.

6. `systemctl restart pdns` to restart the PowerDNS service.
7. Run `dig @192.168.0.1` to check if your records are properly loaded.
   Normally, the lines you added above should be shown. For example, if you run
   `dig @103.42.215.193`, which is querying against my root server, you would
   see:

   ```bash
   ;; ANSWER SECTION:
   .                       3600    IN      NS      gigsgigscloud.lantian.pub.

   ;; ADDITIONAL SECTION:
   gigsgigscloud.lantian.pub. 3600 IN      AAAA    2001:470:fa1c::1
   gigsgigscloud.lantian.pub. 3600 IN      A       103.42.215.193
   ```

   (Some lines removed for brevity)

8. Then, run `dig @192.168.0.1 www.example.com`, and you should get an output
   similar to:

   ```bash
   ;; AUTHORITY SECTION:
   com.                    172800  IN      NS      m.gtld-servers.net.
   com.                    172800  IN      NS      l.gtld-servers.net.
   com.                    172800  IN      NS      k.gtld-servers.net.

   ;; ADDITIONAL SECTION:
   m.gtld-servers.net.     172800  IN      AAAA    2001:501:b1f9::30
   m.gtld-servers.net.     172800  IN      A       192.55.83.30
   l.gtld-servers.net.     172800  IN      AAAA    2001:500:d937::30
   l.gtld-servers.net.     172800  IN      A       192.41.162.30
   k.gtld-servers.net.     172800  IN      AAAA    2001:503:d2d::30
   k.gtld-servers.net.     172800  IN      A       192.52.178.30
   ```

   This is your root server returning the authoritative server addresses of
   `com` domain, telling the recursor to go and ask these servers.

   (Again, some lines removed for brevity)

9. Congratulations! You now have your own root server.

## Using Your Roots for Recursion

With your root servers available, the next step is to configure your recursors
to use them to complete the recursion process.

First, save all of the content you added above (or equivalent, the content of
`dig @192.168.0.1`) to a file, ex. `root.hint`.

For PowerDNS Recursor software, if you haven't enabled DNSSEC validation, simply
add this line in the config file:

```bash
hint-file=/etc/powerdns/root.hint
```

The restart PowerDNS Recursor, and it will work.

If you enabled DNSSEC, since we removed all DNSSEC records above, you need to
tell PowerDNS Recursor not to validate contents in DNS root zones.

Add another line in the config file:

```bash
lua-config-file=/etc/powerdns/script.lua
```

And create the file `/etc/powerdns/script.lua` with this line:

```lua
addNTA(".")
```

Save and restart PowerDNS Recursor, done.

Now test your own resolver, it should be able to resolve any address as you
want, like `lantian.pub`, `bing.com`, etc.

## If the Cut Actually Happened

Assume the United States did use technical means to cut the connection from all
DNS root servers to China.

First, with the existence of caches, China's DNS resolving process won't be
immediately shut down. Take a look at the `root.zone` file. Most of the TTL
(validity times) are 86400 (24 hours) or even more. This means that China has
approximately 24 hours to respond.

In the 24 hours, with caches expiring, different recursors will gradually start
to fail the recursion resolving process. By then, the resolver administrators
will only need to set up a root server by the above means and modify recursor's
configs to use it. Immediately things will be back to normal.

## But This is Just a Toy, Right?

First, if the root server is for temporary emergency private use by one
recursive DNS server, with the existence of caching, the load on root servers
won't be too high. Open-source DNS resolver software should already provide
sufficient performance.

But if an authoritative DNS provider (Like DNSPod) wants to make the root server
public to help each other through the hard times, the server load will be much
higher. But don't forget that professional DNS providers have professional
solutions to maximize their performance, and building a root server has no
special requirements on the DNS server software itself. This means that they can
quickly reuse their professional solution and set up a high-performance root
server cluster to satisfy the public's needs.

## Conclusion

DNS root servers are not technically special. Apart from their special position,
they are no different from other authoritative resolvers. If the currently used
root servers are down, simply quickly configure and "promote" another cluster to
replace them.

The process of configuration and "promotion" is not complicated either, using
existing software to load existing data. Therefore, there's no need to worry
about the large impacts of shutting down DNS root servers.
