// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UnoptimizedContract
 * @dev Deliberately inefficient contract for gas optimization demonstration
 */
contract UnoptimizedContract {
    // Storage variables - not packed, wasting slots
    uint256 public largeNumber;
    uint8 public smallNumber1;
    uint256 public anotherLargeNumber;
    uint8 public smallNumber2;
    bool public flag;

    string public constant NAME = "Unoptimized";
    uint256 public deploymentTime; // Should be immutable

    address public owner;

    mapping(address => uint256) public balances;

    event ValueUpdated(uint256 indexed value);
    event BalanceChanged(address indexed user, uint256 newBalance);

    constructor() {
        owner = msg.sender;
        deploymentTime = block.timestamp;
        largeNumber = 0;
        smallNumber1 = 0;
        anotherLargeNumber = 0;
        smallNumber2 = 0;
        flag = false;
    }

    // Memory instead of calldata for external function
    function processArray(uint256[] memory data) external {
        for (uint256 i = 0; i < data.length; i++) {
            // Reading from storage in every loop iteration
            largeNumber = largeNumber + data[i];
        }
        emit ValueUpdated(largeNumber);
    }

    // No short-circuiting optimization
    function complexCheck(uint256 value) external view returns (bool) {
        // Expensive checks first
        if (value < 1000000 || value > 10 || msg.sender == owner) {
            return true;
        }
        return false;
    }

    // Arithmetic without unchecked (where safe)
    function incrementCounter(uint256 iterations) external {
        for (uint256 i = 0; i < iterations; i++) {
            smallNumber1 = smallNumber1 + 1;
        }
    }

    // Storage write when event would suffice
    function logValue(uint256 value) external {
        anotherLargeNumber = value; // Expensive storage write
    }

    // Reading storage multiple times
    function getOwnerBalance() external view returns (uint256) {
        if (owner == address(0)) {
            return 0;
        }
        return balances[owner];
    }

    function updateBalance(address user, uint256 amount) external {
        require(msg.sender == owner, "Not owner");
        balances[user] = balances[user] + amount;
        emit BalanceChanged(user, balances[user]);
    }
}
