# Layer 2 Theoretical Analysis

## 1. Optimistic Rollups vs ZK-Rollups

| Property            | Optimistic Rollup (Arbitrum, Optimism, Base)         | ZK-Rollup (zkSync Era, Starknet, Scroll, Linea)        |
|---------------------|------------------------------------------------------|--------------------------------------------------------|
| Proof system        | Fraud proofs (interactive or single-round)           | Validity proofs (SNARK / STARK) over the state transition |
| L1 trust assumption | Honest challenger exists during dispute window       | L1 verifier accepts the cryptographic proof, no challenger needed |
| Default finality    | "Soft" within seconds, **economic finality after 7 days** (challenge window) | Cryptographically final once the proof is verified on L1 (minutes-hours) |
| Withdrawal latency  | 7 days back to L1 (mitigated by liquidity bridges)   | Minutes-to-hours back to L1                            |
| Cost of proving     | ~0 (only fraud-proof gas if challenged)              | Significant prover cost amortised across the batch     |
| EVM equivalence     | Bytecode-equivalent (Arbitrum Nitro, OP Stack)       | Originally diverged (Era, Starknet) but Linea / Scroll / zkSync are now bytecode-compatible |

### Architectural sketch

* **Optimistic.** A *sequencer* orders L2 transactions and posts compressed
  batches plus state roots to L1 calldata/blob. Anyone with the L2 state can
  challenge a posted root within the 7-day window via an interactive
  bisection game (Arbitrum) or single-round proof (Cannon on OP Stack). If
  the challenge succeeds, the bad root is reverted and the challenger
  rewarded.
* **ZK.** The sequencer/prover ordering produces a SNARK/STARK proving that
  the new state root is the correct EVM execution of the batch on top of
  the old root. The L1 contract verifies the proof; no challenger needed.

## 2. Security model — inheriting Ethereum

Both families derive *data availability* and *settlement* from L1:

* L1 stores the calldata (or blob) needed to reconstruct L2 state, so anyone
  can re-execute and detect fraud.
* L1 stores the state-root timeline. Withdrawals only become spendable once
  L1 has accepted the corresponding root.
* L1 enforces forced inclusion / escape hatches: even if the sequencer
  censors, a user can submit an L2 transaction directly through the L1
  inbox.

Optimistic rollups depend on at least *one honest challenger* being able to
post a fraud proof during the window. ZK rollups depend on the soundness of
the proof system and the trusted setup (for SNARKs) — STARKs avoid the
trusted setup but produce larger proofs.

## 3. Data availability — calldata vs blobs (EIP-4844)

Pre-Dencun (March 2024) rollups posted batch data as L1 *calldata* — the
single largest cost driver, at ~16 gas/byte. EIP-4844 introduced **blobs**:
ephemeral 128 KB binary payloads attached to transactions, kept on the
beacon chain for ~18 days, addressed by KZG commitments. Blob gas is priced
in a separate fee market (`blob_base_fee`), typically 10-100× cheaper than
calldata per byte.

* Rollups now publish batches as blobs (Arbitrum, Optimism, Base, zkSync all
  migrated within weeks of Dencun).
* L2 fees dropped 5-20× overnight in March 2024.
* Full **Danksharding** (multi-blob, peer-distributed sampling) is the next
  step — target throughput of 64 blobs per slot (~1 MB/s of rollup data).

For a contract author the implication is simple: deploying on an L2 today is
roughly an order of magnitude cheaper than two years ago, because the data
publishing cost — historically the dominant rollup cost — has been
re-priced.

## 4. Bridge security and notable exploits

Native L1↔L2 rollup bridges inherit the rollup's security: withdrawing
through the canonical bridge is as safe as the rollup itself. **Third-party
bridges** (Wormhole, Multichain, Ronin, Nomad) typically run a separate
multisig / validator set and are only as safe as that committee.

* **Ronin (March 2022, $625M).** Compromised 5/9 validator multisig.
  Attackers signed forged withdrawal events.
* **Wormhole (February 2022, $326M).** Signature-verification bug let an
  attacker forge a "guardian" approval and mint 120k wETH on Solana
  unbacked.
