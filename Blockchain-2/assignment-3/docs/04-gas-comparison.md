# Gas comparison: L1 Sepolia vs L2

## Measured EVM gas (from `forge test --gas-report`)

These are pure execution gas — identical on L1 and L2 because both run the
same EVM. Reproduce with `forge test --gas-report` from this folder.

| Contract / function                   | EVM gas (median) |
|---------------------------------------|------------------|
| Deploy `GameItems` (ERC-1155)         | 2,035,582        |
| Deploy `Vault` (ERC-4626)             | 1,215,436        |
| Deploy `MockERC20`                    |   507,820        |
| Deploy `PriceFeedConsumer`            |   341,405        |
| Deploy `PriceDependentVault`          |   547,541        |
| `GameItems.mint` (single)             |    81,065        |
| `GameItems.mintBatch` (3 ids)         |   193,325        |
| `GameItems.craft` (LEGENDARY_SWORD)   |    79,506        |
| `GameItems.burn`                      |    41,243        |
| `Vault.deposit`                       |   108,095        |
| `Vault.withdraw`                      |    57,645        |
| `Vault.redeem`                        |    59,337        |
| `Vault.harvest`                       |    44,215        |
| `PriceDependentVault.deposit`         |    44,978        |
| `PriceDependentVault.withdraw`        |    37,040        |
| `PriceFeedConsumer.getLatestPrice`    |    10,146        |

## Cost translation (illustrative, 2025 conditions)

L2 costs depend on (a) L2 execution gas at the L2 gas price, plus (b) the
L1 data publication cost amortised across the batch (now paid in EIP-4844
blob gas, typically <$0.01/MB).

Assumptions:
* L1 Sepolia gas price: 1 gwei (faucet conditions)
* ETH price: $3,000
* Arbitrum Sepolia gas price: ~0.01 gwei post-Dencun
* Optimism Sepolia gas price: ~0.001 gwei + L1 fee component

Per operation (median gas × price):

| Operation                         | L1 fee (Sepolia, 1 gwei) | Arbitrum Sepolia | Optimism / Base Sepolia |
|-----------------------------------|--------------------------|------------------|--------------------------|
| Deploy GameItems (~2M gas)        | ~$6.00                   | ~$0.06           | ~$0.04                   |
| Deploy Vault (~1.2M gas)          | ~$3.60                   | ~$0.04           | ~$0.025                  |
| Deploy PriceDependentVault (~547k) | ~$1.65                   | ~$0.016          | ~$0.011                  |
| `mint` GameItems (~81k)           | ~$0.24                   | ~$0.0024         | ~$0.0016                 |
| `mintBatch` 3 ids (~193k)         | ~$0.58                   | ~$0.0058         | ~$0.004                  |
| `craft` (~80k)                    | ~$0.24                   | ~$0.0024         | ~$0.0016                 |
| Vault `deposit` (~108k)           | ~$0.32                   | ~$0.0032         | ~$0.002                  |
| Vault `harvest` (~44k)            | ~$0.13                   | ~$0.0013         | ~$0.0009                 |

The L2 column ranges from ~50× to ~200× cheaper than the equivalent L1
operation. Deployment is where the difference is most felt: a 2M-gas deploy
costs minutes-of-attention worth of fees on L2 vs ~$6 on a real-mainnet-
priced L1.

## Reproducing on a real L2 testnet

```bash
# 1. Set env
export PRIVATE_KEY=0x<your test key>
export ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export ARBISCAN_API_KEY=<key>

# 2. Deploy GameItems + Vault + tx sequence on Arbitrum Sepolia
forge script script/DeployL2.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast --verify

# 3. Repeat against L1 Sepolia
export SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<key>
forge script script/DeployL2.s.sol \
  --rpc-url sepolia \
  --broadcast --verify

# 4. Diff the broadcast/<chain-id>/run-latest.json files for actual fees paid.
```

The script intentionally executes 6 transactions after deployment (mint
fungible × 2, mint asset, approve vault, deposit, harvest) so the
broadcast log shows ≥ 5 user-level operations as required.

## Verified contract URLs (placeholders — fill after deployment)

| Network            | Contract            | Explorer link                                                          |
|--------------------|---------------------|------------------------------------------------------------------------|
| Arbitrum Sepolia   | GameItems           | `https://sepolia.arbiscan.io/address/<addr>`                           |
| Arbitrum Sepolia   | Vault               | `https://sepolia.arbiscan.io/address/<addr>`                           |
| Optimism Sepolia   | GameItems           | `https://sepolia-optimistic.etherscan.io/address/<addr>`               |
| Base Sepolia       | GameItems           | `https://sepolia.basescan.org/address/<addr>`                          |

(Deployment requires a funded testnet account; the L1↔L2 fee differential
above is what the assignment is asking you to demonstrate, and is captured
mechanically by the `--broadcast` JSON receipts.)
