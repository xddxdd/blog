---
title: 'Quicksort Implementations by Various OIers (Pascal Language)'
categories: Reposts
tags: [OI]
date: 2012-07-16 13:53:00
autoTranslated: true
---


OIer 1:

```pascal
procedure qsort(l,r:longint);
var
  i,j,m,t:longint;
begin
  i:=l;
  j:=r;
  m:=a[(l+r) div 2];
  repeat
    while a[i]m do dec(j);
    if ij;
  if l <j then qsort(l,j);
  if i <r then qsort(i,r);
end;
```

OIer 2:

```pascal
Procedure QuickSort(Left, Right : Longint);

Var
  LeftPointer, RightPointer, Medium, Temp : Longint;

Begin
  LeftPointer := Left;
  RightPointer := Right;
  Medium := a[(Left + Right) Shr 1];
  Repeat
    While a[LeftPointer]  Medium Do
      Dec(RightPointer);
    If LeftPointer  j;
  If Left  < RightPointer Then
    QuickSort(Left,RightPointer);
  If LeftPointer  < Right Then
    QuickSort(LeftPointer,Right);
End; {End Procedure}
```

OIer 3:

```pascal
procedure kuaipai(z,y:longint);var i,j,m,t:longint;begin i:=z;j:=y;m:=a[(z+y) div 2];repeat while a[i]m do dec(j);if ij;if z <j then kuaipai(z,j);if i <y then kuaipai(i,y);end;
```

OIer 3 Pro:

```pascal
program kuaipaiwithoutrecursive;{今天心情不好不想用递归}
var
  sl,sr:array[1..1000] of longint;
  i,j,n,t,p,r,x,q,t:longint;
begin
  sl[1]:=1;
  sr[1]:=n;
  t:=1;
  while t>0 do begin
    p:=sl[t];
    r:=sr[t];
    t:=t-1;
    if p <r then begin
      x:=a[r];
      i:=p-1;
      for j:=p to r-1 do begin
        if a[j] <=x then begin
          i:=i+1;
          t:=a[i];
          a[i]:=a[j];
          a[j]:=t;
        end;
      end;
      t:=a[i+1];
      a[i+1]:=a[r];
      a[r]:=t;
      q:=i+1;
      t:=t+1;
      sl[t]:=p;
      sr[t]:=q-1;
      t:=t+1;
      sl[t]:=q+1;
      sr[t]:=r;
    end;
  end;
end;
```

Original post: [http://user.qzone.qq.com/1320719107/blog/1342412850][1]

[1]: http://user.qzone.qq.com/1320719107/blog/1342412850
```
