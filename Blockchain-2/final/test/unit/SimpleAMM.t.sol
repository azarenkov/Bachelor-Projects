// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { SimpleAMM } from "../../src/amm/SimpleAMM.sol";

contract SimpleAMMTest is Test {
    SimpleAMM internal amm;
    MockERC20 internal weth;
    MockERC20 internal usdc;
    address internal admin = address(0xA11CE);
    address internal alice = address(0xA1);
    address internal bob = address(0xB0B);

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);
        amm = new SimpleAMM(address(weth), address(usdc), admin);

        weth.mint(alice, 100 ether);
        usdc.mint(alice, 200_000e6);
        weth.mint(bob, 10 ether);
        usdc.mint(bob, 20_000e6);

        vm.startPrank(alice);
        weth.approve(address(amm), type(uint256).max);
        usdc.approve(address(amm), type(uint256).max);
        vm.stopPrank();
        vm.startPrank(bob);
        weth.approve(address(amm), type(uint256).max);
        usdc.approve(address(amm), type(uint256).max);
        vm.stopPrank();
    }

    function _seedPool() internal {
        // Sort by address — token0 is the lower of weth/usdc, token1 the higher.
        bool wethIsToken0 = address(weth) < address(usdc);
        (uint256 a0, uint256 a1) =
            wethIsToken0 ? (uint256(10 ether), uint256(20_000e6)) : (uint256(20_000e6), uint256(10 ether));
        vm.prank(alice);
        amm.addLiquidity(a0, a1, 0, 0);
    }

    function test_construction_identicalTokens_reverts() public {
        vm.expectRevert(SimpleAMM.IdenticalTokens.selector);
        new SimpleAMM(address(weth), address(weth), admin);
    }

    function test_construction_zeroAddress_reverts() public {
        vm.expectRevert(SimpleAMM.ZeroAddress.selector);
        new SimpleAMM(address(weth), address(0), admin);
    }

    function test_addLiquidity_initial_mintsShares() public {
        _seedPool();
        // Alice gets sqrt(10e18 * 20_000e6) - MINIMUM_LIQUIDITY shares.
        uint256 shares = amm.balanceOf(alice);
        assertGt(shares, 0);
        // Dead address holds the burned MINIMUM_LIQUIDITY.
        assertEq(amm.balanceOf(address(0xdead)), amm.MINIMUM_LIQUIDITY());
    }

    function test_addLiquidity_subsequent_pricedProportionally() public {
        _seedPool();
        bool wethIsToken0 = address(weth) < address(usdc);
        (uint256 a0, uint256 a1) =
            wethIsToken0 ? (uint256(1 ether), uint256(2_000e6)) : (uint256(2_000e6), uint256(1 ether));
        vm.prank(bob);
        (uint256 used0, uint256 used1, uint256 shares) = amm.addLiquidity(a0, a1, 0, 0);
        assertEq(used0, a0);
        assertEq(used1, a1);
        assertGt(shares, 0);
    }

    function test_swap_exactIn_returnsCorrectAmount() public {
        _seedPool();
        uint256 amountIn = 1 ether;
        uint256 expected = amm.quoteAmountOut(address(weth), amountIn);
        uint256 beforeBal = usdc.balanceOf(bob);
        vm.prank(bob);
        uint256 received = amm.swapExactIn(address(weth), amountIn, expected, bob);
        assertEq(received, expected);
        assertEq(usdc.balanceOf(bob) - beforeBal, expected);
    }

    function test_swap_belowMinOut_reverts() public {
        _seedPool();
        uint256 amountIn = 1 ether;
        uint256 expected = amm.quoteAmountOut(address(weth), amountIn);
        vm.prank(bob);
        vm.expectRevert();
        amm.swapExactIn(address(weth), amountIn, expected + 1, bob);
    }

    function test_swap_unknownToken_reverts() public {
        _seedPool();
        MockERC20 other = new MockERC20("X", "X", 18);
        vm.expectRevert(abi.encodeWithSelector(SimpleAMM.UnknownToken.selector, address(other)));
        vm.prank(bob);
        amm.swapExactIn(address(other), 1, 0, bob);
    }

    function test_removeLiquidity_returnsAssets() public {
        _seedPool();
        uint256 shares = amm.balanceOf(alice);
        uint256 w0 = weth.balanceOf(alice);
        uint256 u0 = usdc.balanceOf(alice);
        vm.prank(alice);
        amm.removeLiquidity(shares, 0, 0, alice);
        assertEq(amm.balanceOf(alice), 0);
        assertGt(weth.balanceOf(alice), w0);
        assertGt(usdc.balanceOf(alice), u0);
    }

    function test_swap_whenPaused_reverts() public {
        _seedPool();
        vm.prank(admin);
        amm.pause();
        vm.expectRevert();
        vm.prank(bob);
        amm.swapExactIn(address(weth), 1 ether, 0, bob);
    }

    function test_quote_zeroIn_returnsZero() public {
        _seedPool();
        assertEq(amm.quoteAmountOut(address(weth), 0), 0);
    }

    function test_swap_kInvariant_holds() public {
        _seedPool();
        (uint112 r0, uint112 r1,) = amm.getReserves();
        uint256 kBefore = uint256(r0) * uint256(r1);
        vm.prank(bob);
        amm.swapExactIn(address(weth), 1 ether, 0, bob);
        (uint112 r0a, uint112 r1a,) = amm.getReserves();
        uint256 kAfter = uint256(r0a) * uint256(r1a);
        assertGe(kAfter, kBefore, "k must not decrease (fee accumulates)");
    }
}
