// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

import { YulMath } from "../utils/YulMath.sol";

/// @notice Constant-product AMM (x·y=k) with 0.3% swap fee and LP shares.
/// @dev    Built from scratch (no Uniswap fork). Pausable circuit-breaker is held by the Timelock.
///         All swaps follow Checks-Effects-Interactions; ReentrancyGuard backs that up for transfers.
contract SimpleAMM is ERC20, ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev 0.3% pool fee, expressed as 997/1000 numerator/denominator.
    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1_000;

    /// @dev Minimum initial liquidity burned to the zero address — protects against share-inflation attacks
    ///      on first deposit, lifted from Uniswap V2.
    uint256 public constant MINIMUM_LIQUIDITY = 1_000;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint112 private _reserve0;
    uint112 private _reserve1;
    uint32 private _blockTimestampLast;

    event LiquidityAdded(
        address indexed provider, uint256 amount0, uint256 amount1, uint256 sharesMinted
    );
    event LiquidityRemoved(
        address indexed provider, uint256 amount0, uint256 amount1, uint256 sharesBurned
    );
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    error IdenticalTokens();
    error ZeroAddress();
    error InsufficientLiquidityMinted();
    error InsufficientLiquidityBurned();
    error InsufficientInputAmount();
    error InsufficientOutputAmount();
    error InsufficientLiquidity();
    error SlippageExceeded(uint256 expected, uint256 actual);
    error UnknownToken(address token);
    error ReserveOverflow();

    constructor(address token0_, address token1_, address admin) ERC20("Protocol AMM LP", "PAMM-LP") {
        if (token0_ == token1_) revert IdenticalTokens();
        if (token0_ == address(0) || token1_ == address(0)) revert ZeroAddress();
        // Sort so token0 < token1 — gives the pair a deterministic ordering for indexers.
        if (token0_ < token1_) {
            token0 = IERC20(token0_);
            token1 = IERC20(token1_);
        } else {
            token0 = IERC20(token1_);
            token1 = IERC20(token0_);
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) {
        return (_reserve0, _reserve1, _blockTimestampLast);
    }

    function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 amount0, uint256 amount1, uint256 shares)
    {
        (uint112 r0, uint112 r1,) = getReserves();
        // slither-disable-next-line incorrect-equality — initial bootstrap is exact zero, not a price.
        if (r0 == 0 && r1 == 0) {
            (amount0, amount1) = (amount0Desired, amount1Desired);
        } else {
            uint256 amount1Optimal = YulMath.mulDivSolidity(amount0Desired, r1, r0);
            if (amount1Optimal <= amount1Desired) {
                if (amount1Optimal < amount1Min) revert SlippageExceeded(amount1Min, amount1Optimal);
                (amount0, amount1) = (amount0Desired, amount1Optimal);
            } else {
                uint256 amount0Optimal = YulMath.mulDivSolidity(amount1Desired, r0, r1);
                if (amount0Optimal > amount0Desired) revert InsufficientLiquidity();
                if (amount0Optimal < amount0Min) revert SlippageExceeded(amount0Min, amount0Optimal);
                (amount0, amount1) = (amount0Optimal, amount1Desired);
            }
        }

        // -- effects (mint LP shares) --
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            shares = YulMath.sqrt(amount0 * amount1);
            if (shares <= MINIMUM_LIQUIDITY) revert InsufficientLiquidityMinted();
            shares -= MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            uint256 share0 = YulMath.mulDivSolidity(amount0, _totalSupply, r0);
            uint256 share1 = YulMath.mulDivSolidity(amount1, _totalSupply, r1);
            shares = share0 < share1 ? share0 : share1;
        }
        if (shares == 0) revert InsufficientLiquidityMinted();
        _mint(msg.sender, shares);

        // -- interactions --
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
        _update(r0 + amount0, r1 + amount1);

        emit LiquidityAdded(msg.sender, amount0, amount1, shares);
    }

    function removeLiquidity(uint256 shares, uint256 amount0Min, uint256 amount1Min, address to)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        if (shares == 0) revert InsufficientLiquidityBurned();
        if (to == address(0)) revert ZeroAddress();
        uint256 _totalSupply = totalSupply();
        (uint112 r0, uint112 r1,) = getReserves();

        amount0 = YulMath.mulDivSolidity(shares, r0, _totalSupply);
        amount1 = YulMath.mulDivSolidity(shares, r1, _totalSupply);
        // slither-disable-next-line incorrect-equality — rounding-down result of mulDiv can legitimately be zero.
        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityBurned();
        if (amount0 < amount0Min) revert SlippageExceeded(amount0Min, amount0);
        if (amount1 < amount1Min) revert SlippageExceeded(amount1Min, amount1);

        _burn(msg.sender, shares);
        _update(r0 - amount0, r1 - amount1);

        token0.safeTransfer(to, amount0);
        token1.safeTransfer(to, amount1);

        emit LiquidityRemoved(msg.sender, amount0, amount1, shares);
    }

    function swapExactIn(address tokenIn, uint256 amountIn, uint256 amountOutMin, address to)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert InsufficientInputAmount();
        if (to == address(0)) revert ZeroAddress();
        (uint112 r0, uint112 r1,) = getReserves();
        // slither-disable-next-line incorrect-equality — pool unseeded ⇔ reserves are exactly zero.
        if (r0 == 0 || r1 == 0) revert InsufficientLiquidity();

        bool zeroForOne = false;
        if (tokenIn == address(token0)) {
            zeroForOne = true;
        } else if (tokenIn == address(token1)) {
            zeroForOne = false;
        } else {
            revert UnknownToken(tokenIn);
        }

        (uint112 reserveIn, uint112 reserveOut) = zeroForOne ? (r0, r1) : (r1, r0);
        amountOut = _getAmountOut(amountIn, reserveIn, reserveOut);
        if (amountOut < amountOutMin) revert SlippageExceeded(amountOutMin, amountOut);

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20 tokenOut = zeroForOne ? token1 : token0;
        tokenOut.safeTransfer(to, amountOut);

        if (zeroForOne) {
            _update(r0 + amountIn, r1 - amountOut);
        } else {
            _update(r0 - amountOut, r1 + amountIn);
        }

        emit Swap(msg.sender, tokenIn, amountIn, amountOut, to);
    }

    function _getAmountOut(uint256 amountIn, uint112 reserveIn, uint112 reserveOut)
        internal
        pure
        returns (uint256)
    {
        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        uint256 numerator = amountInWithFee * uint256(reserveOut);
        uint256 denominator = uint256(reserveIn) * FEE_DENOMINATOR + amountInWithFee;
        return numerator / denominator;
    }

    function quoteAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        (uint112 r0, uint112 r1,) = getReserves();
        if (tokenIn == address(token0)) return _getAmountOut(amountIn, r0, r1);
        if (tokenIn == address(token1)) return _getAmountOut(amountIn, r1, r0);
        revert UnknownToken(tokenIn);
    }

    function _update(uint256 balance0, uint256 balance1) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max) revert ReserveOverflow();
        // forge-lint: disable-next-line(unsafe-typecast)
        _reserve0 = uint112(balance0);
        // forge-lint: disable-next-line(unsafe-typecast)
        _reserve1 = uint112(balance1);
        _blockTimestampLast = uint32(block.timestamp);
        emit Sync(_reserve0, _reserve1);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
