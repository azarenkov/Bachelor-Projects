// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ChildContract.sol";

/**
 * @title Factory
 * @dev Factory contract that deploys ChildContract instances using CREATE and CREATE2
 */
contract Factory {
    address[] public deployedContracts;
    mapping(address => bool) public isDeployed;

    event ContractDeployed(address indexed contractAddress, string deploymentType, address indexed deployer);

    /**
     * @dev Deploy a ChildContract using CREATE opcode
     * @param _name Name for the new ChildContract
     * @return Address of the newly deployed contract
     */
    function deployWithCreate(string memory _name) external returns (address) {
        ChildContract child = new ChildContract(msg.sender, _name);
        address childAddress = address(child);

        deployedContracts.push(childAddress);
        isDeployed[childAddress] = true;

        emit ContractDeployed(childAddress, "CREATE", msg.sender);
        return childAddress;
    }

    /**
     * @dev Deploy a ChildContract using CREATE2 opcode
     * @param _name Name for the new ChildContract
     * @param _salt Salt for deterministic deployment
     * @return Address of the newly deployed contract
     */
    function deployWithCreate2(string memory _name, bytes32 _salt) external returns (address) {
        ChildContract child = new ChildContract{salt: _salt}(msg.sender, _name);
        address childAddress = address(child);

        deployedContracts.push(childAddress);
        isDeployed[childAddress] = true;

        emit ContractDeployed(childAddress, "CREATE2", msg.sender);
        return childAddress;
    }

    /**
     * @dev Compute the address for CREATE2 deployment without deploying
     * @param _deployer Address of the deployer
     * @param _name Name for the ChildContract
     * @param _salt Salt for deterministic deployment
     * @return Predicted address
     */
    function computeCreate2Address(
        address _deployer,
        string memory _name,
        bytes32 _salt
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(ChildContract).creationCode,
            abi.encode(_deployer, _name)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Get all deployed contract addresses
     * @return Array of deployed contract addresses
     */
    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }

    /**
     * @dev Get the count of deployed contracts
     * @return Number of deployed contracts
     */
    function getDeployedContractsCount() external view returns (uint256) {
        return deployedContracts.length;
    }
}
