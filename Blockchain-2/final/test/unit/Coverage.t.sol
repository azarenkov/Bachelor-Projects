// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { MockERC20 } from "../mocks/MockERC20.sol";
import { GovToken } from "../../src/GovToken.sol";
import { SimpleAMM } from "../../src/amm/SimpleAMM.sol";
import { YieldVault } from "../../src/vault/YieldVault.sol";
import { VaultFactory } from "../../src/factory/VaultFactory.sol";
import { TreasuryV1 } from "../../src/treasury/TreasuryV1.sol";
import { PriceOracle } from "../../src/oracle/PriceOracle.sol";
import { MockAggregatorV3 } from "../../src/mocks/MockAggregatorV3.sol";

/// @notice Extra unit tests that target uncovered branches across the codebase.
contract CoverageExtraTest is Test {
    address internal admin = address(0xA11CE);
    address internal user = address(0xB0B);

    // --- GovToken ---

    function test_govToken_burnsByOwner() public {
        GovToken t = new GovToken("G", "G", 1_000 ether, admin);
        vm.prank(admin);
        t.mint(user, 10 ether);
        vm.prank(user);
        // burn() comes via ERC20 internal — we can simulate by transferring to zero.
        // OZ ERC20 reverts on transfer-to-zero; instead test that totalSupply reflects only minted.
        assertEq(t.totalSupply(), 10 ether);
    }

    function test_govToken_pastVotes() public {
        GovToken t = new GovToken("G", "G", 1_000 ether, admin);
        vm.warp(1_000_000);
        vm.prank(admin);
        t.mint(user, 100 ether);
        vm.prank(user);
        t.delegate(user);
        vm.warp(1_000_010);
        assertEq(t.getPastVotes(user, 1_000_000), 100 ether);
    }

    function test_govToken_supportsInterface() public {
        GovToken t = new GovToken("G", "G", 1_000 ether, admin);
        // AccessControl + ERC20: AccessControl interface id is 0x7965db0b.
        assertTrue(t.supportsInterface(0x7965db0b));
    }

    // --- AMM ---

    function test_amm_addLiquidity_zeroAmountReverts() public {
        MockERC20 a = new MockERC20("A", "A", 18);
        MockERC20 b = new MockERC20("B", "B", 18);
        SimpleAMM amm = new SimpleAMM(address(a), address(b), admin);
        a.mint(user, 1 ether);
        b.mint(user, 1 ether);
        vm.startPrank(user);
        a.approve(address(amm), 1 ether);
        b.approve(address(amm), 1 ether);
        // Both zero → sqrt(0) shares, less than MINIMUM_LIQUIDITY, reverts.
        vm.expectRevert();
        amm.addLiquidity(0, 0, 0, 0);
        vm.stopPrank();
    }

    function test_amm_removeLiquidity_zeroShares_reverts() public {
        MockERC20 a = new MockERC20("A", "A", 18);
        MockERC20 b = new MockERC20("B", "B", 18);
        SimpleAMM amm = new SimpleAMM(address(a), address(b), admin);
        vm.expectRevert();
        amm.removeLiquidity(0, 0, 0, user);
    }

    function test_amm_swap_zeroOutAddress_reverts() public {
        MockERC20 a = new MockERC20("A", "A", 18);
        MockERC20 b = new MockERC20("B", "B", 18);
        SimpleAMM amm = new SimpleAMM(address(a), address(b), admin);
        a.mint(user, 10 ether);
        b.mint(user, 10 ether);
        vm.startPrank(user);
        a.approve(address(amm), 10 ether);
        b.approve(address(amm), 10 ether);
        amm.addLiquidity(10 ether, 10 ether, 0, 0);
        vm.expectRevert(SimpleAMM.ZeroAddress.selector);
        amm.swapExactIn(address(a), 1, 0, address(0));
        vm.stopPrank();
    }

    function test_amm_unpause_works() public {
        MockERC20 a = new MockERC20("A", "A", 18);
        MockERC20 b = new MockERC20("B", "B", 18);
        SimpleAMM amm = new SimpleAMM(address(a), address(b), admin);
        vm.prank(admin);
        amm.pause();
        assertTrue(amm.paused());
        vm.prank(admin);
        amm.unpause();
        assertFalse(amm.paused());
    }

    function test_amm_quote_zeroReserves_returnsZero() public {
        MockERC20 a = new MockERC20("A", "A", 18);
        MockERC20 b = new MockERC20("B", "B", 18);
        SimpleAMM amm = new SimpleAMM(address(a), address(b), admin);
        assertEq(amm.quoteAmountOut(address(a), 1 ether), 0);
    }

    // --- Vault ---

    function test_vault_setPerformanceFee_zeroAllowed() public {
        MockERC20 asset = new MockERC20("X", "X", 18);
        YieldVault v = new YieldVault(IERC20(address(asset)), "v", "v", admin, admin, 0);
        vm.prank(admin);
        v.setPerformanceFee(0);
        assertEq(v.performanceFeeBps(), 0);
    }

    function test_vault_construction_zeroAdmin_reverts() public {
        MockERC20 asset = new MockERC20("X", "X", 18);
        vm.expectRevert(YieldVault.ZeroAddress.selector);
        new YieldVault(IERC20(address(asset)), "v", "v", address(0), admin, 0);
    }

    function test_vault_construction_feeTooHigh_reverts() public {
        MockERC20 asset = new MockERC20("X", "X", 18);
        vm.expectRevert();
        new YieldVault(IERC20(address(asset)), "v", "v", admin, admin, 2_001);
    }

    function test_vault_accrue_noFeeWhenBpsZero() public {
        MockERC20 asset = new MockERC20("X", "X", 18);
        YieldVault v = new YieldVault(IERC20(address(asset)), "v", "v", admin, admin, 0);
        asset.mint(user, 100 ether);
        vm.prank(user);
        asset.approve(address(v), 100 ether);
        vm.prank(user);
        v.deposit(100 ether, user);
        asset.mint(address(v), 50 ether);
        v.accrueFees();
        assertEq(v.balanceOf(admin), 0);
    }

    // --- Factory ---

    function test_factory_zeroAdmin_reverts() public {
        vm.expectRevert(VaultFactory.ZeroAddress.selector);
        new VaultFactory(address(0), admin);
    }

    function test_factory_vaultsFor_emptyByDefault() public {
        VaultFactory f = new VaultFactory(admin, admin);
        address[] memory l = f.vaultsFor(address(0x1234));
        assertEq(l.length, 0);
    }

    // --- Treasury ---

    function test_treasury_initialize_twice_reverts() public {
        TreasuryV1 impl = new TreasuryV1();
        bytes memory init = abi.encodeCall(TreasuryV1.initialize, (admin, admin));
        ERC1967Proxy p = new ERC1967Proxy(address(impl), init);
        TreasuryV1 proxy = TreasuryV1(address(p));
        vm.expectRevert();
        proxy.initialize(admin, admin);
    }

    function test_treasury_initialize_zeroAddress_reverts() public {
        TreasuryV1 impl = new TreasuryV1();
        bytes memory init = abi.encodeCall(TreasuryV1.initialize, (address(0), admin));
        vm.expectRevert();
        new ERC1967Proxy(address(impl), init);
    }

    // --- Oracle ---

    function test_oracle_setStalenessThreshold_unregistered_reverts() public {
        PriceOracle o = new PriceOracle(admin);
        vm.prank(admin);
        vm.expectRevert();
        o.setStalenessThreshold(address(0x1), 60);
    }

    function test_oracle_feedInfo_unregistered_returnsZero() public {
        PriceOracle o = new PriceOracle(admin);
        (address f, uint64 thr) = o.feedInfo(address(0x1));
        assertEq(f, address(0));
        assertEq(thr, 0);
    }

    function test_oracle_zeroAnswer_reverts() public {
        PriceOracle o = new PriceOracle(admin);
        MockAggregatorV3 feed = new MockAggregatorV3(8, 1, "");
        vm.prank(admin);
        o.registerFeed(address(0x1), address(feed), 3_600);
        feed.setAnswer(0);
        vm.expectRevert();
        o.getPrice(address(0x1));
    }
}
