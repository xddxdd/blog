---
title: 'Bad Apple 命令行动画版'
categories: 计算机与客户端
tags: [Bad Apple, Pascal, Linux]
date: 2013-03-02 11:16:00
---

Bad Apple 是岛国东方幻想乡制作的一个动画，全动画采用类似皮影戏的方式，只有黑白，
但是做到了3D画面，而且全部手绘！效果非常好，没有任何跳帧丢帧现象。

因为它的黑白特性，大群人开始尝试将它移植到各种平台上，我见过的就有计算器、树莓
派，还有人把它用javascript放了出来。我也写了一个Pascal程序用来放Bad Apple，不过
是全命令行的。

编译好的程序我懒得放了，而且我用的是Linux，Windows用户下载了也没用，所以我把源代
码放出来，你们自己用FPC编译吧。

```pascal
uses crt;
var
    fin:text;
    i:longint;
    s:string;
begin
    // 链接源文件并准备读取
    assign(fin,'badapple.txt');
    reset(fin);

    // 读入第一幅画面并输出版权
    for i:=1 to 24 do begin
        readln(fin,s);
        writeln(s);
    end;
    write('Bad Apple ASCII Art by Lan Tian - https://lantian.pub');
    delay(50);

    // 输出之后画面，不覆盖版权
    while(not(eof(fin)))do begin
        gotoxy(1,1);
        for i:=1 to 24 do begin
            readln(fin,s);
            writeln(s);
        end;
        //write('Bad Apple ASCII Art by Lan Tian - https://lantian.pub');
        delay(50);
    end;

    // 清屏
    //gotoxy(1,1);
    //for i:=1 to 25 do writeln;
    clrscr;

    // 保持良好编程习惯
    close(fin);
end.
```

当然只执行主程序是没用的，还需要原始图形文件，就是我调用的那个txt，下载地
址：[/usr/uploads/2013/03/badapple.7z](/usr/uploads/2013/03/badapple.7z)。下载下
来和主程序放在一起。
