// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {GameItems} from "../src/GameItems.sol";
import {Vault} from "../src/Vault.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploys GameItems (ERC-1155) + Vault (ERC-4626) + underlying MockERC20.
///         Designed for both L1 (Sepolia) and L2 (Arbitrum/Optimism/Base/zkSync Sepolia).
///
/// Usage:
///   forge script script/DeployL2.s.sol --rpc-url $L2_RPC --broadcast --verify
contract DeployL2 is Script {
    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        string memory baseURI = vm.envOr(
            "GAME_ITEMS_URI",
            string("ipfs://QmExampleGameItems/{id}.json")
        );

        vm.startBroadcast(deployerKey);

        // 1. Deploy GameItems (ERC-1155)
        GameItems game = new GameItems(baseURI);

        // 2. Deploy MockERC20 underlying + ERC-4626 Vault
        MockERC20 asset = new MockERC20("Yield Token", "YLD", 18);
        Vault vault = new Vault(IERC20(address(asset)), "Yield Vault", "yvYLD");

        // 3. Seed deployer with resources & assets, do at least 5 txs
        // tx1: mint fungible resources
        game.mint(deployer, game.GOLD(), 1_000, "");
        // tx2: mint NFT seed
        game.mint(deployer, game.IRON(), 1_000, "");
        // tx3: mint underlying
        asset.mint(deployer, 10_000 ether);
        // tx4: approve vault
        asset.approve(address(vault), type(uint256).max);
        // tx5: deposit into vault
        vault.deposit(1_000 ether, deployer);
        // tx6: harvest yield (simulated)
        asset.mint(deployer, 100 ether);
        vault.harvest(100 ether);

        vm.stopBroadcast();

        console.log("Network chainid:", block.chainid);
        console.log("GameItems:      ", address(game));
        console.log("Asset (YLD):    ", address(asset));
        console.log("Vault (yvYLD):  ", address(vault));
        console.log("Deployer:       ", deployer);
    }
}
