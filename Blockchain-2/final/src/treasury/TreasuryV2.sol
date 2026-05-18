// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { TreasuryV1 } from "./TreasuryV1.sol";

/// @notice V2 of the treasury — adds per-token spend caps. Demonstrates a storage-safe upgrade
///         from V1: only new variables, declared in the slots reserved by the V1 storage gap.
contract TreasuryV2 is TreasuryV1 {
    using SafeERC20 for IERC20;

    /// @dev New storage uses one slot from the V1 gap; gap shrinks by 1.
    mapping(address token => uint256 cap) public perTokenCap;

    event PerTokenCapSet(address indexed token, uint256 cap);

    error CapExceeded(address token, uint256 attempted, uint256 cap);

    function setPerTokenCap(address token, uint256 cap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        perTokenCap[token] = cap;
        emit PerTokenCapSet(token, cap);
    }

    function payGrantWithCap(address token, address to, uint256 amount, bytes32 memo)
        external
        onlyRole(SPENDER_ROLE)
    {
        if (to == address(0)) revert ZeroAddress();
        uint256 cap = perTokenCap[token];
        if (cap != 0 && amount > cap) revert CapExceeded(token, amount, cap);
        IERC20(token).safeTransfer(to, amount);
        emit GrantPaid(token, to, amount, memo);
    }

    function version() external pure override returns (string memory) {
        return "2.0.0";
    }
}
