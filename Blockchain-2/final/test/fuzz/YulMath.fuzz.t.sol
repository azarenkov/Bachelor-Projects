// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { YulMath } from "../../src/utils/YulMath.sol";

contract YulMathFuzzTest is Test {
    function testFuzz_mulDiv_yul_matches_solidity_whenNoOverflow(uint128 x, uint128 y, uint128 d) public pure {
        vm.assume(d > 0);
        uint256 expected = (uint256(x) * uint256(y)) / uint256(d);
        uint256 actual = YulMath.mulDivYul(uint256(x), uint256(y), uint256(d));
        assertEq(actual, expected);
    }

    function testFuzz_sqrt_isFloor(uint128 x) public pure {
        uint256 s = YulMath.sqrt(x);
        // s*s <= x < (s+1)*(s+1)
        assertLe(s * s, uint256(x));
        if (s < type(uint128).max) {
            assertGt((s + 1) * (s + 1), uint256(x));
        }
    }
}
