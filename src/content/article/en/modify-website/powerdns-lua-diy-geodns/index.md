---
title: 'Building GeoDNS with PowerDNS Lua Functionality for Regional DNS Resolution'
categories: Website and Servers
tags: [PowerDNS, GeoDNS, Lua]
date: 2020-01-17 23:45:58
image: /usr/uploads/202001/geodns-global-ping.png
autoTranslated: true
---


Previously, if you wanted to build your own authoritative DNS system for a website, the (almost) only option was PowerDNS with its GeoIP backend. However, the GeoIP backend uses YAML configuration files and cannot work with databases like MySQL. This meant having to manually set up a cross-server file synchronization system instead of using more mature database synchronization technologies.

Fortunately, PowerDNS added support for Lua records in its latest 4.2 version. Lua is a programming language specifically designed for "embedding functionality into other programs," which you may have encountered in nginx (as a plugin). Lua record support enables PowerDNS to return different responses based on user query requests, thus implementing GeoDNS functionality for regional resolution.

## Updating PowerDNS

The latest PowerDNS 4.2 version isn't included in the Debian 10 software repository. You'll need to download it from the Debian Unstable repository. However, since PowerDNS depends on numerous new library files—including essential system libraries—installing via commands like `apt-get install -t unstable pdns-server` would upgrade some core system files to Unstable versions.

In this situation, Docker is the best solution. Since we only need to download PowerDNS from the Debian repository without compiling it ourselves, we can create the image with just a few lines:

```docker
FROM amd64/debian:sid
RUN apt-get -qq update \
    && DEBIAN_FRONTEND=noninteractive apt-get -qq install -y tini pdns-server pdns-tools pdns-backend-\* \
    && apt-get clean
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "/usr/sbin/pdns_server"]
```

