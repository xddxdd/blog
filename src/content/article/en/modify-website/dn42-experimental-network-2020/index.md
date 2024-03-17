---
title: 'DN42 Experimental Network: Intro and Registration (Updated 2022-12)'
categories: 'Website and Servers'
tags: [DN42, BGP]
date: 2021-05-02 12:21:45
---

DN42, aka Decentralized Network 42, is a large, decentralized VPN-based network.
But unlike other traditional VPNs, DN42 itself doesn't provide any VPN exits,
which means it doesn't allow you to bypass Internet censorships or unlock
streaming services. On the contrary, the goal of DN42 is to simulate another
Internet. It uses much of the technology running on modern Internet backbones
(BGP, recursive DNS, etc), and is a great replica of a real network environment.

In short, DN42 is:

- NOT suitable for users only seeking privacy protection or bypassing censorship
- NOT suitable for users consuming large amounts of bandwidth/data, such as for
  unlocking streaming services
- IS suitable for users learning about networking, practicing configuration of
  servers and routers, and even preparing for an AS on the real Internet
- IS suitable for users with a real AS, but is worried of
  [knocking out the Internet due to configuration errors](https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/),
  and want a test field.

Because of this, the bar to enter DN42 is a bit high. Just like the real
Internet, you will be playing the role of a ISP, register your personal ID, ASN,
IPv4 and IPv6 blocks, and announce your IP blocks on your server with BGP. You
also need to contact other users and peer with them, so you can enter the "real"
DN42 step by step.

DN42 is running on `172.20.0.0/14` and `fd00::/8`, IP blocks reserved for
internal usage. In other words, whatever you do on DN42 won't impact real
Interner connections.

## Changelog

- 2022-12: Add steps to use a free IPv4 block finder.
- 2022-06: Update to the latest registration procedure.
- 2022-02: Update `rp_filter` content, never use `rp_filter=2`!
- 2021-06: Improve readability of some config files, differ `contact` from
  `e-mail`.
- 2021-05: Add "Skills Required" section; Add iptables firewall rules.
- 2020-12: Fix peer config path for BIRDv2.
- 2020-10: No longer recommend using Debian Unstable repo for WireGuard (better
  ways exist now); Recommend using WSL on Windows.
- 2020-09: Update to the latest registration procedure.
- 2020-08: No longer recommend new users to go to Burble, following his policy
  update.
- 2020-07: DN42 Git server has changed from `git.dn42.us` to `git.dn42.dev`.
- 2020-05: Update `rp_filter` content, and suggest disabling UFW.
- 2020-04: Add suggestions for configuring your internal network across servers,
  request to not use too much resource, and add more detailed explanation of
  config choices.
- 2020-03: Explain the risk of choosing your own IPv6 ULA; Add "Very Important
  System Configuration" section; Add guides to create and upload GPG keys and
  sign git commits.

## Skill Requirements

This post assumes that you are already capable of:

