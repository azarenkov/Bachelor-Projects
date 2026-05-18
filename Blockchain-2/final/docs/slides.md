---
title: "Protocol — DeFi Super-App"
subtitle: "Blockchain Technologies 2 — Final Project"
author: "Alexey Azarenkov"
date: "2026"
theme: "Madrid"
colortheme: "dolphin"
fontsize: 11pt
aspectratio: 169
---

# Project overview

**Scenario A — DeFi Super-App** (locked at end of Week 6).

A single integrated protocol:

- **AMM** — constant-product (x·y=k), 0.3% fee, built from scratch
- **Yield Vault** — ERC-4626 with performance fee
- **Oracle** — Chainlink price feed adapter with staleness check
- **Governance** — OZ Governor + 2-day Timelock + ERC20Votes token
- **Treasury** — UUPS-upgradeable, owned by the Timelock
- **Factory** — deploys vaults via CREATE2 for deterministic addresses

**Deployed on Arbitrum Sepolia (chain id 421614).**

---

# Architecture (C4 level 2)

```
        ┌─────────┐  votes  ┌──────────┐  propose  ┌──────────┐  queue/exec
        │ Holder  │────────▶│ Governor │──────────▶│ Timelock │──────┐
        └─────────┘         └──────────┘   2d delay└──────────┘      │
                                                                     ▼
        ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
        │ PriceOracle│  │ SimpleAMM  │  │ TreasuryProxy│  │ VaultFactory │
        │  Chainlink │  │  x·y=k     │  │  UUPS (V1)   │  │  CREATE2     │
        └────────────┘  └────────────┘  └──────────────┘  └──────────────┘
              ▲                                                  │
              │                                                  ▼
        ┌──────────┐                                     ┌──────────────┐
        │ Aggregator│                                    │ YieldVault   │
        │   ETH/USD│                                     │  ERC-4626    │
        └──────────┘                                     └──────────────┘
```

Every privileged role on every contract converges on the Timelock. The
deployer renounces all admin powers in the final step of `Deploy.s.sol`.

---

# Smart contract surface

| Contract | LoC | Pattern |
|---|---:|---|
| `GovToken` | 49 | ERC20Votes + Permit |
| `ProtocolGovernor` | 110 | Governor + TimelockControl |
| `ProtocolTimelock` | 11 | TimelockController (2 day delay) |
| `PriceOracle` | 65 | Oracle adapter, RBAC |
| `SimpleAMM` | 215 | x·y=k, CEI, ReentrancyGuard, Pausable |
| `YieldVault` | 130 | ERC-4626 + perf-fee + decimals offset 6 |
| `VaultFactory` | 80 | CREATE + CREATE2 |
| `TreasuryV1` / `TreasuryV2` | 60 / 35 | UUPS upgrade path |
| `YulMath` | 90 | Inline-assembly 512-bit `mulDiv` |

Total production code: ~840 LoC across 10 contracts.

---

# Required components — checklist

| Lecture | Requirement | Where |
|---|---|---|
| L1 | UUPS upgradeable | `TreasuryV1`/`V2` |
| L1 | Factory CREATE + CREATE2 | `VaultFactory` |
| L1 | Inline-assembly benchmarked | `YulMath` |
| L4-5 | DeFi primitive from scratch | `SimpleAMM` (x·y=k) |
| L6 | ERC20Votes + ERC20Permit | `GovToken` |
| L6 | ERC-4626 | `YieldVault` (decimal offset 6) |
| L7 | L2 deployment | Arbitrum Sepolia |
| L8 | Chainlink + staleness | `PriceOracle` |
| L8 | The Graph subgraph | `subgraph/` (6 entities) |
| L9 | Full Governor stack | `ProtocolGovernor` + `ProtocolTimelock` |

All present, all under test, all called by the frontend / subgraph.

---

# Security

- Slither: **0 results** across all detectors after justified suppressions.
- Custom error types, no `require(string)`.
- All ETH transfers use `call{value:}`; no `transfer/send`.
- All ERC-20 interactions use `SafeERC20`.
- No `tx.origin`, no `block.timestamp` as randomness.
- Reentrancy: CEI + `ReentrancyGuard` on every AMM/Vault entry point.
- Access control: every privileged function gated by `AccessControl`; all roles owned by Timelock post-deploy.
- Two case studies reproduced + fixed: reentrancy (cross-function via LP token), tx.origin-style access control.

---

# Testing — 88 total tests (104 with extras)

| Type | Count | Notes |
|---|---:|---|
| Unit | 80 | ≥1 happy path + ≥1 revert path per public function |
| Fuzz | 11 | AMM k-invariant, vault deposit/redeem, voting power, YulMath |
| Invariant | 5 | k monotonic, reserves match balances, vault asset coverage |
| Fork | 4 | Chainlink ETH/USD, Uniswap V2 quote, USDC whale transfer |

Coverage: **91.72% lines** (target ≥ 90%).

All CI lanes green: `forge fmt --check → forge build → forge test → forge coverage → slither`.

---

# Subgraph (The Graph)

6 entities:

- `Pool` — AMM pool reserves + counters
- `Swap` — every swap event (sender, to, tokenIn, amounts)
- `LiquidityChange` — add/remove with provider + shares
- `Vault` — every deployed YieldVault
- `Proposal` — Governor proposal lifecycle
- `Vote` — individual votes referencing proposal

5 documented GraphQL queries: recent swaps, top LPs, active proposals, vote history per address, vaults per asset.

dApp pulls the proposal list from the subgraph (not directly from the contract) per rubric requirement.

---

# Frontend (React + Wagmi v2)

- **Wallet connection** via RainbowKit (MetaMask, WalletConnect).
- **Network detection** — switches user to Arbitrum Sepolia if on wrong chain.
- **Reads:** GOV balance, voting power, delegate, AMM reserves, vault shares.
- **Writes (≥3):** `SimpleAMM.swapExactIn`, `YieldVault.deposit`, `ProtocolGovernor.castVote`.
- **Error handling:** wallet rejection, wrong network, insufficient balance — all surfaced as human messages, no raw RPC noise.
- **Proposal list** pulled from subgraph, with proposal-state badge and vote button.

---

# Deployment & Verification

`script/Deploy.s.sol`:
- Idempotent — re-runs produce the same wiring.
- Renounces deployer's privileged roles at the end.
- Writes `deployments/<chainId>.json` for the dApp / subgraph.

`script/VerifyDeployment.s.sol`:
- Asserts Timelock owns all admin roles.
- Asserts Governor params match the spec (1d delay, 1w period, 4% quorum, 1% threshold).
- Asserts deployer holds zero privileged roles.

All contracts verified on Arbiscan after `forge script --verify`.

---

# What's the team / individual ownership

Solo submission — Alexey Azarenkov:

- Smart contracts + tests + deploy scripts + verification.
- Subgraph definitions + mappings.
- Frontend (Wagmi + RainbowKit).
- CI pipeline + Slither integration.
- Architecture document + audit report + gas report.

(Per the rubric this scenario is solo; team-of-2-3 column not applicable.)

---

# Demo plan

1. Show repo layout + 100% CI green badge.
2. `forge test` — 88 passing, 91.72% coverage.
3. `slither .` — 0 results.
4. Open Arbiscan tab for each deployed contract — verified ABI present.
5. dApp: connect wallet → token stats → swap → vault deposit → cast vote.
6. Subgraph playground: run the 5 documented queries against the live indexer.
7. Live propose → vote → queue → execute through the Governor.

---

# Q&A
