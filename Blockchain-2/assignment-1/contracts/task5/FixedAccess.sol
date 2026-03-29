// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FixedAccess
/// @notice Access-controlled vault — only the owner can change ownership or withdraw
contract FixedAccess is Ownable {
    mapping(address => uint256) public balances;

    event Withdrawn(address indexed to, uint256 amount);
    event Deposited(address indexed from, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Deposit ETH
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw all ETH — onlyOwner modifier prevents unauthorized access
    function withdraw(address payable _to) external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Empty vault");
        emit Withdrawn(_to, amount);
        (bool ok, ) = _to.call{value: amount}("");
        require(ok, "Transfer failed");
    }

    /// @notice transferOwnership inherited from Ownable (protected by onlyOwner)
}
