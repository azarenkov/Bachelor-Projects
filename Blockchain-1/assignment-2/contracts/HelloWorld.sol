// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HelloWorld
 * @notice A demonstration contract showing visibility, state management, and events
 * @dev Implements all visibility levels and demonstrates gas costs
 */
contract HelloWorld {
    
    // ============ STATE VARIABLES ============
    
    /// @notice The main message stored in contract storage
    /// @dev Stored at slot 0, costs 20,000 gas for zero→non-zero write
    string private message;
    
    /// @notice Counter tracking number of updates
    /// @dev Stored at slot 1, demonstrates state persistence
    uint256 public updateCount;
    
    /// @notice Contract deployment timestamp
    /// @dev Immutable after construction, stored at slot 2
    uint256 public immutable deployedAt;
    
    /// @notice Address that deployed the contract
    address public immutable deployer;
    
    
    // ============ EVENTS ============
    
    /**
     * @notice Emitted when the message is updated
     * @param oldMessage Previous message value
     * @param newMessage New message value
     * @param updatedBy Address that performed the update
     * @param updateNumber The update counter value
     */
    event MessageUpdated(
        string indexed oldMessage,  // Indexed for filtering (hashed)
        string newMessage,          // Not indexed (full string in data)
        address indexed updatedBy,  // Indexed for filtering
        uint256 updateNumber        // Not indexed (cheaper)
    );
    
    /**
     * @notice Emitted when message is validated
     * @param isValid Whether the message passed validation
     * @param messageLength Length of the validated message
     */
    event MessageValidated(bool isValid, uint256 messageLength);
    
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Initializes the contract with a default message
     * @dev Sets immutable variables that cannot be changed post-deployment
     */
    constructor() {
        message = "Hello, World!";
        updateCount = 0;
        deployedAt = block.timestamp;
        deployer = msg.sender;
        
        emit MessageUpdated("", "Hello, World!", msg.sender, 0);
    }
    
    
    // ============ PUBLIC FUNCTIONS ============
    
    /**
     * @notice Retrieves the current message
     * @dev Public getter - can be called externally or internally
     * @return The current message string
     * 
     * GAS ANALYSIS:
     * - External call: ~23,500 gas (cold) includes CALL overhead + SLOAD
     * - View function: No state changes, free when called off-chain
     * - Uses SLOAD opcode (2,100 gas for cold access, 100 gas warm)
     */
    function getMessage() public view returns (string memory) {
        return message;
    }
    
    /**
     * @notice Updates the stored message
     * @dev Public function - demonstrates state-changing transaction costs
     * @param newMessage The new message to store
     * 
     * GAS ANALYSIS:
     * - First update (cold storage): ~60,000-80,000 gas
     *   - SSTORE (20,000 gas for zero→non-zero or 2,900 gas non-zero→non-zero)
     *   - String storage expansion
     *   - Event emission (~1,500 gas + data costs)
     *   - Counter increment
     * - Subsequent updates (warm storage): ~45,000-65,000 gas
     */
    function updateMessage(string memory newMessage) public {
        // Validate input using private function
        require(_validateMessage(newMessage), "Invalid message");
        
        // Store old message for event
        string memory oldMessage = message;
        
        // Update state (SSTORE operations)
        message = newMessage;
        updateCount++;  // Increment counter (demonstrates state persistence)
        
        // Emit event for off-chain indexing
        emit MessageUpdated(oldMessage, newMessage, msg.sender, updateCount);
    }
    
    /**
     * @notice Gets comprehensive contract information
     * @dev Public view function - returns multiple values efficiently
     * @return currentMessage The stored message
     * @return updates Total number of updates
     * @return contractAge Time since deployment in seconds
     * 
     * GAS ANALYSIS:
     * - ~25,000-30,000 gas (multiple SLOADs)
     * - Free when called off-chain (view function)
     * - More expensive than single getter due to multiple storage reads
     */
    function getInfo() public view returns (
        string memory currentMessage,
        uint256 updates,
        uint256 contractAge
    ) {
        return (
            message,
            updateCount,
            block.timestamp - deployedAt
        );
    }
    
    
    // ============ EXTERNAL FUNCTIONS ============
    
    /**
     * @notice Appends text to the existing message
     * @dev External function - only callable from outside the contract
     * @param suffix Text to append to current message
     * 
     * VISIBILITY DEMONSTRATION:
     * - Cannot call appendToMessage() internally (must use this.appendToMessage())
     * - More gas efficient for external calls (calldata instead of memory)
     * - Parameters read directly from calldata (no memory copy)
     */
    function appendToMessage(string calldata suffix) external {
        string memory oldMessage = message;
        string memory newMessage = string(abi.encodePacked(message, " ", suffix));
        
        require(_validateMessage(newMessage), "Resulting message invalid");
        
        message = newMessage;
        updateCount++;
        
        emit MessageUpdated(oldMessage, message, msg.sender, updateCount);
    }
    
    /**
     * @notice Resets message to original "Hello, World!"
     * @dev External function demonstrating controlled state reset
     * 
     * GAS ANALYSIS:
     * - If message is longer: ~40,000-50,000 gas (storage reduction)
     * - If message is shorter: ~45,000-55,000 gas (storage expansion)
     */
    function resetMessage() external {
        string memory oldMessage = message;
        message = "Hello, World!";
        updateCount++;
        
        emit MessageUpdated(oldMessage, message, msg.sender, updateCount);
    }
    
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Internal helper for message transformation
     * @dev Internal function - accessible in this contract and derived contracts
     * @param input The string to transform
     * @return The uppercase version (simplified - just returns input)
     * 
     * VISIBILITY DEMONSTRATION:
     * - Can be called by public/external functions in this contract
     * - Would be accessible to contracts that inherit from HelloWorld
     * - Uses JUMP opcode (8 gas) - no CALL overhead
     */
    function _toUpperCase(string memory input) internal pure returns (string memory) {
        // Simplified implementation - in production would convert to uppercase
        return input;
    }
    
    
    // ============ PRIVATE FUNCTIONS ============
    
    /**
     * @notice Validates message meets requirements
     * @dev Private function - only callable within this contract
     * @param _message The message to validate
     * @return bool Whether the message is valid
     * 
     * VISIBILITY DEMONSTRATION:
     * - Most restrictive visibility
     * - Cannot be called by derived contracts
     * - Not part of contract's external interface
     * - Uses JUMP opcode internally (8 gas)
     * - No ABI encoding/decoding overhead
     * 
     * VALIDATION RULES:
     * - Must not be empty
     * - Must be <= 280 characters (Twitter-style limit)
     */
    function _validateMessage(string memory _message) private pure returns (bool) {
        bytes memory messageBytes = bytes(_message);
        
        // Check not empty
        if (messageBytes.length == 0) {
            return false;
        }
        
        // Check maximum length (280 characters)
        if (messageBytes.length > 280) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Private helper to calculate string hash
     * @dev Demonstrates private pure function
     * @param input String to hash
     * @return Hash of the input string
     */
    function _hashMessage(string memory input) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(input));
    }
    
    
    // ============ COMPARISON FUNCTIONS ============
    
    /**
     * @notice Checks if current message matches a given string
     * @dev View function for comparison - demonstrates cheap read operations
     * @param compareTo String to compare against
     * @return bool Whether messages match
     * 
     * GAS ANALYSIS:
     * - ~24,000 gas (cold) for external call
     * - Includes SLOAD for message + keccak256 computation (~30 gas)
     * - Free when called off-chain
     */
    function isMessage(string memory compareTo) public view returns (bool) {
        return keccak256(abi.encodePacked(message)) == keccak256(abi.encodePacked(compareTo));
    }
    
    /**
     * @notice Gets the length of the current message
     * @dev Pure computation on storage data
     * @return Length in bytes
     * 
     * GAS ANALYSIS:
     * - ~23,000 gas (cold SLOAD + bytes conversion)
     * - Cheaper than returning full string
     */
    function getMessageLength() public view returns (uint256) {
        return bytes(message).length;
    }
    
    
    // ============ DEMONSTRATION FUNCTIONS ============
    
    /**
     * @notice Demonstrates internal function call
     * @dev Shows how internal functions integrate into control flow
     * @param input Test string
     * @return Processed string
     */
    function demonstrateInternal(string memory input) public pure returns (string memory) {
        // Direct JUMP to _toUpperCase - no CALL overhead
        return _toUpperCase(input);
    }
    
    /**
     * @notice Attempts to demonstrate private function (will show in comments)
     * @dev Private functions cannot be called externally or shown in ABI
     */
    // function demonstratePrivate(string memory input) public pure returns (bool) {
    //     return _validateMessage(input);  // This works internally
    // }
    // Note: Uncommenting above would work, but _validateMessage never appears in ABI
}


