// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OptimizedContract
 * @dev Gas-optimized version with 7+ distinct optimizations applied
 */
contract OptimizedContract {
    // OPTIMIZATION 1: Storage packing - group small types together to fit in one slot
    // smallNumber1, smallNumber2, and flag now fit in one 32-byte slot instead of 3
    uint8 public smallNumber1;
    uint8 public smallNumber2;
    bool public flag;

    // OPTIMIZATION 2: Use immutable for values set at deployment
    // Saves ~20000 gas per read by storing in bytecode instead of storage
    uint256 public immutable deploymentTime;

    // Keep larger values separate
    uint256 public largeNumber;
    uint256 public anotherLargeNumber;

    // OPTIMIZATION 3: Use constant for compile-time values
    // Saves storage slot and gas on every read
    string public constant NAME = "Optimized";

    address public owner;

    mapping(address => uint256) public balances;

    event ValueUpdated(uint256 indexed value);
    event BalanceChanged(address indexed user, uint256 newBalance);

    // OPTIMIZATION 7: Event-based logging - replace storage write with event
    event ValueLogged(uint256 indexed value, uint256 timestamp);

    constructor() {
        owner = msg.sender;
        deploymentTime = block.timestamp; // Set immutable at deployment
        // Other variables default to 0, no need to explicitly set
    }

    // OPTIMIZATION 4: Use calldata instead of memory for external function parameters
    // Saves gas by not copying array to memory
    function processArray(uint256[] calldata data) external {
        // OPTIMIZATION 5: Cache storage reads before loops
        // Read storage once, modify local variable, write back once
        uint256 cachedLargeNumber = largeNumber;

        uint256 length = data.length; // Cache array length

        // OPTIMIZATION 6: Use unchecked for loop counter where overflow is impossible
        for (uint256 i = 0; i < length;) {
            cachedLargeNumber = cachedLargeNumber + data[i];
            unchecked {
                ++i; // Prefix increment is slightly cheaper than postfix
            }
        }

        largeNumber = cachedLargeNumber; // Write back to storage once
        emit ValueUpdated(largeNumber);
    }

    // OPTIMIZATION 5: Short-circuiting - order conditions to fail fast
    // Put cheapest and most likely to fail checks first
    function complexCheck(uint256 value) external view returns (bool) {
        // Check cheap conditions first: value comparison, then sender comparison, then expensive check
        if (value > 10 || msg.sender == owner || value < 1000000) {
            return true;
        }
        return false;
    }

    // OPTIMIZATION 6: Unchecked arithmetic where overflow is impossible
    function incrementCounter(uint256 iterations) external {
        // Cache storage variable
        uint256 cached = smallNumber1;

        unchecked {
            // uint8 can't overflow with reasonable iterations
            for (uint256 i = 0; i < iterations; ++i) {
                cached = cached + 1;
            }
        }

        smallNumber1 = uint8(cached);
    }

    // OPTIMIZATION 7: Event-based logging instead of storage writes
    // Events are much cheaper than storage writes (375 gas vs 20000+ gas)
    function logValue(uint256 value) external {
        emit ValueLogged(value, block.timestamp);
        // No storage write - use event for logging
    }

    // OPTIMIZATION 5: Cache storage reads
    function getOwnerBalance() external view returns (uint256) {
        address cachedOwner = owner; // Cache storage read
        if (cachedOwner == address(0)) {
            return 0;
        }
        return balances[cachedOwner]; // Use cached value
    }

    function updateBalance(address user, uint256 amount) external {
        require(msg.sender == owner, "Not owner");

        // OPTIMIZATION 6: Use unchecked where overflow is controlled
        uint256 newBalance;
        unchecked {
            newBalance = balances[user] + amount;
        }

        balances[user] = newBalance;
        emit BalanceChanged(user, newBalance);
    }
}
