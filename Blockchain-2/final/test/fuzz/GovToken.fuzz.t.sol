// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { GovToken } from "../../src/GovToken.sol";

contract GovTokenFuzzTest is Test {
    GovToken internal token;
    address internal admin = address(0xA11CE);
    uint256 internal constant CAP = 1_000_000 ether;

    function setUp() public {
        token = new GovToken("Gov", "GOV", CAP, admin);
    }

    function testFuzz_delegation_movesVotes(address holder, uint96 amount) public {
        vm.assume(holder != address(0));
        vm.assume(amount > 0 && amount <= CAP);
        vm.prank(admin);
        token.mint(holder, amount);
        vm.prank(holder);
        token.delegate(holder);
        assertEq(token.getVotes(holder), amount);
    }

    function testFuzz_mint_respectsCap(uint96 amount) public {
        vm.assume(amount > 0);
        if (amount > CAP) {
            vm.prank(admin);
            vm.expectRevert();
            token.mint(admin, amount);
        } else {
            vm.prank(admin);
            token.mint(admin, amount);
            assertEq(token.totalSupply(), amount);
        }
    }
}
