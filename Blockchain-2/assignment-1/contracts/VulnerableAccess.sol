// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VulnerableAccess
 * @dev Intentionally vulnerable contract with access control issues
 * VULNERABILITY: Critical functions lack access control modifiers
 */
contract VulnerableAccess {
    address public owner;
    uint256 public funds;
    mapping(address => bool) public authorizedUsers;

    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // VULNERABILITY: Anyone can call this and become owner!
    function setOwner(address _newOwner) external {
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnerChanged(oldOwner, _newOwner);
    }

    // VULNERABILITY: Anyone can withdraw all funds!
    function withdraw() external {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    // VULNERABILITY: Anyone can add authorized users
    function addAuthorizedUser(address user) external {
        authorizedUsers[user] = true;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send ether");
        funds += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
