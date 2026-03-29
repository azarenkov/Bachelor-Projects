// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ChildContract.sol";

/// @title Factory
/// @notice Deploys ChildContract instances using both CREATE and CREATE2
contract Factory {
    address[] public deployedContracts;
    mapping(address => bool) public isDeployed;

    event ContractDeployed(address indexed contractAddress, string deployMethod, string name);

    /// @notice Deploy a ChildContract using the standard CREATE opcode
    /// @param _name Name for the new child contract
    /// @return addr Address of the newly deployed contract
    function deployWithCreate(string calldata _name) external returns (address addr) {
        ChildContract child = new ChildContract(msg.sender, _name);
        addr = address(child);
        deployedContracts.push(addr);
        isDeployed[addr] = true;
        emit ContractDeployed(addr, "CREATE", _name);
    }

    /// @notice Deploy a ChildContract using CREATE2 (deterministic address)
    /// @param _name Name for the new child contract
    /// @param _salt Arbitrary salt for address computation
    /// @return addr Address of the newly deployed contract
    function deployWithCreate2(string calldata _name, bytes32 _salt) external returns (address addr) {
        ChildContract child = new ChildContract{salt: _salt}(msg.sender, _name);
        addr = address(child);
        deployedContracts.push(addr);
        isDeployed[addr] = true;
        emit ContractDeployed(addr, "CREATE2", _name);
    }

    /// @notice Compute the deterministic address for a CREATE2 deployment
    /// @param _name Name that would be passed to the constructor
    /// @param _salt Salt used during deployment
    /// @return predicted Predicted address before deployment
    function computeCreate2Address(string calldata _name, bytes32 _salt) external view returns (address predicted) {
        bytes memory bytecode = abi.encodePacked(
            type(ChildContract).creationCode,
            abi.encode(msg.sender, _name)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );
        predicted = address(uint160(uint256(hash)));
    }

    /// @notice Return all deployed contract addresses
    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }

    /// @notice Return the number of deployed contracts
    function getDeployedCount() external view returns (uint256) {
        return deployedContracts.length;
    }
}
