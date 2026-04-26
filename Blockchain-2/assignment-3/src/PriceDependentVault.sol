// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PriceFeedConsumer} from "./PriceFeedConsumer.sol";

/// @title PriceDependentVault — accepts ETH deposits, allows withdrawals only when
///        the ETH price (per Chainlink) is above a configured USD threshold.
/// @notice Threshold is expressed using the price feed's native decimals (8 for ETH/USD).
contract PriceDependentVault is PriceFeedConsumer {
    int256 public immutable priceThreshold;

    mapping(address => uint256) public deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    error InsufficientBalance(uint256 requested, uint256 available);
    error PriceBelowThreshold(int256 price, int256 threshold);
    error ZeroAmount();

    constructor(address feed, uint256 maxStaleness_, int256 priceThreshold_)
        PriceFeedConsumer(feed, maxStaleness_)
    {
        priceThreshold = priceThreshold_;
    }

    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        uint256 bal = deposits[msg.sender];
        if (amount > bal) revert InsufficientBalance(amount, bal);

        int256 price = getLatestPrice();
        if (price < priceThreshold) revert PriceBelowThreshold(price, priceThreshold);

        deposits[msg.sender] = bal - amount;
        emit Withdrawn(msg.sender, amount);

        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }

    /// @notice Returns the user's USD-denominated balance (scaled to 1e18).
    function usdValueOf(address user) external view returns (uint256) {
        int256 price = getLatestPrice();
        uint8 d = decimals();
        return (deposits[user] * uint256(price)) / (10 ** d);
    }
}
