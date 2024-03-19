---
title: 'Bad Apple NG：增强版 Bad Apple 播放系统'
categories: 计算机与客户端
tags: [Pascal, Bad Apple]
date: 2013-03-16 10:56:23
---

UPDATE：如果碰到打不开、运行错误2什么的问题，请
在[Bad Apple 命令行动画版](/article/modify-computer/bad-apple-command-line-art.lantian)看
说明下数据文件！！！

上次我
的[Bad Apple 命令行动画版](/article/modify-computer/bad-apple-command-line-art.lantian)成
功被同学WotorDho转载，并且进行了增强，主要是判断延时，以便控制系统卡的时候FPS保
持基本不变。可惜他用的是他编写文澜杀时使用的自建Unit XCrt，冗余代码多不说，还不
好懂。

我研究了一下XCrt，搞懂他的原理，并且对自己的播放器进行修改，达到了一样的效果。
（理论上还会快一点）

同时，由于之前Telnet传输时采取整幅整幅画面传输，浪费了大量流量，我也进行了优化，
也就是判断每个像素点是否相同，如果不同就只改像素点，可以有效减小传输带宽。我称之
Bad Apple NG（NG为Next Generation，下一代）。VPS上的Telnet演示将稍后更新。

上源代码：

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
// 来自 WotorDho <http://user.qzone.qq.com/1320719107> 的时间校准代码（有修改）
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
// 读取下一张图片
function currpic:pic;
    var
        i,j:longint;
    begin
        for i:=1 to 24 do begin
            readln(fin,s);
            for j:=1 to length(s) do currpic[j,i]:=s[j];
        end;
    end;
// 只显示和上幅图不同的部分，减小 Telnet 方式观看时网络压力
// 本过程直接显示图片
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
    cursoroff;    // 禁掉光标，Linux下不管用，Windows下可以，感谢 WotorDho
    // 挂入资源文件开始读取
    assign(fin,'badapple.txt');
    reset(fin);
    for i:=1 to 79 do for j:=1 to 24 do a[i,j]:=' ';
    while(not(eof(fin)))do begin
        ct:=currtime();
        b:=currpic;
        diff:=deltapic(a,b);
        a:=b;
        dt:=deltatime(currtime(),ct);

        // 版权 & 统计
        gotoxy(1,25);
        write('Bad Apple NG - Lan Tian - https://lantian.pub - FPS ',trunc(1000/(50-dt)),', Diff ',diff);
        clreol;

        // 延时 & 微调
        dt:=deltatime(currtime(),ct);
        if(dt<50)then delay(50-dt);
    end;
    // 编程习惯！！
    clrscr;
    close(fin);
    cursoron;
end.
```
