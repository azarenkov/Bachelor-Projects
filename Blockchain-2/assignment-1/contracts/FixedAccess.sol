// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FixedAccess
 * @dev Secure implementation with proper access control
 * FIXES APPLIED:
 * 1. OpenZeppelin's Ownable for owner-only functions
 * 2. OpenZeppelin's AccessControl for role-based permissions
 */
contract FixedAccess is Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    uint256 public funds;

    event FundsWithdrawn(address indexed to, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);
    event RoleGrantedToUser(address indexed user, bytes32 indexed role);

    constructor() Ownable(msg.sender) {
        // Grant deployer all roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(WITHDRAWER_ROLE, msg.sender);
    }

    /**
     * @dev Transfer ownership - protected by Ownable
     * FIX: Only current owner can transfer ownership
     */
    function transferOwnershipSecure(address newOwner) external onlyOwner {
        transferOwnership(newOwner);
    }

    /**
     * @dev Withdraw funds - protected by role-based access control
     * FIX: Only addresses with WITHDRAWER_ROLE can withdraw
     */
    function withdraw() external onlyRole(WITHDRAWER_ROLE) {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Add authorized user with specific role
     * FIX: Only admin can grant roles
     */
    function addAuthorizedUser(address user, bytes32 role) external onlyRole(ADMIN_ROLE) {
        grantRole(role, user);
        emit RoleGrantedToUser(user, role);
    }

    /**
     * @dev Deposit function - anyone can deposit (this is intentional)
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send ether");
        funds += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Emergency withdraw - only owner can use
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds");

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(owner(), amount);
    }
}
