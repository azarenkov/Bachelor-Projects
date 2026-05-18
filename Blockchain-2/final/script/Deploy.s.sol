// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import { GovToken } from "../src/GovToken.sol";
import { PriceOracle } from "../src/oracle/PriceOracle.sol";
import { SimpleAMM } from "../src/amm/SimpleAMM.sol";
import { YieldVault } from "../src/vault/YieldVault.sol";
import { VaultFactory } from "../src/factory/VaultFactory.sol";
import { TreasuryV1 } from "../src/treasury/TreasuryV1.sol";
import { TreasuryV2 } from "../src/treasury/TreasuryV2.sol";
import { ProtocolGovernor } from "../src/governance/ProtocolGovernor.sol";
import { ProtocolTimelock } from "../src/governance/ProtocolTimelock.sol";

/// @dev Demo-grade ERC20 for the AMM pair on a testnet. Anyone can mint up to 1M tokens for free.
contract DemoERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory n, string memory s) {
        name = n;
        symbol = s;
    }

    function balanceOf(address a) external view returns (uint256) {
        return _balances[a];
    }

    function allowance(address o, address sp) external view returns (uint256) {
        return _allowances[o][sp];
    }

    function approve(address sp, uint256 v) external returns (bool) {
        _allowances[msg.sender][sp] = v;
        emit Approval(msg.sender, sp, v);
        return true;
    }

    function transfer(address to, uint256 v) external returns (bool) {
        _balances[msg.sender] -= v;
        _balances[to] += v;
        emit Transfer(msg.sender, to, v);
        return true;
    }

    function transferFrom(address from, address to, uint256 v) external returns (bool) {
        uint256 a = _allowances[from][msg.sender];
        if (a != type(uint256).max) _allowances[from][msg.sender] = a - v;
        _balances[from] -= v;
        _balances[to] += v;
        emit Transfer(from, to, v);
        return true;
    }

    function mint(address to, uint256 amount) external {
        require(amount <= 1_000_000 ether, "DemoERC20: mint cap");
        _balances[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}

/// @notice End-to-end deploy script for Arbitrum Sepolia.
///         Deployer holds setup roles during the run, executes seeding (mint, oracle feed, AMM
///         pair, vault), and only then hands every privileged role to the Timelock.
contract Deploy is Script {
    // Chainlink ETH/USD feed on Arbitrum Sepolia.
    address constant CHAINLINK_ETH_USD_ARB_SEPOLIA = 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165;

    struct Addresses {
        address govToken;
        address timelock;
        address governor;
        address treasuryProxy;
        address treasuryImplV1;
        address treasuryImplV2;
        address oracle;
        address factory;
        address weth;
        address usdc;
        address amm;
        address vault;
    }

    function run() external returns (Addresses memory addrs) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);

        // ----- 1. Token, Timelock, Governor -----
        GovToken token = new GovToken("Protocol Gov", "PGOV", 100_000_000 ether, deployer);
        token.mint(deployer, 10_000_000 ether); // pre-mint so governance demo has voting power

        address[] memory empty = new address[](0);
        ProtocolTimelock timelock = new ProtocolTimelock(2 days, empty, empty, deployer);
        ProtocolGovernor governor = new ProtocolGovernor(IVotes(address(token)), timelock, 100_000 ether);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // ----- 2. Treasury (V1 proxied via UUPS) + V2 impl staged for upgrade demo -----
        TreasuryV1 implV1 = new TreasuryV1();
        bytes memory init = abi.encodeCall(TreasuryV1.initialize, (deployer, deployer));
        ERC1967Proxy treasuryProxy = new ERC1967Proxy(address(implV1), init);
        TreasuryV2 implV2 = new TreasuryV2();
        token.mint(address(treasuryProxy), 1_000_000 ether);

        // ----- 3. Oracle + Chainlink feed registration -----
        PriceOracle oracle = new PriceOracle(deployer);

        // ----- 4. AMM-ready demo tokens + AMM pair + seeded liquidity -----
        DemoERC20 usdc = new DemoERC20("Demo USDC", "dUSDC");
        DemoERC20 weth = new DemoERC20("Demo WETH", "dWETH");
        usdc.mint(deployer, 1_000_000 ether);
        weth.mint(deployer, 1_000 ether);

        SimpleAMM amm = new SimpleAMM(address(usdc), address(weth), deployer);
        usdc.approve(address(amm), type(uint256).max);
        weth.approve(address(amm), type(uint256).max);
        // Sort: token0 is the lower of (usdc, weth). addLiquidity takes (amount0, amount1).
        if (address(usdc) < address(weth)) {
            amm.addLiquidity(100_000 ether, 50 ether, 0, 0);
        } else {
            amm.addLiquidity(50 ether, 100_000 ether, 0, 0);
        }

        // Register Chainlink ETH/USD against demo WETH so the oracle has at least one live feed.
        oracle.registerFeed(address(weth), CHAINLINK_ETH_USD_ARB_SEPOLIA, 24 hours);

        // ----- 5. Vault factory + a seeded USDC vault -----
        VaultFactory factory = new VaultFactory(deployer, address(treasuryProxy));
        address vault = factory.deployVault(IERC20(address(usdc)), "Demo USDC Vault", "vdUSDC", 1_000);

        // ----- 6. Hand all admin powers to the Timelock, renounce deployer roles -----
        token.grantRole(token.DEFAULT_ADMIN_ROLE(), address(timelock));
        token.grantRole(token.MINTER_ROLE(), address(timelock));
        token.renounceRole(token.MINTER_ROLE(), deployer);
        token.renounceRole(token.DEFAULT_ADMIN_ROLE(), deployer);

        TreasuryV1 tp = TreasuryV1(address(treasuryProxy));
        tp.grantRole(tp.DEFAULT_ADMIN_ROLE(), address(timelock));
        tp.grantRole(tp.UPGRADER_ROLE(), address(timelock));
        tp.grantRole(tp.SPENDER_ROLE(), address(timelock));
        tp.renounceRole(tp.UPGRADER_ROLE(), deployer);
        tp.renounceRole(tp.SPENDER_ROLE(), deployer);
        tp.renounceRole(tp.DEFAULT_ADMIN_ROLE(), deployer);

        oracle.grantRole(oracle.DEFAULT_ADMIN_ROLE(), address(timelock));
        oracle.grantRole(oracle.FEED_ADMIN_ROLE(), address(timelock));
        oracle.renounceRole(oracle.FEED_ADMIN_ROLE(), deployer);
        oracle.renounceRole(oracle.DEFAULT_ADMIN_ROLE(), deployer);

        amm.grantRole(amm.DEFAULT_ADMIN_ROLE(), address(timelock));
        amm.grantRole(amm.PAUSER_ROLE(), address(timelock));
        amm.renounceRole(amm.PAUSER_ROLE(), deployer);
        amm.renounceRole(amm.DEFAULT_ADMIN_ROLE(), deployer);

        factory.grantRole(factory.DEFAULT_ADMIN_ROLE(), address(timelock));
        factory.grantRole(factory.DEPLOYER_ROLE(), address(timelock));
        factory.renounceRole(factory.DEPLOYER_ROLE(), deployer);
        factory.renounceRole(factory.DEFAULT_ADMIN_ROLE(), deployer);

        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), deployer);

        vm.stopBroadcast();

        addrs = Addresses({
            govToken: address(token),
            timelock: address(timelock),
            governor: address(governor),
            treasuryProxy: address(treasuryProxy),
            treasuryImplV1: address(implV1),
            treasuryImplV2: address(implV2),
            oracle: address(oracle),
            factory: address(factory),
            weth: address(weth),
            usdc: address(usdc),
            amm: address(amm),
            vault: vault
        });

        _logAddresses(addrs);
        _writeAddresses(addrs);
    }

    function _logAddresses(Addresses memory a) internal pure {
        console2.log("");
        console2.log("=== Deployed addresses ===");
        console2.log("GovToken      :", a.govToken);
        console2.log("Timelock      :", a.timelock);
        console2.log("Governor      :", a.governor);
        console2.log("TreasuryProxy :", a.treasuryProxy);
        console2.log("TreasuryV1    :", a.treasuryImplV1);
        console2.log("TreasuryV2    :", a.treasuryImplV2);
        console2.log("Oracle        :", a.oracle);
        console2.log("VaultFactory  :", a.factory);
        console2.log("Demo USDC     :", a.usdc);
        console2.log("Demo WETH     :", a.weth);
        console2.log("SimpleAMM     :", a.amm);
        console2.log("YieldVault    :", a.vault);
    }

    function _writeAddresses(Addresses memory a) internal {
        string memory chainId = vm.toString(block.chainid);
        string memory path = string.concat("deployments/", chainId, ".json");
        string memory json = string.concat("{\n", '  "chainId": ', chainId, ",\n");
        json = string.concat(json, _entry("GovToken", a.govToken));
        json = string.concat(json, _entry("Timelock", a.timelock));
        json = string.concat(json, _entry("Governor", a.governor));
        json = string.concat(json, _entry("TreasuryProxy", a.treasuryProxy));
        json = string.concat(json, _entry("TreasuryV1", a.treasuryImplV1));
        json = string.concat(json, _entry("TreasuryV2", a.treasuryImplV2));
        json = string.concat(json, _entry("PriceOracle", a.oracle));
        json = string.concat(json, _entry("VaultFactory", a.factory));
        json = string.concat(json, _entry("DemoUSDC", a.usdc));
        json = string.concat(json, _entry("DemoWETH", a.weth));
        json = string.concat(json, _entry("SimpleAMM", a.amm));
        json = string.concat(json, _lastEntry("YieldVault", a.vault));
        json = string.concat(json, "}\n");
        vm.writeFile(path, json);
        console2.log("Wrote", path);
    }

    function _entry(string memory key, address value) internal pure returns (string memory) {
        return string.concat('  "', key, '": "', vm.toString(value), '",\n');
    }

    function _lastEntry(string memory key, address value) internal pure returns (string memory) {
        return string.concat('  "', key, '": "', vm.toString(value), '"\n');
    }
}
