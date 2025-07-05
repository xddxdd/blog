---
title: 'The Dumbest Code Mistake: A Tragedy Caused by a Single Space'
categories: Reposts
tags: [BumbleBee, Bug, Mistake]
date: 2014-01-04 12:09:00
image: /usr/uploads/2014/01/723043973.png
autoTranslated: true
---


Bumblebee is an auxiliary tool for NVidia graphics cards on the Linux platform. It enables NVidia cards to utilize Optimus technology, allowing laptops to render with dedicated graphics while displaying through integrated graphics—essentially hardware-accelerated graphics switching.

This is an extremely useful tool, but it once suffered a severe bug (though three years ago) where a single space caused the deletion of the `/usr` directory for a large number of Ubuntu users.

It happened during a Git update, with changes in `install.sh`:

```diff
@@ -37,7 +37,7 @@
  #    You should have received a copy of the GNU General Public License
  #    along with bumblebee.  If not, see <http://www.gnu.org/licenses/>.
  #
 -BUMBLEBEEVERSION=1.4.31
 +BUMBLEBEEVERSION=1.4.32


  ROOT_UID=0
 @@ -348,7 +348,7 @@ case "$DISTRO" in
    ln -s /usr/lib/mesa/ld.so.conf /etc/alternatives/gl_conf
    rm -rf /etc/alternatives/xorg_extra_modules
    rm -rf /etc/alternatives/xorg_extra_modules-bumblebee
 -  rm -rf /usr /lib/nvidia-current/xorg/xorg
 +  rm -rf /usr/lib/nvidia-current/xorg/xorg
    ln -s /usr/lib/nvidia-current/xorg /etc/alternatives/xorg_extra_modules-bumblebee
    ldconfig
   ;;
```

Due to a single space, the deletion command shifted from targeting `/usr/lib/nvidia-current/xorg/xorg` to deleting two separate directories: `/usr` and `/lib/nvidia-current/xorg/xorg`. The `/usr` directory is where all your programs reside, including `apt-get`...

On [GitHub](https://github.com/MrMEEE/bumblebee-Old-and-abbandoned/commit/a047be85247755cdbe0acce6#diff-1), programmers worldwide furiously mocked this bug:

"So I have to format my hard drive first?" "Yes, I usually use Bumblebee for formatting."

![/usr/uploads/2014/01/3298154581](/usr/uploads/2014/01/3298154581.png)

"Did you install Bumblebee?" "Yes, but I backed up the usr folder..."

![/usr/uploads/2014/01/2909647635](/usr/uploads/2014/01/2909647635.png)

"They will kill us, but they won't kill our usr"

![/usr/uploads/2014/01/723043973](/usr/uploads/2014/01/723043973.png)

"usr, why did you leave me?"

![/usr/uploads/2014/01/1115107318](/usr/uploads/2014/01/1115107318.png)

"Bumblebee, I need to have a word with you"

![/usr/uploads/2014/01/3261213394](/usr/uploads/2014/01/3261213394.jpg)

"usr? Gone since June 2011, lol."

![/usr/uploads/2014/01/4006259684](/usr/uploads/2014/01/4006259684.png)

SELinux and AppArmor are speechless...

![/usr/uploads/2014/01/2872907203](/usr/uploads/2014/01/2872907203.jpg)

"I installed Bumblebee on the company server, now I need to work..."

![/usr/uploads/2014/01/2792998614](/usr/uploads/2014/01/2792998614.jpg)

"I rarely back up, but when I do, it's always too late..."

![/usr/uploads/2014/01/2548332387](/usr/uploads/2014/01/2548332387.jpg)

Jobs: "Ever heard of Bumblebee?" Gates: "I recommend every Linux user install it."

![/usr/uploads/2014/01/1807140881](/usr/uploads/2014/01/1807140881.jpg)

Low Orbit Bumblebee Cannon:

![/usr/uploads/2014/01/3115206340](/usr/uploads/2014/01/3115206340.png)

"What's wrong with adding a space after /usr? That path doesn't exist." "I forgot to wrap the path in quotes..."

![/usr/uploads/2014/01/1434800310](/usr/uploads/2014/01/1434800310.png)

"My Führer, we installed Bumblebee on your machine."

![/usr/uploads/2014/01/1519896961](/usr/uploads/2014/01/1519896961.jpg)
```
