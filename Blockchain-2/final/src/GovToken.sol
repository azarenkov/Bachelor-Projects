// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { Nonces } from "@openzeppelin/contracts/utils/Nonces.sol";

/// @notice Governance token with EIP-2612 permit and ERC20Votes checkpoints, required by the Governor.
contract GovToken is ERC20, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public immutable maxSupply;

    error MaxSupplyExceeded(uint256 attempted, uint256 cap);

    constructor(string memory name_, string memory symbol_, uint256 maxSupply_, address admin)
        ERC20(name_, symbol_)
        ERC20Permit(name_)
    {
        require(admin != address(0), "GovToken: zero admin");
        require(maxSupply_ > 0, "GovToken: zero cap");
        maxSupply = maxSupply_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (totalSupply() + amount > maxSupply) revert MaxSupplyExceeded(totalSupply() + amount, maxSupply);
        _mint(to, amount);
    }

    // ---- OZ multi-parent overrides ----
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}
