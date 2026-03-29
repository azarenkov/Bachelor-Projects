// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title LogicV2
/// @notice Upgraded UUPS implementation adding decrement and reset to V1
contract LogicV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // Storage layout MUST match LogicV1 — counter stays at slot 0 (after OZ gaps)
    uint256 public counter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Re-initializer for V2 (version 2); does not reset counter
    /// @custom:oz-upgrades-validate-as-initializer
    function initializeV2() public reinitializer(2) {
        // Re-run Ownable init (no-op since owner is already set) to satisfy upgrade validator
        __Ownable_init(owner());
    }

    /// @notice Increment counter by 1
    function increment() external {
        counter += 1;
    }

    /// @notice Decrement counter by 1 (new in V2)
    function decrement() external {
        require(counter > 0, "Counter is already zero");
        counter -= 1;
    }

    /// @notice Reset counter to zero (new in V2, owner only)
    function reset() external onlyOwner {
        counter = 0;
    }

    /// @notice Return current counter value
    function get() external view returns (uint256) {
        return counter;
    }

    /// @notice Return contract version string
    function version() external pure returns (string memory) {
        return "V2";
    }

    /// @dev Only owner can authorize upgrades (UUPS requirement)
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
