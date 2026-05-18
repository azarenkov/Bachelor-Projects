// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IGovernor } from "@openzeppelin/contracts/governance/IGovernor.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import { GovToken } from "../../src/GovToken.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { ProtocolGovernor } from "../../src/governance/ProtocolGovernor.sol";
import { ProtocolTimelock } from "../../src/governance/ProtocolTimelock.sol";
import { SimpleAMM } from "../../src/amm/SimpleAMM.sol";
import { YieldVault } from "../../src/vault/YieldVault.sol";
import { YulMath } from "../../src/utils/YulMath.sol";

/// @notice Additional tests targeted at uncovered branches surfaced by `forge coverage`.
contract YulMathExtraTest is Test {
    function _sqr(uint256 x) internal pure returns (uint256) {
        return YulMath.sqrt(x);
    }

    function test_sqrt_smallValues_hitAllSeeds() public pure {
        // Hit every seeding branch.
        assertEq(_sqr(0x10), 4);
        assertEq(_sqr(0x100), 16);
        assertEq(_sqr(0x10000), 256);
        assertEq(_sqr(0x100000000), 65_536);
        assertEq(_sqr(0x10000000000000000), 4_294_967_296);
        assertEq(_sqr(0x100000000000000000000000000000000), 18_446_744_073_709_551_616);
    }

    function test_sqrt_3() public pure {
        assertEq(YulMath.sqrt(3), 1);
    }

    function test_mulDiv_yul_one() public pure {
        assertEq(YulMath.mulDivYul(1, 1, 1), 1);
    }
}

contract YieldVaultExtraTest is Test {
    YieldVault internal vault;
    MockERC20 internal asset;
    address internal admin = address(0xA11CE);
    address internal treasury = address(0xCAFE);
    address internal alice = address(0xA1);

    function setUp() public {
        asset = new MockERC20("X", "X", 18);
        vault = new YieldVault(IERC20(address(asset)), "v", "v", admin, treasury, 1_000);
        asset.mint(alice, 1_000_000 ether);
        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);
    }

    function test_accrueFees_belowOrEqualHWM_noOp() public {
        vm.prank(alice);
        vault.deposit(1 ether, alice);
        // Now HWM = totalAssets. Call accrueFees with no profit.
        vault.accrueFees();
        assertEq(vault.balanceOf(treasury), 0);
    }

    function test_mint_path() public {
        vm.prank(alice);
        // mint() takes shares, not assets. The user wants a specific share count.
        uint256 sharesToMint = 1e18; // 1 share
        uint256 assets = vault.previewMint(sharesToMint);
        asset.mint(alice, assets);
        vm.prank(alice);
        asset.approve(address(vault), assets);
        vm.prank(alice);
        vault.mint(sharesToMint, alice);
        assertEq(vault.balanceOf(alice), sharesToMint);
    }

    function test_withdraw_path() public {
        vm.startPrank(alice);
        vault.deposit(100 ether, alice);
        vault.withdraw(10 ether, alice, alice);
        vm.stopPrank();
        // After withdraw 10/100, vault should hold 90.
        assertEq(asset.balanceOf(address(vault)), 90 ether);
    }

    function test_setTreasury_emitsAndUpdates() public {
        address newTreasury = address(0xCAFE2);
        vm.prank(admin);
        vault.setTreasury(newTreasury);
        assertEq(vault.treasury(), newTreasury);
    }
}

contract SimpleAMMExtraTest is Test {
    SimpleAMM internal amm;
    MockERC20 internal a;
    MockERC20 internal b;
    address internal admin = address(0xA11CE);
    address internal alice = address(0xA1);

    function setUp() public {
        a = new MockERC20("A", "A", 18);
        b = new MockERC20("B", "B", 18);
        amm = new SimpleAMM(address(a), address(b), admin);
        a.mint(alice, 1_000 ether);
        b.mint(alice, 1_000 ether);
        vm.startPrank(alice);
        a.approve(address(amm), type(uint256).max);
        b.approve(address(amm), type(uint256).max);
        amm.addLiquidity(100 ether, 100 ether, 0, 0);
        vm.stopPrank();
    }

    function test_addLiquidity_optimal1_pathTaken() public {
        // amount1Desired > amount1Optimal — exercise the "use desired0, optimal1" branch.
        vm.prank(alice);
        (, uint256 used1,) = amm.addLiquidity(10 ether, 100 ether, 0, 0);
        // Optimal = 10 ether (since reserves are 1:1).
        assertEq(used1, 10 ether);
    }

    function test_addLiquidity_optimal0_pathTaken() public {
        // amount0Desired > amount0Optimal — exercise the "use desired1, optimal0" branch.
        vm.prank(alice);
        (uint256 used0,,) = amm.addLiquidity(100 ether, 10 ether, 0, 0);
        assertEq(used0, 10 ether);
    }

    function test_addLiquidity_subsequent_slippageOnAmount1_reverts() public {
        // Provide skewed amounts so amount1Optimal < amount1Min.
        vm.prank(alice);
        vm.expectRevert();
        amm.addLiquidity(10 ether, 100 ether, 0, 20 ether);
    }

    function test_swap_oneForZero_works() public {
        address t1 = address(amm.token1());
        vm.prank(alice);
        uint256 out = amm.swapExactIn(t1, 1 ether, 0, alice);
        assertGt(out, 0);
    }
}

contract GovernorExtraTest is Test {
    GovToken internal token;
    ProtocolTimelock internal timelock;
    ProtocolGovernor internal governor;
    address internal admin = address(0xA11CE);
    address internal voter1 = address(0xB0B);
    uint256 internal constant CAP = 1_000_000 ether;

    function setUp() public {
        token = new GovToken("Gov", "GOV", CAP, admin);
        address[] memory empty = new address[](0);
        timelock = new ProtocolTimelock(2 days, empty, empty, admin);
        governor = new ProtocolGovernor(IVotes(address(token)), timelock, CAP / 100);
        vm.startPrank(admin);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));
        token.mint(voter1, 50_000 ether);
        vm.stopPrank();
        vm.prank(voter1);
        token.delegate(voter1);
        vm.warp(block.timestamp + 1);
    }

    function test_voteAgainst_pathTaken() public {
        TestTargetX target = new TestTargetX();
        target.transferOwnership(address(timelock));
        address[] memory targets = new address[](1);
        targets[0] = address(target);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeCall(TestTargetX.tick, ());
        string memory desc = "test against";

        vm.prank(voter1);
        uint256 pid = governor.propose(targets, values, calldatas, desc);
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.prank(voter1);
        governor.castVote(pid, 0); // against
        vm.warp(block.timestamp + governor.votingPeriod() + 1);
        assertEq(uint8(governor.state(pid)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_proposalNeedsQueuing_true() public view {
        // Build a fake proposalId — proposalNeedsQueuing() is view and returns true for our setup.
        assertTrue(governor.proposalNeedsQueuing(0));
    }

    function test_clockMode_matchesToken() public view {
        assertEq(governor.CLOCK_MODE(), "mode=timestamp");
    }
}

contract TestTargetX {
    address public owner;
    uint256 public counter;
    constructor() { owner = msg.sender; }
    function transferOwnership(address newOwner) external { require(msg.sender == owner, "owner"); owner = newOwner; }
    function tick() external { require(msg.sender == owner, "owner"); counter++; }
}