1. You have a Linux environment (either dual-boot/virtual machine/VPS is fine).
2. You know how to use common Linux commands (`cd`, `ls`, etc), how to install
   packages on your Linux OS (`apt`, `yum`, etc.), and how to use at least one
   editor (either graphical editors like `gedit` or `vscode`, or command-line
   ones like `vim` or `nano`). If you don't know how to do this, please have a
   look at [this guide](https://ryanstutorials.net/linuxtutorial/).
3. You know basic usage of Git version control system, like push/pull/commit. If
   you don't, please have a look at
   [this guide](https://guides.github.com/introduction/git-handbook/).
4. You have a moderate level of knowledge in networking, know what IP and MAC
   addresses are, know the working principles of switches and routers, can do
   basic networking diagnosis under Linux (with `ping`, `traceroute`, etc.),
   have heard of dynamic routing protocols like BGP or OSPF. If you don't,
   please have a look at
   [this guide (Chapter 1-8)](https://www.cs.unh.edu/cnrg/people/gherrin/linux-net.html).

If you don't fulfill the knowledge required, it's very likely that you cannot
understand important aspects in this guide, make mistakes during the
configuration process, and cause trouble to other users in DN42.

## Registration Procedure

When I wrote my previous guide in 2017,
[Joining DN42 Experimental Network (Chinese Only)](/article/modify-website/join-dn42-experimental-network.lantian),
the user information as well as ASN and IP are all managed from a system called
Monotone. But in the year of 2018, DN42 gave up on Monotone and switched to Git.

**WARNING:** The registration procedure to DN42 is long and complicated since
the procedure to register ASN and IP in the real Internet is similar, and DN42's
goal is being a replicate to the real Internet.

**ATTENTION:**

- The procedure here may become outdated as DN42 updates its registration
  procedures. Please refer to DN42's official guides first, and use my guide
  only as reference.
- [DN42 Registration Procedure on Official Wiki](https://dn42.dev/howto/Getting-Started)
- [DN42 Git Guide (Creating Pull Request) on Official Wiki](https://git.dn42.dev/dn42/registry/src/branch/master/README.md)

In addition, since a bunch of UNIX tools (such as Git, GnuPG) are required in
the procedure:

- It's recommended to use Linux or macOS for the whole procedure.
- If you use Windows, you may try
  [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

Here are the steps:

1. First, go to [https://git.dn42.dev](https://git.dn42.dev) and register an
   account. This is the GitHub for DN42, and the account information is stored
   in one of the git repos.
2. Visit [dn42/registry](https://git.dn42.dev/dn42/registry), the account
   information repo, and click Fork on the top right. This will create a copy of
   the repo into your own account.
   - Previously you can directly create a branch in the repository, but now you
     need to fork the repo, just like what you do on GitHub and similar sites.
3. Now the page should automatically switch to the copy in your own account. Git
   clone it to your local machine.

4. Now, you need to create a series of files in the cloned repo, including:

   1. Create a file `[NICKNAME]-MNT` under `data/mntner` directory. This file is
      your account that authorizes your further operations. For example, this is
      my `mntner` file (available under `data/mntner/LANTIAN-MNT`):

      {% interactive_buttons vertical %} noop|Here is my registration info for
      reference only. noop|Read the document carefully and replace EVERYTHING
      with YOUR information. code1|I acknowledge the notes above, and I want to
      see the code. {% endinteractive_buttons %}

      {% interactive code1 %}

      ```bash
      mntner:             LANTIAN-MNT
      admin-c:            LANTIAN-DN42
      tech-c:             LANTIAN-DN42
      mnt-by:             LANTIAN-MNT
      source:             DN42
      auth:               pgp-fingerprint 23067C13B6AEBDD7C0BB567327F31700E751EC22
      auth:               ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCulLscvKjEeroKdPE207W10MbZ3+ZYzWn34EnVeIG0GzfZ3zkjQJVfXFahu97P68Tw++N6zIk7htGic9SouQuAH8+8kzTB8/55Yjwp7W3bmqL7heTmznRmKehtKg6RVgcpvFfciyxQXV/bzOkyO+xKdmEw+fs92JLUFjd/rbUfVnhJKmrfnohdvKBfgA27szHOzLlESeOJf3PuXV7BLge1B+cO8TJMJXv8iG8P5Uu8UCr857HnfDyrJS82K541Scph3j+NXFBcELb2JSZcWeNJRVacIH3RzgLvp5NuWPBCt6KET1CCJZLsrcajyonkA5TqNhzumIYtUimEnAPoH51hoUD1BaL4wh2DRxqCWOoXn0HMrRmwx65nvWae6+C/7l1rFkWLBir4ABQiKoUb/MrNvoXb+Qw/ZRo6hVCL5rvlvFd35UF0/9wNu1nzZRSs9os2WLBMt00A4qgaU2/ux7G6KApb7shz1TXxkN1k+/EKkxPj/sQuXNvO6Bfxww1xEWFywMNZ8nswpSq/4Ml6nniS2OpkZVM2SQV1q/VdLEKYPrObtp2NgneQ4lzHmAa5MGnUCckES+qOrXFZAcpI126nv1uDXqA2aytN6WHGfN50K05MZ+jA8OM9CWFWIcglnT+rr3l+TI/FLAjE13t6fMTYlBH0C8q+RnQDiIncNwyidQ==
      remarks:            pin-sha256:o1lfYvcdcYy81UIuZMZO1CkCLX+vJOdD5GLw1cmeStU=
      ```

      {% endinteractive %}

      - The items in the file are:
        - `mntner`: `maintainer`, the name for your account. Same as the file
          name.
        - `admin-c`: `admin contact`, points to a later created `person` file.
          Usually `[NICKNAME]-DN42`.
        - `tech-c`: `tech contact`, points to a later created `person` file.
          Usually `[NICKNAME]-DN42`.
        - `mnt-by`: `maintain by`, points to this account itself. Usually
          `[NICKNAME]-DN42`.
        - `source`: has a fixed value of `DN42`.
        - `auth`: your authentication info. Usually, two types of data are
          accepted: GPG public key and SSH public key.
          - You **MUST** add at least one out of GPG pubkey and SSH pubkey.
          - If you plan to add a GPG pubkey, you need to create one first
            (assuming you don't have one). You may follow
            [this guide by GitHub](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-gpg-key).
            You will also need the pubkey when submitting your registration
            request.
            - You also need to upload your GPG pubkey to a public server, aka
              Keyserver, for other people to obtain.
            - Run this command:
              - `gpg --keyserver hkp://keyserver.ubuntu.com --send-key [GPG Key ID]`
            - Then fill the key ID to `auth` item, with the format of
              `pgp-fingerprint [GPG Key ID]`, similar to my example above.
          - If you plan to add an SSH pubkey, you need to create one first
            (assuming you don't have one).
            - Running `ssh-keygen -t ed25519` is usually enough for Mac and
              Linux, but if you have a rather old version of SSH, which doesn't
              support ED25519 crypto, you may run `ssh-keygen -t rsa` instead to
              use RSA crypto.
            - For Windows, you can
              [download PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
              and use its `puttygen` utility.
            - After generation, add your pubkey (usually stored at `~/.ssh` and
              named `id_ed25519.pub` or `id_rsa.pub` on Mac and Linux; displayed
              straight on `puttygen` window after generation) to `auth` item,
              with format `ssh-ed25519 [SSH Pubkey]` or `ssh-rsa [SSH Pubkey]`.
            - In addition, some services on DN42 verify your identity with your
              SSH pubkey here.
          - Read DN42's
            [Registry Authentication Wiki Page](https://dn42.dev/howto/Registry-Authentication)
            for more information.
        - `remarks`: comments, fill with whatever content you like. Or you may
          simply remove them.
      - **ATTENTION:** There is a long sequence of spaces between the name and
        values. The length of this space sequence **cannot be changed to
        whatever you like, and cannot be replaced with TAB**. The length of the
        name, the colon, and the spaces **MUST be exactly 20 characters**.

   2. Create `[NICKNAME]-DN42` under `data/person`. This stands for your
      personal information, but what's actually needed is simply a mailbox.
      Here's my `person` file, for example (`data/person/LANTIAN-DN42`):

      {% interactive_buttons vertical %} noop|Here is my registration info for
      reference only. noop|Read the document carefully and replace EVERYTHING
      with YOUR information. code2|I acknowledge the notes above, and I want to
      see the code. {% endinteractive_buttons %}

      {% interactive code2 %}

      ```bash
      person:             Lan Tian
      e-mail:             b980120@hotmail.com
      contact:            telegram:lantian1998
      nic-hdl:            LANTIAN-DN42
      mnt-by:             LANTIAN-MNT
      source:             DN42
      ```

      {% endinteractive %}

      - The items in the file are:
        - `person`: your nickname.
        - `e-mail`: your e-mail address.
        - `contact`: optional, your contact information other than e-mail, e.g.
          IRC or Telegram.
        - `nic-hdl`: `NIC handle`, points to the file itself. It is the same as
          file name, `[NICKNAME]-DN42`.
        - `mnt-by`: `maintain by`, points to the `mntner` file you previously
          created, `[NICKNAME]-MNT`.
        - `source`: has a fixed value of `DN42`.

   3. Next, you need to choose for yourself an Autonomous System Number or ASN.
      On the real/global Internet, the ASN range 4200000000 - 4294967294 is
      reserved for private use, and DN42 occupies one small block in it,
      424242**0000** - 424242**3999**. **(Note that the range contains 4000 ASNs
      rather than 10000! The other 6000 ASNs aren't open to registration yet.)**
      Pick yourself an ASN in the range that you like and is not occupied, and
      create a file for it under `data/aut-num`. For example, I'm running
      AS4242422547, so I have the file `data/aut-num/AS4242422547`:

      {% interactive_buttons vertical %} noop|Here is my registration info for
      reference only. noop|Read the document carefully and replace EVERYTHING
      with YOUR information. code3|I acknowledge the notes above, and I want to
      see the code. {% endinteractive_buttons %}

      {% interactive code3 %}

      ```bash
      aut-num:            AS4242422547
      as-name:            LANTIAN-AS
      descr:              Peer with me at b980120@hotmail.com
      admin-c:            LANTIAN-DN42
      tech-c:             LANTIAN-DN42
      mnt-by:             LANTIAN-MNT
      source:             DN42
      ```

      {% endinteractive %}

      - The items in the file are:
        - `aut-num`: Your ASN.
        - `as-name`: Name for the AS, usually only visible in some network
          structure graphs of DN42. The recommended value is `[NICKNAME]-AS`.
        - `descr`: Description for the AS, usually only visible in some network
          structure graphs of DN42. Fill with whatever you like.
        - `admin-c`: `admin contact`, points to your `person` file,
          `[NICKNAME]-DN42`.
        - `tech-c`: `tech contact`, points to your `person` file,
          `[NICKNAME]-DN42`.
        - `mnt-by`: `maintain by`, points to your `mntner` file,
          `[NICKNAME]-MNT`.
        - `source`: has a fixed value of `DN42`.
      - If you have an ASN on the real Internet:
        - **You may choose to use your real, global ASN in DN42.** Simply use
          your own ASN in this step.
        - If you do this, you may run into a bit of trouble when peering with
          others：
          - When establishing a VPN connection, many people in DN42 use the last
            5 digits of your ASN as the port number. In this case, your public
            ASN may collide with an internal ASN in DN42.
          - If this happens, you need to talk to the other side, so you can
            connect to another port.
        - And your identity may need to be verified, such as checking if the
          mailbox match what's on the WHOIS information of your global ASN, etc.
          - I never experienced this sequence, and the verification procedure is
            my guess. Perhaps a more complicated procedure is required.
        - Generally, I suggest that you **register for a new ASN in DN42**. It's
          less hassle.

   4. Next, you start to choose your IP. Browse to `data/inetnum` folder, where
      all registered IPv4 blocks are stored. You need to find a free space and
      occupy it for your own use.

      - DN42's IPv4 addresses are in range `172.20.0.0/14`, or
        `172.20.0.0 - 172.23.255.255`.
        - However, a lot of IPv4 blocks are reserved for other purposes, and you
          cannot apply for them. Therefore,
        - **Please use the following tools to choose your IP block, instead of
          manually finding one in `data/inetnum`**.
        - **Please use the following tools to choose your IP block, instead of
          manually finding one in `data/inetnum`**.
        - **Please use the following tools to choose your IP block, instead of
          manually finding one in `data/inetnum`**.
          - <https://explorer.burble.com/free#/4>
          - <https://dn42.us/peers/free>
      - The smallest address block you can register in DN42 is `/29`, or 8 IPs.
        Out of which 6 IPs are usable for servers and devices, as the first IP
        is reserved for marking the address block, and the last IP is for
        broadcasting within the block.
        - For users who "just want a bit of experience", `/29` is enough.
      - If you satisfy any requirement below, `/29` is not enough for you, and
        you need to apply for a larger block:
        - You have more than 6 servers and devices
        - You plan to set up services like Anycast, which will occupy more IPs
        - Some devices that you use (for example, Mikrotik routers) may require
          `/30` blocks when establishing tunnels for peering.
          - In the later peering stage, Linux servers can set up point-to-point
            tunnels between any pair of single IPs, such as `172.22.76.185/32`
            to `172.21.2.3/32`. In addition, my address `172.22.76.185/32` may
            be reused for any number of tunnels, which means I can also set up
            `172.22.76.185/32` to `172.22.3.4/32`, etc. In short, I can peer
            with any number of people without extra IPs.
          - But if your device requires `/30`, one tunnel will occupy 4
            individual IP addresses, and your address cannot be reused. This is
            a waste of IP space.
          - In this case, you need to reserve a large number of IPs yourself.
            Since physical routers are relatively rare in DN42, your peer may
            not have reserved that many addresses. The `/30` block needs to be
            provided by you.
      - DN42 generally suggests registering for `/27`. The largest block you can
        directly register without additional steps is `/26`.
      - If you **REALLY have a lot of servers (more than 62)** that doesn't fit
        even a `/26`, then:
        - Your application won't be accepted immediately. In this case, you need
          to visit one of the places below, tell everyone that you need a larger
          block, state your reasons, and request a vote:
          - DN42's IRC channel ([here](https://wiki.dn42.us/services/IRC), under
            `public internet`)
          - DN42's mailing list
            ([here](https://wiki.dn42.us/contact#contact_mailing-list), under
            `Mailing list`)
      - **DO NOT REQUEST HUGE BLOCKS LIKE `/24` ON YOUR FIRST REGISTRATION!**
      - **DO NOT REQUEST HUGE BLOCKS LIKE `/24` ON YOUR FIRST REGISTRATION!**
      - **DO NOT REQUEST HUGE BLOCKS LIKE `/24` ON YOUR FIRST REGISTRATION!**
        - You may find a free `/24` and take a small block from it like `/27`.
          Later, when you need it, you may expand the block to `/24`.
      - **ESPECIALLY, DO NOT RESERVE `/24` AND IDLE IT!**
      - **ESPECIALLY, DO NOT RESERVE `/24` AND IDLE IT!**
      - **ESPECIALLY, DO NOT RESERVE `/24` AND IDLE IT!**

        - DN42's IPv4 addresses are scarce, just like public Internet.

      - When you finally finish choosing your IP block, create the file under
        `data/inetnum`. For example, one of my blocks is `172.22.76.184/29`, and
        the corresponding file is `data/inetnum/172.22.76.184_29`:

        {% interactive_buttons vertical %} noop|Here is my registration info for
        reference only. noop|Read the document carefully and replace EVERYTHING
        with YOUR information. code4|I acknowledge the notes above, and I want
        to see the code. {% endinteractive_buttons %}

        {% interactive code4 %}

        ```bash
        inetnum:            172.22.76.184 - 172.22.76.191
        netname:            LANTIAN-IPV4
        remarks:            Peer with me at b980120@hotmail.com
        descr:              Peer with me at b980120@hotmail.com
        country:            CN
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        nserver:            ns1.lantian.dn42
        nserver:            ns2.lantian.dn42
        status:             ASSIGNED
        cidr:               172.22.76.184/29
        source:             DN42
        ```

        {% endinteractive %}

      - The items in the file are:
        - `inetnum`: range of your IP block. If you don't know how to calculate
          this, you may deduce it from nearby blocks or use a
          [calculator](https://mxtoolbox.com/subnetcalculator.aspx).
        - `netname`: name of your IP block. Not really useful, fill with
          anything (but recommended to be `[NICKNAME]-IPV4`).
        - `remarks`: comments, fill with anything you like.
        - `descr`: description, fill with anything you like.
        - `country`: your country, CN for Mainland China, US for United States,
          etc.
        - `admin-c`: `admin contact`, points to your `person` file,
          `[NICKNAME]-DN42`.
        - `tech-c`: `tech contact`, points to your `person` file,
          `[NICKNAME]-DN42`.
        - `mnt-by`: `maintain by`, points to your `mntner` file,
          `[NICKNAME]-MNT`.
        - `nserver`: name servers for reverse resolving the IP block. If you
          don't know that this is or don't need this, remove the line.
        - `status`: has a fixed value of `ASSIGNED`.
        - `cidr`: range of your IP block, same as `inetnum` but in CIDR.
        - `source`: has a fixed value of `DN42`.

   5. IP registration is not done yet. You also need a `route` object to
      authorize your AS to use the address. Create a file under `data/route`,
      `data/route/172.22.76.184_29` for example:

      {% interactive_buttons vertical %} noop|Here is my registration info for
      reference only. noop|Read the document carefully and replace EVERYTHING
      with YOUR information. code5|I acknowledge the notes above, and I want to
      see the code. {% endinteractive_buttons %}

      {% interactive code5 %}

      ```bash
      route:              172.22.76.184/29
      descr:              Peer with me at b980120@hotmail.com
      origin:             AS4242422547
      mnt-by:             LANTIAN-MNT
      source:             DN42
      ```

      {% endinteractive %}

      - The items in the file are:
        - `route`: range of your IP block.
        - `descr`: description, fill with anything you like.
        - `origin`: AS you authorize to use this IP block. Fill with your ASN.
        - `mnt-by`: `maintain by`, points to your `mntner` file,
          `[NICKNAME]-MNT`.
        - `source`: has a fixed value of `DN42`.

   6. Since it's already the year 2020, you'd better also register an IPv6
      block. Create a file under `data/inet6num`.

      - DN42's IPv6 blocks are in the `fd00::/8` range, reserved for private
        use.
      - DN42's IPv6 blocks usually exist in `/48`. This ought to be enough for
        anybody.
        - Even if your router requires `/64` for IPv6 tunnels, there can be
          $2^{16} = 65536$ `/64` in a `/48`, enough to peer with everybody in
          DN42.
      - You may want to customize your block, filling it with contents like
        `deadbeef`.
        - First, I am **against you from doing this**!
        - First, I am **against you from doing this**!
        - First, I am **against you from doing this**!
          - Instead of an easy-to-remember IPv6 address, you may want
            [an easy-to-remember domain in DN42](/en/article/modify-website/register-own-domain-in-dn42.lantian)。
        - RFC4193 regulates that all IPv6 ULA addresses should be generated
          randomly to be **globally unique**.
          - If you customize your block, another user may have an address
            conflict while joining DN42. This causes trouble for both of you.
        - In addition, DN42 interconnects with similar experimental networks and
          shares the IPv6 ULA range with them.
          - Since DN42 **may not get complete address allocations from other
            networks**, your IPv6 block may still conflict with other networks,
            even when your IPv6 block isn't registered in DN42 Registry.
        - If such collision occurs, **you may need to renumber the IPv6 address
          of your whole network**.
        - By the way, DN42 admins have different opinions on customizing IPv6
          blocks. Some registered successfully, while others were denied.
          - So if you customized your block and got denied, **don't be
            surprised, just fix the problem**.
        - If you are **REALLY REALLY REALLY** sure that you want a customized
          address, DN42 admins may reply with the following message when you
          submit your registration request:
        - > Your inet6num violates RFC4193 section 3.2. Are you fully aware of
          > the consequences, and do you really want to continue? Being forced
          > to renumber your whole network really isn't fun.
        - If you are **REALLY REALLY REALLY** sure, reply `Yes, I'm sure`.
        - But keep in mind that some DN42 admins as well as myself are **against
          this behavior**.
      - Your best choice is a random IPv6 block. You may use some
        [random prefix generator](https://simpledns.plus/private-ipv6).

      - After generating your IPv6 block, create a file in `data/inet6num`
        similar to IPv4. For example I have `data/inet6num/fdbc:f9dc:67ad::_48`
        for `fdbc:f9dc:67ad::/48`:

        {% interactive_buttons vertical %} noop|Here is my registration info for
        reference only. noop|Read the document carefully and replace EVERYTHING
        with YOUR information. code6|I acknowledge the notes above, and I want
        to see the code. {% endinteractive_buttons %}

        {% interactive code6 %}

        ```bash
        inet6num:           fdbc:f9dc:67ad:0000:0000:0000:0000:0000 - fdbc:f9dc:67ad:ffff:ffff:ffff:ffff:ffff
        netname:            LANTIAN-IPV6
        descr:              Peer with me at b980120@hotmail.com
        country:            CN
        admin-c:            LANTIAN-DN42
        tech-c:             LANTIAN-DN42
        mnt-by:             LANTIAN-MNT
        nserver:            ns1.lantian.dn42
        nserver:            ns2.lantian.dn42
        status:             ASSIGNED
        cidr:               fdbc:f9dc:67ad::/48
        source:             DN42
        ```

        {% endinteractive %}

      - The items in the file are:
        - `inet6num`: range of your IP block. IPv6 ranges are easy to calculate,
          from all 0 to all f.
        - `netname`: name of your IP block. Not really useful, fill with
          anything (but recommended to be `[NICKNAME]-IPV6`).
        - `remarks`: comments, fill with anything you like.
        - `descr`: description, fill with anything you like.
        - `country`: your country, CN for Mainland China, US for United States,
          etc.
        - `admin-c`: `admin contact`, points to your `person` file,
          `[NICKNAME]-DN42`.
        - `tech-c`: `tech contact`, points to your `person` file,
          `[NICKNAME]-DN42`.
        - `mnt-by`: `maintain by`, points to your `mntner` file,
          `[NICKNAME]-MNT`.
        - `nserver`: name servers for reverse resolving the IP block. If you
          don't know that this is or don't need this, remove the line.
        - `status`: has a fixed value of `ASSIGNED`.
        - `cidr`: range of your IP block, same as `inetnum` but in CIDR.
        - `source`: has a fixed value of `DN42`.

   7. Then create a `route6` object under `data/route6`, to authorize your AS to
      use the IP range. For example I have `data/route6/fdbc:f9dc:67ad::_48`:

      {% interactive_buttons vertical %} noop|Here is my registration info for
      reference only. noop|Read the document carefully and replace EVERYTHING
      with YOUR information. code7|I acknowledge the notes above, and I want to
      see the code. {% endinteractive_buttons %}

      {% interactive code7 %}

      ```bash
      route6:             fdbc:f9dc:67ad::/48
      descr:              Peer with me at b980120@hotmail.com
      origin:             AS4242422547
      mnt-by:             LANTIAN-MNT
      source:             DN42
      ```

      {% endinteractive %}

      - The items in the file are:
        - `route6`: range of your IP block.
        - `descr`: description, fill with anything you like.
        - `origin`: AS you authorize to use this IP block. Fill with your ASN.
        - `mnt-by`: `maintain by`, points to your `mntner` file,
          `[NICKNAME]-MNT`.
        - `source`: has a fixed value of `DN42`.

5. Congratulations, you have created all files you need. Next, `cd` to the root
   folder of the git repo, run `git add .`, and run `git commit -S`, use your
   previously created GPG key to create a **GPG signed commit**.

   - If you have already committed, run `git commit --amend -S` sign your
     previous commit.
     - If you don't have a GPG key, remove `-S` from the command. This means you
       need to authenticate yourself with your SSH pubkey. See the following
       steps.
   - According to feedbacks, you may run into problems with GPG signing here if
     you're using Windows.

     - You may try
       [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10).
     - Alternatively, a possible solution is provided in the comment section.
       Run this command, then retry:

       ```bash
       export GPG_TTY=$(tty)
       ```

     - Alternatively, authenticate yourself with SSH pubkey instead of GPG. See
       the following steps.

6. If you committed multiple times before, you need to squash all of your
   changes into a single commit. Simply run the `./squash-my-commits` script to
   do so.
7. Since others may have changed the registry while you're adding your files,
   you need to update your repository:

   ```bash
   # Obtain registry updates
   git fetch origin master
   # Switch to your own branch
   git checkout lantian-20200901/register
   # Rebase your branch, effectively reapplying your changes on the latest registry
   # An editor will pop up after typing this line. You need to keep the "pick" in 1st line
   # and change all "pick" to "squash" starting from 2nd line (if they exist)
   # then save and exit your editor
   #
   # If you don't have a GPG key, remove -S from the command
   git rebase -i -S origin/master
   ```

8. Run `git push -f` to upload your changes to the Git server.
9. Back to [dn42/registry](https://git.dn42.dev/dn42/registry), send a Pull
   Request and wait for your information to be merged.

- If you're authenticating with SSH pubkey, firstly run `git log` to see the
  hash of your commit, then run this command and post the result along with your
  Pull Request:
  - `echo [commit hash] | ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n dn42`
  - Remember to replace with your commit hash and private key location.
- If there are some errors in your procedure or file contents, an admin will
  reply to your Pull Request, fix them accordingly.
- But you **don't need to close your previous Pull Request and create a new
  one** after fixing your problem. Simply `git commit` and `git push` and your
  later changes will be automatically linked to the Pull Request.
  - You need only one Pull Request per registration/information change.
- **Use ENGLISH** for Pull Requests!

After merging your information, you've officially obtained your address block
and may start peering with others.

## Finding a Peer Node

Since DN42 is a decentralized network, there is no official server to connect
to. You need to contact other users registered in DN42 just like you, create a
VPN tunnel connection and BGP session, to establish peering.

Here are some recommended places to find other users:

1. Use [DN42 PingFinder](https://dn42.us/peers). Submit your IP address, and
   server nodes of other users registered on PingFinder will test their latency
   to you. These node entries usually have e-mail addresses or links to their
   description pages for their DN42 AS. You may contact them with this
   information.
2. Go to DN42's [IRC channel](https://wiki.dn42.us/services/IRC).
3. Go to this [unofficial Telegram group](https://t.me/Dn42Chat).
4. ~~Directly go to Burble. Burble is a really active user in DN42 who has many
   nodes around the world. Visit
   [his peering info page](https://dn42.burble.com/peering) to see his server
   information and contacts.~~
   - To reduce network centrality and avoid single point failure, Burble now
     only accepts users with at least 2 already established peers.
5. Directly go to me. Click [here](/en/page/dn42/index.html) or the DN42 item on
   the top navbar to see my information and contacts.

You may peer with many people/nodes simultaneously. It increases the stability
of your network and prevents loss of connection when a single node fails.

Find a few nodes close to your server with low latency, and proceed downwards.

# Very Important System Configuration

- First, **MAKE SURE** that you enabled Linux's packet forwarding, or
  `ip_forwarding`.

  - There is no absolute "client" in DN42. Everyone's server is a router for
    others and needs to forward packets. The steps are:

    ```bash
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
    echo "net.ipv6.conf.default.forwarding=1" >> /etc/sysctl.conf
    echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.conf
    sysctl -p
    ```

  - By the way, if you configured a firewall like `iptables`, check the
    configuration and make sure they don't block packet forwarding.

- Then, **MAKE SURE** to disable Linux `rp_filter`'s strict mode:

  ```bash
  echo "net.ipv4.conf.default.rp_filter=0" >> /etc/sysctl.conf
  echo "net.ipv4.conf.all.rp_filter=0" >> /etc/sysctl.conf
  sysctl -p
  ```

  - `rp_filter` is a network security mechanism of the Linux kernel. It checks
    the packet's source address and the source network interface:
    - If set to 0 (disabled), allow all packets.
      - Some packets that cannot be replied to correctly (no entries in the
        routing table) will be processed by userspace applications, possibly
        consuming extra resources.
      - But the overhead should be tiny, so setting to 0 is no issue here.
    - If set to 1 (strict), if the packet doesn't come from the "best" network
      interface (or in other words, your machine will reply to the packet on a
      different network interface), the packet will be **dropped**.
      - Having different network interfaces for source and reply is **very
        common** in DN42, so **MAKE SURE** you don't set `rp_filter` to 1!
    - If set to 2 (relaxed), **in theory**, Linux will only drop packets that
      don't have a source address in the routing table, which means it doesn't
      know how to properly reply to them.
      - However, theory is just theory. In newer versions (5.0+) of the kernel,
        still, a lot of normal packets with correct source addresses are
        dropped. Therefore, don't use this mode, please stick to 0 instead.

- Then, **MAKE SURE** to turn off any tool that helps you configure `iptables`
  easily, such as UFW.
  - These easy tools may use some assumptions that are suitable for personal
    users but are not suitable for DN42, such as using conntrack.
    - Conntrack filters packets from links it hasn't seen before, effectively
      doing strict `rp_filter`.
  - I personally recommend you to configure iptable manually.

## Choose Tunnel Software

Almost every peering in DN42 is established on tunneling software (or VPN)
since:

- DN42 nodes are spread across the world, and tunneling provides basic
  encryption and protection;
- DN42 uses private addresses that will be dropped by firewalls on the Internet.
  What's worse, your ISP may think you are doing "IP Spoofing" which is a
  violation of ToS and cause catastrophic consequences.

But there are exceptions:

- Two nodes connected to the same internal network may be connected directly.
  - Examples are some NAT VPSes, or Alibaba Cloud servers with Classic
    Networking.

Here is my recommendation for tunneling software:

1. If you're using a Linux VPS or dedicated server, and you're not using OpenVZ
   or LXC, use WireGuard.

   - Pros:
     - Extremely easy to configure
     - Little resource consumption
     - Good security
   - Cons:
     - Lack of features, only allow point-to-point connections
     - Needs extra kernel modules
     - Layer 3 only and doesn't support bridging
   - If you're using OpenVZ or LXC, `wireguard-go` is not suggested. It's not
     updated as frequently, and it's reported by other users to have stability
     issues.
   - Installation, on Debian 10 (Buster) as an example:

     - First, add Debian Backports repo:

       - Edit `/etc/apt/sources.list`, add:

         ```bash
         deb http://deb.debian.org/debian buster-backports main
         ```

     - Then, use DKMS to install WireGuard kernel modules and management tools:
       - `sudo apt update`
       - `sudo apt install wireguard-tools wireguard-dkms`

2. If you're using OpenVZ or LXC VPS, use OpenVPN.

   - Pros:
     - Extremely wide usage
     - Tons of tutorials
     - No need for any extra kernel module
     - Choose between Layer 2 and Layer 2
   - Cons:
     - Being a bit complicated to configure
     - Less secure than WireGuard
   - Installation `sudo apt install openvpn supervisor`
   - Here, Supervisor is for managing processes. You may use others like
     `systemd`.

3. If you're using a hardware router from Cisco, Mikrotik, etc., you're usually
   restricted to GRE/IPSec:

   - Pros:
     - Wide use on hardware routers
   - Cons:
     - Difficult to configure, may need repeated communication/discussions

4. Or simply use plain GRE:

   - Pro:
     - Available on hardware routers
     - Easy to configure
   - Cons:
     - **NO ENCRYPTION! PLAINTEXT TRANSMISSION!**
     - **NO ENCRYPTION! PLAINTEXT TRANSMISSION!**
     - **NO ENCRYPTION! PLAINTEXT TRANSMISSION!**

5. On Linux servers, you may also use ZeroTier One for internal connections or
   for peering.
   - Pros:
     - Nice web interface
     - Fully automated IP assign
   - Cons:
     - May consume much CPU and RAM
     - Not widely accepted in DN42
   - Installation: `curl -s https://install.zerotier.com | sudo bash`

## Choose BGP Software

The BGP protocol is used to exchange route information between DN42 users. Here
is a list of widely used, BGP supported routing software:

1. BIRD Internet Routing Daemon **(v2)**

   - Supports various routing protocols, including BGP, OSPF, RIP, etc
   - Supports both IPv4 and IPv6
   - Clear configuration syntax yet powerful
   - ATTENTION: this is for BIRD2, which is different from BIRD1.
   - BIRD configuration is a bit complicated, so please refer to
     [DN42 Wiki's Bird2 Guide](https://wiki.dn42.us/howto/Bird2), where a
     copy-paste-able config is available.
   - You can directly use BIRD's official repo in Debian:

     ```bash
     wget -O - http://bird.network.cz/debian/apt.key | apt-key add -
     apt-get install lsb-release
     echo "deb http://bird.network.cz/debian/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/bird.list
     apt-get update
     apt-get install bird2
     ```

     You may refer to
     [BIRD's download page](https://bird.network.cz/?download&tdir=debian/).

2. BIRD Internet Routing Daemon **(v1)**

   - Split IPv4 and IPv6 into two processes compared to V2
   - And lack some features, like Multiprotocol BGP, OSPFv3, etc
     - But doesn't affect basic peerings
   - Refer to [DN42 Wiki's Bird1 Guide](https://wiki.dn42.us/howto/Bird), where
     a copy-paste-able config is available.
   - You can directly use BIRD's official repo in Debian:

     ```bash
     wget -O - http://bird.network.cz/debian/apt.key | apt-key add -
     apt-get install lsb-release
     echo "deb http://bird.network.cz/debian/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/bird.list
     apt-get update
     apt-get install bird
     ```

     You may refer to
     [BIRD's download page](https://bird.network.cz/?download&tdir=debian/).

3. Quagga / FRRouting
   - Syntax is similar to Cisco routers, so people with hardware router
     experiences may like this
   - Might be the only available option for some routing OSes (like pfSense)
   - Refer to [DN42 Wiki's Quagga Guide](https://wiki.dn42.us/howto/Quagga)
4. BGP functionality of hardware routers
   - Supported by router manufacturer, and is usually rock stable
   - But might be limited in terms of extended functionality
   - And the configuration is different per vendor, so you have to do your own
     research

## Building Internal Network

If you have multiple servers joining DN42, you need to configure your internal
network first. Your network needs to satisfy the following requirements to work
normally:

1. Proper communication (or pingable) between any two servers
   - Routers outside your AS are only responsible for sending the packet to your
     own AS, and the packet may enter from any node. Your own node needs to
     forward the packet to the correct node.
   - You may use these schemes:
     1. A full-mesh VPN with Tinc, ZeroTier One, etc., so any two servers can
        talk directly.
     2. $\frac{n (n-1)}{2}$ point-to-point tunnels with OpenVPN, WireGuard,
        etc., so any two servers can talk directly.
     3. **(Relatively Dangerous)** Use OpenVPN, WireGuard, etc., to create less
        than $\frac{n (n-1)}{2}$ tunnels, but make sure there is a path between
        any two servers (intermediate nodes allowed). Then use Babel, OSPF, RIP,
        etc., to find the path in your own network.
     - In this scheme, it's easy to make mistakes and **cause catastrophic
       failures**.
       - Some real examples are available at
         [How to Kill the DN42 Network](/en/article/modify-website/how-to-kill-the-dn42-network.lantian/).
     - Routing protocols, including Babel, OSPF, RIP, etc., can automatically
       detect the topology of your whole network and configure the routes.
     - But Babel, OSPF, RIP are only supposed to handle your internal routing,
       and **shouldn't be used to forward routes received externally from BGP!**
       - When BGP routing information is forwarded by Babel, OSPF, RIP,
         information such as source, route length, and BGP communities are all
         lost.
       - Therefore, your other nodes will think that the route **comes from your
         own network** and broadcast the route to others with your AS as the
         source.
       - In short: you will **hijack the whole DN42**.
     - Babel, OSPF, RIP should be strictly restricted to your own IP range.
       **External routing must be handled by BGP**.
     - If you have questions, seek help at
       [the unofficial Telegram group](https://t.me/Dn42Chat).
2. BGP configuration must satisfy one of:
   1. One BGP session between each of your two servers.
      - BGP has a feature that, within one AS, a BGP node will only broadcast
        routes that it **received externally** and **won't forward** routes it
        received from other internal nodes in the AS. It is to prevent any
        occurrence of route loops. Therefore, each server needs to establish BGP
        sessions with all other servers, so it can obtain a complete routing
        table.
      - If you have a lot of servers, you will have fun configuring each server
        by hand. You may consider writing a script or using any plan below.
   2. Configure one server as a `BGP Route Reflector` and establish BGP sessions
      with all other servers.
      - Route Reflector will manage and broadcast all routing information within
        the AS.
      - Compared to the last scheme, you will need to do substantially less
        configuration, but if the Route Reflector is down, your whole network is
        dead.
      - Note that I haven't tried this configuration and cannot provide any
        technical help.
      - If you have questions, seek help at
        [the unofficial Telegram group](https://t.me/Dn42Chat), where some users
        use this scheme.
   3. Configure a different private ASN at each node, and configure BGP
      Confederation.
      - ASN should be in the private ASN range 4200000000 - 4294967294, but not
        4242420000 - 4242429999 since it may overlap with other DN42 users.
      - With Confederation, multiple servers team together and appear as one AS
        when observed externally.
      - See
        [Bird BGP Confederation: Configuration and Emulation](/en/article/modify-website/bird-confederation.lantian).
      - If you have questions, seek help at
        [the unofficial Telegram group](https://t.me/Dn42Chat), where some other
        users also use this scheme.
3. **All your servers must finish the Very Important System Configuration.**

## "1xRTT Peering": Faster Peering

Most users in DN42 are in the United States or Europe. When I contact them from
China, due to the timezone differences, one communication cycle can be quite
lengthy. So we should configure our side as completely as possible based on the
public information of the other side. This makes debugging easier for others and
reduces the time consumption in repeated communications.

I have a list on my [DN42 Page](/en/page/dn42/index.html), including the
information I'll need when setting up the tunnel and BGP session and the steps
you should take.

Note that I don't have any special configuration/requirements, and the list is a
general requirement for almost any DN42 user. Therefore I suggest that you
follow the list and provide complete information.

Here is a copy of the list for reference:

@include "\_templates/dn42-experimental-network-2020/peer-en.md"

## Tunnel Setup: WireGuard

DN42 Wiki has a WireGuard configuration guide available. I made minor
modifications to it so that it's clearer.

First, run `wg genkey | tee privatekey | wg pubkey > publickey` to generate your
public/private key pair. This is the only authentication info in a WireGuard
tunnel, so don't leak the private key.

Then create a configuration file `[PEER_NAME].conf`:

@include "\_templates/dn42-experimental-network-2020/wireguard-en.md"

Then run `wg-quick up [PEER_NAME].conf` to set up the tunnel.

## Tunnel Setup: OpenVPN

DN42 Wiki also provided an OpenVPN configuration template. I made minor
modifications to it so that it's clearer.

@include "\_templates/dn42-experimental-network-2020/openvpn-en.md"

## Limit Traffic on DN42 Interfaces

The tunnel established during a DN42 peering usually allows traffic to any IP
(unless you set AllowedIPs for WireGuard), and this creates a risk: your peer
can inject packets destined for public IPs to your tunnel, and your node will
forward them to the public Internet, under your name. If your peer is exploiting
this for a network attack, you will be in great trouble.

Therefore, it's recommended that you set up iptables rules to block forwarding
from your peers to the Internet.

> Note: you don't need this if you only use WireGuard. WireGuard already has IP
> limitations built-in.

The following rules will restrict traffic to DN42 IP ranges on all interfaces
with name starting with `dn42-`:

```bash
iptables -N DN42_INPUT
iptables -A DN42_INPUT -s 172.20.0.0/14 -j ACCEPT
iptables -A DN42_INPUT -s 172.31.0.0/16 -j ACCEPT
iptables -A DN42_INPUT -s 10.0.0.0/8 -j ACCEPT
iptables -A DN42_INPUT -s 224.0.0.0/4 -j ACCEPT
iptables -A DN42_INPUT -j REJECT
iptables -A INPUT -i dn42+ -j DN42_INPUT

iptables -N DN42_OUTPUT
iptables -A DN42_OUTPUT -d 172.20.0.0/14 -j ACCEPT
iptables -A DN42_OUTPUT -d 172.31.0.0/16 -j ACCEPT
iptables -A DN42_OUTPUT -d 10.0.0.0/8 -j ACCEPT
iptables -A DN42_OUTPUT -d 224.0.0.0/4 -j ACCEPT
iptables -A DN42_OUTPUT -j REJECT
iptables -A OUTPUT -o dn42+ -j DN42_OUTPUT

ip6tables -N DN42_INPUT
ip6tables -A DN42_INPUT -s fd00::/8 -j ACCEPT
ip6tables -A DN42_INPUT -s fe80::/10 -j ACCEPT
ip6tables -A DN42_INPUT -s ff00::/8 -j ACCEPT
ip6tables -A DN42_INPUT -j REJECT
ip6tables -A INPUT -i dn42+ -j DN42_INPUT

ip6tables -N DN42_OUTPUT
ip6tables -A DN42_OUTPUT -d fd00::/8 -j ACCEPT
ip6tables -A DN42_OUTPUT -d fe80::/10 -j ACCEPT
ip6tables -A DN42_OUTPUT -d ff00::/8 -j ACCEPT
ip6tables -A DN42_OUTPUT -j REJECT
ip6tables -A OUTPUT -o dn42+ -j DN42_OUTPUT

iptables -A FORWARD -i dn42+ -j DN42_INPUT
iptables -A FORWARD -o dn42+ -j DN42_OUTPUT

ip6tables -A FORWARD -i dn42+ -j DN42_INPUT
ip6tables -A FORWARD -o dn42+ -j DN42_OUTPUT
```

## BGP Session Setup: BIRD v1 & v2

I will only talk about the configuration of BIRD v1 and v2 since they are the
most widely used. I assume you have finished the setup following the Wiki but
don't have any peers.

- [DN42 Wiki's Bird2 Guide](https://wiki.dn42.us/howto/Bird2)
- [DN42 Wiki's Bird1 Guide](https://wiki.dn42.us/howto/Bird)

For BIRD v1, what you need is:

@include "\_templates/dn42-experimental-network-2020/bird1-en.md"

For BIRD v2, what you need is:

@include "\_templates/dn42-experimental-network-2020/bird2-en.md"

## Network Test & Bonus

After finishing all the setup above, you have successfully entered the DN42
network. Now you can perform some tests:

- `ping 172.20.0.53` or `ping 172.23.0.53`, this is the Anycast DNS in DN42.
- `ping 172.23.0.80`, this is the internal IP address of DN42 Wiki.
- Try
  [Internal Services on DN42 Wiki](https://wiki.dn42.us/internal/Internal-Services),
  [Burble's Services](https://dn42.burble.com/home/burble-dn42-services).

You can also challenge yourself and change your tunnel and BGP config, add more
functionalities and improve performance and/or safety:

- ROA, or Route Origin Authorization, checks if a route comes from the AS it's
  supposed to. For example, my `172.22.76.184/29` should come from `4242422547`.
  Routes failing the check will be rejected;
  - DN42 Wiki has a ROA configuration guide for BIRD: see
    [Bird2](https://wiki.dn42.us/howto/Bird2) or
    [Bird1](https://wiki.dn42.us/howto/Bird)
- Community Filter, that assigns scores to links in DN42 based on latency,
  bandwidth, and encryption, and selects a faster route based on them
  - For Bird1, refer to
    [DN42 Wiki's Bird Communities Page](https://wiki.dn42.us/howto/Bird-communities).
    For Bird2, changes are needed, and you may try out yourself
- Anycast, aka multiple servers announcing the same IP, so that external
  requests will be directed to the nearest server
  - Usually used for DNS on the global Internet, but in DN42, the Wiki
    (172.23.0.80) is also anycasted.
  - I've written two posts on this, one in last year and one in this year: see
    [Building Anycast DNS with Docker in DN42](/en/article/modify-website/dn42-docker-anycast-dns.lantian)
    and
    [Sharing Network Namespace Among Docker Containers for Bird Anycasting](/en/article/modify-website/docker-share-network-namespace-bird-high-availability.lantian).
- Build your own recursive or authoritative DNS server
  - You may even apply to join DN42's DNS Anycast and become a DN42 official DNS
    server.
- Register a domain and create a website
  - See my post in 2018:
    [Register Domain in DN42](/en/article/modify-website/register-own-domain-in-dn42.lantian)
- Or register an AS on the real Internet with RIPE, rent a public IPv4 and IPv6
  address pool, and start doing it for real.

## Need Help?

Remember: DN42 is an **experimental network** where everyone helps everyone.
Nobody is going to blame you if you screwed up. You may seek help at DN42's
[IRC channel](https://wiki.dn42.us/services/IRC),
[mailing list](https://wiki.dn42.us/contact#contact_mailing-list) or the
[unofficial Telegram group](https://t.me/Dn42Chat).
