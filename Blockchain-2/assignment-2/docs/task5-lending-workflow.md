# Task 5 — LendingPool Workflow Diagram

## Deposit → Borrow → Repay → Withdraw Flow

```
User                        LendingPool                      collateralToken / borrowToken
 │                               │                                       │
 │──deposit(amount)──────────────►│                                       │
 │                               │──transferFrom(user, pool, amount)─────►│
 │                               │◄──────────────────────────────── ok ──│
 │                               │  positions[user].deposited += amount   │
 │◄──────────────────────────────│                                       │
 │                               │                                       │
 │──borrow(amount)───────────────►│                                       │
 │                               │  check: borrowed + amount ≤ LTV 75%   │
 │                               │──transfer(user, amount)───────────────►│
 │◄──────────────────────────────│                                       │
 │                               │                                       │
 │   ... time passes, interest   │                                       │
 │   accrues on next interaction │                                       │
 │                               │                                       │
 │──repay(amount)────────────────►│                                       │
 │                               │──transferFrom(user, pool, amount)─────►│
 │                               │  positions[user].borrowed -= amount    │
 │◄──────────────────────────────│                                       │
 │                               │                                       │
 │──withdraw(amount)─────────────►│                                       │
 │                               │  check: HF ≥ 1 after withdrawal        │
 │                               │──transfer(user, amount)───────────────►│
 │◄──────────────────────────────│                                       │


## Liquidation Path (when Health Factor < 1)

Liquidator                  LendingPool                      Tokens
 │                               │                                │
 │──liquidate(borrower)──────────►│                                │
 │                               │  check: HF(borrower) < 1       │
 │                               │  debt = positions[borrower].borrowed
 │                               │  collateralSeized = debt × 1.05
 │                               │──transferFrom(liquidator, pool, debt)─►│
 │                               │──transfer(liquidator, collateralSeized)►│
 │◄──────────────────────────────│                                │
```

## Interest Accrual Model

```
globalInterestIndex grows on every state-changing call:

  Δt = block.timestamp - lastAccrualTimestamp
  rate = BASE_RATE + SLOPE_RATE × (totalBorrowed / totalDeposited)
  globalInterestIndex *= (1 + rate × Δt)

Per-user debt is scaled when their position is next touched:
  user.borrowed = user.borrowed × globalInterestIndex / user.interestIndex
  user.interestIndex = globalInterestIndex
```

## Health Factor Formula

```
healthFactor = (deposited × 75) × 1e18 / (borrowed × 100)

  HF ≥ 1e18  →  solvent
  HF < 1e18  →  liquidatable
  HF = max   →  no debt
```
