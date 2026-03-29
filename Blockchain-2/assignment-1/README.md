# Blockchain-2 — Assignment 1
## Advanced Solidity Patterns & Security Fundamentals

A complete Hardhat project covering Weeks 1–2 of Blockchain Technologies 2.

---

## Project Structure

```
contracts/
  task1/   ChildContract.sol, Factory.sol              (Factory Pattern)
  task2/   LogicV1.sol, LogicV2.sol                    (UUPS Proxy)
  task3/   UnoptimizedStore.sol, OptimizedStore.sol     (Gas Optimization)
  task4/   AssemblyOps.sol                             (Inline Assembly)
  task5/   VulnerableVault.sol, Attacker.sol,
           FixedVault.sol, VulnerableAccess.sol,
           FixedAccess.sol                             (Security)
scripts/
  task1/deploy.js    (Factory deployment with gas comparison)
  task2/deploy.js    (UUPS proxy deploy + upgrade demo)
test/
  task1.test.js  task2.test.js  task3.test.js
  task4.test.js  task5.test.js
docs/
  task6-slither-report.md   (Static analysis report)
  task7-written-analysis.md (Proxy patterns + security landscape)
```

---

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test          # Run all 34 tests
npx hardhat test:gas      # With gas reporter
```

---

## Part 1 — Advanced Solidity Design Patterns

### Task 1: Factory Pattern

`Factory.sol` deploys `ChildContract` instances via both `CREATE` and `CREATE2`:

- `deployWithCreate(name)` — standard deployment
- `deployWithCreate2(name, salt)` — deterministic address deployment
- `computeCreate2Address(name, salt)` — pre-compute address before deployment
- `getDeployedContracts()` — returns all deployed addresses

**Gas Comparison (from test output):**

| Method  | Gas Used |
|---------|----------|
| CREATE  | ~377,557 |
| CREATE2 | ~361,378 |
| Delta   | −16,179  |

CREATE2 is slightly cheaper because Hardhat's inline optimizer can skip address derivation overhead.

### Task 2: UUPS Proxy Pattern

- **LogicV1**: counter with `increment()` and `get()`
- **LogicV2**: adds `decrement()` and `reset()` (owner only), state preserved on upgrade

The upgrade flow:
1. Deploy `LogicV1` behind an ERC-1967 UUPS proxy via OpenZeppelin's `upgrades.deployProxy`
2. Interact via the proxy address (counter incremented)
3. Call `upgrades.upgradeProxy` pointing to `LogicV2` — proxy address unchanged, counter value preserved

**How UUPS delegation works:** The proxy stores the implementation address in EIP-1967 slot `0x360894...`. Every call is forwarded via `delegatecall` — the logic contract's code executes in the proxy's storage context. Initializers replace constructors because constructors run in the implementation's storage (not the proxy's). Storage layout must remain stable across upgrades; `__gap` reserves space.

---

## Part 2 — Gas Optimization Workshop

### Task 3: 7 Gas Optimizations Applied

| # | Optimization | Technique | Gas Saved |
|---|---|---|---|
| 1 | Storage packing | bool+bool+uint8+address in one slot | ~6,400 (deployment) |
| 2 | `immutable` | FEE_RATE, TREASURY from bytecode | ~200/call |
| 3 | `constant` | MAX_SUPPLY compile-time | ~100/read |
| 4 | `calldata` | array parameter not copied | ~300 (5-element array) |
| 5 | Short-circuit | `paused` check first | fails fast |
| 6 | `unchecked` | safe arithmetic blocks | ~40/iteration |
| 7 | Cached storage | `len` and `supply` local vars | ~2,000/call |

**addValues gas (5 elements):** 195,850 → 189,567 (−6,283 gas, −3.2%)

### Task 4: Inline Assembly (Yul)

Three documented assembly operations in `AssemblyOps.sol`:

1. **`caller()` opcode** — read `msg.sender` directly
2. **Bitwise `and(n, n-1)`** — O(1) power-of-two check
3. **`sload` / `sstore`** — direct storage slot access

**Gas comparison (writeStorage):** Solidity: 27,838 | Assembly: 25,048 (−2,790 gas, −10%)

Assembly is justified for cryptography, proxy delegation, and tight loops. Risks: no type safety, storage corruption, harder auditing.

---

## Part 3 — Smart Contract Security

### Task 5A: Reentrancy

- **`VulnerableVault.sol`** — updates balance AFTER `call{value}`, exploitable
- **`Attacker.sol`** — re-enters `withdraw()` from `receive()` fallback
- **Test result:** 5 ETH vault drained to 0 ETH in one transaction
- **`FixedVault.sol`** — CEI pattern + `ReentrancyGuard`: attack reverts, vault preserved

### Task 5B: Access Control

- **`VulnerableAccess.sol`** — `setOwner()` and `withdraw()` missing `onlyOwner`
- **Test result:** attacker takes ownership and drains 3 ETH without authorization
- **`FixedAccess.sol`** — OpenZeppelin `Ownable`: all privileged calls protected

---

## Part 4 — Theoretical Analysis

See [`docs/task7-written-analysis.md`](docs/task7-written-analysis.md) for:
- Comparison of Transparent, UUPS, and Diamond proxy patterns
- Top 5 DeFi vulnerabilities with real-world incident analysis (DAO, Wormhole, Euler)
- Automated tools vs manual auditing
- Security Development Lifecycle

See [`docs/task6-slither-report.md`](docs/task6-slither-report.md) for static analysis findings.
