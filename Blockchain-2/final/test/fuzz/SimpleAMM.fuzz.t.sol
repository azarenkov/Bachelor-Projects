// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { SimpleAMM } from "../../src/amm/SimpleAMM.sol";

contract SimpleAMMFuzzTest is Test {
    SimpleAMM internal amm;
    MockERC20 internal a;
    MockERC20 internal b;
    address internal admin = address(0xA11CE);
    address internal alice = address(0xA1);

    function setUp() public {
        a = new MockERC20("A", "A", 18);
        b = new MockERC20("B", "B", 18);
        amm = new SimpleAMM(address(a), address(b), admin);
        a.mint(alice, type(uint96).max);
        b.mint(alice, type(uint96).max);
        vm.startPrank(alice);
        a.approve(address(amm), type(uint256).max);
        b.approve(address(amm), type(uint256).max);
        amm.addLiquidity(1_000 ether, 1_000 ether, 0, 0);
        vm.stopPrank();
    }

    function testFuzz_swap_kNeverDecreases(uint96 amountIn, bool zeroForOne) public {
        vm.assume(amountIn > 0 && amountIn < 100 ether);
        address tokenIn = zeroForOne ? address(amm.token0()) : address(amm.token1());
        (uint112 r0Before, uint112 r1Before,) = amm.getReserves();
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);
        vm.prank(alice);
        amm.swapExactIn(tokenIn, amountIn, 0, alice);
        (uint112 r0After, uint112 r1After,) = amm.getReserves();
        uint256 kAfter = uint256(r0After) * uint256(r1After);
        assertGe(kAfter, kBefore, "k must not decrease across a swap");
    }

    function testFuzz_addLiquidity_mintsNonZeroShares(uint96 amount0, uint96 amount1) public {
        vm.assume(amount0 > 1e6 && amount1 > 1e6);
        vm.assume(amount0 < type(uint96).max / 2 && amount1 < type(uint96).max / 2);
        vm.prank(alice);
        (,, uint256 shares) = amm.addLiquidity(amount0, amount1, 0, 0);
        assertGt(shares, 0);
    }
}
