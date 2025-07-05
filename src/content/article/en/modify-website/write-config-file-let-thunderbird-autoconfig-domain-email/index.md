---
title: 'Writing Configuration Files to Enable Thunderbird Auto-Configuration for Domain Email'
categories: Website and Servers
tags: [Email, Thunderbird, Domain Email]
date: 2018-06-01 14:45:00
image: /usr/uploads/2018/06/1206081669.png
autoTranslated: true
---


Many people have set up email systems on their own domain names. I also use Zoho's domain email service for my main site lantian.pub. However, a major drawback of using domain email is that it's difficult to remember server addresses for POP3, IMAP, SMTP, etc. When reinstalling systems or email clients requires reconfiguration, you have to log back into the email system to check server addresses, which is quite troublesome.

If you use the Thunderbird email client, you may notice during account setup that Thunderbird has a "Retrieve settings from email provider" process. This essentially requests an XML document from the domain's web server containing email server configurations. By manually creating this configuration file and hosting it on your web server, you can enable automatic Thunderbird configuration.

## Creating the Configuration File

The configuration file stores information such as POP3, IMAP, and SMTP server addresses, port numbers, and usernames. For the Zoho email system used by this site, the configuration file is as follows:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="lantian.pub">
    <domain>lantian.pub</domain>
    <displayName>Lan Tian @ Mail</displayName>
    <displayShortName>Lan Tian Mail</displayShortName>
    <incomingServer type="imap">
      <hostname>imappro.zoho.com</hostname>
      <port>993</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <incomingServer type="pop3">
      <hostname>poppro.zoho.com</hostname>
      <port>995</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>smtp.zoho.com</hostname>
      <port>465</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </outgoingServer>
  </emailProvider>
</clientConfig>
```

This XML file records domain names, ports, encryption methods, and authentication methods for IMAP, POP3, and SMTP servers. If you also use Zoho, simply replace `lantian.pub` with your domain.

For other email systems, replace the server addresses accordingly. However, you might encounter "incorrect username/password" errors after replacement. This occurs because email clients may send credentials in plaintext or MD5-encrypted form. If the server doesn't support a specific method, issues arise.

To determine supported authentication methods:  
1. Open Thunderbird and select "Manual config" in account setup  
2. Enter server details and set "Authentication" to "Autodetect":  

![Thunderbird Adding Account][1]  

3. Click "Re-test":  

![Thunderbird Server Authentication Method Changes][2]  

The authentication field will update:  
- "Normal password" = plaintext → `password-cleartext` in XML  
- "Encrypted password" = MD5 encryption → `password-encrypted`  

For advanced configurations, refer to Mozilla's official articles:  
[Autoconfiguration in Thunderbird][3]  
[Autoconfig: How to create a configuration file][4]  

## Uploading the Configuration File

Thunderbird checks these two locations for configurations:  
1. `http://autoconfig.yourdomain.com/mail/config-v1.1.xml?emailaddress=[your-email]`  
2. `http://yourdomain.com/.well-known/autoconfig/mail/config-v1.1.xml`  

Place the file in either location. When successfully configured, Thunderbird will show:  
![Thunderbird Automatically Detects Configuration][5]  
(Note the prompt: "Configuration found at email provider")

[1]: /usr/uploads/2018/06/689399879.png
[2]: /usr/uploads/2018/06/2691471279.png
[3]: https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Autoconfiguration
[4]: https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Autoconfiguration/FileFormat/HowTo
[5]: /usr/uploads/2018/06/1206081669.png
```
