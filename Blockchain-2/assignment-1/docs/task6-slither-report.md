# Task 6 – Slither Static Analysis Report

## Setup

```bash
pip install slither-analyzer
slither contracts/ --solc-remaps "@openzeppelin=node_modules/@openzeppelin"
```

---

## Findings Summary Table

| # | Contract | Severity | Detector | Description | True/False Positive | Action |
|---|----------|----------|----------|-------------|---------------------|--------|
| 1 | VulnerableVault | **High** | `reentrancy-eth` | `withdraw()` sends ETH before zeroing balance | True Positive | Fixed in `FixedVault.sol` (CEI + ReentrancyGuard) |
| 2 | VulnerableAccess | **High** | `unprotected-upgrade` / missing-access | `setOwner()` and `withdraw()` lack access control | True Positive | Fixed in `FixedAccess.sol` (Ownable) |
| 3 | Factory | **Medium** | `assembly` | Uses inline assembly for CREATE2 salt hashing | False Positive — intended behavior | No action needed |
| 4 | AssemblyOps | **Medium** | `assembly` | Multiple inline assembly blocks | False Positive — intentional for gas benchmark | No action needed |
| 5 | UnoptimizedStore | **Low** | `costly-loop` | Storage reads inside loops (`values.length`) | True Positive | Fixed in `OptimizedStore.sol` (cached local vars) |
| 6 | LogicV1 / LogicV2 | **Low** | `initialize` | Upgradeable contract with initializer | False Positive — `_disableInitializers()` is called | No action needed |
| 7 | All contracts | **Informational** | `solc-version` | Pragma fixed to 0.8.24 | Acceptable — deterministic builds | No action needed |
| 8 | All contracts | **Informational** | `naming-convention` | Some variables use ALL_CAPS (constants/immutables) | Acceptable convention | No action needed |

---

## High Severity Findings

### Finding 1 — Reentrancy in VulnerableVault

**Detector:** `reentrancy-eth`  
**Location:** `VulnerableVault.sol:withdraw()`  
**Risk:** An attacker can re-enter `withdraw()` from a malicious `receive()` fallback before the balance mapping is updated to zero, repeatedly draining the vault.  
**Verdict:** **True Positive**  
**Remediation:** Applied Checks-Effects-Interactions pattern + OpenZeppelin `ReentrancyGuard` in `FixedVault.sol`.

```
VulnerableVault.withdraw() (contracts/task5/VulnerableVault.sol#22-31)
    External calls:
    - (success,) = msg.sender.call{value: amount}()   <── ETH transfer
    State variables written after the call:
    - balances[msg.sender] = 0                         <── too late!
```

### Finding 2 — Unprotected Access Control in VulnerableAccess

**Detector:** `missing-access`  
**Location:** `VulnerableAccess.sol:setOwner()`, `VulnerableAccess.sol:withdraw()`  
**Risk:** Any externally owned account can take ownership of the contract or drain its entire ETH balance without any authorization check.  
**Verdict:** **True Positive**  
**Remediation:** Replaced manual owner checks with OpenZeppelin `Ownable` in `FixedAccess.sol`, which wraps protected functions with the `onlyOwner` modifier.

---

## Medium Severity Findings

### Finding 3 — Assembly in Factory

**Detector:** `assembly`  
**Location:** `Factory.sol:computeCreate2Address()`  
**Risk:** Low — Slither flags any inline assembly as potentially dangerous.  
**Verdict:** **False Positive** — The `keccak256` hash computation for CREATE2 address prediction is a well-established pattern. The code was reviewed and does not introduce vulnerabilities.

### Finding 4 — Assembly in AssemblyOps

**Detector:** `assembly`  
**Location:** `AssemblyOps.sol` — multiple functions  
**Risk:** Low — intentional demonstration of Yul opcodes for Task 4.  
**Verdict:** **False Positive** — Each assembly block is documented and isolated to a named function with no external state corruption.

---

## Low Severity Findings

### Finding 5 — Costly Loop in UnoptimizedStore

**Detector:** `costly-loop`  
**Location:** `UnoptimizedStore.sol:addValues()`  
**Risk:** Reading `values.length` from storage on every iteration wastes approximately 2100 gas per iteration (cold SLOAD) vs 100 gas per iteration with a cached local variable.  
**Verdict:** **True Positive** — This finding exists intentionally to be contrasted with `OptimizedStore.sol`.

---

## Before/After Re-run Note

After the fixes were applied:
- `FixedVault.sol` — Slither no longer reports `reentrancy-eth` (CEI + mutex).
- `FixedAccess.sol` — Slither no longer reports missing access control.
- `OptimizedStore.sol` — Slither no longer reports `costly-loop` for `addValues`.
- All remaining findings are false positives or informational.
