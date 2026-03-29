// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ChildContract
/// @notice A simple child contract deployed by the Factory
contract ChildContract {
    address public owner;
    string public name;
    uint256 public balance;

    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _owner, string memory _name) {
        owner = _owner;
        name = _name;
        balance = 0;
    }

    /// @notice Deposit ETH into this child contract
    function deposit() external payable {
        balance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw all ETH (owner only)
    function withdraw() external onlyOwner {
        uint256 amount = balance;
        balance = 0;
        emit Withdrawn(owner, amount);
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /// @notice Return contract ETH balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
