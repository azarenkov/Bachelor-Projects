// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { AggregatorV3Interface } from "../../src/interfaces/AggregatorV3Interface.sol";
import { PriceOracle } from "../../src/oracle/PriceOracle.sol";

/// @notice Fork tests against real Ethereum mainnet state. Skipped automatically when
///         MAINNET_RPC_URL is not set in the environment.
interface IUniV2Router {
    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory);
}

contract MainnetForkTest is Test {
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address internal constant CHAINLINK_ETH_USD = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    address internal constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    // A funded USDC whale on mainnet — used to obtain real USDC for transfer tests.
    address internal constant USDC_WHALE = 0x55FE002aefF02F77364de339a1292923A15844B8;

    uint256 internal forkId;

    function setUp() public {
        string memory rpc = vm.envOr("MAINNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
            return;
        }
        // Note: we forkSelect at the latest block on the user's RPC so the suite works
        //       against both archive and pruned/light nodes. Reproducibility comes from
        //       pinning via the FORK_BLOCK env var if the user wants it.
        uint256 pinned = vm.envOr("FORK_BLOCK", uint256(0));
        forkId = pinned == 0 ? vm.createSelectFork(rpc) : vm.createSelectFork(rpc, pinned);
    }

    function test_fork_chainlinkEthUsd_priceFresh() public view {
        (, int256 answer,, uint256 updatedAt,) = AggregatorV3Interface(CHAINLINK_ETH_USD).latestRoundData();
        assertGt(answer, 0, "non-positive answer from chainlink");
        // Updated within heartbeat window on the pinned block.
        assertLt(block.timestamp - updatedAt, 24 hours, "stale Chainlink answer");
    }

    function test_fork_priceOracle_acceptsRealFeed() public {
        PriceOracle oracle = new PriceOracle(address(this));
        oracle.registerFeed(WETH, CHAINLINK_ETH_USD, 24 hours);
        (uint256 price, uint8 decimals) = oracle.getPrice(WETH);
        assertGt(price, 1_000e8, "ETH < $1000 on pinned block?");
        assertEq(decimals, 8);
    }

    function test_fork_uniV2Router_quotesEthUsdc() public view {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = USDC;
        uint256[] memory amounts = IUniV2Router(UNISWAP_V2_ROUTER).getAmountsOut(1 ether, path);
        // 1 ETH should always quote to thousands of USDC, no matter the era.
        assertGt(amounts[1], 1_000 * 10 ** 6, "ETH -> USDC quote unreasonably low");
    }

    function test_fork_usdc_transferFromWhale() public {
        address recipient = address(0xC0FFEE);
        uint256 before = IERC20(USDC).balanceOf(recipient);
        vm.prank(USDC_WHALE);
        IERC20(USDC).transfer(recipient, 1_000e6);
        uint256 afterBal = IERC20(USDC).balanceOf(recipient);
        assertEq(afterBal - before, 1_000e6, "USDC transfer did not credit recipient");
    }
}
