# Blockchain-2 Assignment 2 — DeFi Protocol Development (AMM / DEX)

Foundry project implementing a full AMM, a lending protocol, and a professional test suite covering
unit tests, fuzz tests, invariant tests, and fork tests.

---

## Project Structure

```
assignment-2/
├── src/
│   ├── MockERC20.sol          # Mintable ERC-20 (Task 1 + shared test token)
│   ├── LPToken.sol            # LP share token minted/burned by AMM
│   ├── AMM.sol                # Constant-product AMM with 0.3 % fee (Task 3)
│   └── LendingPool.sol        # Single-asset lending/borrowing protocol (Task 5)
├── test/
│   ├── MockERC20.t.sol        # 14 unit tests + 2 fuzz + 2 invariant (Task 1)
│   ├── ForkTest.t.sol         # Mainnet fork tests — USDC supply + Uniswap V2 (Task 2)
│   ├── AMM.t.sol              # 15 unit tests + 2 fuzz tests for AMM (Task 3)
│   └── LendingPool.t.sol      # 15 unit tests for lending pool (Task 5)
├── script/
│   └── Deploy.s.sol           # Deployment script for all contracts
├── docs/
│   ├── task1-fuzz-vs-unit.md      # Fuzz vs unit testing explanation (Task 1)
│   ├── task2-fork-testing.md      # Fork testing benefits/limitations (Task 2)
│   ├── task4-amm-analysis.md      # AMM mathematical analysis (Task 4)
│   ├── task5-lending-workflow.md  # Lending workflow diagram (Task 5)
│   └── task6-cicd.md              # CI/CD pipeline documentation (Task 6)
├── .github/workflows/
│   └── test.yml               # GitHub Actions pipeline (Task 6)
└── foundry.toml               # Foundry config (fuzz runs=1000, invariant runs=500)
```

---

## Quick Start

### Prerequisites

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

### Compile

```bash
forge build
```

### Run all tests

```bash
forge test -v
```

Expected: **54 tests, 0 failures**

### Run fork tests

```bash
MAINNET_RPC_URL=https://mainnet.infura.io/v3/<key> forge test --match-contract ForkTest -vvv
```

### Gas report

```bash
forge test --gas-report --match-contract "AMMTest|LendingPoolTest"
```

### Coverage

```bash
forge coverage
```

---

## Contracts

### AMM (`src/AMM.sol`)

Constant-product AMM (`x·y = k`) with 0.3 % fee. LP shares use the geometric mean formula for the
first deposit and a proportional ratio for subsequent deposits.

| Function | Description |
|---|---|
| `addLiquidity(aDesired, bDesired, aMin, bMin)` | Deposit tokens, receive LP shares |
| `removeLiquidity(lpAmount, aMin, bMin)` | Burn LP shares, receive tokens back |
| `swap(tokenIn, amountIn, amountOutMin)` | Swap with slippage protection |
| `getAmountOut(amountIn, reserveIn, reserveOut)` | Pure constant-product quote |

### LendingPool (`src/LendingPool.sol`)

Single-collateral lending protocol with 75 % LTV, 5 % liquidation bonus, and a linear interest
rate model.

| Function | Description |
|---|---|
| `deposit(amount)` | Deposit collateral |
| `withdraw(amount)` | Withdraw collateral (health-factor check) |
| `borrow(amount)` | Borrow up to 75 % LTV |
| `repay(amount)` | Repay debt (partial or full) |
| `liquidate(borrower)` | Liquidate when HF < 1 |
| `healthFactor(user)` | Returns `deposited×0.75 / borrowed` (1e18 scale) |

---

## CI/CD (Task 6)

The GitHub Actions pipeline (`.github/workflows/test.yml`) runs three jobs:

| Job | What it does |
|---|---|
| `test` | `forge build --sizes` + `forge test` + gas report artifact |
| `coverage` | `forge coverage --report lcov` → uploads lcov artifact |
| `slither` | Slither static analysis → uploads markdown report artifact |

Set the `MAINNET_RPC_URL` repository secret to enable fork tests in CI.

---

## Documentation

| Document | Topic |
|---|---|
| [docs/task1-fuzz-vs-unit.md](docs/task1-fuzz-vs-unit.md) | Fuzz vs unit testing |
| [docs/task2-fork-testing.md](docs/task2-fork-testing.md) | Fork testing |
| [docs/task4-amm-analysis.md](docs/task4-amm-analysis.md) | Constant-product math, IL, price impact |
| [docs/task5-lending-workflow.md](docs/task5-lending-workflow.md) | Lending pool workflow diagram |
| [docs/task6-cicd.md](docs/task6-cicd.md) | CI/CD pipeline stages |
