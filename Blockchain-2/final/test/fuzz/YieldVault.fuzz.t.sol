// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { YieldVault } from "../../src/vault/YieldVault.sol";

contract YieldVaultFuzzTest is Test {
    YieldVault internal vault;
    MockERC20 internal asset;
    address internal admin = address(0xA11CE);
    address internal treasury = address(0xCAFE);
    address internal alice = address(0xA1);

    function setUp() public {
        asset = new MockERC20("X", "X", 18);
        vault = new YieldVault(IERC20(address(asset)), "vX", "vX", admin, treasury, 0);
        asset.mint(alice, type(uint128).max);
        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);
    }

    function testFuzz_depositRedeem_roundTrips(uint96 deposit) public {
        vm.assume(deposit > 1e6);
        vm.startPrank(alice);
        uint256 shares = vault.deposit(deposit, alice);
        uint256 redeemed = vault.redeem(shares, alice, alice);
        vm.stopPrank();
        // ERC4626 rounds toward zero, so redeemed <= deposit always.
        assertLe(redeemed, deposit);
        // …and very close to it (off by at most 1 wei of asset for tiny shares).
        assertApproxEqAbs(redeemed, deposit, 2);
    }

    function testFuzz_previewDeposit_matchesDeposit(uint96 amount) public {
        vm.assume(amount > 1e6);
        uint256 expected = vault.previewDeposit(amount);
        vm.prank(alice);
        uint256 actual = vault.deposit(amount, alice);
        assertEq(actual, expected);
    }
}
