# Blockchain Technologies 2 - Assignment 1

Advanced Solidity Patterns & Security Fundamentals

## Project Structure

```
assignment-1/
├── contracts/               # Smart contracts
│   ├── ChildContract.sol   # Task 1: Factory Pattern
│   ├── Factory.sol         # Task 1: Factory Pattern
│   ├── LogicV1.sol         # Task 2: UUPS Proxy Pattern
│   ├── LogicV2.sol         # Task 2: UUPS Upgraded Logic
│   ├── UnoptimizedContract.sol  # Task 3: Gas Optimization
│   ├── OptimizedContract.sol    # Task 3: Gas Optimization
│   ├── AssemblyContract.sol     # Task 4: Inline Assembly (Yul)
│   ├── VulnerableVault.sol      # Task 5: Reentrancy Vulnerability
│   ├── Attacker.sol             # Task 5: Reentrancy Exploit
│   ├── FixedVault.sol           # Task 5: Fixed Reentrancy
│   ├── VulnerableAccess.sol     # Task 5: Access Control Vulnerability
│   └── FixedAccess.sol          # Task 5: Fixed Access Control
├── test/                   # Test files
│   ├── Factory.test.js
│   ├── Proxy.test.js
│   ├── GasOptimization.test.js
│   ├── Assembly.test.js
│   └── Security.test.js
├── scripts/                # Deployment scripts
│   ├── deploy-all.js
│   ├── deploy-factory.js
│   ├── deploy-proxy.js
│   └── deploy-gas-optimization.js
├── hardhat.config.js
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js v16+
- npm or yarn

### Installation

```bash
cd Blockchain-2/assignment-1
npm install
```

## Running Tests

Run all tests:
```bash
npx hardhat test
```

Run specific test file:
```bash
npx hardhat test test/Factory.test.js
npx hardhat test test/Proxy.test.js
npx hardhat test test/GasOptimization.test.js
npx hardhat test test/Assembly.test.js
npx hardhat test test/Security.test.js
```

Run tests with gas reporter:
```bash
npx hardhat test
# Gas report will be saved to gas-report.txt
```

## Deployment

### Deploy All Contracts

```bash
npx hardhat run scripts/deploy-all.js --network localhost
```

### Deploy Individual Components

Factory Pattern:
```bash
npx hardhat run scripts/deploy-factory.js --network localhost
```

UUPS Proxy:
```bash
npx hardhat run scripts/deploy-proxy.js --network localhost
```

Gas Optimization:
```bash
npx hardhat run scripts/deploy-gas-optimization.js --network localhost
```

### Using Hardhat Local Network

Start local node:
```bash
npx hardhat node
```

In another terminal, deploy:
```bash
npx hardhat run scripts/deploy-all.js --network localhost
```

## Compilation

Compile all contracts:
```bash
npx hardhat compile
```

Clean and recompile:
```bash
npx hardhat clean
npx hardhat compile
```

## Task Summary

### Task 1: Factory Pattern
- **Files**: `ChildContract.sol`, `Factory.sol`
- **Features**:
  - Deploy child contracts using CREATE opcode
  - Deploy child contracts using CREATE2 opcode for deterministic addresses
  - Track all deployed contract addresses
  - Predict CREATE2 addresses before deployment
- **Gas Comparison**: Tests include gas measurements for CREATE vs CREATE2

### Task 2: UUPS Proxy Pattern
- **Files**: `LogicV1.sol`, `LogicV2.sol`
- **Features**:
  - UUPS (Universal Upgradeable Proxy Standard) implementation
  - LogicV1: Simple counter with increment functionality
  - LogicV2: Enhanced counter with decrement and reset
  - State preservation during upgrades
  - Owner-only upgrade authorization
- **Key Concepts**:
  - Proxy delegation pattern
  - Storage layout preservation
  - Initializers instead of constructors

### Task 3: Gas Optimization
- **Files**: `UnoptimizedContract.sol`, `OptimizedContract.sol`
- **7+ Optimizations Applied**:
  1. **Storage Packing**: Grouped small types (uint8, bool) in single slot
  2. **Immutable Variables**: Used `immutable` for deployment-time constants
  3. **Constant Variables**: Used `constant` for compile-time constants
  4. **Calldata vs Memory**: Used `calldata` for external function parameters
  5. **Short-Circuiting**: Ordered conditions to fail fast
  6. **Unchecked Arithmetic**: Used `unchecked` blocks where overflow is impossible
  7. **Event-Based Logging**: Replaced storage writes with events
  8. **Storage Caching**: Cached storage reads before loops

### Task 4: Inline Assembly (Yul)
- **File**: `AssemblyContract.sol`
- **Assembly Operations**:
  1. **caller()**: Read msg.sender directly from EVM context
  2. **Bitwise Operations**: Efficient power-of-2 check using `and`
  3. **Direct Storage Access**: Use `sload` and `sstore` for storage operations
  4. **Arithmetic**: Custom overflow checks with assembly
  5. **Memory Operations**: Efficient calldata copying
- **Gas Comparisons**: Each operation includes Solidity vs Assembly comparison

### Task 5: Security Vulnerabilities

#### Vulnerability A: Reentrancy Attack
- **Vulnerable**: `VulnerableVault.sol`
- **Exploit**: `Attacker.sol`
- **Fixed**: `FixedVault.sol`
- **Vulnerability**: External call before state update allows recursive withdrawal
- **Fix**:
  - Checks-Effects-Interactions pattern
  - OpenZeppelin's ReentrancyGuard modifier
- **Tests**: Demonstrate successful attack and prevention

#### Vulnerability B: Access Control
- **Vulnerable**: `VulnerableAccess.sol`
- **Fixed**: `FixedAccess.sol`
- **Vulnerability**: Missing access control modifiers on critical functions
- **Fix**:
  - OpenZeppelin's Ownable for owner-only functions
  - OpenZeppelin's AccessControl for role-based permissions
- **Tests**: Demonstrate unauthorized access and proper protection

## Gas Optimization Results

Run tests to see detailed gas comparisons:
```bash
npx hardhat test test/GasOptimization.test.js
```

Expected savings:
- **Deployment**: ~15-25% gas reduction
- **processArray**: ~30-40% gas reduction (storage caching + calldata)
- **logValue**: ~95% gas reduction (event vs storage write)
- **incrementCounter**: ~20-30% gas reduction (unchecked arithmetic)

## Inline Assembly Gas Savings

Run tests to see assembly gas comparisons:
```bash
npx hardhat test test/Assembly.test.js
```

Expected savings:
- **msg.sender access**: ~3 gas per call
- **isPowerOfTwo**: ~50-100 gas
- **Storage operations**: ~5-10 gas per operation

## Security Testing

### Reentrancy Attack Demo
```bash
npx hardhat test test/Security.test.js --grep "Reentrancy"
```

### Access Control Demo
```bash
npx hardhat test test/Security.test.js --grep "Access Control"
```

## Static Analysis with Slither

Install Slither:
```bash
pip install slither-analyzer
```

Run Slither on all contracts:
```bash
slither .
```

Run Slither on specific contract:
```bash
slither contracts/VulnerableVault.sol
slither contracts/FixedVault.sol
```

Expected findings:
- **VulnerableVault**: Reentrancy vulnerability detected
- **VulnerableAccess**: Missing access control warnings
- **FixedVault**: Clean (reentrancy guards in place)
- **FixedAccess**: Clean (proper access control)

## Project Details

### Technologies Used
- Solidity ^0.8.20
- Hardhat 2.x
- OpenZeppelin Contracts v4.9.3
- OpenZeppelin Contracts Upgradeable v4.9.3
- Hardhat Gas Reporter
- Ethers.js v6

### Key Features
- Comprehensive test coverage for all contracts
- Gas optimization demonstrations
- Security vulnerability demonstrations
- UUPS proxy upgrade mechanism
- Factory pattern with CREATE and CREATE2
- Inline assembly optimizations

## Notes

- All contracts use Solidity 0.8.20 for consistency
- Tests include detailed console logging for gas comparisons
- Deployment scripts provide step-by-step output
- Security contracts intentionally include vulnerabilities for educational purposes
- Fixed contracts demonstrate industry best practices

## Assignment Requirements Met

✅ Task 1: Factory Pattern with CREATE and CREATE2
✅ Task 2: UUPS Proxy Pattern with upgrades
✅ Task 3: 7+ Gas Optimizations applied and documented
✅ Task 4: Inline Assembly with 3+ operations
✅ Task 5: Reentrancy and Access Control vulnerabilities demonstrated and fixed
✅ Comprehensive test suites for all tasks
✅ Deployment scripts for all contracts
✅ Gas comparison and reporting

## License

MIT
