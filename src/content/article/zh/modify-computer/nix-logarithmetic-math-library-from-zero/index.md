---
title: '从零开始实现 Nix 对数函数库'
categories: 计算机与客户端
tags: [Nix, 对数函数]
date: 2025-05-19 23:02:28
image: /usr/uploads/202505/logarithm.png
series: "从零开始实现 Nix 数学库"
---

（题图来自：[维基百科 - 对数](https://zh.wikipedia.org/zh-cn/%E5%AF%B9%E6%95%B0)）

## 起因

由于一个有点离谱的原因（计算 VPS 间的物理距离来估算网络延迟），我[用 Nix 实现了一个有点离谱的三角函数库](/article/modify-computer/nix-trigonometric-math-library-from-zero.lantian/)。我把三角函数库[发布到 GitHub 上](https://github.com/xddxdd/nix-math)后，发现居然有人用！看来我的需求也不算太离谱。

在仓库的 Issues 里，[有用户建议我给这个数学库添加一些指数/对数函数支持](https://github.com/xddxdd/nix-math/issues/1)，例如 `exp`，`ln`，`pow` 和 `log`。

因为从零开始实现这些基础函数也挺有趣的，所以我就抽空研究了一下。这四个函数中，有些难度的是 `exp` 和 `ln`。`pow` 和 `log` 都可以用另外两个函数转化出来：

$$
\begin{aligned}
\log_n x &= \frac{\ln x}{\ln n} \\
pow(x, n) = x^n &= \exp (n * \ln x)
\end{aligned}
$$

## 对数函数 ln

学习过小学二年级的我们都知道，当 $0 < x \le 2$ 时，以自然底数 `e` 为底的对数函数
$\ln x$ 可以用如下的泰勒级数求得：

$$
\begin{aligned}
\ln x &= \sum_{n=1}^\infty (-1)^{n+1} \frac{(x-1)^n}{n} \\
&= \frac{x-1}{1} - \frac{(x-1)^2}{2} + \frac{(x-1)^3}{3} - ...
\end{aligned}
$$

上次实现三角函数时，我就写过了基于泰勒级数求 $\sin$
函数结果的代码。因此我们只需要将代码抄过来，改掉计算数列中某一项的公式即可。

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

  # 辅助函数，对数列中的所有项求乘积
  multiply = builtins.foldl' builtins.mul 1;

  # 整数次幂的计算函数，就是前一篇文章中的 `pow` 函数，为了防止和浮点次幂函数冲突改了名字
  _pow_int =
    x: times:
    if times == 0 then
      1
    else if times < 0 then
      1 / (_pow_int x (0 - times))
    else
      multiply (lib.replicate times x);

  # 自然对数函数，目前只处理了 0 < x <= 2
  ln =
    x:
    let
      # 计算数列中的第 i 项，其中 i 从 1 开始
      step = i: (_pow_int (0 - 1) (i - 1)) * (_pow_int (1.0 * x - 1.0) i) / i;
      # 与 `sin` 函数相同，计算泰勒级数直到下一项小于 epsilon（1e-10）
      helper =
        # tmp 用于累加，i 是泰勒展开项的编号计数
        tmp: i:
        let
          value = step i;
        in
        # 如果当前项的绝对值小于 epsilon 就停止计算，否则继续算下一步
        if (fabs value) < epsilon then tmp else helper (tmp + value) (i + 1);
    in
      helper 0 1;
}
```

（公式来自：[维基百科](https://en.wikipedia.org/wiki/Logarithm#Taylor_series)）

虽然这个泰勒级数可以处理 $0 < x \le 2$ 的范围，但经过测试，当 $x$
接近范围两端时，需要计算的项数会变得过多，导致 Nix 报栈溢出错误：

```bash
error: stack overflow; max-call-depth exceeded
at /nix/store/qhnbm9x3zs2y55nyx1gxqf801gmjdjfc-source/default.nix:163:61:
   162|     let
   163|       step = i: (_pow_int (0 - 1) (i - 1)) * (_pow_int (1.0 * x - 1.0) i) / i;
      |                                                             ^
   164|       helper =
```

经过测试，当 $0.1 \le x \le 1.9$
时计算项数可以接受，因此我只在这个区间内使用泰勒级数进行计算。

对于超过这个范围的输入，就需要转化到这个区间内再进行计算：

$$
\begin{aligned}
x \le 0,& \ln x = \text{无效值} \\
x < 1,& \ln x = -\ln \frac{1}{x} \\
x > 1.9,& \ln (x) = 2 * \ln \sqrt x \\
\end{aligned}
$$

由于 $\ln x = -\ln \frac{1}{x}$ 时的计算方法适用于整个 $0 < x < 1$
区间，因此为了保持计算方法一致，我就对这个区间的输入全部使用这个方法了。

接下来只需要实现根据输入范围使用不同算法的逻辑就可以了：

```nix
{
  ln =
    x:
    let
      step = i: (_pow_int (0 - 1) (i - 1)) * (_pow_int (1.0 * x - 1.0) i) / i;
      helper =
        tmp: i:
        let
          value = step i;
        in
        if (fabs value) < epsilon then tmp else helper (tmp + value) (i + 1);
    in
    if x <= 0 then
      throw "ln(x<=0) returns invalid value"
    else if x < 1 then
      -ln (1 / x)
    else if x > 1.9 then
      2 * (ln (sqrt x))
    else
      helper 0 1;
}
```

有了自然对数函数 $\ln$ 后，我们自然就可以实现以任意数为底的对数函数 $\log_n$：

```nix
{
  log = base: x: (ln x) / (ln base);
  log2 = log 2;
  log10 = log 10;
}
```

## 自然指数函数 exp

有了对数函数，我们还需要另一块拼图：自然指数函数
$\exp x = e^x$。自然指数函数的泰勒展开式是：

$$
\begin{aligned}
\exp x &= \sum_{n=0}^\infty \frac{x^n}{n!} \\
&= 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + ...
\end{aligned}
$$

显然这个泰勒展开式永不收敛，因此我们不能一项项地计算结果然后求和。所以我们可以使用和上一篇文章中计算
$\arctan$ 时相同的方法，用多项式回归来拟合自然指数函数的曲线。

那么我们要拟合哪一段呢？当 $x \le 0$ 时，我们可以直接计算绝对值指数的倒数
$\frac{1}{e^{-x}}$。而因为我们已经有了计算整数次幂的函数 `_pow_int`，因此当
$x \ge 1$ 时，我们可以将 $x$ 分拆为整数和小数两个部分，分别计算：

$$
\begin{aligned}
x \le 0,& \exp x = \frac{1}{\exp -x} \\
x > 1,& \exp x = (e^{\left \lfloor{x}\right \rfloor}) (e^{x - \left \lfloor{x}\right \rfloor}) \\
\end{aligned}
$$

因此，我们只需要在 $[0, 1)$ 上拟合自然指数函数就可以了。

由于我们不知道多项式回归使用几项时获得最佳结果，我用 Python 和 Numpy 写了一个简单的脚本，从 1 项到 100 项都试一次，然后选取误差最小的拟合结果：

```python
import json
from typing import Callable, Iterable, List, Optional, Tuple
import numpy as np
from numpy.polynomial.polynomial import Polynomial

EPSILON = 1e-10

class Approximate:
    def __init__(self, fn: Callable[[Iterable[float]], Iterable[float]], linspace: Tuple[float, float, float], max_poly_degrees: Optional[int] = None):
        self.fn = fn
        # 多项式回归的范围，使用 np.linspace 的格式
        self.linspace = linspace
        self.input = np.linspace(*linspace)
        # 使用标准函数 fn 计算标准结果
        self.expected = fn(self.input)
        # 最大搜索几项
        self.max_poly_degrees = max_poly_degrees

    def _fit(self, deg: int) -> Tuple[float, Polynomial]:
        # 用 Numpy 的 Polynomial 多项式回归类进行回归
        fit: Polynomial = Polynomial.fit(self.input, self.expected, deg, domain=(self.linspace[0], self.linspace[1]), window=(self.linspace[0], self.linspace[1]))
        # 使用回归出来的多项式函数计算结果
        result = fit(self.input)
        # 计算误差
        error_percent = np.fabs((result - self.expected) / self.expected)
        max_error_percent = np.max(error_percent[error_percent < 1e308] * 100)
        return max_error_percent, fit

    def run(self) -> Tuple[float, Polynomial]:
        # 从 1 到 max_poly_degrees 项，搜索误差最小的拟合结果
        error, poly = self._fit(1)
        for deg in range(2, self.max_poly_degrees+1):
            _error, _poly = self._fit(deg)
            if _error < error:
                error = _error
                poly = _poly
        return error, poly

    def explain(self) -> Polynomial:
        # 输出结果，其中 Coefficients 输出的回归结果 JSON 可以直接复制进 Nix 代码
        error, poly = self.run()
        print(f"Degree: {poly.degree()}")
        print(f"Error %: {error}")
        print(f"Coefficients: {json.dumps(json.dumps(list(poly.coef)))}")
        return poly

Approximate(np.exp, (0, 1, 10000), max_poly_degrees=100).explain()
```

对照同样基于多项式回归的 $\arctan$ 函数，就可以实现 $\exp$ 函数：

```nix
{
  # 取整函数
  int = x: if x < 0 then -int (0 - x) else builtins.floor x;

  exp =
    x:
    let
      # 提取输入的整数部分
      x_int = int x;
      # 提取输入的小数部分
      x_decimal = x - x_int;
      # 使用 Python 和 Numpy 计算出的多项式系数
      decimal_poly = builtins.fromJSON "[0.9999999999999997, 0.9999999999999494, 0.5000000000013429, 0.16666666664916754, 0.04166666680065545, 0.008333332669176907, 0.001388891142716621, 0.00019840730702746657, 2.481076351588151e-05, 2.744709498016379e-06, 2.846575263734758e-07, 2.0215584670370862e-08, 3.542885385105854e-09]";
    in
    if x < 0 then
      # 计算绝对值指数的倒数
      1 / (exp (0 - x))
    else
      # 分开计算整数部分和小数部分的指数，然后相乘
      (_pow_int e x_int) * (polynomial x_decimal decimal_poly);
}
```

## 浮点次幂指数函数 pow

有了以上函数，我们就可以用 $x^n = \exp (n * \ln x)$
计算浮点次幂了。唯一要注意的就是各种特殊情况：

```nix
{
  pow =
    x: times:
    let
      # 判断指数是否为整数
      is_int_times = abs (times - int times) < epsilon;
    in
    if is_int_times then
      # 是整数时使用已有的整数幂运算函数，速度更快，并且可以处理 x < 0 时的情况
      _pow_int x (int times)
    else if x == 0 then
      # 底数为 0，任意次幂都是 0
      0
    else if x < 0 then
      # 底数为负，无法计算浮点次幂，因为我们不支持虚数功能
      throw "Calculating power of negative base and decimal exponential is not supported"
    else
      # 使用上述公式计算结果
      exp (times * ln x);
}
```

## 总结

以上对数和指数函数（和一些额外的数学函数）可以在我的 GitHub 获取：<https://github.com/xddxdd/nix-math>

如果你使用 Nix Flake，可以用以下方式使用这些函数：

```nix
{
  inputs = {
    nix-math.url = "github:xddxdd/nix-math";
  };

  outputs = inputs: let
    math = inputs.nix-math.lib.math;
  in{
    value = math.ln 123;
  };
}
```
