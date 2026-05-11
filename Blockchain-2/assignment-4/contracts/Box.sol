// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
    uint256 private _value;
    uint256 public feeBps;

    event ValueStored(uint256 newValue);
    event FeeUpdated(uint256 newFeeBps);

    error InvalidFee();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function store(uint256 newValue) external onlyOwner {
        _value = newValue;
        emit ValueStored(newValue);
    }

    function retrieve() external view returns (uint256) {
        return _value;
    }

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > 10_000) revert InvalidFee();
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }
}
