// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title LogicV1
 * @dev Initial implementation of upgradeable counter contract
 */
contract LogicV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public counter;

    event CounterIncremented(uint256 newValue);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        counter = 0;
    }

    function increment() external {
        counter += 1;
        emit CounterIncremented(counter);
    }

    function getCounter() external view returns (uint256) {
        return counter;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getVersion() external pure returns (string memory) {
        return "v1.0.0";
    }
}
