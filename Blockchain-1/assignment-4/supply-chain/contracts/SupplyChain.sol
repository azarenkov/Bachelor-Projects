// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    
    enum Status {
        Manufactured,
        InTransit,
        AtWarehouse,
        OutForDelivery,
        Delivered
    }

    struct Product {
        uint256 id;
        string name;
        string manufacturer;
        Status status;
        address currentOwner;
        uint256 timestamp;
        string location;
    }

    struct StatusUpdate {
        Status status;
        uint256 timestamp;
        address updatedBy;
        string location;
    }

    uint256 private productCounter;
    mapping(uint256 => Product) public products;
    mapping(uint256 => StatusUpdate[]) public statusHistory;
    mapping(address => bool) public authorizedParticipants;
    
    address public owner;

    event ProductRegistered(uint256 indexed productId, string name, string manufacturer, address registeredBy);
    event StatusUpdated(uint256 indexed productId, Status newStatus, string location, address updatedBy);
    event OwnershipTransferred(uint256 indexed productId, address from, address to);
    event ParticipantAuthorized(address participant);
    event ParticipantRevoked(address participant);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedParticipants[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    modifier productExists(uint256 productId) {
        require(productId > 0 && productId <= productCounter, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedParticipants[msg.sender] = true;
        productCounter = 0;
    }

    function registerProduct(
        string memory _name,
        string memory _manufacturer,
        string memory _location
    ) external onlyAuthorized returns (uint256) {
        productCounter++;
        
        Product memory newProduct = Product({
            id: productCounter,
            name: _name,
            manufacturer: _manufacturer,
            status: Status.Manufactured,
            currentOwner: msg.sender,
            timestamp: block.timestamp,
            location: _location
        });

        products[productCounter] = newProduct;

        statusHistory[productCounter].push(StatusUpdate({
            status: Status.Manufactured,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            location: _location
        }));

        emit ProductRegistered(productCounter, _name, _manufacturer, msg.sender);
        
        return productCounter;
    }

    function updateStatus(
        uint256 _productId,
        Status _newStatus,
        string memory _location
    ) external onlyAuthorized productExists(_productId) {
        Product storage product = products[_productId];
        
        require(uint8(_newStatus) > uint8(product.status), "Can only move forward in status");
        
        product.status = _newStatus;
        product.location = _location;
        product.timestamp = block.timestamp;

        statusHistory[_productId].push(StatusUpdate({
            status: _newStatus,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            location: _location
        }));

        emit StatusUpdated(_productId, _newStatus, _location, msg.sender);
    }

    function transferOwnership(uint256 _productId, address _newOwner) 
        external 
        onlyAuthorized 
        productExists(_productId) 
    {
        require(_newOwner != address(0), "Invalid address");
        Product storage product = products[_productId];
        
        address previousOwner = product.currentOwner;
        product.currentOwner = _newOwner;

        emit OwnershipTransferred(_productId, previousOwner, _newOwner);
    }

    function getProduct(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (
            uint256 id,
            string memory name,
            string memory manufacturer,
            Status status,
            address currentOwner,
            uint256 timestamp,
            string memory location
        ) 
    {
        Product memory product = products[_productId];
        return (
            product.id,
            product.name,
            product.manufacturer,
            product.status,
            product.currentOwner,
            product.timestamp,
            product.location
        );
    }

    function getStatusHistory(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (StatusUpdate[] memory) 
    {
        return statusHistory[_productId];
    }

    function authorizeParticipant(address _participant) external onlyOwner {
        require(_participant != address(0), "Invalid address");
        authorizedParticipants[_participant] = true;
        emit ParticipantAuthorized(_participant);
    }

    function revokeParticipant(address _participant) external onlyOwner {
        authorizedParticipants[_participant] = false;
        emit ParticipantRevoked(_participant);
    }

    function getTotalProducts() external view returns (uint256) {
        return productCounter;
    }
}
