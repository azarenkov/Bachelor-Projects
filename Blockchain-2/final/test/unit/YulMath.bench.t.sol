// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { YulMath } from "../../src/utils/YulMath.sol";

contract YulMathBenchHarness {
    function yul(uint256 x, uint256 y, uint256 d) external pure returns (uint256) {
        return YulMath.mulDivYul(x, y, d);
    }

    function sol(uint256 x, uint256 y, uint256 d) external pure returns (uint256) {
        return YulMath.mulDivSolidity(x, y, d);
    }
}

contract YulMathBenchTest is Test {
    YulMathBenchHarness internal h;

    function setUp() public {
        h = new YulMathBenchHarness();
    }

    function test_bench_mulDiv_yul() public view {
        h.yul(1_000_000 * 10 ** 18, 1_000_000 * 10 ** 18, 1_234_567);
    }

    function test_bench_mulDiv_solidity() public view {
        h.sol(1_000_000 * 10 ** 18, 1_000_000 * 10 ** 6, 1_234_567);
    }
}
