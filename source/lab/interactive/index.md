---
title: '互动文章测试页'
date: 1970-01-01 00:00:00
---

Twine 系统
----------

{% twine twine.html %}

自制系统
-------

你准备把你的私人网络连进 DN42，首先你要选择一个 IP 段。

请做出你的选择：

{% interactive_buttons %}
next1 我要一个 /18
next1 我要一个 /20
next1 我要一个 /24
end1 我要一个 /27
{% endinteractive_buttons %}

{% interactive next1 %}
你突然发现，有一个和 DN42 相连的、叫 NeoNetwork 的网络，看起来有更充裕的地址。你决定：

{% interactive_buttons %}
next2 继续申请 DN42 地址
next2 去 NeoNetwork 玩了
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive next2 %}
你提交了 Pull Request，管理员要求你提供要这么一大块地址的理由。你说：

{% interactive_buttons vertical %}
next3 要和我签订契约吗？（指 NDA）
next4 我在公网已经有 /20 了
next4 我开了一家计算机博物馆
next5 我有一万个子网，各连了一万个设备
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive next3 %}
邮件列表里的同志们指出，用 NDA 的方式保护网络安全没什么用。你说：

{% interactive_buttons vertical %}
next5 我是有底线的人！（指防火墙）
next6 我就是喜欢，咋地？
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive next4 %}
邮件列表里的同志扫了一下你的公网网段，发现没几台机器是通的。你说：

{% interactive_buttons vertical %}
next5 我是有底线的人！（指防火墙）
next6 这有什么问题吗？（滑稽）
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive next5 %}
邮件列表里的同志问你能否用 NAT 来节省地址。你说：

{% interactive_buttons vertical %}
next6 我问 ARIN 要 /20 都没这么麻烦！
next6 我讨厌 NAT，就是不用！
end1 算了，又不是不能用
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive next6 %}
邮件列表里的成员一致反对你申请大块地址。

你决定：

{% interactive_buttons vertical %}
next7 我就要大块地址怎么了？
end1 算了，/24 也不是不能用
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive next7 %}
管理员把你的 PR 关掉了，还把你拉进了黑名单。

你决定：

{% interactive_buttons %}
end2 上邮件列表骂街
end2 这个管理员够不够格啊？
end2 Telegram 私聊骚扰管理员
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive end1 %}
你正常地申请了一小块地址，管理员正常地把 Pull Request 合进了仓库。

故事结束。
{% endinteractive %}

{% interactive end2 %}
你最终没能加入 DN42。

故事结束。
{% endinteractive %}
