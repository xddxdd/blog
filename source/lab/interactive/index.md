---
title: '互动文章测试页'
date: 1970-01-01 00:00:00
---

使用下面的支线选项进行测试。

{% interactive_buttons vertical lg %}
t1 支线 1
t2 支线 2
t3 不存在的
{% endinteractive_buttons %}

{% interactive t1 %}
支线 1
{% interactive_buttons vertical %}
t11 支线 1-1
t12 支线 1-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t2 %}
支线 2
{% interactive_buttons vertical %}
t21 支线 2-1
t22 支线 2-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t11 %}
支线 1-1
{% interactive_buttons sm %}
t111 支线 1-1-1
t112 支线 1-1-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t12 %}
支线 1-2
{% interactive_buttons sm %}
t121 支线 1-2-1
t122 支线 1-2-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t21 %}
支线 2-1
{% interactive_buttons sm %}
t211 支线 2-1-1
t212 支线 2-1-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t22 %}
支线 2-2
{% interactive_buttons sm %}
t221 支线 2-2-1
t222 支线 2-2-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t111 %}
支线 1-1-1
{% endinteractive %}

{% interactive t112 %}
支线 1-1-2
{% endinteractive %}

{% interactive t121 %}
支线 1-2-1
{% endinteractive %}

{% interactive t122 %}
支线 1-2-2
{% endinteractive %}

{% interactive t211 %}
支线 2-1-1
{% endinteractive %}

{% interactive t212 %}
支线 2-1-2
{% endinteractive %}

{% interactive t221 %}
支线 2-2-1
{% endinteractive %}

{% interactive t222 %}
支线 2-2-2
{% endinteractive %}
