// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract VaultTest is Test {
    MockToken internal asset;
    Vault internal vault;

    address internal owner = address(this);
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant ONE = 1e18;

    function setUp() public {
        asset = new MockToken();
        vault = new Vault(IERC20(address(asset)), "Vault Mock", "vMOCK");

        asset.mint(alice, 1_000 * ONE);
        asset.mint(bob, 1_000 * ONE);
        asset.mint(owner, 1_000_000 * ONE); // for harvests

        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        asset.approve(address(vault), type(uint256).max);
        asset.approve(address(vault), type(uint256).max);
    }

    function test_DepositMintsSharesOneToOneInitially() public {
        vm.prank(alice);
        uint256 shares = vault.deposit(100 * ONE, alice);
        assertEq(shares, 100 * ONE);
        assertEq(vault.balanceOf(alice), 100 * ONE);
        assertEq(vault.totalAssets(), 100 * ONE);
    }

    function test_MintGivesExactShares() public {
        vm.prank(alice);
        uint256 assetsIn = vault.mint(50 * ONE, alice);
        assertEq(assetsIn, 50 * ONE);
        assertEq(vault.balanceOf(alice), 50 * ONE);
    }

    function test_WithdrawBurnsShares() public {
        vm.startPrank(alice);
        vault.deposit(200 * ONE, alice);
        uint256 sharesBurned = vault.withdraw(50 * ONE, alice, alice);
        vm.stopPrank();

        assertEq(sharesBurned, 50 * ONE);
        assertEq(vault.balanceOf(alice), 150 * ONE);
        assertEq(asset.balanceOf(alice), 1_000 * ONE - 200 * ONE + 50 * ONE);
    }

    function test_RedeemReturnsAssets() public {
        vm.startPrank(alice);
        vault.deposit(300 * ONE, alice);
        uint256 assetsOut = vault.redeem(100 * ONE, alice, alice);
        vm.stopPrank();
        assertEq(assetsOut, 100 * ONE);
        assertEq(vault.balanceOf(alice), 200 * ONE);
    }

    function test_SharePriceIncreasesAfterHarvest() public {
        vm.prank(alice);
        vault.deposit(1_000 * ONE, alice);

        uint256 sharesBefore = vault.balanceOf(alice);
        uint256 priceBefore = vault.convertToAssets(ONE);

        // simulate 10% yield
        vault.harvest(100 * ONE);

        uint256 priceAfter = vault.convertToAssets(ONE);
        assertGt(priceAfter, priceBefore);
        // shares unchanged
        assertEq(vault.balanceOf(alice), sharesBefore);
        // alice now redeems all and gets 1100 (minus virtual share rounding)
        vm.prank(alice);
        uint256 assetsOut = vault.redeem(sharesBefore, alice, alice);
        assertApproxEqAbs(assetsOut, 1_100 * ONE, 10);
    }

    function test_SecondDepositorAfterHarvestGetsFewerShares() public {
        vm.prank(alice);
        vault.deposit(1_000 * ONE, alice);
        // double the assets
        vault.harvest(1_000 * ONE);

        vm.prank(bob);
        uint256 bobShares = vault.deposit(1_000 * ONE, bob);
        // bob deposited the same assets but at 2x price, so ~half the shares
        assertApproxEqRel(bobShares, 500 * ONE, 1e15); // 0.1%
    }

    function test_ConvertToSharesAndAssetsRoundingDirection() public {
        vm.prank(alice);
        vault.deposit(1_000 * ONE, alice);
        vault.harvest(1); // tiny yield to force rounding

        uint256 shares = vault.convertToShares(1_000 * ONE);
        uint256 assets = vault.convertToAssets(shares);
        // round-trip should not give back more than we started with
        assertLe(assets, 1_000 * ONE);
    }

    function test_PreviewMatchesDeposit() public {
        uint256 amount = 250 * ONE;
        uint256 expectedShares = vault.previewDeposit(amount);
        vm.prank(alice);
        uint256 actualShares = vault.deposit(amount, alice);
        assertEq(actualShares, expectedShares);
    }

    function test_OnlyOwnerCanHarvest() public {
        vm.prank(alice);
        vault.deposit(100 * ONE, alice);
        vm.prank(bob);
        vm.expectRevert();
        vault.harvest(10 * ONE);
    }

    function test_MaxRedeemAndMaxWithdrawAreFullBalance() public {
        vm.prank(alice);
        vault.deposit(500 * ONE, alice);
        assertEq(vault.maxRedeem(alice), vault.balanceOf(alice));
        assertEq(vault.maxWithdraw(alice), vault.convertToAssets(vault.balanceOf(alice)));
    }

    function test_AssetIsConfigured() public view {
        assertEq(vault.asset(), address(asset));
        assertEq(vault.decimals(), 18);
    }
}
