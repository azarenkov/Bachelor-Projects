// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LPToken.sol";

/// @title AMM — Constant-product (x*y=k) Automated Market Maker with 0.3 % fee
///
/// Design notes
/// ─────────────
/// • Fee: 0.3 % (997 / 1000 multiplier on input, matching Uniswap V2)
/// • First LP receives sqrt(amountA * amountB) LP shares (geometric mean)
/// • Subsequent LPs receive min(amountA/reserveA, amountB/reserveB) * totalSupply
/// • k can only increase over time (fees accumulate in reserves)
contract AMM is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── State ──────────────────────────────────────────────────────────────────

    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    LPToken public immutable lpToken;

    uint256 public reserveA;
    uint256 public reserveB;

    // ── Events ─────────────────────────────────────────────────────────────────

    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 lpMinted
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 lpBurned
    );

    event Swap(
        address indexed trader,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );

    // ── Errors ─────────────────────────────────────────────────────────────────

    error ZeroAmount();
    error InsufficientLiquidity();
    error InsufficientOutputAmount();
    error InvalidToken();
    error InsufficientLPBalance();

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "zero address");
        require(_tokenA != _tokenB, "identical tokens");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        lpToken = new LPToken();
    }

    // ── Liquidity ──────────────────────────────────────────────────────────────

    /// @notice Deposit both tokens and receive LP shares.
    /// @param amountADesired   Amount of tokenA the caller wants to deposit.
    /// @param amountBDesired   Amount of tokenB the caller wants to deposit.
    /// @param amountAMin       Slippage floor for tokenA (only relevant for subsequent deposits).
    /// @param amountBMin       Slippage floor for tokenB (only relevant for subsequent deposits).
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 lpMinted) {
        if (amountADesired == 0 || amountBDesired == 0) revert ZeroAmount();

        uint256 amountA;
        uint256 amountB;

        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        uint256 totalSupply = lpToken.totalSupply();

        if (totalSupply == 0) {
            // First deposit: accept desired amounts as-is, mint geometric mean
            amountA = amountADesired;
            amountB = amountBDesired;
            lpMinted = _sqrt(amountA * amountB);
            if (lpMinted == 0) revert ZeroAmount();
        } else {
            // Subsequent deposits: keep current price ratio
            uint256 amountBOptimal = (amountADesired * _reserveB) / _reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "AMM: insufficient B");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * _reserveA) / _reserveB;
                require(amountAOptimal >= amountAMin, "AMM: insufficient A");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
            // Mint proportional to the smaller ratio to prevent dilution
            lpMinted = _min(
                (amountA * totalSupply) / _reserveA,
                (amountB * totalSupply) / _reserveB
            );
            if (lpMinted == 0) revert ZeroAmount();
        }

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        reserveA = _reserveA + amountA;
        reserveB = _reserveB + amountB;

        lpToken.mint(msg.sender, lpMinted);

        emit LiquidityAdded(msg.sender, amountA, amountB, lpMinted);
    }

    /// @notice Burn LP tokens and receive back a proportional share of reserves.
    /// @param lpAmount     Amount of LP tokens to burn.
    /// @param amountAMin   Minimum tokenA the caller is willing to accept.
    /// @param amountBMin   Minimum tokenB the caller is willing to accept.
    function removeLiquidity(
        uint256 lpAmount,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        if (lpAmount == 0) revert ZeroAmount();
        uint256 totalSupply = lpToken.totalSupply();
        if (totalSupply == 0) revert InsufficientLiquidity();
        if (lpToken.balanceOf(msg.sender) < lpAmount) revert InsufficientLPBalance();

        amountA = (lpAmount * reserveA) / totalSupply;
        amountB = (lpAmount * reserveB) / totalSupply;

        if (amountA == 0 || amountB == 0) revert InsufficientLiquidity();
        if (amountA < amountAMin) revert InsufficientOutputAmount();
        if (amountB < amountBMin) revert InsufficientOutputAmount();

        lpToken.burn(msg.sender, lpAmount);
        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, lpAmount);
    }

    // ── Swap ───────────────────────────────────────────────────────────────────

    /// @notice Swap an exact amount of one token for the other.
    /// @param tokenIn      Address of the input token (must be tokenA or tokenB).
    /// @param amountIn     Exact amount to send.
    /// @param amountOutMin Slippage protection — revert if output is below this.
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant returns (uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();
        if (tokenIn != address(tokenA) && tokenIn != address(tokenB)) revert InvalidToken();

        bool aToB = (tokenIn == address(tokenA));
        (uint256 reserveIn, uint256 reserveOut) = aToB
            ? (reserveA, reserveB)
            : (reserveB, reserveA);

        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        if (amountOut < amountOutMin) revert InsufficientOutputAmount();

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        address tokenOut = aToB ? address(tokenB) : address(tokenA);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        // Update reserves
        if (aToB) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    // ── View ───────────────────────────────────────────────────────────────────

    /// @notice Constant-product output calculation with 0.3 % fee.
    /// @dev  amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice Returns current spot price of tokenA denominated in tokenB (18-decimal fixed point).
    function priceAInB() external view returns (uint256) {
        if (reserveA == 0) revert InsufficientLiquidity();
        return (reserveB * 1e18) / reserveA;
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
