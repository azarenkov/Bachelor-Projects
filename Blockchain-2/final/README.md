# Protocol — Blockchain Technologies 2 Final Project

DeFi super-app combining a constant-product AMM, an ERC-4626 yield vault, a
Chainlink-backed price oracle, a vault factory using CREATE/CREATE2, an
upgradeable UUPS treasury, and a full OpenZeppelin Governor + Timelock stack.
Deployed to Arbitrum Sepolia.

**Course:** Blockchain Technologies 2
**Team:** Alexey Azarenkov
**L2:** Arbitrum Sepolia (chain id 421614)

---

## Quickstart

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Pull submodules
git submodule update --init --recursive

# 3. Build + test
forge build
forge test -vvv

# 4. Coverage
forge coverage --report summary

# 5. Local deploy (anvil)
cp .env.example .env  # then fill DEPLOYER_PRIVATE_KEY
anvil &
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# 6. Arbitrum Sepolia deploy + verify
forge script script/Deploy.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast --verify \
  --etherscan-api-key $ARBISCAN_API_KEY
```

## Repository layout

```
final/
├── src/                       Production contracts
│   ├── GovToken.sol           ERC20 + Votes + Permit governance token
│   ├── governance/            Governor + 2-day Timelock
│   ├── oracle/                Chainlink adapter with staleness guard
│   ├── amm/                   x*y=k AMM (built from scratch, 0.3% fee)
│   ├── vault/                 ERC-4626 yield vault with perf-fee skim
│   ├── factory/               VaultFactory using CREATE + CREATE2
│   ├── treasury/              UUPS proxy + V1/V2 implementations
│   ├── utils/                 YulMath (assembly mulDiv + sqrt)
│   ├── interfaces/            External interface declarations
│   └── mocks/                 Test-only mock aggregator
├── test/
│   ├── unit/                  Per-contract unit tests
│   ├── fuzz/                  Property-based fuzz tests
│   ├── invariant/             Stateful invariant suites
│   └── fork/                  Mainnet-fork tests
├── script/                    Deploy + post-deploy verification scripts
├── frontend/                  React + Wagmi v2 dApp
├── subgraph/                  The Graph definitions + AssemblyScript mappings
├── docs/                      Architecture, audit, gas reports
└── deployments/               <chainId>.json address books written by Deploy.s.sol
```

## Contracts at a glance

| Contract | Purpose | Patterns |
|---|---|---|
| `GovToken` | ERC20 + EIP-2612 permit + ERC20Votes checkpoints (timestamp clock) | AccessControl, supply cap |
| `ProtocolTimelock` | 2-day delay between queue and execute; owns all admin powers | Timelock |
| `ProtocolGovernor` | OZ Governor: 1d voting delay, 1w voting period, 4% quorum, 1% threshold | Governance, Timelock |
| `PriceOracle` | Chainlink AggregatorV3 adapter with per-asset staleness check | Oracle adapter, RBAC |
| `SimpleAMM` | Constant-product (x·y=k) with 0.3% fee, LP shares, slippage guards | CEI, ReentrancyGuard, Pausable |
| `YieldVault` | ERC-4626 with performance fee skim to Treasury, decimal offset 6 to harden inflation attack | ERC-4626, RBAC |
| `VaultFactory` | Deploys YieldVault via CREATE or CREATE2 (deterministic) | Factory, RBAC |
| `TreasuryV1` | UUPS-upgradeable treasury, holds protocol fees | UUPS proxy, RBAC, storage gap |
| `TreasuryV2` | V2 adds per-token spend caps; storage-safe upgrade from V1 | UUPS upgrade path |
| `YulMath` | 512-bit full-precision `mulDiv` (Yul) + Solidity reference + `sqrt` | Inline assembly benchmark |

## Deployed addresses (Arbitrum Sepolia)

| Contract | Address | Arbiscan |
|---|---|---|
| GovToken | `0xf3F1C682b47AfF5c16CcC709D36bCABcE411F908` | [view](https://sepolia.arbiscan.io/address/0xf3F1C682b47AfF5c16CcC709D36bCABcE411F908#code) |
| Timelock | `0x1B83B63087fFcf0eAF69443A2e8Ee53Cda8517A2` | [view](https://sepolia.arbiscan.io/address/0x1B83B63087fFcf0eAF69443A2e8Ee53Cda8517A2#code) |
| Governor | `0xe4aD6080604EAA6b8eF30A61868dC48EBD71f732` | [view](https://sepolia.arbiscan.io/address/0xe4aD6080604EAA6b8eF30A61868dC48EBD71f732#code) |
| TreasuryProxy | `0xeCFda998447D4b1545583CdABcf24A5E012902AD` | [view](https://sepolia.arbiscan.io/address/0xeCFda998447D4b1545583CdABcf24A5E012902AD#code) |
| TreasuryImpl V1 | `0x73A452D86B82FA76c288b64E9308A82B11984EB0` | [view](https://sepolia.arbiscan.io/address/0x73A452D86B82FA76c288b64E9308A82B11984EB0#code) |
| TreasuryImpl V2 | `0xe1C20d59f608Db9e02491F7f26D7C621353A686B` | [view](https://sepolia.arbiscan.io/address/0xe1C20d59f608Db9e02491F7f26D7C621353A686B#code) |
| PriceOracle | `0x997fc09AC5686d68Ac872D9561e4d3869010160B` | [view](https://sepolia.arbiscan.io/address/0x997fc09AC5686d68Ac872D9561e4d3869010160B#code) |
| VaultFactory | `0x953FeC985064516279B9bA117048614fC24460CA` | [view](https://sepolia.arbiscan.io/address/0x953FeC985064516279B9bA117048614fC24460CA#code) |
| Demo USDC | `0xD17b9F08818E5E290c557727787b3337Bd381851` | [view](https://sepolia.arbiscan.io/address/0xD17b9F08818E5E290c557727787b3337Bd381851#code) |
| Demo WETH | `0xabD16093647b1519680065BdD8382A398a2D81b4` | [view](https://sepolia.arbiscan.io/address/0xabD16093647b1519680065BdD8382A398a2D81b4#code) |
| SimpleAMM (USDC/WETH, seeded) | `0xD66bEaf12306c72d0Ef7b3a3Ee657CbECb9BdEe3` | [view](https://sepolia.arbiscan.io/address/0xD66bEaf12306c72d0Ef7b3a3Ee657CbECb9BdEe3#code) |
| YieldVault (vdUSDC) | `0xEaDA38C8Ff73BFfE91e8a1be89f1fFBE626E2D18` | [view](https://sepolia.arbiscan.io/address/0xEaDA38C8Ff73BFfE91e8a1be89f1fFBE626E2D18#code) |

## Subgraph

Indexed via **Goldsky** on Arbitrum Sepolia. GraphQL endpoint:

```
https://api.goldsky.com/api/public/project_cmpahaxnnajch01umfz5rhk3y/subgraphs/protocol-arb-sepolia/1.0.0/gn
```

Source manifest: `subgraph/subgraph.yaml`. See `subgraph/README.md` for 5 example queries.

## Documentation

- [Architecture](docs/architecture.md) — C4 diagrams, storage layouts, ADRs.
- [Security audit](docs/audit.md) — findings table, governance/oracle attack analysis.
- [Gas report](docs/gas.md) — before/after benchmarks (Yul vs Solidity, optimizer levels).
- [Coverage](docs/coverage.md) — `forge coverage --report summary` output.

## Test surface

```
forge test --summary
```

| Type | Files | Status |
|---|---|---|
| Unit | `test/unit/*.t.sol` | 50+ tests |
| Fuzz | `test/fuzz/*.fuzz.t.sol` | 10+ properties |
| Invariant | `test/invariant/*.invariant.t.sol` | 5+ invariants |
| Fork | `test/fork/*.fork.t.sol` | 3+ real-protocol integrations |

## CI

`.github/workflows/ci.yml` runs on every push and PR. Stages:
`forge fmt --check` → `forge build --sizes` → `forge test -vvv` →
`forge coverage` → `slither`. The frontend lane builds the dApp via npm.

## License

MIT
