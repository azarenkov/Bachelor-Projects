// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AssemblyOps
/// @notice Demonstrates three inline Yul assembly operations:
///   1. Reading msg.sender via caller() opcode
///   2. Power-of-two check using bitwise and()
///   3. Direct storage slot read/write via sload/sstore
///
/// When is assembly justified?
///   Assembly bypasses Solidity's safety checks and abstractions, so it should
///   only be used when the gas savings are significant and the code is thoroughly
///   audited.  Typical use-cases: tight loops in cryptography, ERC-20 token
///   transfers in DeFi protocols (e.g., Uniswap), proxy delegation (delegatecall),
///   and reading packed storage.  Risks include: storage layout corruption, no
///   type safety, harder auditing, and breakage on Solidity version upgrades.
contract AssemblyOps {
    // Slot 0: stored value accessed directly via sload/sstore in assembly
    uint256 private _storedValue;

    // Solidity-level owner for comparison purposes
    address public owner;

    event CallerRead(address caller);
    event StorageWritten(uint256 slot, uint256 value);
    event StorageRead(uint256 slot, uint256 value);

    constructor() {
        owner = msg.sender;
        _storedValue = 42;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Assembly versions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Assembly 1: Read msg.sender using the caller() opcode
    /// @return callerAddr The address that called this function
    function getCallerAssembly() external returns (address callerAddr) {
        assembly {
            // caller() pushes the address of the direct caller onto the stack
            // mstore / mload not needed — we can assign directly to a named return var
            callerAddr := caller()
        }
        emit CallerRead(callerAddr);
    }

    /// @notice Assembly 2: Power-of-two check using bitwise and()
    /// @param n The number to test
    /// @return result 1 if n is a power of two, 0 otherwise
    function isPowerOfTwoAssembly(uint256 n) external pure returns (uint256 result) {
        assembly {
            // A power of two has exactly one bit set.
            // n & (n - 1) == 0  AND  n != 0
            // Yul uses iszero() to produce 1 for zero, 0 for non-zero.
            let nMinusOne := sub(n, 1)
            let andResult  := and(n, nMinusOne)
            // iszero(andResult) == 1 iff andResult == 0
            // We also require n != 0: iszero(iszero(n)) == 1 iff n != 0
            result := and(iszero(andResult), iszero(iszero(n)))
        }
    }

    /// @notice Assembly 3a: Write a value directly to storage slot 0 via sstore
    /// @param value Value to store
    function writeStorageAssembly(uint256 value) external {
        assembly {
            // sstore(slot, value) — writes value to storage slot
            sstore(0, value)
        }
        emit StorageWritten(0, value);
    }

    /// @notice Assembly 3b: Read storage slot 0 directly via sload
    /// @return value The raw value in slot 0
    function readStorageAssembly() external returns (uint256 value) {
        assembly {
            // sload(slot) — reads the value at storage slot
            value := sload(0)
        }
        emit StorageRead(0, value);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pure Solidity equivalents (for gas comparison)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Solidity 1: Read msg.sender the normal way
    function getCallerSolidity() external returns (address) {
        address callerAddr = msg.sender;
        emit CallerRead(callerAddr);
        return callerAddr;
    }

    /// @notice Solidity 2: Power-of-two check — Solidity bitwise ops
    function isPowerOfTwoSolidity(uint256 n) external pure returns (bool) {
        return n != 0 && (n & (n - 1)) == 0;
    }

    /// @notice Solidity 3: Write to _storedValue via normal storage access
    function writeStorageSolidity(uint256 value) external {
        _storedValue = value;
        emit StorageWritten(0, value);
    }

    /// @notice Solidity 3: Read _storedValue via normal storage access
    function readStorageSolidity() external returns (uint256) {
        uint256 value = _storedValue;
        emit StorageRead(0, value);
        return value;
    }
}
