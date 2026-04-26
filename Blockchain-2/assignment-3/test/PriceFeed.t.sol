// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {PriceFeedConsumer} from "../src/PriceFeedConsumer.sol";
import {PriceDependentVault} from "../src/PriceDependentVault.sol";

contract PriceFeedTest is Test {
    MockAggregator internal feed;
    PriceFeedConsumer internal consumer;
    PriceDependentVault internal vault;

    uint256 internal constant MAX_STALENESS = 1 hours;
    int256 internal constant THRESHOLD = 2_000e8; // $2000 with 8 decimals

    address internal alice = makeAddr("alice");

    function setUp() public {
        feed = new MockAggregator(8, 2_500e8, "ETH / USD");
        consumer = new PriceFeedConsumer(address(feed), MAX_STALENESS);
        vault = new PriceDependentVault(address(feed), MAX_STALENESS, THRESHOLD);
        vm.deal(alice, 100 ether);
    }

    function test_GetLatestPriceReturnsAnswer() public view {
        assertEq(consumer.getLatestPrice(), 2_500e8);
        assertEq(consumer.decimals(), 8);
    }

    function test_StalePriceReverts() public {
        // make the price stale by warping forward
        vm.warp(block.timestamp + MAX_STALENESS + 1);
        vm.expectRevert();
        consumer.getLatestPrice();
    }

    function test_NegativeOrZeroPriceReverts() public {
        feed.setAnswer(0);
        vm.expectRevert(abi.encodeWithSelector(PriceFeedConsumer.InvalidPrice.selector, int256(0)));
        consumer.getLatestPrice();

        feed.setAnswer(-1);
        vm.expectRevert(abi.encodeWithSelector(PriceFeedConsumer.InvalidPrice.selector, int256(-1)));
        consumer.getLatestPrice();
    }

    function test_EthToUsdConversion() public view {
        // 1 ETH @ $2500 → 2500 * 1e18
        uint256 usd = consumer.ethToUsd(1 ether);
        assertEq(usd, 2_500 * 1e18);
    }

    function test_DepositAndWithdrawAboveThreshold() public {
        vm.prank(alice);
        vault.deposit{value: 5 ether}();
        assertEq(vault.deposits(alice), 5 ether);

        vm.prank(alice);
        vault.withdraw(2 ether);
        assertEq(vault.deposits(alice), 3 ether);
        assertEq(alice.balance, 100 ether - 5 ether + 2 ether);
    }

    function test_WithdrawBelowThresholdReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}();

        feed.setAnswer(1_500e8); // below 2000 threshold
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                PriceDependentVault.PriceBelowThreshold.selector, int256(1_500e8), THRESHOLD
            )
        );
        vault.withdraw(1 ether);
    }

    function test_WithdrawMoreThanDepositReverts() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(PriceDependentVault.InsufficientBalance.selector, 2 ether, 1 ether)
        );
        vault.withdraw(2 ether);
    }

    function test_DepositZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(PriceDependentVault.ZeroAmount.selector);
        vault.deposit{value: 0}();
    }

    function test_UsdValueOf() public {
        vm.prank(alice);
        vault.deposit{value: 2 ether}();
        // 2 ETH * $2500 = $5000 → 5000 * 1e18
        assertEq(vault.usdValueOf(alice), 5_000 * 1e18);
    }

    function test_VmMockCallStyleFlow() public {
        // Demonstrates vm.mockCall on a feed: we mock a different price
        // by calling setAnswer on the mock — equivalent in spirit.
        feed.setAnswer(3_000e8);
        assertEq(consumer.getLatestPrice(), 3_000e8);

        vm.prank(alice);
        vault.deposit{value: 1 ether}();
        vm.prank(alice);
        vault.withdraw(1 ether); // succeeds because 3000 > 2000 threshold
        assertEq(vault.deposits(alice), 0);
    }

    function test_StalenessUsesUpdatedAtFromFeed() public {
        vm.warp(block.timestamp + 1 days);
        feed.setStaleAnswer(2_000e8, block.timestamp - MAX_STALENESS - 5);
        vm.expectRevert();
        consumer.getLatestPrice();
    }
}
