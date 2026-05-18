// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { PriceOracle } from "../../src/oracle/PriceOracle.sol";
import { IPriceOracle } from "../../src/interfaces/IPriceOracle.sol";
import { MockAggregatorV3 } from "../../src/mocks/MockAggregatorV3.sol";

contract PriceOracleTest is Test {
    PriceOracle internal oracle;
    MockAggregatorV3 internal feed;
    address internal admin = address(0xA11CE);
    address internal asset = address(0xCAFE);
    address internal user = address(0xB0B);

    function setUp() public {
        oracle = new PriceOracle(admin);
        feed = new MockAggregatorV3(8, 2_000e8, "ETH/USD");
    }

    function test_registerFeed_succeeds() public {
        vm.prank(admin);
        oracle.registerFeed(asset, address(feed), 3_600);
        (address f, uint64 thr) = oracle.feedInfo(asset);
        assertEq(f, address(feed));
        assertEq(thr, 3_600);
    }

    function test_registerFeed_unauthorized_reverts() public {
        vm.expectRevert();
        vm.prank(user);
        oracle.registerFeed(asset, address(feed), 3_600);
    }

    function test_getPrice_fresh_returnsAnswer() public {
        vm.prank(admin);
        oracle.registerFeed(asset, address(feed), 3_600);
        (uint256 p, uint8 d) = oracle.getPrice(asset);
        assertEq(p, 2_000e8);
        assertEq(d, 8);
    }

    function test_getPrice_stale_reverts() public {
        vm.prank(admin);
        oracle.registerFeed(asset, address(feed), 60);
        vm.warp(block.timestamp + 120);
        vm.expectRevert();
        oracle.getPrice(asset);
    }

    function test_getPrice_unregistered_reverts() public {
        vm.expectRevert(abi.encodeWithSelector(IPriceOracle.FeedNotSet.selector, asset));
        oracle.getPrice(asset);
    }

    function test_getPrice_negativeAnswer_reverts() public {
        vm.prank(admin);
        oracle.registerFeed(asset, address(feed), 3_600);
        feed.setAnswer(-1);
        vm.expectRevert(abi.encodeWithSelector(IPriceOracle.InvalidPrice.selector, -1));
        oracle.getPrice(asset);
    }

    function test_setStalenessThreshold_emitsEvent() public {
        vm.startPrank(admin);
        oracle.registerFeed(asset, address(feed), 3_600);
        oracle.setStalenessThreshold(asset, 7_200);
        vm.stopPrank();
        (, uint64 thr) = oracle.feedInfo(asset);
        assertEq(thr, 7_200);
    }

    function test_registerFeed_zeroAddress_reverts() public {
        vm.expectRevert("PriceOracle: zero address");
        vm.prank(admin);
        oracle.registerFeed(address(0), address(feed), 60);
    }

    function test_registerFeed_zeroThreshold_reverts() public {
        vm.expectRevert("PriceOracle: zero threshold");
        vm.prank(admin);
        oracle.registerFeed(asset, address(feed), 0);
    }
}
