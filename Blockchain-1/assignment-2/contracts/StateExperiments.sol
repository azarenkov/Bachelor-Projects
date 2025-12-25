// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StateExperiments {
    
    struct Person {
        string name;
        uint256 age;
        address wallet;
    }
    
    Person[] public people;
    mapping(uint256 => Person) public personById;
    
    uint256 public visibilityTestValue = 100;
    string public contractName;
    uint256 public creationTimestamp;
    address public creator;
    uint256 public initialValue;
    mapping(address => uint256) public initialBalances;
    uint256[] public initialNumbers;
    
    event MemoryModified(string oldName, string newName, uint256 oldAge, uint256 newAge);
    event StorageModified(string oldName, string newName, uint256 oldAge, uint256 newAge);
    
    constructor(string memory _initialName, uint256 _initialAge) {
        people.push(Person(_initialName, _initialAge, msg.sender));
        personById[0] = Person(_initialName, _initialAge, msg.sender);
        contractName = _initialName;
        creationTimestamp = block.timestamp;
        creator = msg.sender;
        initialValue = _initialAge;
        initialBalances[msg.sender] = 1000;
        initialNumbers.push(100);
        initialNumbers.push(200);
    }
    
    function modifyPersonMemory(uint256 index, string memory newName) public {
        require(index < people.length, "Index out of bounds");
        
        Person memory person = people[index];
        string memory oldName = person.name;
        uint256 oldAge = person.age;
        
        person.name = newName;
        person.age = 999;
        
        emit MemoryModified(oldName, newName, oldAge, 999);
    }
    
    function modifyPersonStorage(uint256 index, string memory newName) public {
        require(index < people.length, "Index out of bounds");
        
        Person storage person = people[index];
        string memory oldName = person.name;
        uint256 oldAge = person.age;
        
        person.name = newName;
        person.age = 888;
        
        emit StorageModified(oldName, newName, oldAge, 888);
    }
    
    function demonstrateArrayMemoryCopy() public pure returns (uint256[] memory) {
        uint256[] memory tempArray = new uint256[](3);
        tempArray[0] = 10;
        tempArray[1] = 20;
        tempArray[2] = 30;
        return tempArray;
    }
    
    function addPerson(string memory name, uint256 age) public {
        people.push(Person(name, age, msg.sender));
    }
    
    function getPerson(uint256 index) public view returns (string memory, uint256, address) {
        require(index < people.length, "Index out of bounds");
        Person memory p = people[index];
        return (p.name, p.age, p.wallet);
    }
    
    function publicFunction() public returns (string memory) {
        visibilityTestValue += 1;
        return "Called public function";
    }
    
    function externalFunction() external returns (string memory) {
        visibilityTestValue += 2;
        return "Called external function";
    }
    
    function internalFunction() internal returns (string memory) {
        visibilityTestValue += 3;
        return "Called internal function";
    }
    
    function privateFunction() private returns (string memory) {
        visibilityTestValue += 4;
        return "Called private function";
    }
    
    function testVisibilityCalls() public returns (string memory) {
        string memory result = "";
        
        result = string.concat(result, publicFunction(), " | ");
        result = string.concat(result, internalFunction(), " | ");
        result = string.concat(result, privateFunction(), " | ");
        result = string.concat(result, this.externalFunction());
        
        return result;
    }
    
    function callExternalDirectly() external pure returns (string memory) {
        return "External function called successfully from outside";
    }
    
    function getConstructorState() public view returns (
        string memory name,
        uint256 timestamp,
        address creator_,
        uint256 value
    ) {
        return (contractName, creationTimestamp, creator, initialValue);
    }
    
    function demonstrateStorageSlots() public view returns (
        uint256 slot2,
        uint256 slot4,
        uint256 slot6
    ) {
        slot2 = visibilityTestValue;
        slot4 = creationTimestamp;
        slot6 = initialValue;
    }
    
    function getInitialBalance(address account) public view returns (uint256) {
        return initialBalances[account];
    }
    
    function getInitialNumbers() public view returns (uint256[] memory) {
        return initialNumbers;
    }
    
    function getPeopleCount() public view returns (uint256) {
        return people.length;
    }
}

contract DerivedContract is StateExperiments {
    
    constructor(string memory _name, uint256 _age) StateExperiments(_name, _age) {}
    
    function testInheritedVisibility() public returns (string memory) {
        string memory result = "";
        
        result = string.concat(result, publicFunction(), " | ");
        result = string.concat(result, internalFunction());
        
        return result;
    }
}