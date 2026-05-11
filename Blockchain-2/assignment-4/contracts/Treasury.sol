// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    event TokensSent(address indexed token, address indexed to, uint256 amount);
    event EthSent(address indexed to, uint256 amount);
    event EthReceived(address indexed from, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {
        emit EthReceived(msg.sender, msg.value);
    }

    function sendToken(IERC20 token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
        emit TokensSent(address(token), to, amount);
    }

    function sendEth(address payable to, uint256 amount) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit EthSent(to, amount);
    }
}
