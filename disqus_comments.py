import re
import sys

s = sys.stdin.read()

s = re.sub(r'<style([^>]*)>([^<]*)</style>', '', s)
s = s.replace(' | ', '')
s = s.replace(' - ', '')
s = s.replace('Lan Tian @ Blog', '')
s = s.replace('https://lantian.pub', '')
s = re.sub(r'&[a-z]*;', '', s)

s = re.sub(r'<span class="dsq-widget-comment">(.*?)</span>',
           lambda s: '<span class="dsq-widget-comment">' + re.sub(r'<[^>]*>', '', s.group()) + '</span>', s)

print(s, end='')
