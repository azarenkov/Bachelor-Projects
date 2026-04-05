// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/LendingPool.sol";
import "../src/MockERC20.sol";

/// @title LendingPoolTest — unit tests for the LendingPool (Task 5)
contract LendingPoolTest is Test {
    MockERC20   collateral;
    MockERC20   borrowAsset;
    LendingPool pool;

    address alice     = makeAddr("alice");
    address bob       = makeAddr("bob");
    address liquidator = makeAddr("liquidator");

    uint256 constant DEPOSIT  = 1_000 ether;
    uint256 constant MAX_LTV  = 75;  // 75 %

    function setUp() public {
        collateral  = new MockERC20("Collateral", "COL", 18);
        borrowAsset = new MockERC20("Borrow",     "BOR", 18);
        pool = new LendingPool(address(collateral), address(borrowAsset));

        // Seed the pool with borrow liquidity
        borrowAsset.mint(address(pool), 1_000_000 ether);

        // Fund users
        collateral.mint(alice,     10_000 ether);
        collateral.mint(bob,       10_000 ether);
        borrowAsset.mint(alice,    10_000 ether);
        borrowAsset.mint(liquidator, 10_000 ether);

        vm.startPrank(alice);
        collateral.approve(address(pool),  type(uint256).max);
        borrowAsset.approve(address(pool), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(liquidator);
        borrowAsset.approve(address(pool), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        collateral.approve(address(pool),  type(uint256).max);
        borrowAsset.approve(address(pool), type(uint256).max);
        vm.stopPrank();
    }

    // ── Deposit ───────────────────────────────────────────────────────────────

    // 1. Basic deposit
    function test_Deposit() public {
        vm.prank(alice);
        pool.deposit(DEPOSIT);

        (uint256 dep,,) = pool.positions(alice);
        assertEq(dep, DEPOSIT);
        assertEq(pool.totalDeposited(), DEPOSIT);
    }

    // 2. Zero deposit reverts
    function test_Deposit_ZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(LendingPool.ZeroAmount.selector);
        pool.deposit(0);
    }

    // ── Withdraw ──────────────────────────────────────────────────────────────

    // 3. Full withdrawal with no debt
    function test_Withdraw_Full() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.withdraw(DEPOSIT);
        vm.stopPrank();

        (uint256 dep,,) = pool.positions(alice);
        assertEq(dep, 0);
    }

    // 4. Partial withdrawal
    function test_Withdraw_Partial() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.withdraw(DEPOSIT / 2);
        vm.stopPrank();

        (uint256 dep,,) = pool.positions(alice);
        assertEq(dep, DEPOSIT / 2);
    }

    // 5. Withdraw with outstanding debt brings HF < 1 → reverts
    function test_Withdraw_WithDebt_Reverts() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.borrow((DEPOSIT * MAX_LTV) / 100); // borrow max
        // Trying to withdraw any collateral would push HF < 1
        vm.expectRevert(LendingPool.OutstandingDebt.selector);
        pool.withdraw(1 ether);
        vm.stopPrank();
    }

    // ── Borrow ────────────────────────────────────────────────────────────────

    // 6. Borrow within LTV
    function test_Borrow_WithinLTV() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        uint256 maxBorrow = (DEPOSIT * MAX_LTV) / 100;
        pool.borrow(maxBorrow);
        vm.stopPrank();

        (, uint256 borrowed,) = pool.positions(alice);
        assertEq(borrowed, maxBorrow);
    }

    // 7. Borrow exceeding LTV reverts
    function test_Borrow_ExceedsLTV_Reverts() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        uint256 overBorrow = (DEPOSIT * MAX_LTV) / 100 + 1;
        vm.expectRevert(LendingPool.ExceedsLTV.selector);
        pool.borrow(overBorrow);
        vm.stopPrank();
    }

    // 8. Borrow with zero collateral reverts
    function test_Borrow_ZeroCollateral_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(LendingPool.ExceedsLTV.selector);
        pool.borrow(1 ether);
    }

    // ── Repay ─────────────────────────────────────────────────────────────────

    // 9. Full repay clears debt (no time passes → no interest)
    function test_Repay_Full() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        uint256 borrowed = (DEPOSIT * MAX_LTV) / 100;
        pool.borrow(borrowed);
        pool.repay(borrowed);
        vm.stopPrank();

        (, uint256 debt,) = pool.positions(alice);
        assertEq(debt, 0);
    }

    // 10. Partial repay reduces debt
    function test_Repay_Partial() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.borrow(500 ether);
        pool.repay(200 ether);
        vm.stopPrank();

        (, uint256 debt,) = pool.positions(alice);
        assertEq(debt, 300 ether);
    }

    // ── Interest accrual ──────────────────────────────────────────────────────

    // 11. Interest accrues over time (vm.warp)
    function test_InterestAccrual() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.borrow(500 ether);
        vm.stopPrank();

        (, uint256 debtBefore,) = pool.positions(alice);

        vm.warp(block.timestamp + 365 days); // advance 1 year

        // Trigger global accrual via alice's deposit (she is the owner of collateral too)
        // Just deposit 1 wei to trigger _accrueInterest + _updateUserDebt for alice
        vm.prank(alice);
        pool.deposit(1);

        (, uint256 debtAfter,) = pool.positions(alice);
        assertGt(debtAfter, debtBefore, "interest should have accrued");
    }

    // ── Liquidation ───────────────────────────────────────────────────────────

    // 12. Cannot liquidate healthy position
    function test_Liquidate_HealthyReverts() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.borrow(100 ether); // well within 75 % LTV
        vm.stopPrank();

        vm.prank(liquidator);
        vm.expectRevert(LendingPool.HealthFactorOk.selector);
        pool.liquidate(alice);
    }

    // 13. Liquidation after simulated collateral drop
    function test_Liquidate_AfterCollateralDrop() public {
        // Alice deposits 1 000 and borrows max (750)
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.borrow((DEPOSIT * MAX_LTV) / 100);
        vm.stopPrank();

        // Simulate "price drop" by directly reducing alice's deposited collateral.
        // Storage layout (immutables don't occupy slots):
        //   slot 0: _status (ReentrancyGuard)
        //   slot 1: positions mapping
        //   slot 2: totalDeposited
        //   ...
        // UserPosition struct base = keccak256(alice ++ 1)
        //   +0: deposited,  +1: borrowed,  +2: interestIndex
        // We set deposited to 500 ether so borrowed (750) > deposited * 0.75 (375) → HF < 1
        bytes32 baseSlot = keccak256(abi.encode(alice, uint256(0)));
        vm.store(address(pool), baseSlot, bytes32(uint256(500 ether)));

        assertTrue(pool.healthFactor(alice) < 1e18, "should be liquidatable");

        uint256 colBefore = collateral.balanceOf(liquidator);
        vm.prank(liquidator);
        pool.liquidate(alice);
        uint256 colAfter = collateral.balanceOf(liquidator);

        assertGt(colAfter, colBefore, "liquidator receives collateral");
    }

    // 14. Health factor is max when no debt
    function test_HealthFactor_NoDebt() public {
        vm.prank(alice);
        pool.deposit(DEPOSIT);
        assertEq(pool.healthFactor(alice), type(uint256).max);
    }

    // 15. Health factor below 1e18 after over-borrowing simulation
    function test_HealthFactor_Undercollateralised() public {
        vm.startPrank(alice);
        pool.deposit(DEPOSIT);
        pool.borrow((DEPOSIT * MAX_LTV) / 100); // 750 ether
        vm.stopPrank();

        // Set deposited to 500 ether → max_borrow = 375 < 750 → HF < 1
        bytes32 baseSlot = keccak256(abi.encode(alice, uint256(0)));
        vm.store(address(pool), baseSlot, bytes32(uint256(500 ether)));

        assertLt(pool.healthFactor(alice), 1e18);
    }
}
