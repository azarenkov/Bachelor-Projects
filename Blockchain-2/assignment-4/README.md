# Assignment 4 — DAO & On-chain Governance System

End-to-end on-chain governance: ERC-20 Votes token, 12-month team vesting, OpenZeppelin
`Governor` + `TimelockController`, a `Treasury` and a `Box` contract both owned by the
Timelock, plus a minimal Ethers.js dApp for wallet connection, delegation and voting.

## Architecture

```
                    ┌─────────────────────┐
                    │  GovernanceToken    │   ERC-20 + ERC20Permit + ERC20Votes
                    │  (1,000,000 GOV)    │     ↳ timestamp clock mode
                    └──────────┬──────────┘
                               │ voting power (delegated)
                               ▼
   ┌───────────┐ propose  ┌──────────┐  queue ┌──────────────────┐ execute ┌────────┐
   │ proposer  │─────────▶│ Governor │───────▶│ TimelockController│────────▶│  Box   │
   │ (≥1% sup) │          │          │        │     (2-day)       │         │Treasury│
   └───────────┘  vote    │  vote=1d │        │                   │         └────────┘
                          │  period=7d        │                                ▲
                          │  quorum=4%        │     ↳ holds funds              │
                          └──────────┘        └──────────────────┘    owns ────┘

   Distribution (1,000,000 GOV total)         Vesting (team only)
   ──────────────────────────────              ─────────────────────────────
   • Team (vested 12 mo) ……… 400,000          linear release every block
   • Treasury ……………………………… 300,000          start = deployment, duration = 12 × 30 days
   • Community Airdrop ……… 200,000          beneficiary = `team` wallet
   • Liquidity ………………………… 100,000
```

See `docs/token-distribution.svg` for a graphical view.

## Contracts (`contracts/`)

| Contract | Role |
|---|---|
| `GovernanceToken.sol` | ERC-20 with `ERC20Permit` (EIP-2612 gasless approvals) + `ERC20Votes` (snapshot-based voting power), `mode=timestamp` clock so it plays well with `block.timestamp`-driven queue delays. |
| `TokenVesting.sol`    | Linear vesting over 12 × 30 days; anyone can call `release()` and the contract sends only what is currently vested to `beneficiary`. |
| `MyGovernor.sol`      | `Governor` + `GovernorSettings` + `GovernorCountingSimple` + `GovernorVotes` + `GovernorVotesQuorumFraction(4)` + `GovernorTimelockControl`. Voting delay 1 day, voting period 7 days, proposal threshold 10 000 GOV (≈1 % of supply), quorum 4 %. |
| `Box.sol`             | `Ownable`-owned `store(uint256)` + `retrieve()` + `setFeeBps(uint256)`. Owner is the Timelock — so only governance can change state. |
| `Treasury.sol`        | Holds GOV and ETH, only Timelock can `sendToken` / `sendEth`. |

The Timelock is the only proposer (granted role at deploy time); executor is `address(0)`
which means "anyone can execute once the timelock delay has elapsed". The deployer
renounces `DEFAULT_ADMIN_ROLE` so the system becomes self-governed.

## Tests (`test/`) — 26 passing

```bash
npm test
```

- `GovernanceToken.test.js` — 8 tests: initial supply, timestamp clock mode, delegation,
  voting-power transfers, `getPastVotes` snapshots, EIP-2612 `permit()`.
- `TokenVesting.test.js`   — 4 tests: pre-start lock, ~1/12 after one month, full release
  after duration, no double-release.
- `Governance.test.js`     — 14 tests: parameter sanity, role wiring, threshold gate,
  end-to-end (propose → vote → queue → execute) for `Box.store(42)`,
  parameter-change proposals (`Box.setFeeBps`), treasury token transfers, defeated
  outcomes (no quorum / against-majority), abstain quorum, delegated voting, premature
  execute blocked, direct EOA calls blocked.

## Scripts (`scripts/`)

- `deploy.js` — deploys everything in the right order, wires Timelock roles, distributes
  tokens (40/30/20/10), writes `deployed.json` + `frontend/deployed.json`.
- `demo_proposal.js` — reads `deployed.json`, delegates votes, posts a proposal to call
  `Box.store(42)`, casts FOR votes, advances time, queues, executes — and prints
  state transitions and `Box.retrieve()`.
- `make_distribution_chart.js` — renders `docs/token-distribution.svg`.

## Workflow

```bash
npm install
npm test                 # run all 26 tests

# Local network demo:
npx hardhat node &       # terminal 1
npm run deploy:local     # terminal 2: deploys + writes deployed.json
npm run demo:local       # full lifecycle in one shot

# Frontend (Part 4):
npm run frontend         # serves frontend/ on http://localhost:5173
# Open it, MetaMask → localhost:8545 / chainId 31337, import any hardhat key.
```

## Frontend (`frontend/`)

Single-page dApp using `ethers@6` from esm.sh — no build step.

Features:

1. **Connect MetaMask** — reads chain, account, exposes signer.
2. **Token / power / delegate** — `balanceOf`, `getVotes`, `delegates`, plus a
   `delegate(to)` form (empty = self-delegate).
3. **Proposals list** — pulled from `ProposalCreated` events, with state pill
   (Pending / Active / Succeeded / Queued / Executed / Defeated / Expired), tally of
   For/Against/Abstain.
4. **Cast vote** — 3 buttons (For / Against / Abstain) for proposals in `Active` state.
   Disabled after voting (shows ✓).
5. **Activity log** — every tx hash printed live.

`frontend/deployed.json` is overwritten by `deploy.js` so the page always points at the
current addresses.

## Files

```
assignment-4/
├── contracts/
│   ├── GovernanceToken.sol
│   ├── TokenVesting.sol
│   ├── MyGovernor.sol
│   ├── Treasury.sol
│   └── Box.sol
├── test/
│   ├── GovernanceToken.test.js
│   ├── TokenVesting.test.js
│   └── Governance.test.js
├── scripts/
│   ├── deploy.js
│   ├── demo_proposal.js
│   └── make_distribution_chart.js
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── deployed.json     (generated)
├── docs/
│   └── token-distribution.svg
├── hardhat.config.js
└── package.json
```
