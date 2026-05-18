// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { YieldVault } from "../../src/vault/YieldVault.sol";

contract YieldVaultTest is Test {
    YieldVault internal vault;
    MockERC20 internal usdc;
    address internal admin = address(0xA11CE);
    address internal treasury = address(0xCAFE);
    address internal alice = address(0xA1);
    address internal bob = address(0xB0B);

    function setUp() public {
        usdc = new MockERC20("USDC", "USDC", 6);
        vault = new YieldVault(IERC20(address(usdc)), "Vault USDC", "vUSDC", admin, treasury, 1_000); // 10% fee

        usdc.mint(alice, 1_000_000e6);
        usdc.mint(bob, 1_000_000e6);
        vm.prank(alice);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_deposit_mintsShares() public {
        vm.prank(alice);
        uint256 shares = vault.deposit(1_000e6, alice);
        assertEq(vault.balanceOf(alice), shares);
        assertEq(vault.totalAssets(), 1_000e6);
    }

    function test_redeem_returnsAssets() public {
        vm.startPrank(alice);
        uint256 shares = vault.deposit(1_000e6, alice);
        uint256 redeemed = vault.redeem(shares, alice, alice);
        vm.stopPrank();
        assertApproxEqAbs(redeemed, 1_000e6, 1);
    }

    function test_performanceFee_chargedOnProfit() public {
        vm.prank(alice);
        vault.deposit(1_000e6, alice);
        // Simulate yield by minting USDC into the vault.
        usdc.mint(address(vault), 100e6);
        vm.prank(admin);
        vault.accrueFees();
        // 10% of 100 = 10 USDC worth of shares to treasury.
        assertGt(vault.balanceOf(treasury), 0);
    }

    function test_performanceFee_noProfit_noShares() public {
        vm.prank(alice);
        vault.deposit(1_000e6, alice);
        vm.prank(admin);
        vault.accrueFees();
        assertEq(vault.balanceOf(treasury), 0);
    }

    function test_setFee_aboveCap_reverts() public {
        vm.prank(admin);
        vm.expectRevert();
        vault.setPerformanceFee(2_001);
    }

    function test_setTreasury_zero_reverts() public {
        vm.prank(admin);
        vm.expectRevert(YieldVault.ZeroAddress.selector);
        vault.setTreasury(address(0));
    }

    function test_setTreasury_byNonAdmin_reverts() public {
        vm.expectRevert();
        vm.prank(alice);
        vault.setTreasury(address(0xDEAD));
    }

    function test_inflationAttack_oneWeiDeposit_safe() public {
        // The OZ ERC4626 virtual-assets/-shares logic should make 1-wei donations harmless to later depositors.
        vm.prank(alice);
        vault.deposit(1, alice);
        usdc.mint(address(vault), 1_000_000e6);
        // Bob deposits a normal amount.
        vm.prank(bob);
        uint256 bobShares = vault.deposit(100e6, bob);
        // Bob's shares must still be meaningful (i.e. != 0).
        assertGt(bobShares, 0);
    }
}
