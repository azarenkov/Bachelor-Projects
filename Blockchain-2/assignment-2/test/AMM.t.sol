// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/AMM.sol";
import "../src/MockERC20.sol";
import "../src/LPToken.sol";

/// @title AMMTest — unit + fuzz tests for the constant-product AMM (Task 3)
contract AMMTest is Test {
    MockERC20 tokenA;
    MockERC20 tokenB;
    AMM       amm;

    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");

    uint256 constant INITIAL_A = 10_000 ether;
    uint256 constant INITIAL_B = 40_000 ether; // price = 4 B per A

    function setUp() public {
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        amm    = new AMM(address(tokenA), address(tokenB));

        // Fund alice and bob
        tokenA.mint(alice, 100_000 ether);
        tokenB.mint(alice, 400_000 ether);
        tokenA.mint(bob,   10_000 ether);
        tokenB.mint(bob,   40_000 ether);

        // Alice approves AMM
        vm.startPrank(alice);
        tokenA.approve(address(amm), type(uint256).max);
        tokenB.approve(address(amm), type(uint256).max);
        vm.stopPrank();

        // Bob approves AMM
        vm.startPrank(bob);
        tokenA.approve(address(amm), type(uint256).max);
        tokenB.approve(address(amm), type(uint256).max);
        vm.stopPrank();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /// Alice seeds the pool with initial liquidity
    function _seedPool() internal returns (uint256 lp) {
        vm.prank(alice);
        lp = amm.addLiquidity(INITIAL_A, INITIAL_B, 0, 0);
    }

    // ── Add Liquidity ─────────────────────────────────────────────────────────

    // 1. First liquidity provider gets sqrt(a*b) LP tokens
    function test_AddLiquidity_First() public {
        uint256 lp = _seedPool();
        uint256 expected = _sqrt(INITIAL_A * INITIAL_B);
        assertEq(lp, expected);
        assertEq(amm.lpToken().balanceOf(alice), expected);
        assertEq(amm.reserveA(), INITIAL_A);
        assertEq(amm.reserveB(), INITIAL_B);
    }

    // 2. Subsequent liquidity provider receives proportional LP
    function test_AddLiquidity_Second() public {
        _seedPool();
        uint256 totalLP = amm.lpToken().totalSupply();

        vm.prank(bob);
        uint256 bobLP = amm.addLiquidity(1_000 ether, 4_000 ether, 0, 0);

        uint256 expectedLP = (1_000 ether * totalLP) / INITIAL_A;
        assertEq(bobLP, expectedLP);
    }

    // 3. Events are emitted on add liquidity
    function test_AddLiquidity_EmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit AMM.LiquidityAdded(alice, 0, 0, 0);
        amm.addLiquidity(INITIAL_A, INITIAL_B, 0, 0);
    }

    // 4. Zero amount reverts
    function test_AddLiquidity_ZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(AMM.ZeroAmount.selector);
        amm.addLiquidity(0, INITIAL_B, 0, 0);
    }

    // ── Remove Liquidity ──────────────────────────────────────────────────────

    // 5. Partial removal returns proportional tokens
    function test_RemoveLiquidity_Partial() public {
        _seedPool();
        uint256 totalLP = amm.lpToken().totalSupply();

        vm.startPrank(alice);
        amm.lpToken().approve(address(amm), type(uint256).max);
        (uint256 rA, uint256 rB) = amm.removeLiquidity(totalLP / 2, 0, 0);
        vm.stopPrank();

        assertApproxEqAbs(rA, INITIAL_A / 2, 1);
        assertApproxEqAbs(rB, INITIAL_B / 2, 1);
    }

    // 6. Full removal empties pool
    function test_RemoveLiquidity_Full() public {
        _seedPool();
        uint256 totalLP = amm.lpToken().totalSupply();

        vm.startPrank(alice);
        amm.lpToken().approve(address(amm), type(uint256).max);
        amm.removeLiquidity(totalLP, 0, 0);
        vm.stopPrank();

        assertEq(amm.reserveA(), 0);
        assertEq(amm.reserveB(), 0);
    }

    // 7. Slippage protection on remove
    function test_RemoveLiquidity_SlippageReverts() public {
        _seedPool();
        uint256 totalLP = amm.lpToken().totalSupply();

        vm.startPrank(alice);
        amm.lpToken().approve(address(amm), type(uint256).max);
        vm.expectRevert(AMM.InsufficientOutputAmount.selector);
        amm.removeLiquidity(totalLP, INITIAL_A + 1, 0);
        vm.stopPrank();
    }

    // ── Swap ──────────────────────────────────────────────────────────────────

    // 8. Swap A → B
    function test_Swap_AtoB() public {
        _seedPool();
        uint256 amountIn = 1_000 ether;
        uint256 expected = amm.getAmountOut(amountIn, INITIAL_A, INITIAL_B);

        vm.prank(bob);
        uint256 out = amm.swap(address(tokenA), amountIn, 0);

        assertEq(out, expected);
        assertGt(out, 0);
    }

    // 9. Swap B → A
    function test_Swap_BtoA() public {
        _seedPool();
        uint256 amountIn = 4_000 ether;
        uint256 expected = amm.getAmountOut(amountIn, INITIAL_B, INITIAL_A);

        vm.prank(bob);
        uint256 out = amm.swap(address(tokenB), amountIn, 0);

        assertEq(out, expected);
    }

    // 10. k increases after swap (fee accumulation)
    function test_Swap_KIncreasesAfterSwap() public {
        _seedPool();
        uint256 kBefore = amm.reserveA() * amm.reserveB();

        vm.prank(bob);
        amm.swap(address(tokenA), 1_000 ether, 0);

        uint256 kAfter = amm.reserveA() * amm.reserveB();
        assertGe(kAfter, kBefore, "k must not decrease");
    }

    // 11. Slippage protection on swap
    function test_Swap_SlippageReverts() public {
        _seedPool();
        uint256 expected = amm.getAmountOut(1_000 ether, INITIAL_A, INITIAL_B);

        vm.prank(bob);
        vm.expectRevert(AMM.InsufficientOutputAmount.selector);
        amm.swap(address(tokenA), 1_000 ether, expected + 1);
    }

    // 12. Swap with invalid token reverts
    function test_Swap_InvalidToken() public {
        _seedPool();
        vm.prank(bob);
        vm.expectRevert(AMM.InvalidToken.selector);
        amm.swap(address(0xdead), 1_000 ether, 0);
    }

    // 13. Swap zero reverts
    function test_Swap_ZeroReverts() public {
        _seedPool();
        vm.prank(bob);
        vm.expectRevert(AMM.ZeroAmount.selector);
        amm.swap(address(tokenA), 0, 0);
    }

    // 14. Large swap causes high price impact (output much less than spot)
    function test_Swap_LargePriceImpact() public {
        _seedPool();
        // Swap half the reserveA
        uint256 bigSwap = INITIAL_A / 2;
        // Spot price implies ~2 000 ether out, actual should be less
        uint256 out = amm.getAmountOut(bigSwap, INITIAL_A, INITIAL_B);
        assertLt(out, (INITIAL_B / 2), "large swap should have price impact");
    }

    // 15. getAmountOut with zero reserve reverts
    function test_GetAmountOut_ZeroReserveReverts() public {
        vm.expectRevert(AMM.InsufficientLiquidity.selector);
        amm.getAmountOut(1 ether, 0, 1_000 ether);
    }

    // ── Fuzz tests ────────────────────────────────────────────────────────────

    /// Fuzz: k must never decrease after any swap
    function testFuzz_Swap_KNeverDecreases(uint256 amountIn) public {
        _seedPool();
        amountIn = bound(amountIn, 1, INITIAL_A / 10);

        uint256 kBefore = amm.reserveA() * amm.reserveB();

        vm.prank(bob);
        amm.swap(address(tokenA), amountIn, 0);

        uint256 kAfter = amm.reserveA() * amm.reserveB();
        assertGe(kAfter, kBefore);
    }

    /// Fuzz: output is always less than reserveOut (pool cannot be drained)
    function testFuzz_Swap_OutputLessThanReserve(uint256 amountIn) public {
        _seedPool();
        amountIn = bound(amountIn, 1, INITIAL_A - 1);

        uint256 reserveBBefore = amm.reserveB();
        vm.prank(bob);
        uint256 out = amm.swap(address(tokenA), amountIn, 0);
        assertLt(out, reserveBBefore, "cannot drain more than reserve");
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) {
            z = 1;
        }
    }
}
