// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { YulMath } from "../../src/utils/YulMath.sol";

contract YulMathHarness {
    function yul(uint256 x, uint256 y, uint256 d) external pure returns (uint256) {
        return YulMath.mulDivYul(x, y, d);
    }

    function sol(uint256 x, uint256 y, uint256 d) external pure returns (uint256) {
        return YulMath.mulDivSolidity(x, y, d);
    }

    function sqr(uint256 x) external pure returns (uint256) {
        return YulMath.sqrt(x);
    }
}

contract YulMathTest is Test {
    YulMathHarness internal h;

    function setUp() public {
        h = new YulMathHarness();
    }

    function test_mulDiv_basicEquivalence() public view {
        assertEq(h.yul(10, 20, 5), 40);
        assertEq(h.sol(10, 20, 5), 40);
    }

    function test_mulDiv_yul_handlesFullPrecision() public view {
        // 2^200 * 2 / 2 should be 2^200 — overflow in 256-bit Solidity, OK in Yul.
        uint256 big = uint256(1) << 200;
        uint256 res = h.yul(big, 2, 2);
        assertEq(res, big);
    }

    function test_mulDiv_yul_zeroDenominator_reverts() public {
        vm.expectRevert(YulMath.DivisionByZero.selector);
        h.yul(1, 1, 0);
    }

    function test_mulDiv_solidity_overflow_reverts() public {
        uint256 big = type(uint256).max;
        vm.expectRevert(YulMath.MulDivOverflow.selector);
        h.sol(big, big, 1);
    }

    function test_sqrt_perfectSquares() public view {
        assertEq(h.sqr(0), 0);
        assertEq(h.sqr(1), 1);
        assertEq(h.sqr(4), 2);
        assertEq(h.sqr(1_000_000), 1_000);
        assertEq(h.sqr(uint256(1) << 200), uint256(1) << 100);
    }

    function test_sqrt_floors() public view {
        assertEq(h.sqr(2), 1);
        assertEq(h.sqr(99), 9);
    }
}
