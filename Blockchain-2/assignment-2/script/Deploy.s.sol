// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";
import "../src/AMM.sol";
import "../src/LendingPool.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // ── Tokens ──────────────────────────────────────────────────────────
        MockERC20 tokenA = new MockERC20("Token A", "TKA", 18);
        MockERC20 tokenB = new MockERC20("Token B", "TKB", 18);
        MockERC20 collateral = new MockERC20("Collateral", "COL", 18);
        MockERC20 borrowAsset = new MockERC20("BorrowAsset", "BOR", 18);

        // Mint initial supply to deployer
        tokenA.mint(deployer, 1_000_000 ether);
        tokenB.mint(deployer, 4_000_000 ether);
        collateral.mint(deployer, 1_000_000 ether);
        borrowAsset.mint(deployer, 1_000_000 ether);

        // ── AMM ─────────────────────────────────────────────────────────────
        AMM amm = new AMM(address(tokenA), address(tokenB));

        // Seed initial liquidity
        tokenA.approve(address(amm), 100_000 ether);
        tokenB.approve(address(amm), 400_000 ether);
        amm.addLiquidity(100_000 ether, 400_000 ether, 0, 0);

        // ── LendingPool ─────────────────────────────────────────────────────
        LendingPool lendingPool = new LendingPool(address(collateral), address(borrowAsset));
        borrowAsset.transfer(address(lendingPool), 500_000 ether);

        vm.stopBroadcast();

        console.log("TokenA:      ", address(tokenA));
        console.log("TokenB:      ", address(tokenB));
        console.log("AMM:         ", address(amm));
        console.log("Collateral:  ", address(collateral));
        console.log("BorrowAsset: ", address(borrowAsset));
        console.log("LendingPool: ", address(lendingPool));
    }
}
