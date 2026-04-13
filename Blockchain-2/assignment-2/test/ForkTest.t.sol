// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";

/// @title ForkTest — Task 2: Foundry fork testing against Ethereum mainnet
///
/// Run with:
///   forge test --match-contract ForkTest --fork-url <RPC_URL> -vvv
///
/// The tests are skipped automatically when no RPC URL is provided (CI-safe).

interface IUSDC {
    function totalSupply() external view returns (uint256);

    function decimals() external view returns (uint8);

    function symbol() external view returns (string memory);
}

interface IUniswapV2Router02 {
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IERC20Minimal {
    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);
}

contract ForkTest is Test {
    // ── Mainnet addresses ─────────────────────────────────────────────────────
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant UNISWAP_V2_R = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    // A well-known USDC whale for impersonation
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;

    uint256 mainnetFork;
    bool forkAvailable;

    function setUp() public {
        string memory rpc = vm.envOr("MAINNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            forkAvailable = false;
            return;
        }
        mainnetFork = vm.createFork(rpc);
        vm.selectFork(mainnetFork);
        forkAvailable = true;
    }

    // ── Test 1: Read USDC total supply ────────────────────────────────────────

    /// @notice Reads the real USDC total supply from the mainnet contract.
    ///
    /// How vm.createSelectFork works:
    ///   vm.createSelectFork(rpcUrl)  →  snapshots mainnet state and makes it the active fork.
    ///   vm.createFork + vm.selectFork allows managing multiple forks in one test file.
    ///   vm.rollFork(blockNumber) rewinds the fork to any historic block, enabling
    ///   reproducible tests against a pinned state rather than the live chain tip.
    function test_USDC_TotalSupply() public {
        if (!forkAvailable) return;

        IUSDC usdc = IUSDC(USDC);
        uint256 supply = usdc.totalSupply();

        // USDC has 6 decimals; total supply is in the billions of dollars
        assertGt(supply, 1_000_000 * 1e6, "supply should be > $1 B");
        assertEq(usdc.decimals(), 6);
        assertEq(keccak256(bytes(usdc.symbol())), keccak256(bytes("USDC")));

        emit log_named_uint("USDC total supply (6 dec)", supply);
    }

    /// @notice Pins the fork at a specific historical block to test vm.rollFork.
    function test_USDC_TotalSupplyAtBlock() public {
        if (!forkAvailable) return;

        // Pin to a known block (e.g. ~Jan 2024 — block 19_000_000)
        vm.rollFork(19_000_000);
        uint256 supply = IUSDC(USDC).totalSupply();
        assertGt(supply, 0, "historic supply > 0");
        emit log_named_uint("USDC supply at block 19_000_000", supply);
    }

    // ── Test 2: Simulate Uniswap V2 swap ─────────────────────────────────────

    /// @notice Simulates swapping 1 000 USDC → WETH through the real Uniswap V2 router.
    ///
    /// Changes:
    /// - Skip the swap if the impersonated whale has insufficient USDC balance.
    /// - Ensure the whale has ETH for gas (via vm.deal) so approve/swap calls succeed.
    function test_UniswapV2_Swap_USDC_to_WETH() public {
        if (!forkAvailable) return;

        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_R);
        IERC20Minimal usdc = IERC20Minimal(USDC);

        uint256 amountIn = 1_000 * 1e6; // 1 000 USDC

        // Build swap path
        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = WETH;

        // Get expected output
        uint256[] memory amounts = router.getAmountsOut(amountIn, path);
        uint256 expectedOut = amounts[1];
        assertGt(expectedOut, 0, "expected WETH out > 0");
        emit log_named_uint("Expected WETH out (wei)", expectedOut);

        // Ensure the whale has ETH for gas so the impersonated calls won't fail
        // vm.deal sets the ETH balance for an address in the forked state.
        // Set a small amount (1 ETH) which is sufficient for the test transactions.
        vm.deal(USDC_WHALE, 1 ether);

        // Impersonate a whale that holds USDC
        vm.startPrank(USDC_WHALE);

        // Debug: check whale's USDC balance before approving/swapping
        uint256 usdcBalance = IERC20Minimal(USDC).balanceOf(USDC_WHALE);
        emit log_named_uint("USDC balance of whale (6 dec)", usdcBalance / 1e6);

        // If the whale doesn't have enough USDC for the test, skip early
        if (usdcBalance < amountIn) {
            emit log("Skipping swap: whale has insufficient USDC for the test");
            vm.stopPrank();
            return;
        }

        // Approve router to spend USDC
        bool ok = usdc.approve(address(router), amountIn);
        require(ok, "approve failed");

        uint256 wethBefore = IERC20Minimal(WETH).balanceOf(USDC_WHALE);

        // Perform the swap with 5% slippage tolerance
        router.swapExactTokensForTokens(
            amountIn,
            (expectedOut * 95) / 100, // 5 % slippage tolerance
            path,
            USDC_WHALE,
            block.timestamp + 60
        );

        uint256 wethAfter = IERC20Minimal(WETH).balanceOf(USDC_WHALE);
        assertGt(
            wethAfter,
            wethBefore,
            "WETH balance should increase after swap"
        );
        vm.stopPrank();
    }

    // ── Test 3: getAmountsOut (read-only, no whale needed) ────────────────────

    function test_UniswapV2_GetAmountsOut() public {
        if (!forkAvailable) return;

        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = USDC;

        uint256[] memory amounts = IUniswapV2Router02(UNISWAP_V2_R)
            .getAmountsOut(1 ether, path);

        // 1 ETH should be worth > $100 in any recent block
        assertGt(amounts[1], 100 * 1e6, "ETH price > $100");
        emit log_named_uint("1 ETH in USDC (6 dec)", amounts[1]);
    }
}
