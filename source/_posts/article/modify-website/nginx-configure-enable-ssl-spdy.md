---
lang: zh
title: 'nginx 配置并启用SSL和SPDY访问'
label: nginx-configure-enable-ssl-spdy
categories: 网站与服务端
tags: [SPDY,nginx,StartSSL,SSL]
date: 2014-08-08 14:41:00
---
来自 CloudFlare 博客的最新消息（<a href="http://blog.cloudflare.com/google-now-factoring-https-support-into-ranking-cloudflare-on-track-to-make-it-free-and-easy" _src="http://blog.cloudflare.com/google-now-factoring-https-support-into-ranking-cloudflare-on-track-to-make-it-free-and-easy">http://blog.cloudflare.com/google-now-factoring-https-support-into-ranking-cloudflare-on-track-to-make-it-free-and-easy</a> ），Google可能会在算权重的时候把网站支持SSL作为加分项目。因此我就给我的博客启用了SSL。</p><h2>1.申请证书<br/></h2><p>SSL，在服务器端必须有证书。这个证书最好不要自己生成，否则大多数浏览器都会提示证书不受信任。

StartSSL是目前唯一一家颁发免费SSL证书并且受到大多数浏览器信任的证书颁发机构，可以根据 <a href="http://www.freehao123.com/startssl-ssl/" _src="http://www.freehao123.com/startssl-ssl/">http://www.freehao123.com/startssl-ssl/</a> 这篇文章进行操作。

不过在实际操作中，由于StartSSL连接速度较慢，如果按照向导生成证书，中途可能卡住，而一旦卡住就要全部重来，我们可以自己生成证书请求，然后提交。</p><ol class=" list-paddingleft-2" style="list-style-type: decimal;"><li><p>在你的Linux服务器（本例为Debian 7）上输入以下命令产生一个私钥：</p></li><li>```bash
openssl genrsa -out privkey.pem 4096```<p><br/></p></li><li><p>输入以下命令产生证书请求（CSR文件），其中信息可以乱填，StartSSL不关心其中信息，他只关心你的私钥是多少。</p></li><li>```bash
openssl req -new -key privkey.pem -out cert.csr```</li><li>```bashcat cert.csr
```<p><br/></p></li><li><p>把第五步的输出复制。</p></li><li><p>按照上面这篇文章操作，执行到这一步时选择Skip，然后粘贴入你的证书请求，然后下一步。</p></li></ol><p><img src="/usr/uploads/16501407479649.gif" title="startssl_19.gif"/></p><h2>2.安装证书<br/></h2><p>完成上面的步骤后，你应该（至少）有两个文件：一个是你的私钥，一个是证书文件。

如果你手动生成证书请求csr文件，那么privkey.pem就是你的私钥；如果你通过网页向导生成，私钥已经在向导过程中给出。</p><ol class=" list-paddingleft-2" style="list-style-type: decimal;"><li><p>把你的证书保存为ssl.crt，以下操作将按照本文件名继续。如果你通过网页向导操作，把你的私钥保存到ssl.key。</p></li><li><p>如果通过网页向导操作，输入以下命令对你的私钥解密，密码是你在网页向导上填写的那个。如果不解密，每次nginx启动时都会要求你输入密码。</p></li><li>```bashopenssl rsa -in ssl.key -out privkey.pem
```<p><br/></p></li><li><p>Firefox在证书验证上比较奇葩，它要求证书文件中保存有这个证书的颁发机构的证书。因此我们要进行如下操作：</p></li><li>```bashwget http://www.startssl.com/certs/ca.pem
wget http://www.startssl.com/certs/sub.class1.server.ca.pem
cat ssl.crt sub.class1.server.ca.pem ca.pem > ssl-unified.crt```<p><br/></p></li><li><p>此时你获得一个ssl-unified.crt文件，把它和privkey.pem移动到你喜欢的地方。</p></li><li><p>（警告：不要复制到能够通过网页访问来下载的地方，比如把他们放在/var/www里就是作死行为！本例以放在/root下为例。）</p></li><li><p>编辑你的nginx配置文件。</p></li><li>```bash
cd /etc/nginx/sites-enabled```</li><li>```bashnano default #如果你的网站配置文件名不同，请替换。
```<p><br/></p></li><li><p>在配置文件里你的网站那一段的listen 80下面输入：</p></li><li>```bashlisten 443 ssl;
ssl_certificate /root/ssl-unified.crt;
ssl_certificate_key /root/privkey.pem;```<p><br/></p></li><li><p>重启nginx，安装结束。。</p></li><li>```bash
service nginx restart```<p><br/></p></li></ol><h2>3.SPDY的安装和启用<br/></h2><p>SPDY是Google主导开发的一个网络协议，使用它，可以在一个SSL连接内同时传输好几路数据。<br/>

比如，打开网页时，如果没有SPDY，那么浏览器就要同时打开好几路SSL连接下载数据。问题是，这些连接不是同时打开的，一般情况下网页加载到一半，浏览器发现“哎呀我需要这个东西但是还没下载”，才会开新连接下载数据。

而有了SPDY，浏览器可以直接在同一个SSL连接中下载数据，省去了连接和SSL验证的时间。</p><ol class=" list-paddingleft-2" style="list-style-type: decimal;"><li><p>更新nginx版本。Debian软件源里默认的nginx不带有SPDY功能，需要把nginx替换成nginx-full。</p></li><li>```bash
apt-get install nginx-full```<p><br/></p></li><li><p>编辑你的nginx配置文件，把</p></li><li>```bashlisten 443 ssl;
```<p><br/></p></li><li><p>改成</p></li><li>```bashlisten 443 ssl spdy;
```<p><br/></p></li><li><p>完事。</p></li></ol><p>启用后，如果你的网站的图片、CSS、JS等都从你的服务器上下载，将会较大地改善你的网站在SSL下的载入速度。</p>