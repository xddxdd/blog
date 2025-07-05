---
title: 'Debian VPS Setup for Sending Emails via SMTP'
categories: Website and Servers
tags: [WordPress, SMTP, sendmail]
date: 2014-08-02 21:15:32
autoTranslated: true
---


In a blog, when the author replies to a visitor's comment, it's difficult for the visitor to notice the reply unless they revisit the page. However, with the comment reply email notification feature, visitors receive an email when the author or another visitor replies to their comment, allowing them to promptly learn about the response.

In the widely used WordPress blog system, emails are typically sent via the system's default sendmail, which often ends up in spam folders. Therefore, we usually opt for email services like Tencent, Microsoft, or Google that provide domain-specific email solutions, which require sending emails via SMTP. The issue is that sendmail doesn't natively support SMTP, though this can be resolved using plugins within the blog system.

However, this approach has limitations. If the VPS provider blocks port 25 (the standard SMTP port), blog systems that don't support SSL-encrypted SMTP will fail to send emails. Additionally, if your VPS hosts multiple websites with different platforms, configuring each one individually is cumbersome and error-prone.

Therefore, we can solve this by installing SMTP email-sending software directly on the VPS.

eSMTP is a sendmail syntax-compatible tool that redirects sendmail-generated emails through SMTP.

Log in to your VPS and enter the following commands:

```bash
sudo apt-get install esmtp
sudo ln -s /usr/bin/esmtp /usr/bin/sendmail
sudo nano /etc/esmtprc
```

After `hostname=`, enter the SMTP server address. If it's not using port 25, specify the port (e.g., Gmail uses `smtp.gmail.com:587`).  

After `username=`, enter your email address.  
After `password=`, enter your email password.  

If the mail server supports StartTLS (like Gmail), change `starttls=` from `disabled` to `enabled`.  

After `mda=`, enter `"/usr/bin/procmail -d %T"` (including quotes).  

The final file should resemble:

```bash
# Config file for ESMTP sendmail

# The SMTP host and service (port)
hostname=smtp.gmail.com:587

# SECURITY WARNING: Do NOT set username and password in the system wide
# configuration file unless you are the only user of this machine. See
# esmtprc(5).

# The user name
username=email@gmail.com

# The password
password=your_password

# Whether to use Starttls
starttls=enabled

# The certificate passphrase
#certificate_passphrase=

# The Mail Delivery Agent
mda="/usr/bin/procmail -d %T"
```

Press `Ctrl+X` to save and exit.

Modify your `php.ini` file, locate the `sendmail_path` line, and change it to:

```bash
sendmail_path = /usr/bin/esmtp -t -i
```

Save the changes, then run:

```bash
sudo service apache2 restart  # If using Apache2
sudo service php5-fpm restart # If using nginx or other php5-fpm setups
```

Configuration complete. You can now send a test email from your blog system to verify.
