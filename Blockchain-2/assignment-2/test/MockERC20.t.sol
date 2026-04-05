// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/MockERC20.sol";

/// @title MockERC20Test — unit + fuzz + invariant tests for the ERC-20 token (Task 1)
contract MockERC20Test is Test {
    MockERC20 token;
    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");

    function setUp() public {
        token = new MockERC20("Test Token", "TT", 18);
        token.mint(alice, 1_000 ether);
    }

    // ── Unit tests (≥10) ──────────────────────────────────────────────────────

    // 1. Initial state
    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), 1_000 ether);
    }

    // 2. Mint increases balance
    function test_MintIncreasesBalance() public {
        token.mint(bob, 500 ether);
        assertEq(token.balanceOf(bob), 500 ether);
        assertEq(token.totalSupply(), 1_500 ether);
    }

    // 3. Mint only by owner
    function test_MintOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1 ether);
    }

    // 4. Transfer succeeds
    function test_Transfer() public {
        vm.prank(alice);
        token.transfer(bob, 100 ether);
        assertEq(token.balanceOf(alice), 900 ether);
        assertEq(token.balanceOf(bob), 100 ether);
    }

    // 5. Transfer emits event
    function test_TransferEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IERC20.Transfer(alice, bob, 200 ether);
        token.transfer(bob, 200 ether);
    }

    // 6. Transfer reverts on insufficient balance
    function test_TransferInsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 1_001 ether);
    }

    // 7. Transfer to zero address reverts
    function test_TransferToZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(address(0), 1 ether);
    }

    // 8. Approve sets allowance
    function test_Approve() public {
        vm.prank(alice);
        token.approve(bob, 500 ether);
        assertEq(token.allowance(alice, bob), 500 ether);
    }

    // 9. transferFrom moves tokens and reduces allowance
    function test_TransferFrom() public {
        vm.prank(alice);
        token.approve(bob, 300 ether);

        vm.prank(bob);
        token.transferFrom(alice, bob, 300 ether);

        assertEq(token.balanceOf(bob), 300 ether);
        assertEq(token.allowance(alice, bob), 0);
    }

    // 10. transferFrom reverts when exceeding allowance
    function test_TransferFromExceedsAllowance() public {
        vm.prank(alice);
        token.approve(bob, 50 ether);

        vm.prank(bob);
        vm.expectRevert();
        token.transferFrom(alice, bob, 51 ether);
    }

    // 11. Burn decreases supply
    function test_Burn() public {
        token.burn(alice, 200 ether);
        assertEq(token.totalSupply(), 800 ether);
        assertEq(token.balanceOf(alice), 800 ether);
    }

    // 12. Burn more than balance reverts
    function test_BurnExceedsBalance() public {
        vm.expectRevert();
        token.burn(alice, 1_001 ether);
    }

    // 13. Self-transfer
    function test_SelfTransfer() public {
        vm.prank(alice);
        token.transfer(alice, 100 ether);
        assertEq(token.balanceOf(alice), 1_000 ether);
    }

    // 14. Decimals
    function test_Decimals() public {
        assertEq(token.decimals(), 18);
        MockERC20 t6 = new MockERC20("USDC", "USDC", 6);
        assertEq(t6.decimals(), 6);
    }

    // ── Fuzz test ─────────────────────────────────────────────────────────────

    /// @notice Fuzz: any valid transfer amount leaves total supply unchanged
    function testFuzz_TransferPreservesSupply(uint256 amount) public {
        amount = bound(amount, 0, token.balanceOf(alice));
        uint256 supplyBefore = token.totalSupply();
        vm.prank(alice);
        token.transfer(bob, amount);
        assertEq(token.totalSupply(), supplyBefore);
    }

    /// @notice Fuzz: transferFrom never grants more than allowance
    function testFuzz_TransferFromRespectAllowance(uint256 allowance, uint256 sendAmount) public {
        allowance   = bound(allowance,   0, 1_000 ether);
        sendAmount  = bound(sendAmount,  0, allowance);

        vm.prank(alice);
        token.approve(bob, allowance);

        vm.prank(bob);
        token.transferFrom(alice, bob, sendAmount);

        assertEq(token.allowance(alice, bob), allowance - sendAmount);
    }
}

/// @title ERC20Invariants — invariant test harness for MockERC20
contract ERC20InvariantHandler is Test {
    MockERC20 public token;
    address[] internal actors;

    /// The handler owns and deploys its own token so it can mint freely.
    constructor() {
        token = new MockERC20("Inv Token", "INV", 18);
        actors.push(makeAddr("actor1"));
        actors.push(makeAddr("actor2"));
        actors.push(makeAddr("actor3"));
        for (uint256 i = 0; i < actors.length; i++) {
            token.mint(actors[i], 1_000 ether);
        }
    }

    function transfer(uint256 actorSeed, uint256 toSeed, uint256 amount) external {
        address from = actors[actorSeed % actors.length];
        address to   = actors[toSeed   % actors.length];
        amount = bound(amount, 0, token.balanceOf(from));
        vm.prank(from);
        token.transfer(to, amount);
    }
}

contract ERC20InvariantTest is Test {
    ERC20InvariantHandler handler;

    // Pre-computed actor addresses (avoid makeAddr in view functions)
    address actor1;
    address actor2;
    address actor3;

    function setUp() public {
        handler = new ERC20InvariantHandler();
        actor1  = makeAddr("actor1");
        actor2  = makeAddr("actor2");
        actor3  = makeAddr("actor3");
        targetContract(address(handler));
    }

    /// Invariant 1: total supply never changes after transfers
    function invariant_TotalSupplyConstant() public view {
        // 3 actors × 1 000 ether
        assertEq(handler.token().totalSupply(), 3_000 ether);
    }

    /// Invariant 2: no address can hold more than total supply; sum equals supply
    function invariant_NoBalanceExceedsTotalSupply() public view {
        MockERC20 token = handler.token();
        uint256 supply = token.totalSupply();
        uint256 bal1 = token.balanceOf(actor1);
        uint256 bal2 = token.balanceOf(actor2);
        uint256 bal3 = token.balanceOf(actor3);
        assertTrue(bal1 <= supply);
        assertTrue(bal2 <= supply);
        assertTrue(bal3 <= supply);
        assertEq(bal1 + bal2 + bal3, supply, "sum of balances != total supply");
    }
}
