# Architecture & Design

**Project:** DeFi super-app (AMM + ERC-4626 yield vault + governance)
**Course:** Blockchain Technologies 2
**Status:** capstone

This document covers the production-time architecture, contract storage layouts,
trust assumptions, and the architectural decision records (ADRs) for the
significant choices in the codebase.

---

## 1. System context (C4 level 1)

```
                  ┌────────────────────────┐
                  │   End user / wallet    │
                  │  (MetaMask, WC, etc.)  │
                  └───────────┬────────────┘
                              │ tx
                              ▼
            ┌─────────────────────────────────┐         ┌───────────────────────┐
            │            Frontend             │ HTTPS   │   The Graph subgraph  │
            │   (React + Wagmi + Viem)        │◀───────▶│  (hosted/Studio)      │
            └───────────┬─────────────────────┘   query └──────────▲────────────┘
                        │                                          │ index events
                        ▼                                          │
            ┌─────────────────────────────────────────────────────────────┐
            │                 Arbitrum Sepolia (L2)                        │
            │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
            │  │ Governor   │─▶│ Timelock   │─▶│ Treasury   │  + Oracle    │
            │  └────────────┘  └─────┬──────┘  │ (UUPS)     │  + AMM       │
            │                        │         └────────────┘  + Vault     │
            │                        │                          + Factory  │
            │                        └──── admin of ───────────────────────┤
            └─────────────────────────────────────────────────────────────┘
                                              ▲
                                              │ Chainlink price feed
                                       ┌──────┴──────┐
                                       │  Aggregator │
                                       └─────────────┘
```

## 2. Container / component diagram (C4 level 2)

```
┌─────────────────────────────  Governance plane  ─────────────────────────────┐
│                                                                              │
│   ┌──────────┐  delegates  ┌──────────┐  propose / vote / queue / execute   │
│   │ GovToken │◀────────────│ Voter    │──────────────┐                       │
│   │ (ERC20V) │             └──────────┘              ▼                       │
│   └─────┬────┘                                ┌────────────┐                 │
│         │ voting power                        │  Governor  │                 │
│         └────────────────────────────────────▶└─────┬──────┘                 │
│                                                     │ queueOperations()      │
│                                                     ▼                        │
│                                              ┌────────────┐ 2-day delay      │
│                                              │ Timelock   │                  │
│                                              └─────┬──────┘                  │
│                                                    │ execute()               │
└────────────────────────────────────────────────────┼──────────────────────────┘
                                                     │
       ┌─────────────────────────  Protocol plane  ──┴─────────────────────────┐
       │                                                                       │
       │   ┌─────────┐   admin   ┌────────────┐   admin   ┌──────────────┐    │
       │   │ Oracle  │◀──────────│  Timelock  │──────────▶│  AMM         │    │
       │   └─────────┘           └─────┬──────┘           └──────────────┘    │
       │                               │ upgrader                              │
       │                               ▼                                       │
       │                       ┌──────────────┐                                │
       │                       │ TreasuryProxy│ ─┐                             │
       │                       │ (ERC1967)    │  │ delegatecall                │
       │                       └──────┬───────┘  │                             │
       │                              │          ▼                             │
       │                              │   ┌──────────────┐                     │
       │                              │   │ TreasuryV1   │  ← upgradeable      │
       │                              │   │ TreasuryV2   │     to V2 via UUPS  │
       │                              │   └──────────────┘                     │
       │                              │                                        │
       │                              ▼                                        │
       │                       ┌──────────────┐  deploys  ┌──────────────┐     │
       │                       │ VaultFactory │──────────▶│  YieldVault  │     │
       │                       │ (CREATE/CR2) │           │  (ERC-4626)  │     │
       │                       └──────────────┘           └──────────────┘     │
       └───────────────────────────────────────────────────────────────────────┘
```

## 3. Sequence diagrams

### 3.1 Swap (AMM)

```
User       SimpleAMM        token0          token1
 │ swapExactIn(tokenIn=token0, amountIn, minOut, to)
 ├──────────▶│
 │           │ check whenNotPaused, nonReentrant
 │           │ getReserves() → (r0, r1)
 │           │ amountOut = (amountIn*997*r1) / (r0*1000 + amountIn*997)
 │           │ require amountOut >= minOut
 │           │ safeTransferFrom(user, this, amountIn)  ──▶ │
 │           │                                              │
 │           │ safeTransfer(to, amountOut)  ──────────────────────▶ │
 │           │                                                      │
 │           │ _update(r0 + amountIn, r1 - amountOut)
 │           │ emit Swap, Sync
 │◀──────────┤ amountOut
```

### 3.2 Governance: propose → vote → queue → execute

