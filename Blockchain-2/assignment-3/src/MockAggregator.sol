// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IAggregatorV3} from "./IAggregatorV3.sol";

/// @notice Mock Chainlink-style aggregator for unit tests.
contract MockAggregator is IAggregatorV3 {
    uint8 public override decimals;
    string public override description;
    uint256 public override version = 4;

    int256 internal _answer;
    uint256 internal _updatedAt;
    uint80 internal _roundId;

    constructor(uint8 _decimals, int256 initialAnswer, string memory _description) {
        decimals = _decimals;
        description = _description;
        _setAnswer(initialAnswer);
    }

    function _setAnswer(int256 newAnswer) internal {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
        unchecked {
            _roundId += 1;
        }
    }

    function setAnswer(int256 newAnswer) external {
        _setAnswer(newAnswer);
    }

    function setStaleAnswer(int256 newAnswer, uint256 updatedAt) external {
        _answer = newAnswer;
        _updatedAt = updatedAt;
        unchecked {
            _roundId += 1;
        }
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (_roundId, _answer, _updatedAt, _updatedAt, _roundId);
    }
}
