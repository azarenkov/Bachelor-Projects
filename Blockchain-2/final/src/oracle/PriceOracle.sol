// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AggregatorV3Interface } from "../interfaces/AggregatorV3Interface.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Adapter around Chainlink aggregators with per-asset staleness checks.
/// @dev Designed as the only oracle surface the rest of the protocol talks to, so feeds can be
///      swapped (e.g. for an L2 sequencer feed wrapper) without touching consumers.
contract PriceOracle is IPriceOracle, AccessControl {
    bytes32 public constant FEED_ADMIN_ROLE = keccak256("FEED_ADMIN_ROLE");

    struct Feed {
        AggregatorV3Interface aggregator;
        uint64 stalenessThreshold;
    }

    mapping(address asset => Feed) private _feeds;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FEED_ADMIN_ROLE, admin);
    }

    function registerFeed(address asset, address aggregator, uint64 stalenessThreshold)
        external
        onlyRole(FEED_ADMIN_ROLE)
    {
        require(asset != address(0) && aggregator != address(0), "PriceOracle: zero address");
        require(stalenessThreshold > 0, "PriceOracle: zero threshold");
        _feeds[asset] = Feed({ aggregator: AggregatorV3Interface(aggregator), stalenessThreshold: stalenessThreshold });
        emit FeedRegistered(asset, aggregator, stalenessThreshold);
    }

    function setStalenessThreshold(address asset, uint64 newThreshold) external onlyRole(FEED_ADMIN_ROLE) {
        Feed storage f = _feeds[asset];
        if (address(f.aggregator) == address(0)) revert FeedNotSet(asset);
        require(newThreshold > 0, "PriceOracle: zero threshold");
        uint64 old = f.stalenessThreshold;
        f.stalenessThreshold = newThreshold;
        emit StalenessThresholdUpdated(asset, old, newThreshold);
    }

    function getPrice(address asset) external view returns (uint256 price, uint8 decimals_) {
        Feed memory f = _feeds[asset];
        if (address(f.aggregator) == address(0)) revert FeedNotSet(asset);
        // slither-disable-next-line unused-return — roundId/startedAt/answeredInRound are not needed here.
        (, int256 answer,, uint256 updatedAt,) = f.aggregator.latestRoundData();
        if (answer <= 0) revert InvalidPrice(answer);
        if (block.timestamp - updatedAt > f.stalenessThreshold) {
            revert StalePrice(updatedAt, f.stalenessThreshold);
        }
        // forge-lint: disable-next-line(unsafe-typecast)
        return (uint256(answer), f.aggregator.decimals());
    }

    function feedInfo(address asset) external view returns (address aggregator, uint64 stalenessThreshold) {
        Feed memory f = _feeds[asset];
        return (address(f.aggregator), f.stalenessThreshold);
    }
}
