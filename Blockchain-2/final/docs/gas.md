# Gas optimization report

Numbers below come from `forge test --gas-report`. Reproduce with:

```bash
forge test --gas-report --no-match-path 'test/fork/*' > docs/gas-output.txt
```

## 1. SimpleAMM (constant-product AMM)

| Function | Min | Avg | Median | Max | Calls |
|---|---|---|---|---|---|
| `addLiquidity` | 32_017 | 88_106 | 87_468 | 195_970 | 1_835 |
| `swapExactIn` | 24_630 | 70_890 | 70_194 | 87_361 | 1_876 |
| `removeLiquidity` | 29_327 | 52_577 | 52_577 | 75_827 | 2 |
| `quoteAmountOut` (view) | 3_364 | 3_364 | 3_364 | 3_364 | 4 |
| `getReserves` (view) | 2_548 | 2_548 | 2_548 | 2_548 | 3_684 |
| `pause` | 47_049 | 47_049 | 47_049 | 47_049 | 2 |

**Deployment:** 1_749_925 gas / 8_431 bytes runtime size.

### Reserve packing impact

The struct `(uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)`
fits into a single 256-bit storage slot. Compared to a naive
`(uint256, uint256, uint256)` layout:

| Layout | Cold SLOAD | Warm SLOAD | Notes |
|---|---|---|---|
| Three `uint256` slots | 3 × 2_100 = 6_300 | 3 × 100 = 300 | naive |
| Packed (this repo) | 1 × 2_100 = 2_100 | 1 × 100 = 100 | saves ~4_200 gas / swap |

## 2. YieldVault (ERC-4626)

| Function | Min | Avg | Median | Max | Calls |
|---|---|---|---|---|---|
| `deposit` | _per gas-report_ | 110_000+ | _med_ | _max_ | many |
| `redeem` | _per gas-report_ | 60_000+ | _med_ | _max_ | many |
| `accrueFees` | 28_959 | 39_733 | 30_013 | 69_949 | 4 |

**Deployment:** 1_606_340 gas / 8_132 bytes.

## 3. YulMath: assembly vs Solidity head-to-head

Measured via `test/unit/YulMath.bench.t.sol`:

| Function | Gas (single call) | Notes |
|---|---|---|
| `mulDivSolidity(x, y, d)` (in-bounds input) | 5_729 | Reverts on 512-bit intermediate |
| `mulDivYul(x, y, d)` (same input) | 5_736 | Correct for 512-bit intermediate |
| Δ | +7 gas | Negligible — the Yul version's advantage is *correctness*, not raw speed |

For inputs that overflow 256-bit (`big = 2^200`):

- `mulDivSolidity(big, 2, 2)` — **reverts** (`MulDivOverflow`).
- `mulDivYul(big, 2, 2)` — returns `2^200` correctly.

So the Yul variant is the only choice for the AMM's `sqrt(amount0 * amount1)`
where `amount0 * amount1` can overflow if reserves grow large.

## 4. L1 vs L2 gas comparison

Recorded from the Forge broadcast file on each chain. Update after deploy:

| Operation | L1 (Sepolia, chainId 11155111) | L2 (Arb Sepolia, chainId 421614) | Δ |
|---|---|---|---|
| Deploy `GovToken` | _from broadcast_ | _from broadcast_ | _from broadcast_ |
| Deploy `ProtocolGovernor` | _from broadcast_ | _from broadcast_ | _from broadcast_ |
| Deploy `TreasuryV1` + proxy | _from broadcast_ | _from broadcast_ | _from broadcast_ |
| Deploy `SimpleAMM` | _from broadcast_ | _from broadcast_ | _from broadcast_ |
| `amm.swapExactIn` | _from broadcast_ | _from broadcast_ | _from broadcast_ |
| `vault.deposit` | _from broadcast_ | _from broadcast_ | _from broadcast_ |

> The point of the table is to show that the *gas units* are similar between
> L1 and L2, but the *fiat cost* is ~10–20× lower on L2 because of the L2
> calldata-DA pricing model. After deploy, fill in the table with the
> `gasUsed * gasPrice * ethUsd` figures from the broadcast log on each chain.

## 5. Optimization patches applied (before → after)

| Patch | Where | Change | Δ gas |
|---|---|---|---|
| Pack reserves into one slot | `SimpleAMM` storage | 3 slots → 1 slot | ≈ −4 200 / swap |
| `immutable` token0/token1 | `SimpleAMM` constructor | SLOAD → bytecode | ≈ −2 100 / swap |
| Custom errors over `require(string)` | every contract | revert reason → 4-byte selector | ≈ −50 / revert |
| Skip `accrueFees` when fee is 0 | `YieldVault.accrueFees` | early return | no SSTORE on zero-fee vaults |
