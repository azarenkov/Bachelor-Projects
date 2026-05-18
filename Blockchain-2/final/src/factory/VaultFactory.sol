// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

import { YieldVault } from "../vault/YieldVault.sol";

/// @notice Factory for ERC-4626 yield vaults. Supports CREATE for non-deterministic deployment
///         and CREATE2 for deterministic addresses (useful for cross-chain symmetric deployments
///         and for predictable addresses in subgraph mappings).
contract VaultFactory is AccessControl {
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    address public immutable defaultTreasury;
    address public immutable defaultAdmin;

    /// @dev underlying asset → list of deployed vaults (CREATE OR CREATE2).
    mapping(address asset => address[] vaults) private _vaultsByAsset;
    /// @dev (asset, salt) → vault address; only populated for CREATE2 deployments.
    mapping(bytes32 key => address vault) private _deterministicVault;

    event VaultDeployed(
        address indexed asset, address indexed vault, address indexed deployer, bool deterministic, bytes32 salt
    );

    error ZeroAddress();
    error AlreadyDeployed(address existing);

    constructor(address admin_, address treasury_) {
        if (admin_ == address(0) || treasury_ == address(0)) revert ZeroAddress();
        defaultAdmin = admin_;
        defaultTreasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(DEPLOYER_ROLE, admin_);
    }

    function deployVault(IERC20 asset, string calldata name_, string calldata symbol_, uint256 performanceFeeBps)
        external
        onlyRole(DEPLOYER_ROLE)
        returns (address vault)
    {
        vault = address(new YieldVault(asset, name_, symbol_, defaultAdmin, defaultTreasury, performanceFeeBps));
        _vaultsByAsset[address(asset)].push(vault);
        emit VaultDeployed(address(asset), vault, msg.sender, false, bytes32(0));
    }

    function deployVaultDeterministic(
        IERC20 asset,
        string calldata name_,
        string calldata symbol_,
        uint256 performanceFeeBps,
        bytes32 salt
    ) external onlyRole(DEPLOYER_ROLE) returns (address vault) {
        bytes32 key = keccak256(abi.encodePacked(address(asset), salt));
        if (_deterministicVault[key] != address(0)) revert AlreadyDeployed(_deterministicVault[key]);
        vault = address(
            new YieldVault{ salt: salt }(asset, name_, symbol_, defaultAdmin, defaultTreasury, performanceFeeBps)
        );
        _deterministicVault[key] = vault;
        _vaultsByAsset[address(asset)].push(vault);
        emit VaultDeployed(address(asset), vault, msg.sender, true, salt);
    }

    /// @notice Pre-compute the address of a deterministic vault. Useful for off-chain wiring before deploy.
    function predictVaultAddress(
        IERC20 asset,
        string calldata name_,
        string calldata symbol_,
        uint256 performanceFeeBps,
        bytes32 salt
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(YieldVault).creationCode,
            abi.encode(asset, name_, symbol_, defaultAdmin, defaultTreasury, performanceFeeBps)
        );
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint256(hash)));
    }

    function vaultsFor(address asset) external view returns (address[] memory) {
        return _vaultsByAsset[asset];
    }
}
