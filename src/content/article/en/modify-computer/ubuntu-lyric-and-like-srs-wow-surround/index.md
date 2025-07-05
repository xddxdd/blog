---
title: 'Installing LRC Lyrics Display Plugin and Enabling SRS WOW-like Sound Effects in Ubuntu'
categories: Computers and Clients
tags: [Music, Tinkering, Linux]
date: 2013-03-09 11:40:45
image: /usr/uploads/2013/03/2013-03-09-113429的屏幕截图.png
autoTranslated: true
---


My ASUS laptop originally had a sound card driver in Windows 7 that included a technology called ASUS Sonic Focus. Its principle involves adjusting the audio equalizer to create a psychological Dolby surround effect, making listeners perceive the sound as spatial. After enabling Sonic Focus, I found the audio quality significantly improved. (I'm not an audiophile.)

However, on Ubuntu, there's naturally no Sonic Focus – ASUS wouldn't bother supporting such a rapidly evolving system. Dolby and SRS also don't provide Linux support, so the open-source community developed Extra Stereo to replicate these features. There's also Crystalizer, which enhances high-frequency loudness for clearer sound. Those who've used Creative Sound Blaster or X-Fi cards should be familiar with this.

Meanwhile, the most frustrating aspect of listening to music on Ubuntu is the lack of lyrics. Rhythmbox claims to have automatic lyric downloading, but it simply didn't work for me... I had to search for alternatives myself.

That's when I discovered OSD Lyrics.

> OSD Lyrics is a lyrics show compatible with various media players. It is not a plugin but a standalone program. OSD Lyrics shows lyrics on your desktop, in the style similar to KaraOK. It also provides another displaying style, in which lyrics scroll from bottom to top. OSD Lyrics can download lyrics from the network automatically.

This software displays desktop lyrics and supports Audacious, Banshee (pre-installed in Ubuntu 12.04 or 11.10, I forget which), Rhythmbox (pre-installed in Ubuntu 12.10), and others. Its effects resemble Kuwo or similar players, and it can automatically search/download lyrics from the Qianqian Jinting lyrics database. The official PPA repository allows direct installation:

```bash
sudo add-apt-repository ppa:osd-lyrics/ppa
sudo apt-get update
sudo apt-get install osdlyrics
```

By default, lyrics are stored in `~/.lyrics`, which is inconvenient. I prefer storing them with the music files. Open OSD Lyrics (it will prompt you to select a player), click the icon in the top-right corner → Options → Lyrics Location. Clear the path field except for `%`, and the filename field except for `%f`.

### 2. Enabling SRS WOW-like Sound Effects

This is trickier since Extra Stereo isn't a standalone install or driver-level feature. We need a compatible player. Currently supported players include MPlayer (SMPlayer) and Audacious. For music, we'll use Audacious.

```bash
sudo apt-get install audacious
```

After installation, open Audacious. Go to the top menu: Output → Effects, where you'll find both Crystalizer and Extra Stereo.

**PS:** For standard computer speakers:
- Extra Stereo: Set around 2.8 (values >3.5 cause distortion)
- Crystalizer: Set around 2 (values >3 cause distortion)
- Echo: Configure as 180, 28, 24 (top to bottom)

For SMPlayer, you can either adjust settings per video or add them to MPlayer's launch parameters. Go to Menu → Options → Preferences → Advanced. In the "Execute the following actions each time a file is opened" field, add:

```bash
extrastereo_filter true
```

Save the settings. Alternatively, enable manually via Menu → Audio → Filters → Extra Stereo.
```
