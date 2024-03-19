---
title: '神算法对班里进行八卦'
categories: 转载
tags: [算法]
date: 2014-03-22 17:43:00
---

B站上看到的，[av1020723](http://www.bilibili.tv/video/av1020723/)。等会我可能会
做一个PHP版出来。

<embed height="452" width="544" quality="high" allowfullscreen="true" type="application/x-shockwave-flash" src="http://static.hdslb.com/miniloader.swf" flashvars="aid=1020723&page=1" pluginspage="http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash"></embed>

原程序为Java语言，在我电脑上运行不起来（原因未知），我看着源代码翻译成了Pascal。

<blockquote>Java版：
程序：http://pan.baidu.com/s/1sjtZs1v
源代码：http://pan.baidu.com/s/1ntmFSLV</blockquote>

Pascal版源代码：

```pascal
uses math;
type
    relation=record
        p:longint;
        q:longint;
    end;
var
    i,boy,girl,total,count:longint;
    boylove,girllove:float;
    cpresult:relation;
    //Union变量
    id,sz,lead:array[0..10000]of longint;

//模拟java bernoulli函数功能
function possibility(maybe:float):boolean;
    var
        i:longint;
    begin
        i:=random(10000);
        if(i>maybe*10000)then exit(false) else exit(true);
    end;

//配对
function cp(i:integer):relation;
    var
        j:float;
    begin
        cp.p:=i;
        j:=-1;

        if(i<boy)then begin
            if(possibility(1-boylove))then begin
                //这个人不恋爱
                cp.q:=i;
            end else begin
                //随机一个女生和他配对
                while(j<boy)or(j>boy+girl)do begin
                    j:=randg(boy+girl/2,girl/2);
                end;
                cp.q:=trunc(j);
            end;
        end else begin
            if(possibility(1-girllove))then begin
                //这个人不恋爱
                cp.q:=i;
            end else begin
                //随机一个男生和她配对
                while(j<0)or(j>boy)do begin
                    j:=randg(boy+girl/2,girl/2);
                end;
                cp.q:=trunc(j);
            end;
        end;
    end;

//Union部分代码
procedure unioninit(n:longint);
    var
        i:longint;
    begin
        for i:=0 to n-1 do begin
            id[i]:=i;
            sz[i]:=1;
            lead[i]:=1;
        end;
    end;
function unionfind(p:longint):longint;
    var
        t:longint;
    begin
        t:=p;
        //找到关系的根源
        while(t<>id[t])do t:=id[t];
        unionfind:=t;
    end;
function unionconnected(p,q:longint):boolean;
    begin
        unionconnected:=unionfind(p)=unionfind(q);
    end;
procedure union(p,q:longint);
    var
        rootp,rootq:longint;
    begin
        rootp:=unionfind(p);
        rootq:=unionfind(q);
        //两个人的关系链条没有交叉
        if(rootp<>rootq)then begin
            if(sz[rootp]<sz[rootq])then begin
                //把rootP链接到rootQ上表示他们相爱
                id[rootp]:=rootq;
                //链条长度相加
                sz[rootq]:=sz[rootq]+sz[rootp];
                //取消链条头标记
                lead[rootp]:=0;
            end else begin
                id[rootq]:=rootp;
                sz[rootp]:=sz[rootq]+sz[rootp];
                lead[rootq]:=0;
            end;
            count:=count-1;
        end;
    end;
procedure unionshow;
    var
        i:longint;
        poly:array[0..100]of longint;
    begin
        for i:=0 to 100 do poly[i]:=0;
        for i:=0 to total do begin
            if(lead[i]=0)then continue;
            poly[sz[i]]:=poly[sz[i]]+1;
        end;
        for i:=1 to 100 do begin
            if(poly[i]<>0)then begin
                if(i=1)then writeln('Lonely: ',poly[1])
                else if(i=2)then writeln('Couple: ',poly[2])
                else writeln(i,' angle love: ',poly[i]);
            end;
        end;
    end;
begin
    randomize;
    write('Boy number:');
    readln(boy);
    write('Girl number:');
    readln(girl);
    total:=boy+girl;
    count:=total;
    unioninit(total);
    write('Boy love rate:');
    readln(boylove);
    while(boylove>1)do boylove:=boylove/100;
    write('Girl love rate:');
    readln(girllove);
    while(girllove>1)do girllove:=girllove/100;
    for i:=0 to total-1 do begin
        //创建一对恋人
        cpresult:=cp(i);
        //把他们记录在案
        //if(cpresult.p<>cpresult.q)then writeln('Lovers logged: ',cpresult.p,' ',cpresult.q);
        union(cpresult.p,cpresult.q);
    end;
    //列出恋情情况
    unionshow;
end.
```

算法解释：

首先开3个数组，id记录某个人的恋人，sz记录关系链长度，lead记录这个人是否一条关系
链的开头。

先设置全部id为这个人自己，sz为1，lead为true（1）。

然后用随机数扫一遍所有的人，如果这个人符合创建关系条件（随机数在恋爱率范围内），
那么随机一个异性配偶配置关系。原作者用的随机数算法貌似是高斯算法，java的高斯算法
出结果后貌似还要开根号，pascal的不用，然后我翻译时开了根号，然后调试死循环调了半
个小时。

配置关系时，先找到两个人关系链条的头，然后进行下一步操作。比如1和31配置关系，1的
上一级链条是2，2的上级是3，31的上级是32，那么实际上要把3和32配置关系，形成五角
恋。然后两人关系链条长度相加，第一个人关系链条指向第二个人，取消第一个人的链条端
点标记，完工。

最后扫sz数组输出各种情况的组数，完工。
