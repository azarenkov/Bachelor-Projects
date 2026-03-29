// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title UnoptimizedStore
/// @notice Deliberately unoptimized contract for gas comparison purposes
contract UnoptimizedStore {
    // Storage variables NOT packed — each wastes a full 32-byte slot
    bool public paused;          // slot 0 (wastes 31 bytes)
    uint256 public totalSupply;  // slot 1
    address public owner;        // slot 2 (wastes 12 bytes)
    uint8 public decimals;       // slot 3 (wastes 31 bytes)
    uint256 public maxSupply;    // slot 4
    bool public initialized;     // slot 5 (wastes 31 bytes)

    uint256[] public values;

    // Not immutable/constant — re-read from storage on every call
    uint256 public FEE_RATE = 300;
    address public TREASURY = address(0xdead);

    event ValueAdded(uint256 index, uint256 value);

    constructor() {
        owner = msg.sender;
        maxSupply = 1_000_000 * 1e18;
        totalSupply = 0;
        decimals = 18;
        initialized = true;
        paused = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Add multiple values — unoptimized: memory param, no caching, checked math
    function addValues(uint256[] memory _values) external onlyOwner {
        // Reads values.length from storage on every iteration
        for (uint256 i = 0; i < _values.length; i++) {
            // Reads FEE_RATE from storage every iteration
            uint256 fee = (_values[i] * FEE_RATE) / 10000;
            values.push(_values[i] - fee);
            // Writes totalSupply to storage every iteration
            totalSupply += _values[i] - fee;
            emit ValueAdded(values.length - 1, _values[i] - fee);
        }
    }

    /// @notice Sum all values — unoptimized: reads length & elements from storage each time
    function sumValues() external view returns (uint256 total) {
        for (uint256 i = 0; i < values.length; i++) {
            total += values[i];
        }
    }

    /// @notice Check if amount is a power of two — unoptimized arithmetic
    function isPowerOfTwo(uint256 n) external pure returns (bool) {
        if (n == 0) return false;
        // Inefficient loop instead of bitwise check
        uint256 x = 1;
        while (x < n) {
            x *= 2;
        }
        return x == n;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }
}
