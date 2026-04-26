# The Graph: decentralised indexing vs traditional backends

## Traditional backend indexing

A typical Web2-style indexer for an on-chain game or DeFi protocol looks like:

```
RPC node ── log subscription ──▶  Backend service ──▶  Postgres
                                       │
                                       └─▶ REST / GraphQL API ──▶ Frontend
```

The team operates:

* a private RPC archive node (or pays Alchemy/Infura),
* a long-running consumer that polls / subscribes to logs and writes to the
  relational database,
* the API server,
* re-indexing tooling for redeployments / chain reorgs,
* monitoring, alerting, on-call rotation.

This works, but it is centralised: the API is operated by one team, can
disappear, can lie about historical data (since the SQL store is mutable),
and has no externally verifiable correctness.

## How The Graph decentralises this

A *subgraph* is a declarative description of how to derive entities from
on-chain events. It consists of three artefacts:

* `subgraph.yaml` — manifest: contract addresses, ABIs, network, start
  block, event-to-handler mapping.
* `schema.graphql` — entities and relationships (here: `Token`, `Account`,
  `TransferSingle`, `VaultDeposit`, …).
* `mapping.ts` — AssemblyScript handlers that translate event payloads into
  entity writes.

The author publishes the subgraph IPFS-hash on-chain (Subgraph Studio →
decentralised network). Independent **Indexers** in the network stake GRT
to serve queries; **Curators** signal which subgraphs are valuable;
**Delegators** stake GRT to indexers they trust. Queries are paid in GRT
and Indexers compete on response time / completeness; misbehaviour can be
slashed via fishermen and arbitration.

Practical implications for this project:

* The same `subgraph.yaml` works on-prem (self-hosted Graph Node + IPFS +
  Postgres) and on the decentralised hosted network. No code change.
* Schema migrations are immutable per deployment — a subgraph version is a
  pinned IPFS hash, so a frontend can pin to a specific schema and never
  see breaking changes silently.
* Reorgs are handled in the indexer: handlers see a deterministic ordered
  log stream and the indexer rewinds entity writes on a re-org without the
  application author writing rollback code.

## Tradeoffs vs running your own backend

| Property                  | Self-hosted backend         | The Graph subgraph                            |
|---------------------------|------------------------------|----------------------------------------------|
| Operator                  | You                          | Many independent indexers (or hosted service)|
| Cost                      | RPC node + EC2 + DB + on-call | GRT per-query (or Studio free tier)         |
| Latency to "live"         | Seconds (push-based)         | ~1 block behind head (poll-based)            |
| Custom business logic     | Anything                     | Limited to AssemblyScript + entity writes    |
| Cross-source joins        | Easy in SQL                  | Need explicit derived fields                 |
| Verifiable correctness    | No                           | Yes, against on-chain logs (anyone can re-index) |
| Schema migration          | DBA-controlled               | New deployment, frozen old                   |

## In this project

The subgraph in `subgraph/` indexes:

* **`GameItems`** (ERC-1155): `TransferSingle`, `TransferBatch`,
  `ItemCrafted`. Maintains per-account / per-token balances, total supply,
  craft history.
* **`Vault`** (ERC-4626): `Deposit`, `Withdraw`, `Harvested`. Tracks per-user
  total shares, deposit/withdrawal history, and time-series liquidity
  snapshots.

The three required GraphQL queries (`get all swaps`-equivalent, swaps by
user-equivalent, total liquidity over time) are in `subgraph/queries.graphql`,
adapted to this project (crafts in place of swaps, vault deposits in place
of swap-by-user).

### Local deployment (optional)

```bash
cd subgraph
npm install
npm run abis:copy        # copy GameItems / Vault ABIs from forge output
npm run codegen          # generates types from schema.graphql
npm run build            # AS → wasm
npm run create-local && npm run deploy-local
```

Hosted deployment uses Subgraph Studio:

```bash
graph auth --studio <DEPLOY_KEY>
graph deploy --studio assignment-3
```
