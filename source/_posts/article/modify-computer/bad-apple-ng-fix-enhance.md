---
lang: zh
title: 'Bad Apple NG 修正增强版本'
label: bad-apple-ng-fix-enhance
categories: 计算机与客户端
tags: [Pascal,Bad Apple]
date: 2013-03-23 21:34:44
---
这次更新修正了几个错误。

1.帧率统计功能实际上是错误的（我脑抽写出的代码），全片过程中帧率一般维持在20FPS不变。现已将FPS统计改成处理延时。（PS：对于处理延时，程序自动调节）

2.有TX反馈说64位OS下运行不正常，八成是int64的问题，现在已经全部改成longint，问题应该解决。

3.加了个统计功能（把第三行stat=true改成stat=false可以关掉）。

数据文件下载：<a href="/usr/uploads/2013/03/badapple.7z" target="_blank">/usr/uploads/2013/03/badapple.7z</a>

源码：（自己用FPC 2.6编译）

```bash
uses crt,dos;
const
    stat=true;
    inx=79;
    iny=24;
    yanchi=50;
    yanchitj=800;
type
    pic=array[1..inx,1..iny]of char;
var
    fin:text;
    i,j,diff:longint;
    ct,dt,dtt,pt:longint;
    s:string;
    a,b:pic;
// 来自 WotorDho <http://user.qzone.qq.com/1320719107> 的时间校准代码（有修改）
function currtime:longint;
    var
        a,b,c,d:word;
    begin
        gettime(a,b,c,d);
        currtime:=3600000*a+60000*b+1000*c+10*d;
    end;
function deltatime(a,b:longint):longint;
    begin
        deltatime:=a-b;
        if(a-b<0)then deltatime:=deltatime+3600000*iny;
    end;
// 读取下一张图片
function currpic:pic;
    var
        i,j:longint;
    begin
        for i:=1 to iny do begin
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
        for i:=1 to inx do for j:=1 to iny do begin
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
    dtt:=0;
    pt:=0;
    for i:=1 to inx do for j:=1 to iny do a[i,j]:=' ';
    while(not(eof(fin)))do begin
        ct:=currtime();
        b:=currpic;
        diff:=deltapic(a,b);
        a:=b;
        dt:=deltatime(currtime(),ct);
        dtt:=dtt+dt;
        pt:=pt+1;

        // 版权 & 统计
        gotoxy(1,25);
        write('Bad Apple NG - Lan Tian - https://lantian.pub - Delay ',dt,'ms, Diff ',diff);
        clreol;

        // 延时 & 微调
        dt:=deltatime(currtime(),ct);
        if(dt<yanchi)then delay(yanchi-dt);
    end;
    // 统计信息
    clrscr;
    if(stat)then begin
        writeln('Bad Apple NG - Lan Tian - https://lantian.pub');
        delay(yanchitj);
        writeln('- ',pt,' frames drawn total');
        writeln('- ',pt,' 帧已绘制');
        delay(yanchitj);
        writeln('- ',pt*inx*iny,' ASCII characters total');
        writeln('- ',pt*inx*iny,' 个 ASCII 字符已绘制');
        delay(yanchitj);
        writeln('- ',dtt,' characters different from previous frame');
        writeln('- ',dtt,' 个差异与上一帧（全片过程中）');
        delay(yanchitj);
        writeln('Please remember you can watch this show by entering');
        writeln('请注意，你可以在线观看这个字符动画，只要输入以下命令');
        delay(yanchitj);
        writeln('   following command into your cmd(Windows) or terminal(Linux)');
        writeln('   到你的命令提示符（对于Windows）或者终端（对于Linux）');
        delay(yanchitj);
        writeln('telnet 5.175.156.249 OR telnet xuyh0120.tk');
        delay(yanchitj);
        writeln('Thanks for watching. See you next time!');
        writeln('感谢观赏。下次再见！');
        delay(yanchitj*10);
    end;
    close(fin);
    cursoron;
end.
```
