# Blockchain-2 — Assignment 3

Layer-2 deployment, advanced token standards, oracle integration, subgraph.

## Layout

```
assignment-3/
├── src/
│   ├── GameItems.sol            # ERC-1155 multi-token (3 fungible + 2 NFT)
│   ├── Vault.sol                # ERC-4626 tokenised vault with harvest()
│   ├── PriceFeedConsumer.sol    # reads Chainlink ETH/USD with staleness check
│   ├── PriceDependentVault.sol  # ETH vault gated by Chainlink price threshold
│   ├── MockAggregator.sol       # mock Chainlink aggregator for tests
│   ├── MockERC20.sol            # underlying ERC-20 for the vault
│   └── IAggregatorV3.sol        # minimal Chainlink interface
├── test/                        # 35 Foundry tests, all passing
├── script/
│   ├── DeployL2.s.sol           # GameItems + Vault deploy + 6 txs (≥5 user txs)
│   └── DeployOracle.s.sol       # PriceFeedConsumer + PriceDependentVault
├── subgraph/                    # The Graph subgraph (yaml + schema + mapping)
└── docs/
    ├── 01-erc1155-vs-erc20-erc721.md
    ├── 02-erc4626-use-cases.md
    ├── 03-l2-analysis.md
    ├── 04-gas-comparison.md
    └── 05-subgraph-explanation.md
```

## Build & test

```bash
forge build
forge test --gas-report
```

35 tests across 3 suites (`GameItemsTest`, `VaultTest`, `PriceFeedTest`),
all passing.

## Deploy on L2 (Arbitrum / Optimism / Base Sepolia)

```bash
export PRIVATE_KEY=0x...
export ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export ARBISCAN_API_KEY=...

forge script script/DeployL2.s.sol \
  --rpc-url arbitrum_sepolia --broadcast --verify
```

The script deploys 3 contracts (`GameItems`, `MockERC20`, `Vault`) and
executes 6 user transactions: mint resources, mint asset, approve vault,
deposit, harvest. See `docs/04-gas-comparison.md` for actual gas figures
and the L1↔L2 fee comparison.

## Deploy oracle integration

```bash
# Sepolia ETH/USD aggregator
export CHAINLINK_FEED=0x694AA1769357215DE4FAC081bf1f309aDC325306
forge script script/DeployOracle.s.sol --rpc-url sepolia --broadcast --verify
```

## Submission checklist

| Requirement                                                | Location                          |
|-----------------------------------------------------------|-----------------------------------|
| ERC-1155 gaming contract + tests                          | `src/GameItems.sol`, `test/GameItems.t.sol` (13 tests) |
| ERC-1155 vs ERC-20+721 explanation                        | `docs/01-erc1155-vs-erc20-erc721.md` |
| ERC-4626 vault contract + tests                           | `src/Vault.sol`, `test/Vault.t.sol` (11 tests) |
| ERC-4626 real-world use cases                             | `docs/02-erc4626-use-cases.md`    |
| L2 deployment script                                      | `script/DeployL2.s.sol`           |
| L2 theoretical analysis (2-3 pages)                       | `docs/03-l2-analysis.md`          |
| L1 vs L2 gas comparison                                   | `docs/04-gas-comparison.md`       |
| Chainlink oracle contracts                                | `src/PriceFeedConsumer.sol`, `src/PriceDependentVault.sol`, `src/MockAggregator.sol` |
| Oracle tests with mocking                                 | `test/PriceFeed.t.sol` (11 tests) |
| Subgraph manifest, schema, mapping                        | `subgraph/{subgraph.yaml,schema.graphql,mapping.ts}` |
| GraphQL queries                                           | `subgraph/queries.graphql`        |
| The Graph explanation                                     | `docs/05-subgraph-explanation.md` |
