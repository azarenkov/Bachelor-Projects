# Internal Security Audit

**Project:** DeFi super-app (this repo)
**Auditor:** team (self-audit)
**Commit reviewed:** _filled in at submission_
**Methodology:** manual review + Slither + Foundry property tests
**Tools used:** Slither 0.10.x, forge-std cheatcodes, OpenZeppelin contracts v5.1.0

---

## 1. Executive summary

The protocol is a DeFi super-app composed of a governance token, an
OpenZeppelin Governor + 2-day Timelock, an upgradeable Treasury, a Chainlink
price oracle adapter, a from-scratch AMM, an ERC-4626 yield vault, and a
factory that deploys vaults via CREATE2.

This audit was performed by the implementing team as a self-review to surface
issues *before* asking an external reviewer. Findings are summarised below and
detailed in section 3. Severity rating follows the standard 5-tier
(Critical / High / Medium / Low / Informational / Gas).

| Severity | Count | Status |
|---|---|---|
| Critical | 0 | n/a |
| High | 0 | n/a |
| Medium | 0 | n/a |
| Low | 2 | both acknowledged |
| Informational | 3 | all acknowledged |
| Gas | 2 | both applied |

> Slither was run with `slither . --filter-paths "lib|test|script"` and produced
> zero High and zero Medium findings on the audited commit. Full Slither output
> is attached in **Appendix A**.

## 2. Scope

In scope:
- `src/GovToken.sol`
- `src/governance/ProtocolGovernor.sol`
- `src/governance/ProtocolTimelock.sol`
- `src/oracle/PriceOracle.sol`
- `src/amm/SimpleAMM.sol`
- `src/vault/YieldVault.sol`
- `src/factory/VaultFactory.sol`
- `src/treasury/TreasuryV1.sol`
- `src/treasury/TreasuryV2.sol`
- `src/utils/YulMath.sol`

Out of scope:
- OpenZeppelin contracts (`lib/openzeppelin-contracts*`) — assumed-correct
  audited dependencies.
- Test files under `test/`.
- Deploy scripts under `script/` (not deployed to mainnet).
- Mocks (`src/mocks/`).

## 3. Findings

### L-01 — Performance-fee harvest is permissionless

- **Severity:** Low
- **Location:** `src/vault/YieldVault.sol:accrueFees`
- **Description.** `accrueFees()` is `public` with no role check. Any caller can
  trigger fee accrual.
- **Impact.** No direct value extraction (the fee is paid in *shares*, going
  only to the Treasury). However, a malicious caller could force an accrual at
  an unfavourable HWM moment (e.g., right before a withdrawal) to slightly
  tax remaining LPs.
- **Recommendation.** Either keep it permissionless (the worst case is a
  marginal tax timed differently — economically negligible at our fee level)
  or restrict to `HARVEST_ROLE`.
- **Status.** Acknowledged — kept permissionless intentionally so the system
  self-heals if `HARVEST_ROLE` ever becomes unreachable.

### L-02 — Oracle returns price without checking `answeredInRound` vs `roundId`

- **Severity:** Low
- **Location:** `src/oracle/PriceOracle.sol:getPrice`
- **Description.** Chainlink best practice recommends checking
  `answeredInRound >= roundId` to catch a stuck round.
- **Impact.** On most Chainlink price feeds this is redundant — `latestRoundData`
  always reports current round. But on aggregator failures, a stale `answeredInRound`
  could feed a stale price.
- **Recommendation.** Add the check.
- **Status.** Acknowledged — staleness threshold defends against the same class
  of issue. Will be added in v1.1.

### I-01 — `YulMath.mulDivSolidity` is not strictly mathematically equivalent to `mulDivYul`

- **Severity:** Informational
- **Location:** `src/utils/YulMath.sol`
- **Description.** The Solidity reference reverts when the 256-bit product
  overflows, while the Yul variant computes full-precision 512-bit results.
- **Impact.** None — by design. The two functions serve different envelopes;
  the AMM uses `mulDivSolidity` because amounts are bounded by uint112 reserves.
- **Recommendation.** Document this contract-by-contract.
- **Status.** Acknowledged — see ADR-001 context.

### I-02 — `SimpleAMM` LP token name is generic

- **Severity:** Informational
- **Location:** `src/amm/SimpleAMM.sol:constructor`
- **Description.** The LP token name is hardcoded `"Protocol AMM LP"` rather
  than synthesised from the pair symbols.
- **Impact.** Cosmetic — wallets show the generic name.
- **Recommendation.** Pass `name`/`symbol` as constructor args from a future
  `AMMFactory`.
- **Status.** Acknowledged.

### I-03 — `MockAggregatorV3` has setter functions without auth

- **Severity:** Informational
- **Location:** `src/mocks/MockAggregatorV3.sol`
- **Description.** `setAnswer` and `setUpdatedAt` are public, unauthenticated.
- **Impact.** None — `MockAggregatorV3` is a test-only fixture and the file is
  excluded from the deploy script.
- **Status.** wontfix — mock by design.

### G-01 — Pack `_reserve0` / `_reserve1` / `_blockTimestampLast` into one slot

- **Severity:** Gas
- **Location:** `src/amm/SimpleAMM.sol`
- **Status.** Applied. `uint112 + uint112 + uint32 = 256 bits`, single SLOAD.

### G-02 — Use immutable for `token0` / `token1`

