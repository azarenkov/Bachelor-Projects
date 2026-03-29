// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChildContract
 * @dev Basic child contract deployed by Factory
 */
contract ChildContract {
    address public owner;
    string public name;
    uint256 public balance;

    event BalanceUpdated(uint256 newBalance);
    event NameUpdated(string newName);

    constructor(address _owner, string memory _name) {
        owner = _owner;
        name = _name;
        balance = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function updateBalance(uint256 _newBalance) external onlyOwner {
        balance = _newBalance;
        emit BalanceUpdated(_newBalance);
    }

    function updateName(string memory _newName) external onlyOwner {
        name = _newName;
        emit NameUpdated(_newName);
    }

    function getDetails() external view returns (address, string memory, uint256) {
        return (owner, name, balance);
    }

    receive() external payable {
        balance += msg.value;
        emit BalanceUpdated(balance);
    }
}
