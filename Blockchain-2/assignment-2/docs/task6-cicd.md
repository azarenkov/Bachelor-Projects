# Task 6 — CI/CD Pipeline Documentation

## Pipeline Stages

The GitHub Actions workflow (`.github/workflows/test.yml`) contains three parallel stages that run
after every push to `main`/`develop` and on every pull-request targeting `main`.

### Stage 1 — Build & Test (`test` job)

1. **Checkout** — clones the repo with `submodules: recursive` so `lib/forge-std` and
   `lib/openzeppelin-contracts` are present.
2. **Install Foundry** — uses the official `foundry-rs/foundry-toolchain@v1` action which downloads
   the latest stable `forge`/`cast`/`anvil` binaries.
3. **Compile** — `forge build --sizes` compiles all contracts and prints bytecode sizes.
   The build fails immediately if any contract exceeds the 24 576-byte EIP-170 deployment limit.
4. **Test** — `forge test -v` runs all unit tests, fuzz tests (1 000 runs each), and invariant tests
   (500 runs × 50 call depth). Fork tests are included when `MAINNET_RPC_URL` is set as a repository
   secret; otherwise they self-skip via `vm.envOr`.
5. **Gas report** — `forge test --gas-report` re-runs only the AMM and LendingPool suites and writes
   a plain-text gas report artifact, allowing reviewers to spot gas regressions in PRs.

### Stage 2 — Coverage (`coverage` job, depends on `test`)

Runs `forge coverage --report lcov` to produce a line/branch coverage report in LCOV format.
The artifact is uploaded and can be fed into Codecov or a custom badge service.

### Stage 3 — Slither Analysis (`slither` job, depends on `test`)

1. Installs [Slither](https://github.com/crytic/slither) via `pip3`.
2. Builds with `--build-info` so Slither can resolve remappings from the Foundry config.
3. Runs Slither in `--checklist` mode (markdown output) and saves the report as an artifact.
   `continue-on-error: true` prevents Slither findings from blocking the merge while still
   making the report visible.

## Secrets Required

| Secret | Purpose |
|---|---|
| `MAINNET_RPC_URL` | Enables fork tests (optional — tests self-skip if absent) |

## Running Locally with `act`

```bash
# Install act: https://github.com/nektos/act
act push -j test -s MAINNET_RPC_URL="" --container-architecture linux/amd64
```
