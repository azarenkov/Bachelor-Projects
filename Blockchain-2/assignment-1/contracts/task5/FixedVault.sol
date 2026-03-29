// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FixedVault
/// @notice Reentrancy-safe vault using Checks-Effects-Interactions + ReentrancyGuard
contract FixedVault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /// @notice Deposit ETH
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw all ETH — protected by CEI pattern and ReentrancyGuard
    function withdraw() external nonReentrant {
        // CHECKS
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        // EFFECTS — zero balance BEFORE the external call
        balances[msg.sender] = 0;

        // INTERACTIONS — now safe to send ETH
        emit Withdrawn(msg.sender, amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