* **Nomad (August 2022, $190M).** A misconfigured Merkle root accepted any
  message as valid; the exploit was copy-pasted by hundreds of opportunistic
  addresses.
* **Multichain (July 2023, $126M).** Compromised admin keys; cross-chain
  liquidity drained.

The lesson: trust-minimised rollup bridges (canonical exits, ZK light
clients) are categorically safer than externally-validated bridges. For
production, prefer canonical bridges or ZK-light-client based stacks (LayerZero
v2 with DVN sets, Hyperlane ISMs, Across' optimistic-with-fraud-proof
model) and treat any "fast bridge" as exposing the bridge's validator set as
a separate trust assumption.

## 5. Cost analysis — when L2 vs L1?

A simple rule of thumb after Dencun:

* If your contract serves **end users with $1-$100 transaction sizes**,
  deploy on L2. A swap on Arbitrum costs ~$0.03; on L1 mainnet it costs
  ~$3-$30. L1 makes UX impossible.
* If your contract is **infrastructure that other contracts rely on for
  settlement** (oracles, large-scale auctions, MEV-supply chains, treasury
  custody), L1 is still warranted — you want maximum liveness and
  finality, and the txs are infrequent enough that fees are amortised.
* If you need **composability with deep L1 liquidity** (Uniswap v3 USDC/ETH,
  AAVE markets), prefer L1 unless the same liquidity exists on L2 (it
  increasingly does — Uniswap v3 is on every major L2).
* For **gas-sensitive batch operations** (NFT mints, airdrops, on-chain
  games), L2 is the only sensible choice — a 10k-mint on L1 is $10k+, on
  Base it is $20-$50.

In this project, the AMM and Vault deployments target L2 testnets because
their typical user transactions (swaps, deposits) are exactly the kind of
small-value, frequent operations that L2 is designed to make affordable.

## 6. Rough gas comparison (this project)

The deployment script `script/DeployL2.s.sol` runs an identical sequence of
transactions on either L1 or L2. Approximate gas / fee figures from typical
2025 conditions (Sepolia at 1 gwei; L2s post-Dencun, blob fees normalised):

| Operation                              | L1 Sepolia gas | L2 (Arbitrum Sepolia) gas | L1 fee @ 1 gwei | L2 fee (approx) |
|----------------------------------------|----------------|---------------------------|-----------------|-----------------|
| Deploy GameItems                       | ~2.4M          | ~2.4M (L2 exec) + L1 calldata | ~$6           | ~$0.04          |
| Deploy MockERC20                       | ~700k          | ~700k                     | ~$1.8           | ~$0.01          |
| Deploy Vault (ERC-4626)                | ~1.6M          | ~1.6M                     | ~$4             | ~$0.03          |
| `mint` fungible (GOLD, 1k)             | ~70k           | ~70k                      | ~$0.18          | ~$0.001         |
| `mintBatch` (3 ids)                    | ~120k          | ~120k                     | ~$0.30          | ~$0.002         |
| `craft` (LEGENDARY_SWORD)              | ~85k           | ~85k                      | ~$0.21          | ~$0.0015        |
| Vault `deposit`                        | ~100k          | ~100k                     | ~$0.25          | ~$0.0018        |
| Vault `harvest`                        | ~55k           | ~55k                      | ~$0.14          | ~$0.001         |

The L2 gas units are essentially the same as L1 because the rollup runs the
same EVM bytecode; the cost difference comes from per-gas pricing (cheap L2
gwei) plus the per-byte L1 data cost which is now charged in blob gas
(EIP-4844). Net effect: ~50-200× cheaper on L2 for the same logical
operation.

Reproducing on a real L2 testnet:

```bash
# Arbitrum Sepolia
export PRIVATE_KEY=0x...
export ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export ARBISCAN_API_KEY=...
forge script script/DeployL2.s.sol \
  --rpc-url arbitrum_sepolia --broadcast --verify
```

Verified contract URLs (post-deploy, paste from broadcast logs):

* Arbitrum Sepolia: `https://sepolia.arbiscan.io/address/<addr>`
* Optimism Sepolia: `https://sepolia-optimistic.etherscan.io/address/<addr>`
* Base Sepolia:     `https://sepolia.basescan.org/address/<addr>`
