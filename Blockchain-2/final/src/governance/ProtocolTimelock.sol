// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @notice 2-day timelock controller that owns the treasury and protocol admin roles.
contract ProtocolTimelock is TimelockController {
    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors, address admin)
        TimelockController(minDelay, proposers, executors, admin)
    { }
}
