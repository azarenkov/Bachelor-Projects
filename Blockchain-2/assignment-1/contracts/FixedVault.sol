// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FixedVault
 * @dev Secure vault implementation with reentrancy protection
 * FIXES APPLIED:
 * 1. Checks-Effects-Interactions pattern
 * 2. OpenZeppelin's ReentrancyGuard
 */
contract FixedVault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Must deposit some ether");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Secure withdrawal with reentrancy protection
     * FIX 1: nonReentrant modifier prevents reentrancy
     * FIX 2: Checks-Effects-Interactions pattern - state updated before external call
     */
    function withdraw() external nonReentrant {
        uint256 balance = balances[msg.sender];

        // CHECKS: Verify conditions
        require(balance > 0, "Insufficient balance");

        // EFFECTS: Update state BEFORE external call
        balances[msg.sender] = 0;

        // INTERACTIONS: External call happens last
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
