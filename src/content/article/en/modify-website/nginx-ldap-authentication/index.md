---
title: 'Configuring LDAP Authentication for nginx'
categories: Website and Servers
tags: [nginx, LDAP]
date: 2018-10-14 12:34:17
autoTranslated: true
---


My various servers host different services, each with its own username/password system, making unified management difficult. If my password were compromised in the future, changing them individually would be extremely tedious. Therefore, I want to use a dedicated service to manage usernames and passwords, with all other services obtaining authentication information from it.

LDAP is one of the commonly used authentication protocols. Not only do many applications natively support it (including Jenkins, pfSense, etc.), but through plugins, nginx can also support it, adding unified authentication management to any web-based service.

## Adding the Plugin

If your nginx is compiled from source, adding the LDAP plugin only requires three steps:

1. `apk add openldap-dev`
2. `git clone https://github.com/kvspb/nginx-auth-ldap.git`
3. `./configure --add-module=/path/to/nginx-auth-ldap`

I still deploy nginx using Docker. The Dockerfile can be found at [https://github.com/xddxdd/dockerfiles/blob/210f0f82c7bc1c0c3697d329b73ea31abea6b14a/nginx/Dockerfile][1], where the compilation parameters can be referenced.

## Configuring Authentication

After installing the plugin, first add an `ldap_server` configuration block in the http section of nginx.conf. To prevent a single point of failure from taking down the entire authentication service, I temporarily used JumpCloud's LDAP service with the following configuration:

```nginx
ldap_server jumpcloud {
    url ldap://ldap.jumpcloud.com/ou=Users,o=[Your JumpCloud LDAP ID],dc=jumpcloud,dc=com?uid?sub?(objectClass=posixAccount);
    binddn "uid=[LDAP Auth Username],ou=Users,o=[Your JumpCloud LDAP ID],dc=jumpcloud,dc=com";
    binddn_passwd "[LDAP Auth Password]";
    group_attribute "memberOf";
    group_attribute_is_dn on;

    max_down_retries 3;
    connections 1;
    referral off;

    require valid_user;
    satisfy any;
}
```

Then add the following content to the server block or location block you want to protect:

```nginx
location /private {
    auth_ldap "Forbidden";
    auth_ldap_servers jumpcloud;
}
```

This enables authentication using the specified LDAP server.

Note: The LDAP authentication plugin conflicts with the http_addition plugin. The specific symptom is that when both `auth_ldap` and `add_after_body` are enabled in the same location, after successful username/password authentication, nginx fails to send webpage data, causing the browser to spin until timeout. The temporary solution is to disable `add_after_body`:

```nginx
# LDAP auth doesn't work well with http_addition, disable it
add_after_body "";
```

After these steps, LDAP authentication will be enabled for the specified address. By using nginx as a reverse proxy for other internal services and blocking direct external access to those services, you can uniformly protect and authenticate these services with LDAP.

[1]:
  https://github.com/xddxdd/dockerfiles/blob/210f0f82c7bc1c0c3697d329b73ea31abea6b14a/nginx/Dockerfile
```
