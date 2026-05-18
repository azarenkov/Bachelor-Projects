// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { GovToken } from "../../src/GovToken.sol";

contract GovTokenTest is Test {
    GovToken internal token;
    address internal admin = address(0xA11CE);
    address internal user = address(0xB0B);
    uint256 internal constant CAP = 1_000_000 ether;

    function setUp() public {
        token = new GovToken("Protocol Gov", "PGOV", CAP, admin);
    }

    function test_metadata() public view {
        assertEq(token.name(), "Protocol Gov");
        assertEq(token.symbol(), "PGOV");
        assertEq(token.decimals(), 18);
        assertEq(token.maxSupply(), CAP);
    }

    function test_mint_byAdmin_succeeds() public {
        vm.prank(admin);
        token.mint(user, 100 ether);
        assertEq(token.balanceOf(user), 100 ether);
    }

    function test_mint_byNonAdmin_reverts() public {
        vm.expectRevert();
        vm.prank(user);
        token.mint(user, 1 ether);
    }

    function test_mint_overCap_reverts() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(GovToken.MaxSupplyExceeded.selector, CAP + 1, CAP));
        token.mint(user, CAP + 1);
    }

    function test_clockMode_isTimestamp() public view {
        assertEq(token.CLOCK_MODE(), "mode=timestamp");
        assertEq(uint256(token.clock()), block.timestamp);
    }

    function test_delegate_movesVotingPower() public {
        vm.prank(admin);
        token.mint(user, 100 ether);
        assertEq(token.getVotes(user), 0); // not delegated yet
        vm.prank(user);
        token.delegate(user);
        assertEq(token.getVotes(user), 100 ether);
    }

    function test_permit_setsAllowance() public {
        uint256 ownerKey = 0xBEEF;
        address owner = vm.addr(ownerKey);
        vm.prank(admin);
        token.mint(owner, 1 ether);

        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                address(this),
                1 ether,
                token.nonces(owner),
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerKey, digest);

        token.permit(owner, address(this), 1 ether, deadline, v, r, s);
        assertEq(token.allowance(owner, address(this)), 1 ether);
    }

    function test_construction_zeroAdmin_reverts() public {
        vm.expectRevert("GovToken: zero admin");
        new GovToken("X", "X", 1, address(0));
    }

    function test_construction_zeroCap_reverts() public {
        vm.expectRevert("GovToken: zero cap");
        new GovToken("X", "X", 0, admin);
    }
}
