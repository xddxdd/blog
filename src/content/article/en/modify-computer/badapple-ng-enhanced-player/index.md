---
title: 'Bad Apple NG: Enhanced Bad Apple Playback System'
categories: Computers and Clients
tags: [Pascal, Bad Apple]
date: 2013-03-16 10:56:23
autoTranslated: true
---

UPDATE: If encountering issues like failure to open or runtime error 2, please check the instructions at [Bad Apple Command Line Art Version](/en/article/modify-computer/bad-apple-command-line-art.lantian) regarding data files!!!

My previous [Bad Apple Command Line Art Version](/en/article/modify-computer/bad-apple-command-line-art.lantian) was successfully reposted by classmate WotorDho and enhanced with delay calibration to maintain consistent FPS when system lags. However, he used a custom XCrt unit from his Wenlan Killer project, which contains redundant code and is hard to understand.

After studying XCrt, I modified my player to achieve the same effect (theoretically with better performance).

Additionally, I optimized the Telnet transmission that previously wasted bandwidth by sending full frames. The new version only updates changed pixels, significantly reducing data transfer. I call this Bad Apple NG (Next Generation). The Telnet demo on VPS will be updated later.

Source code:

```pascal
uses crt,dos;
type
    pic=array[1..79,1..24]of char;
var
    fin:text;
    i,j,diff:longint;
    ct,dt:int64;
    s:string;
    a,b:pic;
// Time calibration code from WotorDho <http://user.qzone.qq.com/1320719107> (modified)
function currtime:int64;
    var
        a,b,c,d:word;
    begin
        gettime(a,b,c,d);
        currtime:=3600000*a+60000*b+1000*c+10*d;
    end;
function deltatime(a,b:int64):int64;
    begin
        deltatime:=a-b;
        if(a-b<0)then deltatime:=deltatime+3600000*24;
    end;
// Read next frame
function currpic:pic;
    var
        i,j:longint;
    begin
        for i:=1 to 24 do begin
            readln(fin,s);
            for j:=1 to length(s) do currpic[j,i]:=s[j];
        end;
    end;
// Display only changed pixels to reduce network load for Telnet viewers
// This procedure directly renders the frame
function deltapic(a,b:pic):longint;
    var
        i,j:longint;
    begin
        deltapic:=0;
        for i:=1 to 79 do for j:=1 to 24 do begin
            if(a[i,j]<>b[i,j])then begin
                gotoxy(i,j);
                write(b[i,j]);
                deltapic:=deltapic+1;
            end;
        end;
    end;
begin
    cursoroff;    // Disable cursor (works on Windows, ineffective on Linux) - thanks WotorDho
    // Load resource file
    assign(fin,'badapple.txt');
    reset(fin);
    for i:=1 to 79 do for j:=1 to 24 do a[i,j]:=' ';
    while(not(eof(fin)))do begin
        ct:=currtime();
        b:=currpic;
        diff:=deltapic(a,b);
        a:=b;
        dt:=deltatime(currtime(),ct);

        // Copyright & statistics
        gotoxy(1,25);
        write('Bad Apple NG - Lan Tian - https://lantian.pub - FPS ',trunc(1000/(50-dt)),', Diff ',diff);
        clreol;

        // Delay & fine-tuning
        dt:=deltatime(currtime(),ct);
        if(dt<50)then delay(50-dt);
    end;
    // Good coding practice!!
    clrscr;
    close(fin);
    cursoron;
end.
```
