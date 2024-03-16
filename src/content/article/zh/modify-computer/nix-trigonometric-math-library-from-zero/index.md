---
title: '从零开始实现 Nix 三角函数库'
categories: 计算机与客户端
tags: [Nix, 三角函数]
date: 2023-09-20 23:10:57
image: /usr/uploads/202309/trigonometric.png
---

（题图来自：[维基百科 - 三角函数](https://zh.wikipedia.org/zh-cn/%E4%B8%89%E8%A7%92%E5%87%BD%E6%95%B0)）

## 起因

我想计算我的所有 VPS 节点之间的网络延迟，并把延迟写入 Bird BGP 服务端的配置中，以便让节点之间的数据转发经过延迟最低的路径。但是，我的节点截至今天有 17 个，我不想在节点之间手动两两 Ping 获取延迟。

于是我想了一种方法：标记所有节点所在物理地点的经纬度，根据经纬度计算物理距离，再将距离除以光速的一半即可获得大致的延迟。我随机抽样了几对节点，发现她们之间的路由都比较直，没有严重的绕路现象，此时物理距离就是一个可以满足我要求的近似值。

因为我的节点上用的都是 NixOS，统一使用 Nix 语言管理配置，所以我需要找到一种在 Nix 中计算这个距离的方法。一种常用的根据经纬度算距离的方法是半正矢公式（Haversine Formula），它将地球近似为一个半径为 6371 公里的球体，再使用以下公式计算经纬度之间的距离：

> 参考资料：[维基百科 - 半正矢公式](https://zh.wikipedia.org/zh-cn/%E5%8D%8A%E6%AD%A3%E7%9F%A2%E5%85%AC%E5%BC%8F)

$$
\begin{aligned}
h = hav(\frac{d}{r}) &= (hav(\varphi_2 - \varphi_1) + \cos(\varphi_1) \cos(\varphi_2) hav(\lambda_2 - \lambda_1)) \\
\text{其中：} hav(\theta) &= \sin^2(\frac{\theta}{2}) = \frac{1 - \cos(\theta)}{2} \\
\text{可得：} d &= r \cdot archav(h) = 2r \cdot arcsin(\sqrt{h}) \\
&= 2r \cdot \arcsin(\sqrt{\sin^2 (\frac{\varphi_2 - \varphi_1}{2}) + \cos(\varphi_1) \cos(\varphi_2) \sin^2 (\frac{\lambda_2 - \lambda_1}{2})})
\end{aligned}
$$

> 注：半正矢公式有几种变体，我实际参考的是 Stackoverflow 上的这一版使用 arctan 函数的实现：<https://stackoverflow.com/a/27943>

但是，Nix 作为一个打包、写软件配置用的语言，自然没有三角函数的支持，只能完成一些简单的浮点数计算。

于是我用了另一种方法，直接调用 Python 的 `geopy` 模块计算距离：

```nix
{
  pkgs,
  lib,
  ...
}: let
in {
  # 计算两个经纬度之间的距离，单位是公里
  distance = a: b: let
    py = pkgs.python3.withPackages (p: with p; [geopy]);

    helper = a: b:
      lib.toInt (builtins.readFile (pkgs.runCommandLocal
        "geo-result.txt"
        {nativeBuildInputs = [py];}
        ''
          python > $out <<EOF
          import geopy.distance
          print(int(geopy.distance.geodesic((${a.lat}, ${a.lng}), (${b.lat}, ${b.lng})).km))
          EOF
        ''));
  in
    if a.lat < b.lat || (a.lat == b.lat && a.lng < b.lng)
    then helper a b
    else helper b a;
}
```

这种方法能用，但这相当于为每组不同的经纬度单独创建了一个“软件包”，再让 Nix 进行构建。Nix 为了尽可能保持可重复打包，避免软件包打包过程中引入变量，会创建一个不联网、磁盘访问受限的沙盒环境，然后在这个虚拟环境中启动 Python，加载 `geopy`，进行计算。这个过程很慢，在我的笔记本电脑（i7-11800H）上需要为每个软件包花大约 0.5 秒，而且由于 Nix 的限制无法并行处理。截至今天，我的 17 个节点分散在全世界 10 个不同的城市，这意味着计算这些距离就要花费 $\frac{10 \cdot 9}{2} \cdot 0.5s = 22.5s$ 的时间。

而且，由于构建软件包的函数 `pkgs.runCommandLocal` 的输出立即被 `builtins.readFile` 读取，这些距离计算用的软件包并不会被我的 NixOS 配置直接引用，也就意味着它们的引用计数为 0，在运行 `nixos-collect-garbage -d` 时会被立即清理。之后构建下一次配置时，又要花费 22.5 秒再计算一遍。

那么，我能不能不再依赖 Python，而是使用 Nix 的简单的浮点数功能实现 sin，cos，tan 这些三角函数，从而实现计算半正矢函数呢？

于是就有了今天的项目：使用纯 Nix 语言实现的三角函数库。

## 正弦 sin，余弦 cos，正切 tan：泰勒级数

正弦 sin 和余弦 cos 这两个三角函数都有比较简单的计算方法：泰勒级数。我们都知道，正弦 sin 有如下的泰勒展开式：

$$
\begin{aligned}
\sin x &= \sum_{n=0}^\infty (-1)^n \frac{x^{2n+1}}{(2n+1)!} \\
&= x - \frac{x^3}{3!} + \frac{x^5}{5!} - ...
\end{aligned}
$$

不难发现，每个泰勒展开项可以用基本的四则运算完成计算。我们就可以在 Nix 中实现如下的函数：

```nix
{
  pi = 3.14159265358979323846264338327950288;

  # 辅助函数，对数列中的所有项求和/乘积
  sum = builtins.foldl' builtins.add 0;
  multiply = builtins.foldl' builtins.mul 1;

  # 取余函数，计算 a mod b，用于将 sin/cos 的输入限制到 (-2pi, 2pi)
  mod = a: b:
    if a < 0
    then mod (b - mod (0 - a) b) b
    else a - b * (div a b);

  # 乘方函数，计算 x^times，其中 times 为整数
  pow = x: times: multiply (lib.replicate times x);

  # 正弦函数
  sin = x: let
    # 将 x 转为浮点数避免整数乘除法，并取余 2pi 限制输入范围，避免精度损失
    x' = mod (1.0 * x) (2 * pi);
    # 计算数列中的第 i 项，其中 i 从 1 开始
    step = i: (pow (0 - 1) (i - 1)) * multiply (lib.genList (j: x' / (j + 1)) (i * 2 - 1));
    # 注：此处 lib.genList 的调用相当于 for (j = 0; j < i*2-1; j++)
  in
    # TODO：咕咕咕
    0;
}
```

其中计算单个泰勒展开项时，为了避免浮点数的精度损失，没有分别计算分子分母两个大数再相除，而是将 $\frac{x^n}{n!}$ 展开成 $\frac{x}{1} \cdot \frac{x}{2} \cdot ... \cdot \frac{x}{n}$，单独计算每一项，再将所有数值相对较小的结果相乘。

然后，我们要决定计算多少项。我们可以选择计算固定的项数，比如 10 项：

```nix
{
  sin = x: let
    x' = mod (1.0 * x) (2 * pi);
    step = i: (pow (0 - 1) (i - 1)) * multiply (lib.genList (j: x' / (j + 1)) (i * 2 - 1));
  in
    # 如果 x < 0 就取负，进一步缩小要处理的范围
    if x < 0
    then -sin (0 - x)
    # 计算 10 项泰勒展开项并求和
    else sum (lib.genList (i: step (i + 1)) 10);
}
```

但是计算固定项数时，因为 Nix 的浮点数是 32 位的 float，输入值很小时泰勒展开项很快就小于浮点数精度，浪费计算次数，而输入值很大时计算 10 项又不能保证计算足够精确。于是我决定改成根据泰勒展开项的值决定，在这一步计算结果小于精度要求时结束计算：

```nix
{
  # 精度限制，泰勒展开项小于该值时停止计算
  epsilon = pow (0.1) 10;

  # 绝对值函数 abs 以及别名 fabs
  abs = x:
    if x < 0
    then 0 - x
    else x;
  fabs = abs;

  sin = x: let
    x' = mod (1.0 * x) (2 * pi);
    step = i: (pow (0 - 1) (i - 1)) * multiply (lib.genList (j: x' / (j + 1)) (i * 2 - 1));
    # 如果当前项的绝对值小于 epsilon 就停止计算，否则继续算下一步
    # tmp 用于累加，i 是泰勒展开项的编号计数
    helper = tmp: i: let
      value = step i;
    in
      if (fabs value) < epsilon
      then tmp
      else helper (tmp + value) (i + 1);
  in
    if x < 0
    then -sin (0 - x)
    # 累加从 0 开始，编号从 1 开始
    else helper 0 1;
}
```

于是我们就有了一个足够精确的正弦 sin 函数。把它的输入值从 0 到 10（大于 $2 \pi$），每隔 0.001 扫描一遍：

```nix
{
  # arange：生成一个从 min（含）到 max（不含），间隔 step 的数列
  arange = min: max: step: let
    count = floor ((max - min) / step);
  in
    lib.genList (i: min + step * i) count;

  # arange2：生成一个从 min（含）到 max（含），间隔 step 的数列
  arange2 = min: max: step: arange min (max + step) step;

  # 测试函数：将数组 inputs 中的每个值都用函数 fn 计算一遍，生成 input -> output 的 attrset
  testOnInputs = inputs: fn:
    builtins.listToAttrs (builtins.map (v: {
        name = builtins.toString v;
        value = fn v;
      })
      inputs);

  # 测试函数：将从 min（含）到 max（含），间隔 step 的输入都测试一遍
  testRange = min: max: step: testOnInputs (math.arange2 min max step);

  testOutput = testRange (0 - 10) 10 0.001 math.sin;
}
```

将 `testOutput` 和 Python Numpy 的 `np.sin` 比较，所有结果的差距都小于 0.0001%，满足要求。

类似的，我们可以实现余弦 cos 函数：

```nix
{
  # 将余弦转换成正弦
  cos = x: sin (0.5 * pi - x);
}
```

你不会真以为我会从零开始再来一遍吧？不会吧不会吧？

类似的，正切 tan 函数也很简单：

```nix
{
  tan = x: (sin x) / (cos x);
}
```

将 `cos` 和 `tan` 用类似的方法测试，差距均小于 0.0001%。

## 反正切 arctan：只能近似

arctan 函数也有泰勒展开式：

$$
\begin{aligned}
\arctan x &= \sum_{n=0}^\infty (-1)^n \frac{x^{2n+1}}{2n+1} \\
&= x - \frac{x^3}{3} + \frac{x^5}{5} - ...
\end{aligned}
$$

但是很容易发现，arctan 的泰勒展开式收敛远不如 sin 的展开式快。由于 arctan 展开式的分母线性增加，计算到小于 epsilon 所需的项数大幅增加，甚至可能直接让 Nix 的栈溢出：

```bash
error: stack overflow (possible infinite recursion)
```

所以我们不能用泰勒展开式了，得用其它计算次数少的方法。受到 <https://stackoverflow.com/a/42542593> 的启发，我决定用多项式回归来拟合 $[0, 1]$ 上的 arctan 曲线，并将其它范围的 arctan 按如下规则进行映射：

$$
\begin{aligned}
x < 0,& \arctan (x) = -\arctan (-x) \\
x > 1,& \arctan (x) = \frac{\pi}{2} - \arctan (\frac{1}{x}) \\
\end{aligned}
$$

启动 Python，加载 Numpy，开始拟合：

```python
import numpy as np

# 生成 arctan 函数的输入，[0, 1] 的 1000 个点：
a = np.linspace(0, 1, 1000)

# 多项式回归，我指定用十次函数回归（x^10）
fit = np.polyfit(a, np.arctan(a), 10)

# 输出回归结果
print('\n'.join(["{0:.7f}".format(i) for i in (fit[::-1])]))
# 0.0000000
# 0.9999991
# 0.0000361
# -0.3339481
# 0.0056166
# 0.1692346
# 0.1067547
# -0.3812212
# 0.3314050
# -0.1347016
# 0.0222228
```

以上输出代表 $[0, 1]$ 上的 arctan 可以近似为：

$$\arctan(x) = 0 + 0.9999991 x + 0.0000361 x^2 - ... + 0.0222228 x^{10}$$

于是我们就可以在 Nix 中实现以上多项式：

```nix
{
  # 多项式计算，x^0*poly[0] + x^1*poly[1] + ... + x^n*poly[n]
  polynomial = x: poly: let
    step = i: (pow x i) * (builtins.elemAt poly i);
  in
    sum (lib.genList step (builtins.length poly));

  # 反正切函数
  atan = x: let
    poly = [
      0.0000000
      0.9999991
      0.0000366
      (0 - 0.3339528)
      0.0056430
      0.1691462
      0.1069422
      (0 - 0.3814731)
      0.3316130
      (0 - 0.1347978)
      0.0222419
    ];
  in
    # x < 0 的映射
    if x < 0
    then -atan (0 - x)
    # x > 1 的映射
    else if x > 1
    then pi / 2 - atan (1 / x)
    # 0 <= x <= 1，多项式计算
    else polynomial x poly;
}
```

进行精度测试，所有结果误差小于 0.0001%。

## 平方根 sqrt：牛顿法

对于平方根函数，我们可以使用著名的牛顿法进行递推。我使用的递推公式是：

$$a_{n+1} = \frac{a_n + \frac{x}{a_n}}{2}$$

其中 $x$ 是平方根函数的输入。

我们可以在 Nix 中如下实现牛顿法求平方根，递推到结果变化小于 epsilon 即可：

```nix
{
  # 平方根函数
  sqrt = x: let
    helper = tmp: let
      value = (tmp + 1.0 * x / tmp) / 2;
    in
      if (fabs (value - tmp)) < epsilon
      then value
      else helper value;
  in
    if x < epsilon
    then 0
    else helper (1.0 * x);
}
```

精度测试显示所有结果的误差小于 $1e-10$（绝对值）。

## 半正矢公式

有了以上函数，终于可以开始实现半正矢公式了。我参考的是 Stackoverflow 上这一版的实现：<https://stackoverflow.com/a/27943>

```nix
{
  # 角度转换成弧度
  deg2rad = x: x * pi / 180;

  # 半正矢公式，输入两个经纬度，输出地球上的球面距离
  haversine = lat1: lon1: lat2: lon2: let
    # 将地球视为半径 6371 公里的球体
    radius = 6371000;
    # 纬度差的弧度
    rad_lat = deg2rad ((1.0 * lat2) - (1.0 * lat1));
    # 经度差的弧度
    rad_lon = deg2rad ((1.0 * lon2) - (1.0 * lon1));
    # 按公式计算
    a = (sin (rad_lat / 2)) * (sin (rad_lat / 2)) + (cos (deg2rad (1.0 * lat1))) * (cos (deg2rad (1.0 * lat2))) * (sin (rad_lon / 2)) * (sin (rad_lon / 2));
    c = 2 * atan ((sqrt a) / (sqrt (1 - a)));
  in
    radius * c;
}
```

最后根据光速计算理论延迟：

```nix
{
  # 150000：光每毫秒行进的米数，再除以 2（计算的是双向延迟）
  rttMs = lat1: lon1: lat2: lon2: floor ((haversine lat1 lon1 lat2 lon2) / 150000);
}
```

## 总结

我终于达成了最开始的目标：用经纬度除以光速计算节点间网络理论延迟。

以上三角函数（和一些额外的数学函数）可以在我的 GitHub 获取：<https://github.com/xddxdd/nix-math>

如果你使用 Nix Flake，可以用以下方式使用这些函数：

```nix
{
  inputs = {
    nix-math.url = "github:xddxdd/nix-math";
  };

  outputs = inputs: let
    math = inputs.nix-math.lib.math;
  in{
    value = math.sin (math.deg2rad 45);
  };
}
```