/**
 * ============================================================================
 * GAS USAGE COMPARISON SUMMARY
 * ============================================================================
 * 
 * VIEW FUNCTIONS (No state changes):
 * ├─ getMessage()         : ~23,500 gas (cold) | FREE off-chain
 * ├─ getInfo()            : ~28,000 gas (cold) | FREE off-chain  
 * ├─ isMessage()          : ~24,000 gas (cold) | FREE off-chain
 * └─ getMessageLength()   : ~23,000 gas (cold) | FREE off-chain
 * 
 * STATE-CHANGING FUNCTIONS:
 * ├─ updateMessage()      : ~60,000-80,000 gas (first call)
 * │                         ~45,000-65,000 gas (subsequent)
 * ├─ appendToMessage()    : ~65,000-90,000 gas (string expansion)
 * └─ resetMessage()       : ~40,000-55,000 gas
 * 
 * DEPLOYMENT:
 * └─ Constructor          : ~450,000-550,000 gas (includes initialization)
 * 
 * ============================================================================
 * VISIBILITY COMPARISON
 * ============================================================================
 * 
 * PUBLIC functions:
 *   ✓ Callable externally (via transaction/call)
 *   ✓ Callable internally (via JUMP)
 *   ✓ Appear in ABI
 *   ✗ Slightly more bytecode (dual entry points)
 * 
 * EXTERNAL functions:
 *   ✓ Only callable externally (or via this.function())
 *   ✓ More gas efficient for external calls (calldata)
 *   ✓ Appear in ABI
 *   ✗ Internal calls require this.function() (expensive CALL)
 * 
 * INTERNAL functions:
 *   ✗ Not callable externally
 *   ✓ Callable from this contract and derived contracts
 *   ✓ Most efficient internal calls (JUMP, 8 gas)
 *   ✗ Not in ABI
 * 
 * PRIVATE functions:
 *   ✗ Only callable within this exact contract
 *   ✗ Not accessible to derived contracts
 *   ✓ Most restrictive encapsulation
 *   ✓ Efficient JUMP (8 gas)
 *   ✗ Not in ABI
 * 
 * ============================================================================
 */