// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice V1 of the protocol treasury. Holds fees collected from the vault and AMM,
///         pays grants on Timelock instruction. Upgradeable via UUPS.
/// @dev    Authoriser for upgrades is whoever holds UPGRADER_ROLE — at deploy time, the Timelock.
contract TreasuryV1 is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant SPENDER_ROLE = keccak256("SPENDER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    event GrantPaid(address indexed token, address indexed to, uint256 amount, bytes32 indexed memo);

    error ZeroAddress();

    /// @dev Storage gap so subsequent versions can introduce variables without colliding
    ///      with the inherited storage of OZ upgradeable parents.
    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address upgrader) public initializer {
        if (admin == address(0) || upgrader == address(0)) revert ZeroAddress();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SPENDER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);
    }

    function payGrant(address token, address to, uint256 amount, bytes32 memo) external onlyRole(SPENDER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit GrantPaid(token, to, amount, memo);
    }

    function version() external pure virtual returns (string memory) {
        return "1.0.0";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) { }
}
