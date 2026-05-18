// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice ERC-4626 vault with a performance fee skimmed to the treasury.
/// @dev    Inherits OpenZeppelin's ERC4626 (which already implements virtual-shares / virtual-assets
///         to neutralise the first-depositor inflation attack). Performance fee is charged on yield
///         only, not on principal, and is taken in vault shares so it does not need a transfer at harvest.
contract YieldVault is ERC4626, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ADMIN_ROLE = keccak256("FEE_ADMIN_ROLE");
    bytes32 public constant HARVEST_ROLE = keccak256("HARVEST_ROLE");

    uint256 public constant MAX_PERFORMANCE_FEE_BPS = 2_000; // 20% cap on performance fee
    uint256 public constant BPS = 10_000;

    address public treasury;
    uint256 public performanceFeeBps;
    uint256 public lastHighWaterMark;

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PerformanceFeeUpdated(uint256 oldBps, uint256 newBps);
    event PerformanceFeeAccrued(uint256 profit, uint256 feeShares, address indexed receiver);

    error FeeTooHigh(uint256 attempted, uint256 cap);
    error ZeroAddress();

    constructor(IERC20 asset_, string memory name_, string memory symbol_, address admin, address treasury_, uint256 feeBps_)
        ERC20(name_, symbol_)
        ERC4626(asset_)
    {
        if (admin == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (feeBps_ > MAX_PERFORMANCE_FEE_BPS) revert FeeTooHigh(feeBps_, MAX_PERFORMANCE_FEE_BPS);
        treasury = treasury_;
        performanceFeeBps = feeBps_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FEE_ADMIN_ROLE, admin);
        _grantRole(HARVEST_ROLE, admin);
        lastHighWaterMark = 0;
    }

    function setTreasury(address newTreasury) external onlyRole(FEE_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setPerformanceFee(uint256 newBps) external onlyRole(FEE_ADMIN_ROLE) {
        if (newBps > MAX_PERFORMANCE_FEE_BPS) revert FeeTooHigh(newBps, MAX_PERFORMANCE_FEE_BPS);
        emit PerformanceFeeUpdated(performanceFeeBps, newBps);
        performanceFeeBps = newBps;
    }

    /// @notice Accrue performance fee by minting shares to the treasury so the share/asset ratio reflects the cut.
    /// @dev    Charges fee on yield only (assets above the high-water mark). Principal flows (deposit /
    ///         withdraw / mint / redeem) re-baseline the HWM through `_resetHighWaterMark`, so depositors
    ///         never get charged a fee on their own principal.
    function accrueFees() public {
        _accrue();
    }

    function _accrue() internal {
        uint256 currentAssets = totalAssets();
        if (currentAssets <= lastHighWaterMark || performanceFeeBps == 0) {
            return;
        }
        uint256 profit = currentAssets - lastHighWaterMark;
        uint256 feeAssets = Math.mulDiv(profit, performanceFeeBps, BPS);
        // slither-disable-next-line incorrect-equality — exact zero from rounding-down means no fee owed.
        if (feeAssets == 0) {
            return;
        }
        // Mint shares equal to feeAssets at current rate. Use rounding-down convert; this slightly
        // favours existing depositors and is consistent with ERC4626 rounding directions.
        uint256 feeShares = previewDeposit(feeAssets);
        if (feeShares > 0) {
            _mint(treasury, feeShares);
            emit PerformanceFeeAccrued(profit, feeShares, treasury);
        }
        lastHighWaterMark = currentAssets;
    }

    function _resetHighWaterMark() internal {
        lastHighWaterMark = totalAssets();
    }

    /// @notice Harden against the first-depositor inflation attack with a 6-decimal share-offset.
    ///         OpenZeppelin's ERC4626 multiplies shares by 10**_decimalsOffset for virtual-share accounting.
    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }

    // --- ERC4626 hooks ---

    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256 shares) {
        _accrue();
        shares = super.deposit(assets, receiver);
        _resetHighWaterMark();
    }

    function mint(uint256 shares, address receiver) public override nonReentrant returns (uint256 assets) {
        _accrue();
        assets = super.mint(shares, receiver);
        _resetHighWaterMark();
    }

    function withdraw(uint256 assets, address receiver, address owner)
        public
        override
        nonReentrant
        returns (uint256 shares)
    {
        _accrue();
        shares = super.withdraw(assets, receiver, owner);
        _resetHighWaterMark();
    }

    function redeem(uint256 shares, address receiver, address owner)
        public
        override
        nonReentrant
        returns (uint256 assets)
    {
        _accrue();
        assets = super.redeem(shares, receiver, owner);
        _resetHighWaterMark();
    }
}
