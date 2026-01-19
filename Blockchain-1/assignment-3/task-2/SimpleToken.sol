// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleToken
 * @dev A basic ERC-20 style token implementation for educational purposes
 * This contract is used with the Token DApp (task-2)
 */
contract SimpleToken {
    // Token metadata
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    // Contract owner
    address public owner;

    // Balances mapping
    mapping(address => uint256) public balanceOf;

    // Allowances mapping (for approve/transferFrom pattern)
    mapping(address => mapping(address => uint256)) public allowance;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @dev Constructor - Initializes the token
     * @param _name Token name (e.g., "MyToken")
     * @param _symbol Token symbol (e.g., "MTK")
     * @param _decimals Number of decimals (typically 18)
     * @param _initialSupply Initial supply (with decimals, e.g., 1000000000000000000000 for 1000 tokens)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _initialSupply;

        // Assign all tokens to contract deployer
        owner = msg.sender;
        balanceOf[msg.sender] = _initialSupply;

        emit Transfer(address(0), msg.sender, _initialSupply);
    }

    /**
     * @dev Transfer tokens from sender to another address
     * @param _to Recipient address
     * @param _value Amount of tokens to transfer
     * @return success True if transfer was successful
     */
    function transfer(
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_value > 0, "Transfer amount must be greater than zero");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    /**
     * @dev Approve another address to spend tokens on behalf of sender
     * @param _spender Address authorized to spend
     * @param _value Amount of tokens to approve
     * @return success True if approval was successful
     */
    function approve(
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        require(_spender != address(0), "Cannot approve zero address");

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    /**
     * @dev Transfer tokens from one address to another (requires prior approval)
     * @param _from Address to transfer from
     * @param _to Address to transfer to
     * @param _value Amount of tokens to transfer
     * @return success True if transfer was successful
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_from != address(0), "Cannot transfer from zero address");
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(
            allowance[_from][msg.sender] >= _value,
            "Insufficient allowance"
        );
        require(_value > 0, "Transfer amount must be greater than zero");

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param _to Address to receive minted tokens
     * @param _value Amount of tokens to mint
     * @return success True if minting was successful
     */
    function mint(address _to, uint256 _value) public returns (bool success) {
        require(msg.sender == owner, "Only owner can mint tokens");
        require(_to != address(0), "Cannot mint to zero address");
        require(_value > 0, "Mint amount must be greater than zero");

        totalSupply += _value;
        balanceOf[_to] += _value;

        emit Transfer(address(0), _to, _value);

        return true;
    }

    /**
     * @dev Burn tokens from sender's balance
     * @param _value Amount of tokens to burn
     * @return success True if burning was successful
     */
    function burn(uint256 _value) public returns (bool success) {
        require(
            balanceOf[msg.sender] >= _value,
            "Insufficient balance to burn"
        );
        require(_value > 0, "Burn amount must be greater than zero");

        balanceOf[msg.sender] -= _value;
        totalSupply -= _value;

        emit Transfer(msg.sender, address(0), _value);

        return true;
    }
}

/*
 * DEPLOYMENT INSTRUCTIONS:
 *
 * 1. Open Remix IDE (https://remix.ethereum.org)
 * 2. Create new file: SimpleToken.sol
 * 3. Paste this code
 * 4. Compile with Solidity 0.8.0 or higher
 * 5. Deploy with these constructor parameters:
 *    - name: "MyToken"
 *    - symbol: "MTK"
 *    - decimals: 18
 *    - initialSupply: 1000000000000000000000 (1000 tokens with 18 decimals)
 * 6. Copy the deployed contract address
 * 7. Use it in the DApp!
 *
 * EXAMPLE PARAMETERS:
 * name: "MyToken"
 * symbol: "MTK"
 * decimals: 18
 * initialSupply: 1000000000000000000000
 *
 * This creates a token with:
 * - Name: MyToken
 * - Symbol: MTK
 * - 18 decimal places (like ETH)
 * - Initial supply: 1000 tokens
 * - All tokens go to deployer address
 *
 * TESTING:
 * - Deploy on Sepolia testnet
 * - You'll need test ETH for gas
 * - Get test ETH from: https://sepoliafaucet.com/
 *
 * FEATURES:
 * ✅ Transfer tokens
 * ✅ Check balances
 * ✅ Approve spending
 * ✅ Transfer on behalf (transferFrom)
 * ✅ Mint new tokens (owner only)
 * ✅ Burn tokens
 * ✅ Transfer events
 * ✅ Approval events
 */
