// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IAggregatorV3} from "./IAggregatorV3.sol";

/// @title PriceFeedConsumer — reads ETH/USD price from a Chainlink aggregator.
contract PriceFeedConsumer {
    IAggregatorV3 public immutable priceFeed;
    uint256 public immutable maxStaleness;

    error StalePrice(uint256 updatedAt, uint256 nowTs, uint256 maxAge);
    error InvalidPrice(int256 answer);

    constructor(address feed, uint256 maxStaleness_) {
        priceFeed = IAggregatorV3(feed);
        maxStaleness = maxStaleness_;
    }

    /// @notice Returns the latest price, scaled to feed decimals, after freshness checks.
    function getLatestPrice() public view returns (int256) {
        (, int256 answer,, uint256 updatedAt,) = priceFeed.latestRoundData();
        if (answer <= 0) revert InvalidPrice(answer);
        if (block.timestamp > updatedAt + maxStaleness) {
            revert StalePrice(updatedAt, block.timestamp, maxStaleness);
        }
        return answer;
    }

    function decimals() public view returns (uint8) {
        return priceFeed.decimals();
    }

    /// @notice Convert an ETH amount (in wei) to USD scaled to 1e18.
    function ethToUsd(uint256 ethWei) external view returns (uint256) {
        int256 price = getLatestPrice();
        uint8 d = decimals();
        // price has `d` decimals; ethWei has 18; result scaled to 1e18
        return (ethWei * uint256(price)) / (10 ** d);
    }
}
