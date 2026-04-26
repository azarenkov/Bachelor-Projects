// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {PriceFeedConsumer} from "../src/PriceFeedConsumer.sol";
import {PriceDependentVault} from "../src/PriceDependentVault.sol";

/// @notice Deploys the Chainlink consumer + price-gated vault.
///
/// Required env: CHAINLINK_FEED (address of ETH/USD aggregator on the target chain)
/// Optional:     PRICE_THRESHOLD (int, default 2000e8), MAX_STALENESS (uint, default 3600)
///
/// Reference feed addresses (ETH/USD):
///   Sepolia:           0x694AA1769357215DE4FAC081bf1f309aDC325306
///   Arbitrum Sepolia:  0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165
///   Optimism Sepolia:  0x61Ec26aA57019C486B10502285c5A3D4A4750AD7
///   Base Sepolia:      0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
contract DeployOracle is Script {
    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address feed = vm.envAddress("CHAINLINK_FEED");
        int256 threshold = int256(vm.envOr("PRICE_THRESHOLD", uint256(2_000e8)));
        uint256 maxStaleness = vm.envOr("MAX_STALENESS", uint256(3600));

        vm.startBroadcast(deployerKey);
        PriceFeedConsumer consumer = new PriceFeedConsumer(feed, maxStaleness);
        PriceDependentVault vault = new PriceDependentVault(feed, maxStaleness, threshold);
        vm.stopBroadcast();

        console.log("Chainlink feed:       ", feed);
        console.log("PriceFeedConsumer:    ", address(consumer));
        console.log("PriceDependentVault:  ", address(vault));
        console.log("Threshold:            ", uint256(threshold));
        console.log("Max staleness (s):    ", maxStaleness);
    }
}
