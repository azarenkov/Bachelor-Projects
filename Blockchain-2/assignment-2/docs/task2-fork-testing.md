# Task 2 — Fork Testing: Benefits and Limitations

## How vm.createSelectFork and vm.rollFork Work

`vm.createSelectFork(rpcUrl)` forks the live (or archive) RPC endpoint and makes that fork active.
All subsequent storage reads and contract calls go against the real on-chain state snapshotted at the
current block.

`vm.createFork(rpcUrl)` creates the fork without activating it; `vm.selectFork(forkId)` switches to
it later. This allows a single test file to manage **multiple independent forks** (e.g., mainnet and
Polygon) and switch between them mid-test.

`vm.rollFork(blockNumber)` rewinds the active fork to a specific historical block. This is essential
for **reproducible tests**: without pinning a block, the live chain advances and results change
between CI runs.

```solidity
// Create and pin to a historic block
uint256 fork = vm.createFork(rpcUrl);
vm.selectFork(fork);
vm.rollFork(19_000_000);  // ~Jan 2024 — results are identical on every run
```

## Benefits

1. **Real contract state** — no need to mock complex protocols (Uniswap V2 router, USDC token,
   Chainlink feeds). Tests interact with the actual deployed bytecode and real reserves.
2. **Integration confidence** — proves that your contract can actually call external contracts
   correctly; an incorrect ABI or wrong address fails immediately.
3. **Price discovery** — `getAmountsOut` returns real market rates, so slippage tests are grounded
   in actual liquidity.
4. **Historical reproducibility** — pinning a block with `vm.rollFork` makes the test deterministic
   and safe for CI.

## Limitations

1. **Slow** — every fork test round-trips to an RPC node. A suite of fork tests may take 10–100×
   longer than local-only tests.
2. **Requires an API key** — public RPC nodes rate-limit heavily; a dedicated Alchemy/Infura key is
   needed for CI.
3. **State drift** — without pinning a block the live chain advances, causing tests that read live
   state (prices, balances) to become flaky.
4. **Not suitable for unit isolation** — fork tests mix your contract logic with external contract
   behaviour. Bugs in external contracts become your test's problem.
5. **Mainnet whale impersonation** — using `vm.prank` on real addresses works locally but makes
   tests dependent on those addresses still holding the expected balances at the pinned block.

## Practical Rule

Use fork tests to verify **integration points** (calling Uniswap, reading Chainlink, interacting with
multisigs). Use local unit/fuzz tests for all pure business-logic validation.
