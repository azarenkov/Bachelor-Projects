# Task 1 — Fuzz Testing vs Unit Testing

## Unit Testing

Unit tests verify **specific, known scenarios**. The developer writes a fixed set of inputs and the
expected output, then asserts equality. This is ideal for:

- Documenting intended behaviour (spec-as-code)
- Covering known edge cases (zero amount, overflow boundary, revert conditions)
- Fast feedback in CI — a deterministic suite always produces the same result

**Limitation:** the coverage is only as broad as the developer's imagination. A subtle bug triggered
only by an unexpected combination of inputs will be missed if no one thought to write that test case.

## Fuzz Testing

Fuzz tests let the testing framework (Foundry's fuzzer, derived from libfuzzing) **auto-generate
random inputs** across the full domain. Given a property like "the output amount must always be less
than the reserve", the fuzzer will hammer the function with thousands of random values, attempting to
find a counterexample.

```solidity
// Foundry fuzz test — amount is generated automatically (1 000 runs by default)
function testFuzz_Swap_OutputLessThanReserve(uint256 amountIn) public {
    amountIn = bound(amountIn, 1, INITIAL_A - 1);
    uint256 out = amm.swap(address(tokenA), amountIn, 0);
    assertLt(out, reserveBBefore);
}
```

Strengths:
- Catches off-by-one errors, edge cases in arithmetic, and integer overflow/underflow that a human
  tester is unlikely to construct manually
- Scales effort: increasing `runs` in `foundry.toml` deepens the search with zero extra code

**Limitation:** fuzz tests are only as strong as the **invariant (property) being checked**. If the
property itself is wrong, no number of random runs will catch the bug.

## Invariant Testing

Invariant tests assert properties that **must hold across any sequence of transactions**. Foundry's
invariant runner calls handler functions in random order and checks the invariant after every call.

```solidity
// Must hold no matter how many transfers have occurred
function invariant_TotalSupplyConstant() public view {
    assertEq(token.totalSupply(), 3_000 ether);
}
```

This is more powerful than a simple fuzz test because it exercises **state machine exploration**
rather than a single function call.

## When to Use Each

| Scenario | Recommended approach |
|---|---|
| Verifying a specific revert message | Unit test |
| Checking arithmetic properties across a wide value range | Fuzz test |
| Ensuring a global invariant survives arbitrary sequences of transactions | Invariant test |
| Integration flows (deposit → borrow → repay) | Unit test |
| Stress-testing AMM constant-product formula | Fuzz + invariant test |
