// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IGovernor } from "@openzeppelin/contracts/governance/IGovernor.sol";
import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import { GovToken } from "../../src/GovToken.sol";
import { ProtocolGovernor } from "../../src/governance/ProtocolGovernor.sol";
import { ProtocolTimelock } from "../../src/governance/ProtocolTimelock.sol";

contract GovernanceTest is Test {
    GovToken internal token;
    ProtocolTimelock internal timelock;
    ProtocolGovernor internal governor;

    address internal admin = address(0xA11CE);
    address internal voter1 = address(0xB0B);
    address internal voter2 = address(0xCAFE);

    uint256 internal constant CAP = 1_000_000 ether;

    function setUp() public {
        token = new GovToken("Gov", "GOV", CAP, admin);

        address[] memory empty = new address[](0);
        // Proposers/executors initially empty; the Governor address will be granted proposer post-deploy.
        timelock = new ProtocolTimelock(2 days, empty, empty, admin);

        governor = new ProtocolGovernor(IVotes(address(token)), timelock, CAP / 100); // 1% threshold

        vm.startPrank(admin);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // anyone can execute
        // Mint and delegate enough voting power to clear quorum (4% = 40k tokens).
        token.mint(voter1, 50_000 ether);
        token.mint(voter2, 20_000 ether);
        vm.stopPrank();

        vm.prank(voter1);
        token.delegate(voter1);
        vm.prank(voter2);
        token.delegate(voter2);

        // Move past the snapshot block so getPastVotes works.
        vm.warp(block.timestamp + 1);
    }

    function test_governorParameters_matchSpec() public view {
        assertEq(governor.votingDelay(), 1 days);
        assertEq(governor.votingPeriod(), 1 weeks);
        assertEq(governor.proposalThreshold(), CAP / 100);
        // Quorum at the current timestamp must be 4% of total supply (70k * 0.04 = 2_800 ether).
        // We assert via the formula: quorumNumerator * totalSupply / quorumDenominator.
        assertEq(governor.quorum(block.timestamp - 1), token.totalSupply() * 4 / 100);
    }

    function test_proposeVoteQueueExecute_endToEnd() public {
        // Build a no-op proposal that calls `setText` on a test target.
        TestTarget target = new TestTarget();
        // Hand control of `target` to the timelock so only it can execute the call.
        target.transferOwnership(address(timelock));

        address[] memory targets = new address[](1);
        targets[0] = address(target);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeCall(TestTarget.setText, ("hello DAO"));
        string memory description = "set greeting";

        // Voter1 has >1% — can propose.
        vm.prank(voter1);
        uint256 pid = governor.propose(targets, values, calldatas, description);

        // Wait for voting to open, then vote.
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.prank(voter1);
        governor.castVote(pid, 1); // for
        vm.prank(voter2);
        governor.castVote(pid, 1);

        // Close voting.
        vm.warp(block.timestamp + governor.votingPeriod() + 1);
        assertEq(uint8(governor.state(pid)), uint8(IGovernor.ProposalState.Succeeded));

        // Queue → wait timelock delay → execute.
        bytes32 descHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descHash);
        vm.warp(block.timestamp + 2 days + 1);
        governor.execute(targets, values, calldatas, descHash);

        assertEq(target.text(), "hello DAO");
        assertEq(uint8(governor.state(pid)), uint8(IGovernor.ProposalState.Executed));
    }
}

/// @dev Owned target that only the Timelock should be able to flip.
contract TestTarget {
    address public owner;
    string public text;

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "owner");
        owner = newOwner;
    }

    function setText(string calldata newText) external {
        require(msg.sender == owner, "owner");
        text = newText;
    }
}
