---
title: 'LT NoLitter: An Xposed Module to Prevent Android Apps from Creating Random Folders'
categories: Computers and Clients
tags: [Android]
date: 2017-01-31 23:17:27
autoTranslated: true
---


The Android system provides user-accessible storage space, allowing users to manage their files with ease (compared to iOS). However, some applications create numerous folders directly in the storage root directory, disrupting file management and posing a significant nuisance for users with organizational preferences.

To address this, I developed an Xposed module. This module hooks into Android's File class. Whenever an app attempts to read or write files/folders in the root directory, the module first checks if the target exists. If it exists, the operation proceeds normally; if not, the operation is redirected to the `/Android/files` directory.

Compared to XInternalSD, this approach effectively handles undisciplined apps that bypass Android's storage path APIs by directly writing to generic paths like `/sdcard`. XInternalSD only modifies retrieved storage paths, making it ineffective in such cases.

Compared to SD redirect solutions, this method eliminates complex configuration. Users simply need to whitelist their file manager app during setup, then delete or move unwanted root directory folders to `/Android/files`. Should you later want an app to store data in a specific root directory folder, just create that folder directly.

Project address: [https://github.com/xddxdd/lantian-nolitter][1]

[1]: https://github.com/xddxdd/lantian-nolitter
```
