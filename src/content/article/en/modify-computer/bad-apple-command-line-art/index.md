---
title: 'Bad Apple Command Line Animation Version'
categories: Computers and Clients
tags: [Bad Apple, Pascal, Linux]
date: 2013-03-02 11:16:00
autoTranslated: true
---


Bad Apple is an animation produced by Touhou Project in Japan. The entire animation uses a method similar to shadow play, featuring only black and white colors, yet achieves 3D visuals through entirely hand-drawn frames! The effect is excellent with no frame skipping or dropping.

Due to its monochromatic nature, many enthusiasts have ported it to various platforms. I've seen versions running on calculators, Raspberry Pi, and even JavaScript implementations. I also wrote a Pascal program to play Bad Apple, though it operates entirely in the command line.

I'm too lazy to provide the compiled binary. Since I use Linux, it would be useless for Windows users anyway. Therefore, I'm sharing the source code below—compile it yourself using FPC.

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

Of course, the main program alone is useless. You'll also need the original graphics file (the `badapple.txt` I reference). Download it here: [/usr/uploads/2013/03/badapple.7z](/usr/uploads/2013/03/badapple.7z). Place it in the same directory as the executable.
```
