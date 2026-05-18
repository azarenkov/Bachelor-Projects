// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { TreasuryV1 } from "../../src/treasury/TreasuryV1.sol";
import { TreasuryV2 } from "../../src/treasury/TreasuryV2.sol";

contract TreasuryTest is Test {
    TreasuryV1 internal implV1;
    TreasuryV2 internal implV2;
    TreasuryV1 internal proxy;
    MockERC20 internal token;
    address internal admin = address(0xA11CE);
    address internal upgrader = address(0xBEEF);
    address internal recipient = address(0xCAFE);

    function setUp() public {
        implV1 = new TreasuryV1();
        implV2 = new TreasuryV2();
        bytes memory init = abi.encodeCall(TreasuryV1.initialize, (admin, upgrader));
        ERC1967Proxy p = new ERC1967Proxy(address(implV1), init);
        proxy = TreasuryV1(address(p));
        token = new MockERC20("T", "T", 18);
        token.mint(address(proxy), 100 ether);
    }

    function test_initialVersion_isV1() public view {
        assertEq(proxy.version(), "1.0.0");
    }

    function test_payGrant_byAdmin_succeeds() public {
        vm.prank(admin);
        proxy.payGrant(address(token), recipient, 1 ether, bytes32("grant-1"));
        assertEq(token.balanceOf(recipient), 1 ether);
    }

    function test_payGrant_byOther_reverts() public {
        vm.expectRevert();
        proxy.payGrant(address(token), recipient, 1 ether, bytes32("x"));
    }

    function test_upgrade_byUpgrader_succeeds() public {
        vm.prank(upgrader);
        proxy.upgradeToAndCall(address(implV2), "");
        assertEq(TreasuryV2(address(proxy)).version(), "2.0.0");
    }

    function test_upgrade_byOther_reverts() public {
        vm.expectRevert();
        proxy.upgradeToAndCall(address(implV2), "");
    }

    function test_v2_setCapAndEnforce() public {
        vm.prank(upgrader);
        proxy.upgradeToAndCall(address(implV2), "");
        TreasuryV2 v2 = TreasuryV2(address(proxy));
        vm.prank(admin);
        v2.setPerTokenCap(address(token), 5 ether);
        vm.prank(admin);
        v2.payGrantWithCap(address(token), recipient, 5 ether, bytes32("ok"));
        assertEq(token.balanceOf(recipient), 5 ether);
        vm.prank(admin);
        vm.expectRevert();
        v2.payGrantWithCap(address(token), recipient, 6 ether, bytes32("over"));
    }
}
