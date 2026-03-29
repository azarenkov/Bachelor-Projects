// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VulnerableVault
/// @notice Vulnerable to reentrancy — balances updated AFTER external call
/// @dev DO NOT USE IN PRODUCTION
contract VulnerableVault {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /// @notice Deposit ETH
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw all ETH — VULNERABLE: external call before state update
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        // BUG: sends ETH before zeroing the balance.
        // An attacker contract can re-enter withdraw() from its receive() fallback
        // before balances[msg.sender] is set to 0, draining the vault repeatedly.
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // too late — reentrancy already happened
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
