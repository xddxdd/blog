---
title: 'Win7 Laptop Broadcasting Wireless Network'
categories: Computers and Clients
tags: [Windows, Wireless Network]
date: 2013-07-30 10:31:44
autoTranslated: true
---


A few words first.

1. Moved to a new place.
2. Just had internet installed, with the interface in the living room.
3. No air conditioning in the living room.

Device situation: Two laptops (Macbook and Win7), one phone (seems useless). Requirement:  
Use the Win7 laptop to broadcast a wireless network.

Tried with Macbook, but it could only create an Adhoc hotspot, which my Android phone didn't recognize. Tried Win7's built-in network creation—also Adhoc. Phone didn't recognize it, and although Macbook detected it, connection failed.

Background introduction complete. Main text begins.

1. Start Menu → Programs → Accessories. Right-click and open Command Prompt as Administrator. Enter the command:

```bash
netsh wlan set hostednetwork mode=allow ssid=lantian key=lantian.pub
```

Change "lantian" to your desired network name and "lantian.pub" to your password (minimum 8 characters).

2. Open Network and Sharing Center. Find the newly appeared wireless network (should include "Microsoft Virtual WiFi Miniport Adapter"). Rename it, e.g., "WiFi Hotspot" (optional, but keep it identifiable).  
If disabled, enable it. If it doesn't appear, see PS at the end.

3. Check all network connections. Set all IP configurations to automatic assignment.  
(Can skip initially, but errors may occur later if omitted)

4. Right-click your external connection (for ADSL: "Broadband Connection"; for LAN: "Local Area Connection").  
Properties → Sharing → Check "Allow other network users to connect through this computer’s Internet connection".  
Under "Home networking connection", select "WiFi Hotspot" (the newly created network).  

If you see the English prompt "Internet Connection Sharing cannot be enabled...", execute Step 3.

5. In Command Prompt, enter:

```bash
netsh wlan start hostednetwork
```

Setup complete. All devices can now connect to the internet.

PS: If the wireless network doesn’t appear, update your wireless card driver to the latest using tools like Driver Genius or Driver Life. If still unsuccessful, your network card doesn’t support this feature—give up.
```
