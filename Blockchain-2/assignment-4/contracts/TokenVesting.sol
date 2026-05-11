// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64  public immutable start;
    uint64  public immutable duration;
    uint256 public immutable totalAmount;
    uint256 public released;

    event TokensReleased(uint256 amount);

    error NothingToRelease();

    constructor(address token_, address beneficiary_, uint64 start_, uint64 duration_, uint256 totalAmount_) {
        require(token_ != address(0), "token=0");
        require(beneficiary_ != address(0), "beneficiary=0");
        require(duration_ > 0, "duration=0");
        require(totalAmount_ > 0, "amount=0");
        token = IERC20(token_);
        beneficiary = beneficiary_;
        start = start_;
        duration = duration_;
        totalAmount = totalAmount_;
    }

    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        if (timestamp < start) return 0;
        uint64 elapsed = timestamp - start;
        if (elapsed >= duration) return totalAmount;
        return (totalAmount * elapsed) / duration;
    }

    function releasable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    function release() external {
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit TokensReleased(amount);
    }
}