The final Dockerfile I used (partial) can be found on [my GitHub](https://github.com/xddxdd/dockerfiles/blob/53295f2641dce30072f0f2ac5dd631e1f0b35687/dockerfiles/powerdns-bird/template.Dockerfile). Note that this Dockerfile includes Bird BGP and requires GPP processing to generate the complete version (details can be found in [this article](/en/article/modify-website/gpp-preprocess-dockerfile-include-if.lantian/)).

## Configuring the GeoIP Database

PowerDNS uses the MaxMind GeoIP database for IP geographical information. Although MaxMind provides a free, lower-precision IP geolocation database (GeoLite) for personal use, starting December 30, 2019, MaxMind began requiring GeoLite users to register an account and obtain a license key to download the database. The steps are as follows:

1. Go to the [GeoLite 2 Databases page](https://dev.maxmind.com/geoip/geoip2/geolite2/), click the yellow button at the bottom to register. This process requires email verification and cannot be done through a proxy (since that's what they specialize in).
2. In the account details page, click `My License Key` on the left to manage license keys.
3. Click `Generate License Key` to create a new key.
4. Fill in a key description and select the key version as shown in the image, then confirm with the blue button:
   - ![License version selection](/usr/uploads/202001/maxmind-license-version.png)
5. After submission, note two important pieces of information to fill in the configuration file later:
   - `Account/User ID`
   - `License Key`

Next, you can use MaxMind's official `geoipupdate` tool to automatically update the database. First, install it on Debian:

```bash
apt-get install geoipupdate
```

Then create the folder `/etc/geoip` and modify `/etc/GeoIP.conf` (note capitalization) with the following content:

```bash
AccountID [Account ID]
LicenseKey [License Key]
EditionIDs GeoLite2-ASN GeoLite2-City GeoLite2-Country
DatabaseDirectory /etc/geoip
```

Run `geoipupdate` to update the database automatically, with files stored in `/etc/geoip`. Set up automatic updates via Cron:

```bash
crontab -e
# Add this line:
0 0 * * 0 /usr/bin/geoipupdate
```

## Configuring and Starting PowerDNS

To enable GeoIP functionality, modify PowerDNS's configuration file. Open `pdns.conf` and make the following changes based on your existing working PowerDNS configuration:

```ini
# Enable Lua records
enable-lua-records=yes
# Add geoip after your current database backend
launch=gmysql,geoip
# Specify the database file path, using the highest-precision city-level database
geoip-database-files=/etc/geoip/GeoLite2-City.mmdb
```

Then start PowerDNS. If your host system is Debian Unstable, simply run:

```bash
systemctl start pdns
```

For Docker users, here's a reference for `docker-compose.yml`:

```yaml
powerdns:
  image: [Your custom Docker image]
  container_name: powerdns
  restart: always
  volumes:
    - './conf/powerdns/pdns.conf:/etc/powerdns/pdns.conf:ro'
    - '/etc/geoip:/etc/geoip:ro'
  ports:
    - '53:53'
    - '53:53/udp'
  depends_on:
    - mysql
```

## Adding Lua Resolution Records

In modern DNS resolution systems, DNS servers typically inform upstream servers of the user's IP step by step (known as EDNS), allowing servers to assign the nearest server address based on the user's IP.

In PowerDNS Lua, the user's IP address is available as the variable `bestwho`. However, if the user's DNS server doesn't inform upstream servers of the user's address, `bestwho` will point to the DNS server's address.

First, let's demonstrate how to use `bestwho`. Create a record of type `LUA` with the following content:

```bash
A ";if(bestwho:isIPv4()) then return bestwho:toString() else return '0.0.0.0' end"
```

The initial `A` indicates the record type to return. The following string is a small Lua program: if the source IP is IPv4, it returns the user's IP; otherwise, it returns `0.0.0.0` to indicate failure.

Similarly, we can create an IPv6 version. Create another record with the same name and type `LUA`:

```bash
AAAA ";if(bestwho:isIPv6()) then return bestwho:toString() else return '::' end"
```

Or use a TXT record to return connection information with port numbers:

```bash
TXT "bestwho:toStringWithPort()"
```

Or use a LOC record to return the geographical location inferred by GeoIP:

```bash
LOC "latlonloc()"
```

All these features can be seen at `whoami.lantian.pub`:

```bash
$ dig +short @1.1.1.1 whoami.lantian.pub
108.162.214.17

$ dig +short @1.1.1.1 AAAA whoami.lantian.pub
2400:cb00:12:1024::6ca2:d619

$ dig +short @1.1.1.1 TXT whoami.lantian.pub
"[2400:cb00:12:1024::6ca2:d626]:16668"

$ dig +short @1.1.1.1 LOC whoami.lantian.pub
34 3 15.840 N 118 14 38.400 W 0.00m 1m 10000m 10m
```

(Note: Cloudflare's 1.1.1.1 server intentionally disables EDNS, so it displays Cloudflare's server address here)

## Configuring GeoDNS

Now that we understand how PowerDNS Lua works, we can configure regional resolution records. PowerDNS provides a convenient function `pickclosest` that automatically selects the nearest server from an IP list for the user. For example, the current A record for `lantian.pub` is:

```bash
A "pickclosest({'103.42.215.193','185.186.147.110','107.172.134.89','195.154.221.59'})"
```

`pickclosest` also works for AAAA records:

```bash
AAAA "pickclosest({'2001:470:19:10bb::1','2001:470:d:46e::1','2001:470:1f07:54d::1','2001:470:1f13:28::1'})"
```

(The above servers are located in: Hong Kong, Los Angeles, New York, and France respectively)

This way, users from different regions get different resolution results:

```bash
# Mainland China
$ dig +short lantian.pub
103.42.215.193

# Los Angeles, USA
$ dig +short lantian.pub
185.186.147.110

# France
$ dig +short lantian.pub
195.154.221.59
```

Global ping latency also improves significantly. Achieving sub-100ms latency worldwide with a single server would be impossible:

![KeyCDN Global Ping Tool Results](/usr/uploads/202001/geodns-global-ping.png)

## Country-Based Resolution

Instead of selecting the nearest server based on geographical location, a better approach is country-based resolution—for example, the common setup of direct connections within China and using Cloudflare abroad. PowerDNS provides a useful function for this: `country`:

```bash
TXT ";if(country('CN')) then return 'YES' else return 'NO' end"
```

Test from inside and outside China:

```bash
# Mainland China
$ dig +short @103.42.215.193 TXT is-china.lantian.pub
"YES"

# Los Angeles, USA
$ dig +short @103.42.215.193 TXT is-china.lantian.pub
"NO"
```

Slightly modifying this code allows distributing traffic between China and overseas to different servers for A, AAAA, CNAME, etc.:

```bash
CNAME ";if(country('CN')) then return 'cdn-china.lantian.pub' else return 'cdn-overseas.lantian.pub' end"
```

## References

Find more functions in PowerDNS's official documentation:

[Lua Records - PowerDNS Authoritative Server Documentation](https://doc.powerdns.com/authoritative/lua-records/index.html)
```
