// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssemblyContract
 * @dev Demonstrates inline assembly (Yul) for gas optimization
 */
contract AssemblyContract {
    uint256 public storedValue;

    event SenderLogged(address sender);
    event ValueStored(uint256 value);
    event PowerOfTwoCheck(uint256 value, bool isPowerOfTwo);

    /**
     * @dev Get msg.sender using assembly - reads caller() directly from EVM context
     * OPTIMIZATION: Avoids Solidity's overhead of loading msg.sender
     * Gas saved: ~3 gas per call
     */
    function getSenderWithAssembly() external returns (address sender) {
        assembly {
            sender := caller()
        }
        emit SenderLogged(sender);
    }

    /**
     * @dev Get msg.sender using standard Solidity for comparison
     */
    function getSenderWithSolidity() external returns (address) {
        address sender = msg.sender;
        emit SenderLogged(sender);
        return sender;
    }

    /**
     * @dev Check if a number is a power of 2 using assembly
     * Algorithm: A power of 2 has only one bit set, so n & (n-1) == 0
     * OPTIMIZATION: Direct bitwise operations in assembly are more efficient
     * Gas saved: ~50-100 gas depending on input
     */
    function isPowerOfTwoWithAssembly(uint256 n) external returns (bool result) {
        assembly {
            // A number is power of 2 if: n != 0 && (n & (n-1)) == 0
            // Example: 8 = 1000, 7 = 0111, 8 & 7 = 0000
            result := and(gt(n, 0), iszero(and(n, sub(n, 1))))
        }
        emit PowerOfTwoCheck(n, result);
    }

    /**
     * @dev Check if a number is a power of 2 using standard Solidity
     */
    function isPowerOfTwoWithSolidity(uint256 n) external returns (bool) {
        bool result = n > 0 && (n & (n - 1)) == 0;
        emit PowerOfTwoCheck(n, result);
        return result;
    }

    /**
     * @dev Direct storage access using assembly (sload and sstore)
     * OPTIMIZATION: Bypasses Solidity's safety checks for raw storage access
     * WARNING: This is dangerous and should only be used when you know the exact storage layout
     * Gas saved: ~5-10 gas per operation
     *
     * Storage layout:
     * Slot 0: storedValue (uint256)
     */
    function setValueWithAssembly(uint256 newValue) external {
        assembly {
            // sstore(slot, value) - write directly to storage slot 0
            sstore(0, newValue)
        }
        emit ValueStored(newValue);
    }

    /**
     * @dev Get value from storage using assembly
     */
    function getValueWithAssembly() external view returns (uint256 value) {
        assembly {
            // sload(slot) - read directly from storage slot 0
            value := sload(0)
        }
    }

    /**
     * @dev Standard Solidity storage operations for comparison
     */
    function setValueWithSolidity(uint256 newValue) external {
        storedValue = newValue;
        emit ValueStored(newValue);
    }

    function getValueWithSolidity() external view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Efficient addition with overflow check using assembly
     * Demonstrates how assembly can implement custom safety checks more efficiently
     */
    function addWithAssembly(uint256 a, uint256 b) external pure returns (uint256 result) {
        assembly {
            result := add(a, b)
            // Check for overflow: if result < a, overflow occurred
            if lt(result, a) {
                // Revert with custom error
                mstore(0x00, 0x08c379a000000000000000000000000000000000000000000000000000000000) // Error sig
                mstore(0x04, 0x0000000000000000000000000000000000000000000000000000000000000020) // Offset
                mstore(0x24, 0x0000000000000000000000000000000000000000000000000000000000000008) // Length
                mstore(0x44, 0x4f766572666c6f7700000000000000000000000000000000000000000000000) // "Overflow"
                revert(0x00, 0x64)
            }
        }
    }

    /**
     * @dev Efficient return data copy using assembly
     * Useful for proxy contracts and low-level calls
     */
    function returnDataWithAssembly(bytes calldata data) external pure returns (bytes memory) {
        assembly {
            // Allocate memory for return data
            let ptr := mload(0x40) // Get free memory pointer
            let size := data.length

            // Copy calldata to memory
            calldatacopy(ptr, data.offset, size)

            // Update free memory pointer
            mstore(0x40, add(ptr, size))

            // Return the data
            return(ptr, size)
        }
    }
}
