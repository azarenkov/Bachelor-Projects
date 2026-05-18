// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AggregatorV3Interface } from "../interfaces/AggregatorV3Interface.sol";

/// @dev Test-only mock aggregator. Lets tests drive answer/updatedAt to exercise staleness paths.
contract MockAggregatorV3 is AggregatorV3Interface {
    uint8 private _decimals;
    int256 private _answer;
    uint256 private _updatedAt;
    uint80 private _roundId;
    string private _description;

    constructor(uint8 decimals_, int256 answer_, string memory description_) {
        _decimals = decimals_;
        _answer = answer_;
        _updatedAt = block.timestamp;
        _roundId = 1;
        _description = description_;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function description() external view returns (string memory) {
        return _description;
    }

    function version() external pure returns (uint256) {
        return 4;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (_roundId, _answer, _updatedAt, _updatedAt, _roundId);
    }

    function setAnswer(int256 newAnswer) external {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
        _roundId += 1;
    }

    function setUpdatedAt(uint256 timestamp) external {
        _updatedAt = timestamp;
    }
}
