// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VulnerableAccess
/// @notice Access control misconfiguration — setOwner and withdraw are unprotected
/// @dev DO NOT USE IN PRODUCTION
contract VulnerableAccess {
    address public owner;
    mapping(address => uint256) public balances;

    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);
    event Deposited(address indexed from, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /// @notice BUG: Anyone can call setOwner and take over the contract
    function setOwner(address _newOwner) external {
        // Missing: require(msg.sender == owner, "Not owner");
        emit OwnerChanged(owner, _newOwner);
        owner = _newOwner;
    }

    /// @notice Deposit ETH
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice BUG: Anyone can drain the contract — no access check
    function withdraw(address payable _to) external {
        // Missing: require(msg.sender == owner, "Not owner");
        uint256 amount = address(this).balance;
        require(amount > 0, "Empty vault");
        emit Withdrawn(_to, amount);
        (bool ok, ) = _to.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}
