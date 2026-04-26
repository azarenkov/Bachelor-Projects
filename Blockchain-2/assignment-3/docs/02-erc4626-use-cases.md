# ERC-4626 use cases

ERC-4626 standardises tokenised yield-bearing vaults. A user deposits an
underlying ERC-20 asset and receives "shares" that represent a pro-rata claim
on the vault's growing pool of assets. The key invariant is that share price
(`totalAssets / totalSupply`) only ever moves up as yield accrues.

## Yearn v3

Yearn's v3 vaults (live since 2024) are pure ERC-4626. Each vault wraps a
single asset (USDC, ETH, DAI…) and routes deposits to one or more "strategies"
that farm yield (Aave lending, Curve LPs, Convex boosts, ETH staking). The
vault's `totalAssets()` is `idle + Σ strategy.report()`. Yield is recognised
via `harvest()`-style reports, exactly the pattern this assignment's `Vault`
mimics. Because the token is ERC-4626, downstream protocols (DeFi
aggregators, Pendle PT/YT, lenders) integrate yvUSDC the same way they would
any 4626 vault — no Yearn-specific glue.

## Aave aTokens

Aave aTokens are not strictly ERC-4626 (they are ERC-20 with rebasing balances),
but Aave v3 ships an ERC-4626 wrapper called `StaticATokenLM`. It converts
the rebasing aToken into a fixed-balance share-based vault token, which is
what most integrators want — Yearn, Morpho, Pendle, and most rate-swap
protocols all consume the static (4626) variant rather than the raw aToken.

## Why the standard matters

* **Composability.** Any 4626 vault can be plugged into any 4626-aware
  protocol (DEX router, looper, leveraged farming) without writing per-vault
  adapters. Pre-4626, every yield aggregator wrote bespoke adapters per Yearn
  / Compound / Aave version.
* **Frontends and indexers** can render any 4626 vault uniformly: deposit /
  withdraw / mint / redeem all have the same signatures and the same
  preview functions for slippage estimates.
* **Rounding rules** are codified — `convertToShares` rounds down on deposit
  and up on withdraw, which prevents the famous "first depositor inflation
  attack" when combined with virtual shares (OpenZeppelin's reference
  implementation, used here, ships with virtual-share protection).

## In this project

`Vault.sol` extends `OZ ERC4626` and adds `harvest(amount)`: the owner
transfers extra underlying into the vault and emits an event. This is the
simplest possible model of yield accrual — share price after the harvest is
`(totalAssets + amount) / totalSupply`. The 11 tests cover deposit/mint,
withdraw/redeem, share price increase after harvest, fewer-shares-for-later
depositors, rounding direction, preview parity, access control, and asset
introspection.
