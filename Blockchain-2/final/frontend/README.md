# Protocol dApp

React + Wagmi v2 + RainbowKit dApp for interacting with the protocol on Arbitrum Sepolia.

```bash
cd frontend
npm install
npm run dev
```

Set the following in `.env`:

```
VITE_WC_PROJECT_ID=<your WalletConnect Cloud projectId>
VITE_SUBGRAPH_URL=<your Graph Studio endpoint>
```

Update `src/config/addresses.ts` with the values from `deployments/421614.json` after deploy.

## Pages

- `Dashboard` — token balance + voting power + delegate + AMM reserves (read).
- `Swap` — `swapExactIn` write.
- `Vault` — `deposit` write + reading user share balance.
- `Proposals` — proposal list from The Graph + `castVote` write.

## State-changing transactions

- `Swap.swapExactIn`
- `Vault.deposit`
- `Governor.castVote`

Three+ writes from the UI as required by the rubric. Each one is wrapped in
`TxButton` which surfaces wallet-friendly error messages (rejection, wrong
network, insufficient balance) — no raw RPC output reaches the user.

## Network guard

`NetworkGuard` blocks all writes until the user is connected and on the
Arbitrum Sepolia chain. A switch prompt appears if they're on the wrong chain.
