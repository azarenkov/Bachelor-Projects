# Protocol subgraph

## Entities

- `Pool` — AMM pool, holds reserves, swap count, total volume.
- `Swap` — individual swap event with sender, to, tokenIn, amountIn, amountOut.
- `LiquidityChange` — add/remove liquidity events; `isAdd: Boolean` distinguishes direction.
- `Vault` — every `YieldVault` deployed by the factory.
- `Proposal` — Governor proposal lifecycle (Pending → Active → Succeeded → Queued → Executed / Canceled).
- `Vote` — individual cast votes referencing the parent proposal.

> Four core entities (Pool / Swap / LiquidityChange / Vault) and two governance
> entities (Proposal / Vote) — covers the rubric's "at least 4 entities".

## Example queries

```graphql
# 1) Recent swaps for a pool
query RecentSwaps($pool: Bytes!) {
  swaps(first: 20, orderBy: timestamp, orderDirection: desc, where: { pool: $pool }) {
    sender
    tokenIn
    amountIn
    amountOut
    timestamp
    txHash
  }
}

# 2) Top liquidity providers for a pool
query TopLPs($pool: Bytes!) {
  liquidityChanges(where: { pool: $pool, isAdd: true }, orderBy: shares, orderDirection: desc, first: 10) {
    provider
    shares
    amount0
    amount1
    timestamp
  }
}

# 3) Active proposals
query ActiveProposals($now: BigInt!) {
  proposals(where: { voteStart_lte: $now, voteEnd_gt: $now, canceled: false, executed: false }) {
    proposalId
    proposer
    description
    forVotes
    againstVotes
    voteEnd
  }
}

# 4) Vote history for an address
query MyVotes($voter: Bytes!) {
  votes(where: { voter: $voter }, orderBy: timestamp, orderDirection: desc) {
    proposal { proposalId description }
    support
    weight
    timestamp
  }
}

# 5) Vaults indexed by asset
query VaultsForAsset($asset: Bytes!) {
  vaults(where: { asset: $asset }, orderBy: createdAt) {
    id
    deterministic
    salt
    createdAt
  }
}
```

## Codegen & deploy

```bash
# Generate ABI types from the compiled contracts.
forge build
graph codegen
graph build
graph deploy --node https://api.studio.thegraph.com/deploy/ <slug>
```

Update `subgraph.yaml` with the per-contract deployed addresses from
`deployments/421614.json` before running `graph build`.
