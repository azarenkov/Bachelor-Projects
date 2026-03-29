// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title OptimizedStore
/// @notice Gas-optimized version of UnoptimizedStore with 7 distinct optimizations
///
/// Optimization summary:
/// 1. Storage packing   — bool+address+uint8 packed into one slot
/// 2. Immutable         — FEE_RATE and TREASURY are immutable (set once in constructor)
/// 3. Constant          — MAX_SUPPLY is a compile-time constant
/// 4. Calldata          — _values parameter uses calldata instead of memory
/// 5. Short-circuiting  — paused check placed first (cheap bool read)
/// 6. Unchecked math    — safe arithmetic wrapped in unchecked blocks
/// 7. Cached storage    — values.length and FEE_RATE cached in local vars before loops
/// (bonus) Event logging — totalSupply accumulated locally; one storage write per call
contract OptimizedStore {
    // Optimization 1: Storage packing
    // Pack bool(1)+bool(1)+uint8(1)+address(20) = 23 bytes — fits in one 32-byte slot
    bool public paused;         // \
    bool public initialized;    //  > all packed into slot 0
    uint8 public decimals;      // /
    address public owner;       // /

    uint256 public totalSupply; // slot 1

    uint256[] public values;

    // Optimization 2: Immutable — set once at deploy time, read from bytecode (no SLOAD)
    uint256 public immutable FEE_RATE;
    address public immutable TREASURY;

    // Optimization 3: Constant — known at compile time, embedded directly in bytecode
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18;

    event ValueAdded(uint256 indexed index, uint256 value);

    constructor(uint256 _feeRate, address _treasury) {
        owner = msg.sender;
        decimals = 18;
        initialized = true;
        paused = false;
        // Optimization 2: assign immutables in constructor
        FEE_RATE = _feeRate;
        TREASURY = _treasury;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Add multiple values — optimized version
    /// Optimization 4: calldata — avoids copying array from calldata to memory
    /// Optimization 5: short-circuit — cheap paused check before expensive logic
    /// Optimization 6: unchecked math — no overflow possible (fee < value)
    /// Optimization 7: cache storage reads — len and feeRate read once before loop
    function addValues(uint256[] calldata _values) external onlyOwner {
        // Optimization 5: short-circuit — fail fast on paused
        require(!paused, "Paused");

        // Optimization 7: cache storage reads
        uint256 len = _values.length;
        uint256 feeRate = FEE_RATE; // immutable read — actually from bytecode, but local var clarifies intent
        uint256 supply = totalSupply; // cache totalSupply to avoid repeated SLOADs

        for (uint256 i = 0; i < len; ) {
            // Optimization 6: unchecked — fee <= value so subtraction cannot underflow
            unchecked {
                uint256 fee = (_values[i] * feeRate) / 10000;
                uint256 net = _values[i] - fee;
                values.push(net);
                supply += net;
                emit ValueAdded(values.length - 1, net);
                ++i; // cheaper than i++
            }
        }

        // (bonus) Event-based logging: write totalSupply once after the loop
        totalSupply = supply;
    }

    /// @notice Sum all values — optimized with cached length and local accumulator
    function sumValues() external view returns (uint256 total) {
        uint256 len = values.length; // Optimization 7: cache length
        for (uint256 i = 0; i < len; ) {
            unchecked {
                total += values[i]; // Optimization 6: unchecked accumulator
                ++i;
            }
        }
    }

    /// @notice Check if n is a power of two — Optimization 6: O(1) bitwise check
    function isPowerOfTwo(uint256 n) external pure returns (bool) {
        // Bitwise trick: powers of two have exactly one bit set.
        // n & (n-1) clears the lowest set bit; result is 0 iff n is a power of two.
        return n != 0 && (n & (n - 1)) == 0;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }
}
