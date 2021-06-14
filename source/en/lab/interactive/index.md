---
title: 'Interactive Document Test Page'
date: 1970-01-01 00:00:00
---

Twine System
------------

{% twine twine.html %}

Self-built System
-----------------

Use the case options below to perform tests.

{% interactive_buttons vertical lg %}
t1 Case 1
t2 Case 2
t3 Nothing
{% endinteractive_buttons %}

{% interactive t1 %}
Case 1
{% interactive_buttons vertical %}
t11 Case 1-1
t12 Case 1-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t2 %}
Case 2
{% interactive_buttons vertical %}
t21 Case 2-1
t22 Case 2-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t11 %}
Case 1-1
{% interactive_buttons sm %}
t111 Case 1-1-1
t112 Case 1-1-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t12 %}
Case 1-2
{% interactive_buttons sm %}
t121 Case 1-2-1
t122 Case 1-2-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t21 %}
Case 2-1
{% interactive_buttons sm %}
t211 Case 2-1-1
t212 Case 2-1-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t22 %}
Case 2-2
{% interactive_buttons sm %}
t221 Case 2-2-1
t222 Case 2-2-2
{% endinteractive_buttons %}
{% endinteractive %}

{% interactive t111 %}
Case 1-1-1
{% endinteractive %}

{% interactive t112 %}
Case 1-1-2
{% endinteractive %}

{% interactive t121 %}
Case 1-2-1
{% endinteractive %}

{% interactive t122 %}
Case 1-2-2
{% endinteractive %}

{% interactive t211 %}
Case 2-1-1
{% endinteractive %}

{% interactive t212 %}
Case 2-1-2
{% endinteractive %}

{% interactive t221 %}
Case 2-2-1
{% endinteractive %}

{% interactive t222 %}
Case 2-2-2
{% endinteractive %}
