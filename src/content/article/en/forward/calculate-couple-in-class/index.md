---
title: 'Divine Algorithm for Class Gossip'
categories: Reposts
tags: [Algorithm]
date: 2014-03-22 17:43:00
autoTranslated: true
---


Saw this on Bilibili, [av1020723](http://www.bilibili.tv/video/av1020723/). I might create a PHP version later.

<embed height="452" width="544" quality="high" allowfullscreen="true" type="application/x-shockwave-flash" src="http://static.hdslb.com/miniloader.swf" flashvars="aid=1020723&page=1" pluginspage="http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash"></embed>

The original program was in Java and wouldn't run on my computer (unknown reason). I translated the source code to Pascal.

> Java version:  
> Program: http://pan.baidu.com/s/1sjtZs1v  
> Source code: http://pan.baidu.com/s/1ntmFSLV  

Pascal version source code:

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
    //Union variables
    id,sz,lead:array[0..10000]of longint;

//Simulate Java bernoulli function
function possibility(maybe:float):boolean;
    var
        i:longint;
    begin
        i:=random(10000);
        if(i>maybe*10000)then exit(false) else exit(true);
    end;

//Pairing
function cp(i:integer):relation;
    var
        j:float;
    begin
        cp.p:=i;
        j:=-1;

        if(i<boy)then begin
            if(possibility(1-boylove))then begin
                //This person is single
                cp.q:=i;
            end else begin
                //Randomly pair with a girl
                while(j<boy)or(j>boy+girl)do begin
                    j:=randg(boy+girl/2,girl/2);
                end;
                cp.q:=trunc(j);
            end;
        end else begin
            if(possibility(1-girllove))then begin
                //This person is single
                cp.q:=i;
            end else begin
                //Randomly pair with a boy
                while(j<0)or(j>boy)do begin
                    j:=randg(boy+girl/2,girl/2);
                end;
                cp.q:=trunc(j);
            end;
        end;
    end;

//Union-Find code
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
        //Find relationship root
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
        //Relationship chains don't intersect
        if(rootp<>rootq)then begin
            if(sz[rootp]<sz[rootq])then begin
                //Link rootP to rootQ to form relationship
                id[rootp]:=rootq;
                //Combine chain lengths
                sz[rootq]:=sz[rootq]+sz[rootp];
                //Remove chain head flag
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
        //Create a pair
        cpresult:=cp(i);
        //Record the pair
        //if(cpresult.p<>cpresult.q)then writeln('Lovers logged: ',cpresult.p,' ',cpresult.q);
        union(cpresult.p,cpresult.q);
    end;
    //Display relationship status
    unionshow;
end.
```

Algorithm explanation:

First initialize three arrays: `id` records a person's partner, `sz` records relationship chain length, `lead` marks whether someone is a chain head.

Initially set all `id` to self, `sz` to 1, `lead` to 1 (true).

Scan all people using random numbers. If someone meets pairing conditions (random number within love rate), randomly assign an opposite-sex partner. The original author used a Gaussian algorithm - Java's version required square roots while Pascal's doesn't. I added square roots during translation and spent 30 minutes debugging an infinite loop.

When establishing relationships:  
1. Find both individuals' relationship chain roots (e.g., 1→2→3 and 31→32)  
2. Link roots (3→32) to form complex relationships (pentagonal here)  
3. Combine chain lengths, set first chain to point to second  
4. Remove first chain's head flag  

Finally, scan the `sz` array to output group counts by relationship complexity.
```
