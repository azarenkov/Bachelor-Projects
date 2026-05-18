// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPriceOracle {
    error StalePrice(uint256 updatedAt, uint256 stalenessThreshold);
    error InvalidPrice(int256 answer);
    error FeedNotSet(address asset);

    event FeedRegistered(address indexed asset, address indexed feed, uint256 stalenessThreshold);
    event StalenessThresholdUpdated(address indexed asset, uint256 oldThreshold, uint256 newThreshold);

    function getPrice(address asset) external view returns (uint256 price, uint8 decimals);
}