```
Voter1       Governor        Timelock        Target (e.g. Treasury / Oracle)
  │ propose(...)
  ├───────▶│ check threshold (>=1% supply)
  │        │ snapshot block, state = Pending
  │        │
  │  wait votingDelay (1 day)
  │        │ state → Active
  │  cast votes
  │        │ accumulate "for" weight
  │  wait votingPeriod (1 week)
  │        │ state → Succeeded (or Defeated/Expired)
  │
  │ queue(targets, values, calldatas, descHash)
  ├───────▶│ queueOperations() → scheduleBatch(eta = now + 2d) ─▶ │
  │        │ state → Queued                                       │
  │
  │  wait minDelay (2 days)
  │
  │ execute(targets, values, calldatas, descHash)
  ├───────▶│ executeBatch() ───────────────────────────────────▶ │
  │        │                                                     │ executes
  │        │ state → Executed                                    │ as Timelock
```

### 3.3 Vault deposit + harvest

```
LP          YieldVault       USDC           Treasury
 │ deposit(1000, LP)
 ├──────────▶│ accrue() — first deposit, no profit to skim
 │           │ super.deposit() — uses ERC4626 conversion w/ virtual offset 6
 │           │ safeTransferFrom(LP, this, 1000) ──▶ │
 │           │ mint(LP, shares)
 │           │ resetHighWaterMark() → HWM = totalAssets()
 │◀──────────┤ shares
 │
 │ … time passes, vault earns ⟶ totalAssets grows by 100 (yield) ⟶
 │
 │ accrueFees() (anyone may call)
 ├──────────▶│ profit = 100, feeBps = 1000 (10%) ⟶ feeAssets = 10
 │           │ feeShares = previewDeposit(10)
 │           │ _mint(Treasury, feeShares)  ───────────────────▶ │
 │           │ emit PerformanceFeeAccrued
 │◀──────────┤
```

## 4. Storage layouts (upgradeable contracts)

### 4.1 `TreasuryV1` (UUPS-proxied)

Inherits, in linearised order:
`Initializable → AccessControlUpgradeable → UUPSUpgradeable → TreasuryV1`.

| Slot | Variable | Source |
|----:|---|---|
| `0x00...0` | `_initialized`, `_initializing` (Initializable) | `Initializable.sol` |
| `0xcd5e...` (ERC-7201 namespace) | `_roles` mapping (AccessControl) | `AccessControlUpgradeable.sol` |
| `0xb53127...` (ERC-7201 namespace) | UUPSUpgradeable's slot | `UUPSUpgradeable.sol` |
| Slots 1..50 | `__gap` (reservation) | `TreasuryV1` |

`TreasuryV2` declares one new state variable (`perTokenCap`) which consumes
**one** slot from the V1 `__gap`. Therefore `TreasuryV2.__gap` is the same gap
shrunk by one slot. **Storage layout is forward-compatible.**

### 4.2 `GovToken`

Inherits `ERC20 + ERC20Permit + ERC20Votes + AccessControl`. All parent state
is on canonical OZ slots, no overrides; the additional `maxSupply` is `immutable`
(constructor-only, no storage slot).

### 4.3 `SimpleAMM`

| Slot | Variable | Type |
|---|---|---|
| 0..N (OZ parents) | `_balances`, `_allowances`, `_totalSupply`, `_name`, `_symbol` (ERC20) | inherited |
| | `_status` (ReentrancyGuard) | inherited |
| | `_paused` (Pausable) | inherited |
| | `_roles` (AccessControl) | inherited |
| custom | `_reserve0 : uint112` packed with | own |
| custom | `_reserve1 : uint112` and | own |
| custom | `_blockTimestampLast : uint32` (32+112+112 = 256, single slot) | own |

The reserve trio is **packed into one slot** for cheaper warm SLOAD/SSTORE per
swap, mirroring Uniswap V2's layout decision.

## 5. Trust assumptions

| Actor | Powers | Can they brick the protocol? |
|---|---|---|
| End users (LPs, swappers, voters) | swap, add/remove liquidity, deposit/withdraw vault, vote, delegate | No |
| Token holders ≥1% supply | propose | Only via 7-day vote + 2-day timelock |
| Token holders ≥4% supply | reach quorum | Same |
| Timelock | upgrade Treasury, register oracle feeds, pause AMM, grant/revoke roles, mint GovToken | **Yes, eventually** — but every move is queued ≥2 days and is on-chain visible. |
| Governor | propose execution; itself cannot execute directly (must go via Timelock) | No (it is the proposer only) |
| Deployer | hold roles transiently during deploy, **renounced at the end of `Deploy.s.sol`** | No, post-deploy. |

Post-deploy, the Timelock is the only address with privileged roles. If the
Timelock's admin key is compromised, the worst case is the malicious actor must
still wait 2 days to execute, giving the community a window to react (token
delegation can re-route quorum, the Pauser role can be invoked to freeze the AMM).

