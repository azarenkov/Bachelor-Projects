// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { StdInvariant } from "forge-std/StdInvariant.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { YieldVault } from "../../src/vault/YieldVault.sol";

contract VaultHandler is Test {
    YieldVault internal vault;
    MockERC20 internal asset;
    address internal user;

    constructor(YieldVault v, MockERC20 a, address u) {
        vault = v;
        asset = a;
        user = u;
    }

    function deposit(uint96 amount) public {
        amount = uint96(bound(amount, 1, 1_000_000 ether));
        asset.mint(user, amount);
        vm.startPrank(user);
        asset.approve(address(vault), amount);
        vault.deposit(amount, user);
        vm.stopPrank();
    }

    function redeem(uint96 sharesRaw) public {
        uint256 balance = vault.balanceOf(user);
        if (balance == 0) return;
        uint256 shares = bound(uint256(sharesRaw), 1, balance);
        vm.prank(user);
        vault.redeem(shares, user, user);
    }
}

contract YieldVaultInvariantTest is StdInvariant, Test {
    YieldVault internal vault;
    MockERC20 internal asset;
    VaultHandler internal handler;
    address internal admin = address(0xA11CE);
    address internal treasury = address(0xCAFE);
    address internal user = address(0xA1);

    function setUp() public {
        asset = new MockERC20("X", "X", 18);
        vault = new YieldVault(IERC20(address(asset)), "vX", "vX", admin, treasury, 0);
        handler = new VaultHandler(vault, asset, user);
        targetContract(address(handler));
    }

    /// @notice totalAssets >= sum of user balances accounted by shares (because virtual offset).
    function invariant_totalAssetsCoversShares() public view {
        // For any sane state, totalSupply * convertToAssets(1share) should not exceed totalAssets.
        uint256 supply = vault.totalSupply();
        if (supply == 0) return;
        uint256 assetsAtFullSupply = vault.convertToAssets(supply);
        // assetsAtFullSupply uses rounding-down, so totalAssets >= assetsAtFullSupply.
        assertGe(vault.totalAssets(), assetsAtFullSupply);
    }

    /// @notice Underlying balance held by the vault == reported totalAssets.
    function invariant_assetBalanceMatchesTotalAssets() public view {
        assertEq(asset.balanceOf(address(vault)), vault.totalAssets());
    }
}
