---
title: 'Nix Trigonometric Math Library from Ground Zero'
categories: 'Computers and Clients'
tags: [Nix, 'Trigonometric Functions']
date: 2023-09-20 23:10:57
image: /usr/uploads/202309/trigonometric.png
---

(Title image sourced from:
[Wikipedia - Trigonometry](https://en.wikipedia.org/wiki/Trigonometry))

## Why

I wanted to calculate the network latency between all my VPS nodes, and add the
latency into the configuration file of Bird BGP daemon, so the network packets
are forwarded through the lowest latency route. However, I have 17 nodes as of
today, and I didn't want to manually run a `ping` command between each pair.

So I came up with a solution: I can mark the latitudes and longitudes of the
physical locations of my nodes, calculate the physical distance, and divide that
by half the light speed to get the approximate latencies. I randomly sampled a
few node pairs, and found that the Internet routing between them are mostly
straightforward, with no significant detours. In this case, the physical
distance is a good approximation that satisfies my requirements.

Because I use NixOS across all my nodes, and manage all configs with Nix, I need
to find a way to calculate this distance with Nix. One commonly used method to
calculate distance based on latitude/longitude is Haversine formula. It
approximates the Earth as a sphere with a radius of 6371km, and then use the
following formula to calculate the distance:

> Reference:
> [Wikipedia - Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula)

$$
\begin{aligned}
h = hav(\frac{d}{r}) &= (hav(\varphi_2 - \varphi_1) + \cos(\varphi_1) \cos(\varphi_2) hav(\lambda_2 - \lambda_1)) \\
\text{Where: } hav(\theta) &= \sin^2(\frac{\theta}{2}) = \frac{1 - \cos(\theta)}{2} \\
\text{Therefore: } d &= r \cdot archav(h) = 2r \cdot arcsin(\sqrt{h}) \\
&= 2r \cdot \arcsin(\sqrt{\sin^2 (\frac{\varphi_2 - \varphi_1}{2}) + \cos(\varphi_1) \cos(\varphi_2) \sin^2 (\frac{\lambda_2 - \lambda_1}{2})})
\end{aligned}
$$

> Note: there are a few variations of Haversine formula. I actually used this
> arctan-based implementation from Stackoverflow:
> <https://stackoverflow.com/a/27943>

Nix however, as a language mainly focused on packaging and generating config
files, naturally doesn't natively support trigonometric functions, and is only
capable of some simple floating point computations.

Thus I went with another way, depending on Python's `geopy` module for distance
computation:

```nix
{
  pkgs,
  lib,
  ...
}: let
in {
  # Calculate distance between latitudes/longitudes in kilometers
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

It works, but what it really did is creating a new "package" for each pair of
latitudes/longitudes, and having Nix build it. In order to achieve reproducible
packaging wherever possible, and prevent extra variables from being introduced,
Nix creates a sandbox isolated from Internet and restricted from arbitrary disk
access, run Python in this sandbox, have it load `geopy`, and do the
calculation. This process is slow, taking around 0.5s for each package on my
laptop (i7-11800H), and cannot be parallelized due to Nix's limitations. As of
today, my 17 nodes are distributed in 10 different cities around the world. This
means calculating all these distances alone will take
$\frac{10 \cdot 9}{2} \cdot 0.5s = 22.5s$.

In addition, since the output of the packaging function `pkgs.runCommandLocal`
is immediately consumed by `builtins.readFile`, the packages for distance
calculation are not directly referenced by my Nix config. This means that their
reference count is 0, and will be immediately garbage collected with
`nixos-collect-garbage -d`. Next time I want to build my config, it needs
another 22.5s to calculate all of them again.

Is it possible that I no longer rely on Python, but instead implement the
trigonometric functions sin, cos, tan, and finally implement the Haversine
function?

And here comes the project today: trigonometric math library implemented in pure
Nix.

## sin, cos, tan: Taylor Expansion

The trigonometric functions, sine and cosine, have a relatively easy way to
compute: Taylor expansions. We all know that the sine function has the following
Taylor expansion:

$$
\begin{aligned}
\sin x &= \sum_{n=0}^\infty (-1)^n \frac{x^{2n+1}}{(2n+1)!} \\
&= x - \frac{x^3}{3!} + \frac{x^5}{5!} - ...
\end{aligned}
$$

We can observe that each expanded item can be calculated with basic arithmetric
operations. Therefore, we can implement the following functions in Nix:

```nix
{
  pi = 3.14159265358979323846264338327950288;

  # Helper functions to sum/multiply all items in the array
  sum = builtins.foldl' builtins.add 0;
  multiply = builtins.foldl' builtins.mul 1;

  # Modulos function, "a mod b". Used for limiting input to sin/cos to (-2pi, 2pi)
  mod = a: b:
    if a < 0
    then mod (b - mod (0 - a) b) b
    else a - b * (div a b);

  # Power function, calculates "x^times", where "times" is an integer
  pow = x: times: multiply (lib.replicate times x);

  # Sine function
  sin = x: let
    # Convert x to floating point to avoid integer arithmetrics.
    # Also modulos it by 2pi to limit input range and avoid precision loss
    x' = mod (1.0 * x) (2 * pi);
    # Calculate i-th item in the expansion, i starts from 1
    step = i: (pow (0 - 1) (i - 1)) * multiply (lib.genList (j: x' / (j + 1)) (i * 2 - 1));
    # Note: this lib.genList call is equal to for (j = 0; j < i*2-1; j++)
  in
    # TODO: Not completed yet!
    0;
}
```

For the calculation of a single Taylor expansion item, to avoid precision loss,
I didn't calculate the numerator and denominator separately before dividing
them. Instead, I expanded $\frac{x^n}{n!}$ to
$\frac{x}{1} \cdot \frac{x}{2} \cdot ... \cdot \frac{x}{n}$, and calculate them
one by one, and multiply all these much smaller results.

Then, we need to determine how many items we want to calculate. We could opt to
a constant number of items, 10 for example:

```nix
{
  sin = x: let
    x' = mod (1.0 * x) (2 * pi);
    step = i: (pow (0 - 1) (i - 1)) * multiply (lib.genList (j: x' / (j + 1)) (i * 2 - 1));
  in
    # Invert when x < 0 to reduce input range
    if x < 0
    then -sin (0 - x)
    # Calculate 10 Taylor expansion items and add them up
    else sum (lib.genList (i: step (i + 1)) 10);
}
```

But when a fixed number of items are used, since Nix uses 32 bit float for its
calculations, the 10 Taylor expansion items quickly diminish below floating
point accuracy when the input is very small, and further items are still not
small enough to be ignored with larger inputs. So I decided to have it make
decisions based on the value of Taylor expansion items, and stop computation
when the value is below our accuracy target:

```nix
{
  # Accuracy target, stop iterating when Taylor expansion item is below this
  epsilon = pow (0.1) 10;

  # Absolute value function "abs" and its alias "fabs"
  abs = x:
    if x < 0
    then 0 - x
    else x;
  fabs = abs;

  sin = x: let
    x' = mod (1.0 * x) (2 * pi);
    step = i: (pow (0 - 1) (i - 1)) * multiply (lib.genList (j: x' / (j + 1)) (i * 2 - 1));
    # Stop if absolute value of current item is below epsilon, continue otherwise
    # "tmp" is the accumulator, and "i" is the index for the Taylor expansion item
    helper = tmp: i: let
      value = step i;
    in
      if (fabs value) < epsilon
      then tmp
      else helper (tmp + value) (i + 1);
  in
    if x < 0
    then -sin (0 - x)
    # Accumulate from 0, index start from 1
    else helper 0 1;
}
```

Now we have a sine function with sufficient accuracy. Scan its result with input
from 0 to 10 (above $2 \pi$), with a step of 0.001:

```nix
{
  # arange: generate an array from "min" (inclusive) to "max" (exclusive) every "step"
  arange = min: max: step: let
    count = floor ((max - min) / step);
  in
    lib.genList (i: min + step * i) count;

  # arange: generate an array from "min" (inclusive) to "max" (inclusive) every "step"
  arange2 = min: max: step: arange min (max + step) step;

  # Test function: calculate each value from array "inputs" with "fn", and generate an attrset for input -> output
  testOnInputs = inputs: fn:
    builtins.listToAttrs (builtins.map (v: {
        name = builtins.toString v;
        value = fn v;
      })
      inputs);

  # Test function: try all inputs from "min" (inclusive) to "max" (inclusive) every "step"
  testRange = min: max: step: testOnInputs (math.arange2 min max step);

  testOutput = testRange (0 - 10) 10 0.001 math.sin;
}
```

Compare `testOutput` to the result of Python Numpy's `np.sin`, and all the
results are within 0.0001% of true value. This satisfies our precision
requirements.

Similarly, we can implement the cosine function:

```nix
{
  # Convert cosine to sine
  cos = x: sin (0.5 * pi - x);
}
```

You really think I'm doing it from ground zero again? Really?

Similarly, the tangent function is also simple:

```nix
{
  tan = x: (sin x) / (cos x);
}
```

I also ran the test on `cos` and `tan`, and the error is also within 0.0001%.

## arctan: Approximation. the Only Way

The arctangent function also has a Taylor expansion:

$$
\begin{aligned}
\arctan x &= \sum_{n=0}^\infty (-1)^n \frac{x^{2n+1}}{2n+1} \\
&= x - \frac{x^3}{3} + \frac{x^5}{5} - ...
\end{aligned}
$$

Yet it is easy to notice that arctan's Taylor expansion doesn't converge nearly
as fast as sine. Since its denominator increase linearly, we need to calculate
much more items before it's smaller than epsilon, which may cause a stack
overflow for Nix:

```bash
error: stack overflow (possible infinite recursion)
```

Taylor expansion is no longer an option then, we need something that calculates
much faster. Being inspired by <https://stackoverflow.com/a/42542593>, I decided
to fit the arctangent curve on $[0, 1]$ with polynomial regression, and map the
arctangent function in other ranges using the following rules:

$$
\begin{aligned}
x < 0,& \arctan (x) = -\arctan (-x) \\
x > 1,& \arctan (x) = \frac{\pi}{2} - \arctan (\frac{1}{x}) \\
\end{aligned}
$$

Start Python and Numpy, and begin the fitting process:

```python
import numpy as np

# Generate input to arctan, 1000 points on [0, 1]:
a = np.linspace(0, 1, 1000)

# Polynomial regression, I'm using 10th order polynomial (x^10)
fit = np.polyfit(a, np.arctan(a), 10)

# Output regression results
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

The output above means that the arctangent function on $[0, 1]$ can be
approximated with:

$$\arctan(x) = 0 + 0.9999991 x + 0.0000361 x^2 - ... + 0.0222228 x^{10}$$

We can replicate this polynomial function in Nix:

```nix
{
  # Polynomial calculation, x^0*poly[0] + x^1*poly[1] + ... + x^n*poly[n]
  polynomial = x: poly: let
    step = i: (pow x i) * (builtins.elemAt poly i);
  in
    sum (lib.genList step (builtins.length poly));

  # Arctangent function
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
    # Mapping when x < 0
    if x < 0
    then -atan (0 - x)
    # Mapping when x > 1
    else if x > 1
    then pi / 2 - atan (1 / x)
    # Polynomial calculation when 0 <= x <= 1
    else polynomial x poly;
}
```

I ran the precision test, and all results are within 0.0001% of true value.

## sqrt: Newtonian Method

For the square root function, we can iterate with the famous Newtonian method.
The iteration formula I'm using is:

$$a_{n+1} = \frac{a_n + \frac{x}{a_n}}{2}$$

Of which $x$ is the input to the square root function.

We can implement Newtonian square root calculation in Nix with the following
code, and iterate until the change in result is below epsilon:

```nix
{
  # Square root function
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

The precision test shows all results are within $1e-10$ (absolute value) of true
value.

## Haversine Formula

With the functions above ready, we can finally start implementing the Haversine
formula. I'm using this implementation from Stackoverflow as a reference:
<https://stackoverflow.com/a/27943>

```nix
{
  # Convert degree to radian
  deg2rad = x: x * pi / 180;

  # Haversine formula, input a pair of latitudes/longitudes, output surface distance on Earth
  haversine = lat1: lon1: lat2: lon2: let
    # Treat the Earth as a sphere with radius of 6371km
    radius = 6371000;
    # Radian of latitude difference
    rad_lat = deg2rad ((1.0 * lat2) - (1.0 * lat1));
    # Radian of longitude difference
    rad_lon = deg2rad ((1.0 * lon2) - (1.0 * lon1));
    # Calculate based on formula
    a = (sin (rad_lat / 2)) * (sin (rad_lat / 2)) + (cos (deg2rad (1.0 * lat1))) * (cos (deg2rad (1.0 * lat2))) * (sin (rad_lon / 2)) * (sin (rad_lon / 2));
    c = 2 * atan ((sqrt a) / (sqrt (1 - a)));
  in
    radius * c;
}
```

Finally, calculate the theoretical delay based on light speed:

```nix
{
  # 150000: distance light travels each millisecond, divided by 2 (for round trip)
  rttMs = lat1: lon1: lat2: lon2: floor ((haversine lat1 lon1 lat2 lon2) / 150000);
}
```

## Conclusion

I finally reached the target I was aiming for: calculate the theoretical network
latency between my nodes based on the light speed.

All these trigonometric functions (and some extra math functions) can be
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