## 6. Design patterns used

This project consciously uses the following patterns from the rubric list:

1. **Factory pattern** — `VaultFactory` deploys `YieldVault` instances. CREATE
   gives a non-deterministic address (cheaper, simpler); CREATE2 gives a
   deterministic address that can be precomputed off-chain — useful for the
   subgraph (start-block can be set to the factory-deploy block while still
   indexing predetermined per-pool addresses).
2. **Proxy / UUPS** — `TreasuryV1` is the implementation behind an `ERC1967Proxy`.
   `_authorizeUpgrade` gates the upgrade behind `UPGRADER_ROLE`, which is held
   only by the Timelock.
3. **Checks-Effects-Interactions** — every state-changing function in `SimpleAMM`
   computes `amountOut` (check) → mints/burns shares (effect) → only then runs
   the `safeTransferFrom`/`safeTransfer` calls (interaction).
4. **Reentrancy Guard** — `nonReentrant` on every AMM and Vault entry point as
   a defence-in-depth on top of CEI.
5. **Access Control / Role-based permissions** — every privileged function on
   every contract is gated by an OpenZeppelin AccessControl role. No `Ownable`,
   no `tx.origin`, no implicit admin.
6. **Pausable / Circuit Breaker** — `SimpleAMM.pause()` lets the Timelock freeze
   swaps if an oracle disaster occurs.
7. **State Machine** — Governor proposal lifecycle (Pending → Active →
   Succeeded → Queued → Executed) is the canonical state machine the protocol
   relies on for parameter changes.
8. **Oracle adapter** — `PriceOracle` abstracts the Chainlink `AggregatorV3`
   surface, so a feed swap (or a wrapper around an L2-sequencer-uptime feed)
   needs no consumer changes.
9. **Timelock** — `TimelockController` enforces the 2-day delay between approval
   and execution; this is the single most important defence against
   flash-loan-funded governance.

## 7. Architectural Decision Records (ADRs)

### ADR-001: Build the AMM from scratch instead of forking Uniswap V2

- **Context.** The rubric requires *one* DeFi primitive built from scratch.
  AMM was chosen because the math (`x·y=k`, fee numerator/denominator) and
  rounding behaviour are well-trodden and easy to reason about, leaving more
  room for the rest of the protocol.
- **Decision.** Implement a single-pair AMM with token0/token1 sorting,
  Uniswap-style fee numerator (997/1000), LP shares minted by ERC20, initial
  MINIMUM_LIQUIDITY burn to the dead address, and Pausable circuit-breaker.
- **Consequences.** We don't get Uniswap's router/path abstractions, but we
  also don't carry the audit complexity. The Pausable + ReservedOverflow guard
  are first-class instead of bolted on.

### ADR-002: UUPS over Transparent Proxy for the Treasury

- **Context.** OpenZeppelin's Transparent and UUPS proxies are functionally
  equivalent for our use case.
- **Decision.** Use UUPS because the upgrade logic lives in the implementation
  (smaller proxy ⇒ cheaper deploy), and the upgrade auth is just an AccessControl
  role we already use everywhere.
- **Consequences.** A buggy V2 that omits `_authorizeUpgrade` could brick
  upgradeability. We mitigate this by always inheriting V2 from V1 (which
  has the auth function) and by deploying a smoke-test against `version()`
  before the upgrade is queued through governance.

### ADR-003: Timestamp clock for ERC20Votes

- **Context.** OZ v5 ERC20Votes allows either block-number or timestamp clock
  via `clock()`/`CLOCK_MODE()`.
- **Decision.** Timestamp. L2 block numbers are noisy and don't map to a clean
  "1 day" / "1 week" duration; timestamps do.
- **Consequences.** Governor parameters (`votingDelay`, `votingPeriod`) are
  expressed in seconds (`1 days`, `1 weeks`). Time-warps in tests work
  identically.

### ADR-004: Performance fee charged in shares, not assets

- **Context.** Vault performance fee mechanism — could transfer asset at
  harvest, or could mint shares to the Treasury proportional to profit.
- **Decision.** Mint shares. No external transfer, no rebase, no risk of
  draining liquidity at harvest.
- **Consequences.** Treasury holds vault shares; when it redeems them it
  cashes out at the share/asset rate at that moment. Slightly favours the
  Treasury during periods of rising NAV.

### ADR-005: ERC-4626 `_decimalsOffset() = 6`

- **Context.** OZ's ERC4626 mitigates the first-depositor inflation attack
  using a virtual-share offset.
- **Decision.** Override to 6. This raises the cost of the attack by 10⁶ at
  the price of a small share-precision tax on initial depositors.
- **Consequences.** Even after a 1 wei + 1M USDC donation, a 100 USDC normal
  deposit still mints a non-zero, recoverable share balance — verified by an
  explicit unit test.
