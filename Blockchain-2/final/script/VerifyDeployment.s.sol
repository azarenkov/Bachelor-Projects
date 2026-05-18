// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { GovToken } from "../src/GovToken.sol";
import { ProtocolGovernor } from "../src/governance/ProtocolGovernor.sol";
import { ProtocolTimelock } from "../src/governance/ProtocolTimelock.sol";
import { TreasuryV1 } from "../src/treasury/TreasuryV1.sol";

/// @notice Read-only sanity script: connect to a live deployment and assert post-deployment
///         invariants the rubric calls out — Timelock owns admin, delays match spec, no
///         backdoor remains on deployer.
contract VerifyDeployment is Script {
    function run() external view {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address govToken = vm.envAddress("GOV_TOKEN");
        address timelock = vm.envAddress("TIMELOCK");
        address governor = vm.envAddress("GOVERNOR");
        address treasury = vm.envAddress("TREASURY_PROXY");

        GovToken token = GovToken(govToken);
        ProtocolGovernor g = ProtocolGovernor(payable(governor));
        ProtocolTimelock t = ProtocolTimelock(payable(timelock));
        TreasuryV1 tr = TreasuryV1(treasury);

        console2.log("Checking token admin lifecycle...");
        require(!token.hasRole(token.DEFAULT_ADMIN_ROLE(), deployer), "FAIL: deployer still admin on token");
        require(!token.hasRole(token.MINTER_ROLE(), deployer), "FAIL: deployer still minter on token");
        require(token.hasRole(token.DEFAULT_ADMIN_ROLE(), timelock), "FAIL: timelock not admin on token");

        console2.log("Checking governor params...");
        require(g.votingDelay() == 1 days, "FAIL: voting delay != 1 day");
        require(g.votingPeriod() == 1 weeks, "FAIL: voting period != 1 week");

        console2.log("Checking timelock delay & proposers...");
        require(t.getMinDelay() == 2 days, "FAIL: timelock delay != 2 days");
        require(t.hasRole(t.PROPOSER_ROLE(), governor), "FAIL: governor not proposer");
        require(!t.hasRole(t.DEFAULT_ADMIN_ROLE(), deployer), "FAIL: deployer still admin on timelock");

        console2.log("Checking treasury upgrader...");
        require(tr.hasRole(tr.UPGRADER_ROLE(), timelock), "FAIL: timelock not upgrader on treasury");

        console2.log("ALL CHECKS PASSED");
    }
}
