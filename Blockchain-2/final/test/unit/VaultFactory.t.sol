// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { VaultFactory } from "../../src/factory/VaultFactory.sol";
import { YieldVault } from "../../src/vault/YieldVault.sol";

contract VaultFactoryTest is Test {
    VaultFactory internal factory;
    MockERC20 internal asset;
    address internal admin = address(0xA11CE);
    address internal treasury = address(0xCAFE);

    function setUp() public {
        factory = new VaultFactory(admin, treasury);
        asset = new MockERC20("X", "X", 18);
    }

    function test_deployVault_create() public {
        vm.prank(admin);
        address v = factory.deployVault(IERC20(address(asset)), "Vault X", "vX", 1_000);
        assertTrue(v != address(0));
        address[] memory list = factory.vaultsFor(address(asset));
        assertEq(list.length, 1);
        assertEq(list[0], v);
    }

    function test_deployVaultDeterministic_matchesPrediction() public {
        bytes32 salt = bytes32(uint256(42));
        address predicted = factory.predictVaultAddress(IERC20(address(asset)), "Vault X", "vX", 1_000, salt);
        vm.prank(admin);
        address deployed = factory.deployVaultDeterministic(IERC20(address(asset)), "Vault X", "vX", 1_000, salt);
        assertEq(deployed, predicted);
    }

    function test_deployVaultDeterministic_sameSaltTwice_reverts() public {
        bytes32 salt = bytes32(uint256(7));
        vm.startPrank(admin);
        factory.deployVaultDeterministic(IERC20(address(asset)), "V", "v", 1_000, salt);
        vm.expectRevert();
        factory.deployVaultDeterministic(IERC20(address(asset)), "V", "v", 1_000, salt);
        vm.stopPrank();
    }

    function test_deploy_unauthorized_reverts() public {
        vm.expectRevert();
        factory.deployVault(IERC20(address(asset)), "V", "v", 0);
    }
}
