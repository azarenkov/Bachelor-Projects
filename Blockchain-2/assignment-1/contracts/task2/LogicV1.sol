// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title LogicV1
/// @notice Initial UUPS-upgradeable implementation with a simple counter
contract LogicV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public counter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializer replaces constructor for upgradeable contracts
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        counter = 0;
    }

    /// @notice Increment counter by 1
    function increment() external {
        counter += 1;
    }

    /// @notice Return current counter value
    function get() external view returns (uint256) {
        return counter;
    }

    /// @notice Return contract version string
    function version() external pure returns (string memory) {
        return "V1";
    }

    /// @dev Only owner can authorize upgrades (UUPS requirement)
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
