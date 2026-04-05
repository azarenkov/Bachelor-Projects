# Task 4 — AMM Mathematical Analysis

## 1. Constant-Product Formula Derivation

An AMM pool holds two reserves: `x` (token A) and `y` (token B). The invariant is:

```
x · y = k
```

When a trader sends `Δx` of token A to the pool, the new reserve of A becomes `x + Δx`.
For `k` to remain constant, the new reserve of B must satisfy:

```
(x + Δx) · y' = k = x · y
⟹  y' = (x · y) / (x + Δx)
⟹  Δy = y - y' = y - (x · y) / (x + Δx) = (y · Δx) / (x + Δx)
```

This formula has a crucial property: **no matter how much `Δx` is sent, `y'` can never reach 0**
(division by `x + Δx` always yields a positive remainder). The pool can never be fully drained.

## 2. Effect of the 0.3 % Fee on k

Uniswap V2 charges a fee by only crediting `99.7 %` of the input:

```
amountInWithFee = Δx · 997
numerator       = amountInWithFee · y
denominator     = x · 1000 + amountInWithFee

Δy = numerator / denominator
```

After the swap the reserves become:
```
x' = x + Δx          (full input enters the pool)
y' = y - Δy          (output is slightly less than without fee)
```

Therefore:
```
x' · y' = (x + Δx) · (y - Δy) > x · y
```

The product **strictly increases** with every swap because the pool keeps the 0.3 % fee as
additional reserve. Over time `k` drifts upward, and liquidity providers accrue this value when they
remove liquidity.

## 3. Impermanent Loss

Suppose a provider deposits at price `p₀ = y/x`. The price moves to `p₁ = r · p₀` (e.g., `r = 2`
for a 2× price increase).

Under constant product: `x · y = k ⟹ x = √(k/p), y = √(k·p)`.

The value of the LP position at price `p₁` is:

```
V_AMM = 2 · √(k · p₁) = 2 · √(k · r · p₀)
```

The value of holding the initial tokens (no LP) at price `p₁` is:

```
V_hold = x₀ · p₁ + y₀ = x₀ · r · p₀ + x₀ · p₀
       = x₀ · p₀ · (r + 1)
```

Impermanent Loss percentage:

```
IL = V_AMM / V_hold - 1 = 2√r / (r + 1) - 1
```

For a **2× price increase** (`r = 2`):

```
IL = 2·√2 / (2 + 1) - 1 = 2·1.4142 / 3 - 1 ≈ 0.9428 - 1 = -5.72 %
```

The LP position is worth **5.72 % less** than simply holding. This loss becomes permanent only when
the LP withdraws at that price.

| Price change (r) | IL     |
|-----------------|--------|
| 1.25×           | -0.6 % |
| 1.5×            | -2.0 % |
| 2×              | -5.7 % |
| 4×              | -20.0 %|
| 10×             | -42.5 %|

## 4. Price Impact as a Function of Trade Size

The spot price before the trade is `p₀ = y/x`. After sending `Δx` of token A:

```
p₁ = y' / x' = (y - Δy) / (x + Δx)
```

Price impact:

```
PI = (p₁ - p₀) / p₀ ≈ -Δx / (x + Δx)
```

For small trades (`Δx ≪ x`) the impact is approximately linear in `Δx/x`. For large trades
it grows super-linearly; swapping `Δx = x` (100 % of reserve) would result in a 50 % price impact.

This is why large AMM trades are always split (or routed across multiple pools).

## 5. Comparison to Uniswap V2

| Feature | This AMM | Uniswap V2 |
|---|---|---|
| Formula | x·y = k (identical) | x·y = k |
| Fee | 0.3 % (identical) | 0.3 % |
| LP token | ERC-20 (identical) | ERC-20 |
| Factory/pair pattern | Single contract | Factory deploys pairs |
| Flash swaps | ❌ | ✅ |
| Protocol fee | ❌ | ✅ (switchable 1/6 of 0.3 %) |
| Price oracle (TWAP) | ❌ | ✅ (cumulative price) |
| Minimum liquidity lock | ❌ | ✅ (1 000 wei burned) |
| Permit (EIP-2612) | ❌ | ✅ on LP tokens |
| Multi-hop routing | ❌ | ✅ via Router02 |

The most important missing feature is the **TWAP price oracle**, which makes Uniswap V2 pairs
safe to use as on-chain price feeds (the manipulation cost grows with the pool size and block time).
Flash swaps are also absent; they enable atomic arbitrage without capital and are central to the
Uniswap ecosystem's efficiency.
