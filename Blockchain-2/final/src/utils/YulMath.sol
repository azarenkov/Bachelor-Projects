// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Two implementations of the same primitive (`mulDiv`) so we can benchmark gas/correctness
///         of inline-assembly (Yul) vs a pure-Solidity reference. Used both by the AMM and the Vault.
/// @dev Yul variant is loop-free 512-bit mulDiv ported from Remco Bloemen's full-precision algorithm.
///      The Solidity reference uses unchecked 256-bit math and is correct only when the product fits.
library YulMath {
    error MulDivOverflow();
    error DivisionByZero();

    /// @notice Full-precision 512-bit-by-256-bit mulDiv: floor((x * y) / denominator).
    function mulDivYul(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        // Adapted from Remco Bloemen's `mulDiv` (Uniswap V3 FullMath, MIT licensed).
        assembly ("memory-safe") {
            if iszero(denominator) {
                mstore(0x00, 0x23d359a3) // DivisionByZero()
                revert(0x1c, 0x04)
            }

            let mm := mulmod(x, y, not(0))
            let prod0 := mul(x, y)
            let prod1 := sub(sub(mm, prod0), lt(mm, prod0))

            switch prod1
            case 0 { result := div(prod0, denominator) }
            default {
                if iszero(gt(denominator, prod1)) {
                    mstore(0x00, 0x88bb98f4) // MulDivOverflow()
                    revert(0x1c, 0x04)
                }
                let remainder := mulmod(x, y, denominator)
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
                let twos := and(sub(0, denominator), denominator)
                denominator := div(denominator, twos)
                prod0 := div(prod0, twos)
                twos := add(div(sub(0, twos), twos), 1)
                prod0 := or(prod0, mul(prod1, twos))
                let inv := xor(mul(3, denominator), 2)
                inv := mul(inv, sub(2, mul(denominator, inv)))
                inv := mul(inv, sub(2, mul(denominator, inv)))
                inv := mul(inv, sub(2, mul(denominator, inv)))
                inv := mul(inv, sub(2, mul(denominator, inv)))
                inv := mul(inv, sub(2, mul(denominator, inv)))
                inv := mul(inv, sub(2, mul(denominator, inv)))
                result := mul(prod0, inv)
            }
        }
    }

    /// @notice Solidity reference for benchmarking. Reverts on 256-bit overflow.
    function mulDivSolidity(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256) {
        if (denominator == 0) revert DivisionByZero();
        unchecked {
            uint256 prod = x * y;
            // Trip overflow if x and y are both non-zero and prod / x != y.
            if (x != 0 && prod / x != y) revert MulDivOverflow();
            return prod / denominator;
        }
    }

    /// @notice Floor square root via Newton's method. Used by the AMM for initial LP shares.
    function sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x == 0) return 0;
        // Cheap seed: 2^(ceil(log2(x)/2)).
        uint256 xx = x;
        uint256 r = 1;
        if (xx >= 0x100000000000000000000000000000000) { xx >>= 128; r <<= 64; }
        if (xx >= 0x10000000000000000) { xx >>= 64; r <<= 32; }
        if (xx >= 0x100000000) { xx >>= 32; r <<= 16; }
        if (xx >= 0x10000) { xx >>= 16; r <<= 8; }
        if (xx >= 0x100) { xx >>= 8; r <<= 4; }
        if (xx >= 0x10) { xx >>= 4; r <<= 2; }
        if (xx >= 0x4) { r <<= 1; }
        z = r;
        // 7 Newton iterations are enough for 256-bit precision.
        unchecked {
            z = (x / z + z) >> 1;
            z = (x / z + z) >> 1;
            z = (x / z + z) >> 1;
            z = (x / z + z) >> 1;
            z = (x / z + z) >> 1;
            z = (x / z + z) >> 1;
            z = (x / z + z) >> 1;
            uint256 zRoundDown = x / z;
            if (zRoundDown < z) z = zRoundDown;
        }
    }
}