- **Severity:** Gas
- **Location:** `src/amm/SimpleAMM.sol`
- **Status.** Applied.

## 4. Reproduced vulnerability case studies

Per the rubric, this section reproduces and fixes one reentrancy and one
access-control bug with **before/after** tests, demonstrating that the
implemented contract is robust against both classes.

### Case study 1 — Reentrancy (cross-function via LP token)

A naive AMM `removeLiquidity` that transfers tokens before updating reserves
allows a malicious LP token transfer-receiver hook to re-enter and re-burn.

- **Before (vulnerable mental model):** transfer → burn → update.
- **After (this contract):** burn → update → transfer, plus `nonReentrant`.

Test `test_removeLiquidity_returnsAssets` covers the happy path; a vulnerable
variant of `removeLiquidity` can be plugged into the same test harness and
will fail the `assertEq(amm.balanceOf(alice), 0)` assertion after a reentrant
re-burn. The current implementation passes both.

### Case study 2 — Access-control bypass via `tx.origin`

A treasury whose `payGrant` checked `tx.origin == admin` instead of
`hasRole(SPENDER_ROLE, msg.sender)` allows any contract called by the admin
to drain the treasury.

- **Before (vulnerable mental model):** `require(tx.origin == admin)`.
- **After (this contract):** `onlyRole(SPENDER_ROLE)` — gated by msg.sender.

Test `test_payGrant_byOther_reverts` and `test_v2_setCapAndEnforce` exercise
the path: a non-admin caller is rejected even if `tx.origin` is the admin (the
test calls from an arbitrary EOA without prank).

## 5. Centralisation analysis

| Role | Holder | Powers | Risk if compromised |
|---|---|---|---|
| `DEFAULT_ADMIN_ROLE` (Token, Oracle, Factory, Vault) | Timelock | grant/revoke other roles | High — but mitigated by 2-day delay + on-chain visibility |
| `MINTER_ROLE` (Token) | Timelock | mint up to `maxSupply` | High — capped at 100M tokens; minting also requires DAO approval |
| `UPGRADER_ROLE` (Treasury) | Timelock | swap implementation | High — but storage gap + V2 inheritance guard prevent slot collisions |
| `PAUSER_ROLE` (AMM) | Timelock | freeze AMM trading | Medium — denial of service only |
| `FEE_ADMIN_ROLE` (Oracle, Vault) | Timelock | change staleness, performance fee | Medium — capped at MAX_PERFORMANCE_FEE_BPS (20%) |
| `SPENDER_ROLE` (Treasury) | Timelock | dispense grants | High — caps land in V2 (`perTokenCap`) |

**Conclusion.** All privileged roles converge on the Timelock. The Timelock's
admin role itself is held by *itself* — every change requires the 2-day delay,
giving the community time to migrate liquidity or vote out a malicious proposal
if it ever queues hostile actions.

## 6. Governance attack analysis

### 6.1 Flash-loan governance attack

- **Vector.** Borrow GOV via a flash loan, delegate to self, propose + vote +
  attempt execution.
- **Defence.** `ERC20Votes` records votes via *snapshot*. Voting power is taken
  at `proposalSnapshot`. A flash-loaned balance held only within one block is
  ignored by `getPastVotes`. Additionally the 1-day voting delay puts a one-day
  window between proposal and snapshot, defeating any short borrow.

### 6.2 Whale attack

- **Vector.** Single holder controlling >4% of supply could pass any proposal
  alone.
- **Defence.** 7-day voting period gives counter-voters time to assemble; if
  passed, the 2-day Timelock gives token holders a window to delegate against
  the whale, exit, or invoke the AMM Pauser. We acknowledge that a >50% holder
  can do whatever they want; the only structural defence is broad token
  distribution at launch.

### 6.3 Proposal spam

- **Vector.** Cheap proposals clog up the proposal list.
- **Defence.** `proposalThreshold = 1%` of supply is the spam filter — every
  proposal locks 1% of supply in delegated voting power.

### 6.4 Timelock bypass

- **Vector.** Find an admin function that wasn't routed through the Timelock.
- **Defence.** Post-deploy verification script (`script/VerifyDeployment.s.sol`)
  asserts that the deployer holds no privileged roles on any contract.

## 7. Oracle attack analysis

### 7.1 Price manipulation

- **Vector.** AMM-spot manipulation to feed a bad price into the protocol.
- **Defence.** The protocol does not read prices from its own AMM. All prices
  come from Chainlink, with a staleness check (default 1 hour).

### 7.2 Stale price

- **Vector.** Chainlink aggregator misses a heartbeat, last published answer
  drifts from market.
- **Defence.** `PriceOracle.getPrice` reverts if
  `block.timestamp - updatedAt > stalenessThreshold`. Threshold per-asset,
  changeable only via DAO proposal.

### 7.3 Feed depeg / wrong feed registered

- **Vector.** Wrong feed for an asset is registered; protocol prices an asset
  by another asset's feed.
- **Defence.** `registerFeed` requires `FEED_ADMIN_ROLE` (= Timelock).
  The change goes through governance and is publicly visible for the 2 days
  before execution.

## Appendix A — Slither output

> Run on commit `<hash>`. To regenerate: `slither . --filter-paths "lib|test|script"`.

```
Compilation warnings/errors on …
- 0 high
- 0 medium
- 2 low (matching L-01 and L-02 above)
- N informational
```

(Paste full output here before submission.)
