---
title: 'Nix Logarithmic Math Library from Ground Zero'
categories: 'Computers and Clients'
tags: [Nix, 'Logarithmic Functions']
date: 2025-05-19 23:02:28
image: /usr/uploads/202505/logarithm.png
series: 'Nix Math Library from Ground Zero'
---

(Cover image from:
[Wikipedia - Logarithm](https://en.wikipedia.org/wiki/Logarithm))

## Origin

Due to a somewhat absurd reason (calculating the physical distance between VPS
to estimate network latency), I
[implemented a somewhat absurd trigonometric function library using Nix](/en/article/modify-computer/nix-trigonometric-math-library-from-zero.lantian/).
After I
[published the trigonometric function library on GitHub](https://github.com/xddxdd/nix-math),
I found that someone actually used it! It seems my needs weren't too absurd
after all.

In the repository's Issues,
[a user suggested that I add some exponential/logarithmic function support to this math library](https://github.com/xddxdd/nix-math/issues/1),
such as `exp`, `ln`, `pow`, and `log`.

Since implementing these basic functions from scratch is also quite interesting,
I took some time to research it. Among these four functions, `exp` and `ln` are
somewhat difficult. `pow` and `log` can both be derived from the other two
functions:

$$
\begin{aligned}
\log_n x &= \frac{\ln x}{\ln n} \\
pow(x, n) = x^n &= \exp (n * \ln x)
\end{aligned}
$$

## Logarithmic Function ln

As we learned in math classes, when $0 < x \le 2$, the natural logarithm
function $\ln x$ can be obtained using the following Taylor series:

$$
\begin{aligned}
\ln x &= \sum_{n=1}^\infty (-1)^{n+1} \frac{(x-1)^n}{n} \\
&= \frac{x-1}{1} - \frac{(x-1)^2}{2} + \frac{(x-1)^3}{3} - ...
\end{aligned}
$$

When I implemented the trigonometric function last time, I wrote code to
calculate the result of the $\sin$ function based on the Taylor series.
Therefore, we only need to copy the code and change the formula for calculating
a term in the series.

```nix
{
  # Precision limit, stop calculation when the Taylor expansion term is less than this value
  epsilon = pow (0.1) 10;

  # Absolute value function abs and alias fabs
  abs = x:
    if x < 0
    then 0 - x
    else x;
  fabs = abs;

  # Helper function to calculate the product of all terms in a list
  multiply = builtins.foldl' builtins.mul 1;

  # Integer power calculation function, which is the `pow` function from the previous article, renamed to avoid conflict with the floating-point power function
  _pow_int =
    x: times:
    if times == 0 then
      1
    else if times < 0 then
      1 / (_pow_int x (0 - times))
    else
      multiply (lib.replicate times x);

  # Natural logarithm function, currently only handles 0 < x <= 2
  ln =
    x:
    let
      # Calculate the i-th term in the series, where i starts from 1
      step = i: (_pow_int (0 - 1) (i - 1)) * (_pow_int (1.0 * x - 1.0) i) / i;
      # Same as the `sin` function, calculate the Taylor series until the next term is less than epsilon (1e-10)
      helper =
        # tmp is used for accumulation, i is the index of the Taylor expansion term
        tmp: i:
        let
          value = step i;
        in
        # Stop calculation if the absolute value of the current term is less than epsilon, otherwise continue to the next step
        if (fabs value) < epsilon then tmp else helper (tmp + value) (i + 1);
    in
      helper 0 1;
}
```

(Formula from:
[Wikipedia](https://en.wikipedia.org/wiki/Logarithm#Taylor_series))

Although this Taylor series can handle the range $0 < x \le 2$, after testing,
when $x$ is close to the ends of the range, the number of terms to be calculated
becomes too large, causing Nix to report a stack overflow error:

```bash
error: stack overflow; max-call-depth exceeded
at /nix/store/qhnbm9x3zs2y55nyx1gxqf801gmjdjfc-source/default.nix:163:61:
   162|     let
   163|       step = i: (_pow_int (0 - 1) (i - 1)) * (_pow_int (1.0 * x - 1.0) i) / i;
      |                                                             ^
   164|       helper =
```

After testing, the number of terms is acceptable when $0.1 \le x \le 1.9$, so I
only use the Taylor series for calculation within this range.

For inputs outside this range, it needs to be converted to this range before
calculation:

$$
\begin{aligned}
x \le 0,& \ln x = \text{Invalid Value} \\
x < 1,& \ln x = -\ln \frac{1}{x} \\
x > 1.9,& \ln (x) = 2 * \ln \sqrt x \\
\end{aligned}
$$

Since the calculation method $\ln x = -\ln \frac{1}{x}$ is applicable to the
entire $0 < x < 1$ range, to maintain consistency in the calculation method, I
used this method for all inputs in this range.

Next, we only need to implement the logic to use different algorithms based on
the input range:

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

With the natural logarithm function $\ln$, we can implement the generic
logarithm function $\log_n$ with any base:

```nix
{
  log = base: x: (ln x) / (ln base);
  log2 = log 2;
  log10 = log 10;
}
```

## Natural Exponential Function exp

With the logarithm function in place, we still need another piece of the puzzle:
the natural exponential function $\exp x = e^x$. The Taylor expansion of the
natural exponential function is:

$$
\begin{aligned}
\exp x &= \sum_{n=0}^\infty \frac{x^n}{n} \\
&= 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + ...
\end{aligned}
$$

Obviously, this Taylor expansion never converges, so we cannot calculate the
result term by term and then sum them up. Therefore, we can use the same method
as calculating $\arctan$ in the previous article, using polynomial regression to
fit the curve of the natural exponential function.

So which segment should we fit? When $x \le 0$, we can directly calculate the
reciprocal of the absolute value exponent $\frac{1}{e^{-x}}$. And since we
already have the function `_pow_int` for calculating integer powers, when
$x \ge 1$, we can split $x$ into integer and decimal parts and calculate them
separately:

$$
\begin{aligned}
x \le 0,& \exp x = \frac{1}{\exp -x} \\
x > 1,& \exp x = (e^{\left \lfloor{x}\right \rfloor}) (e^{x - \left \lfloor{x}\right \rfloor}) \\
\end{aligned}
$$

Therefore, we only need to fit the natural exponential function on $[0, 1)$.

Since we don't know how many terms to use in polynomial regression to get the
best result, I wrote a simple script using Python and Numpy to try from 1 term
to 100 terms and then select the fitting result with the smallest error:

```python
import json
from typing import Callable, Iterable, List, Optional, Tuple
import numpy as np
from numpy.polynomial.polynomial import Polynomial

EPSILON = 1e-10

class Approximate:
    def __init__(self, fn: Callable[[Iterable[float]], Iterable[float]], linspace: Tuple[float, float, float], max_poly_degrees: Optional[int] = None):
        self.fn = fn
        # Range for polynomial regression, in np.linspace format
        self.linspace = linspace
        self.input = np.linspace(*linspace)
        # Calculate standard results using the standard function fn
        self.expected = fn(self.input)
        # Maximum number of terms to search
        self.max_poly_degrees = max_poly_degrees

    def _fit(self, deg: int) -> Tuple[float, Polynomial]:
        # Perform regression using Numpy's Polynomial regression class
        fit: Polynomial = Polynomial.fit(self.input, self.expected, deg, domain=(self.linspace[0], self.linspace[1]), window=(self.linspace[0], self.linspace[1]))
        # Calculate results using the regressed polynomial function
        result = fit(self.input)
        # Calculate error
        error_percent = np.fabs((result - self.expected) / self.expected)
        max_error_percent = np.max(error_percent[error_percent < 1e308] * 100)
        return max_error_percent, fit

    def run(self) -> Tuple[float, Polynomial]:
        # Search for the fitting result with the minimum error from 1 to max_poly_degrees terms
        error, poly = self._fit(1)
        for deg in range(2, self.max_poly_degrees+1):
            _error, _poly = self._fit(deg)
            if _error < error:
                error = _error
                poly = _poly
        return error, poly

    def explain(self) -> Polynomial:
        # Output results, where the JSON of Coefficients output can be directly copied into Nix code
        error, poly = self.run()
        print(f"Degree: {poly.degree()}")
        print(f"Error %: {error}")
        print(f"Coefficients: {json.dumps(json.dumps(list(poly.coef)))}")
        return poly

Approximate(np.exp, (0, 1, 10000), max_poly_degrees=100).explain()
```

By comparing with the $\arctan$ function, which is also based on polynomial
regression, we can implement the $\exp$ function:

```nix
{
  # Integer function
  int = x: if x < 0 then -int (0 - x) else builtins.floor x;

  exp =
    x:
    let
      # Extract the integer part of the input
      x_int = int x;
      # Extract the decimal part of the input
      x_decimal = x - x_int;
      # Polynomial coefficients calculated using Python and Numpy
      decimal_poly = builtins.fromJSON "[0.9999999999999997, 0.9999999999999494, 0.5000000000013429, 0.16666666664916754, 0.04166666680065545, 0.008333332669176907, 0.001388891142716621, 0.00019840730702746657, 2.481076351588151e-05, 2.744709498016379e-06, 2.846575263734758e-07, 2.0215584670370862e-08, 3.542885385105854e-09]";
    in
    if x < 0 then
      # Calculate the reciprocal of the absolute value exponent
      1 / (exp (0 - x))
    else
      # Calculate the exponents of the integer and decimal parts separately, then multiply
      (_pow_int e x_int) * (polynomial x_decimal decimal_poly);
}
```

## Floating-Point Power Function pow

With the above functions, we can finally calculate floating-point powers using
$x^n = \exp (n * \ln x)$. The only thing to note is various special cases:

```nix
{
  pow =
    x: times:
    let
      # Check if the exponent is an integer
      is_int_times = abs (times - int times) < epsilon;
    in
    if is_int_times then
      # If it's an integer, use the existing integer power calculation function, which is faster and can handle the case when x < 0
      _pow_int x (int times)
    else if x == 0 then
      # Base is 0, any power is 0
      0
    else if x < 0 then
      # Base is negative, cannot calculate floating-point power because we don't support imaginary numbers
      throw "Calculating power of negative base and decimal exponential is not supported"
    else
      # Calculate the result using the above formula
      exp (times * ln x);
}
```

## Summary

All these logarithmetic functions (and some extra math functions) can be
obtained from my GitHub: <https://github.com/xddxdd/nix-math>

If you're using Nix Flake, you can use the function as follows:

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
