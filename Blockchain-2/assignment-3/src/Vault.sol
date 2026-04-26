// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Vault — ERC-4626 tokenized vault with simulated yield via harvest().
/// @notice Yield is added by transferring underlying assets into the vault and
///         calling `harvest()`; share price increases proportionally because the
///         total assets under management grow while shares stay constant.
contract Vault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    event Harvested(uint256 yield, uint256 totalAssetsAfter);

    constructor(IERC20 asset_, string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
        ERC4626(asset_)
        Ownable(msg.sender)
    {}

    /// @notice Pulls `yieldAmount` of underlying from caller, increasing share price.
    /// @dev Caller must approve at least `yieldAmount` of the underlying asset.
    function harvest(uint256 yieldAmount) external onlyOwner {
        if (yieldAmount == 0) return;
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), yieldAmount);
        emit Harvested(yieldAmount, totalAssets());
    }
}
