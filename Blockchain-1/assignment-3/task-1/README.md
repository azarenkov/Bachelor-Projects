# Task A - Basic Frontend Interaction with MetaMask

This project demonstrates a complete HTML + JavaScript frontend that connects to MetaMask, retrieves account information, and interacts with a deployed Solidity smart contract.

## 📋 Features

✅ **MetaMask Connection**
- Connects to MetaMask wallet
- Displays connected account address
- Shows network information and ETH balance
- Handles account and network changes

✅ **Smart Contract Interaction**
- Configurable contract address input
- Creates contract instance with ABI
- Reads values from deployed SimpleToken contract
- Displays results dynamically in the UI

✅ **Error Handling**
- Validates MetaMask installation
- Validates contract addresses
- Provides user-friendly error messages
- Handles rejected connections gracefully

✅ **User Interface**
- Clean, modern design
- Responsive layout
- Real-time status indicators
- Loading states for async operations

## 🚀 Quick Start

### Prerequisites

1. **MetaMask Browser Extension**
   - Install MetaMask from [metamask.io](https://metamask.io/)
   - Create or import a wallet
   - Connect to a test network (Sepolia, Goerli, etc.)

2. **Test ETH**
   - Get test ETH from a faucet for your chosen network
   - Sepolia faucet: https://sepoliafaucet.com/
   - Goerli faucet: https://goerlifaucet.com/

3. **Deployed SimpleToken Contract**
   - Deploy the SimpleToken contract from assignment-2
   - Copy the deployed contract address

### Running the Application

1. **Open the HTML file**
   ```bash
   # Navigate to the project directory
   cd Blockchain-1/assignment-3
   
   # Open index.html in your browser
   # Option 1: Double-click index.html
   # Option 2: Use a local server (recommended)
   python3 -m http.server 8000
   # Then open http://localhost:8000
   ```

2. **Connect to MetaMask**
   - Click the "Connect to MetaMask" button
   - Approve the connection request in MetaMask popup
   - Your account information will be displayed

3. **Configure Contract**
   - Paste your deployed SimpleToken contract address
   - Click "Initialize Contract"
   - Wait for confirmation

4. **Interact with Contract**
   - Click "Read Token Info" to see token name, symbol, decimals, and total supply
   - Click "Check My Balance" to see your token balance
   - Click "Get Total Supply" to see the total token supply

## 📁 File Structure

```
assignment-3/
├── index.html          # Main HTML page with UI
├── app.js             # JavaScript logic with Ethers.js
└── README.md          # This file
```

## 🔧 Technical Implementation

### 1. MetaMask Connection

```javascript
// Check for MetaMask
if (typeof window.ethereum === 'undefined') {
    // Show error
}

// Request account access
const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
});

// Create provider and signer
provider = new ethers.providers.Web3Provider(window.ethereum);
signer = provider.getSigner();
```

### 2. Contract ABI

The application uses the SimpleToken ABI with the following functions:
```javascript
const CONTRACT_ABI = [
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "function decimals() public view returns (uint8)",
    "function totalSupply() public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function owner() public view returns (address)"
];
```

### 3. Contract Instance Creation

```javascript
// Create contract instance with address, ABI, and signer
contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

// Verify contract exists
const code = await provider.getCode(contractAddress);
if (code === '0x') {
    // No contract at this address
}
```

### 4. Reading Contract Values

```javascript
// Read token information
const name = await contract.name();
const symbol = await contract.symbol();
const totalSupply = await contract.totalSupply();
const balance = await contract.balanceOf(userAccount);

// Format values with decimals
const decimals = await contract.decimals();
const formatted = ethers.utils.formatUnits(totalSupply, decimals);
```

## 🎯 Key Features Demonstrated

### Error Handling Examples

1. **MetaMask Not Installed**
   ```javascript
   if (typeof window.ethereum === 'undefined') {
       showError('MetaMask is not installed!');
   }
   ```

2. **Invalid Contract Address**
   ```javascript
   if (!ethers.utils.isAddress(contractAddress)) {
       showError('Invalid contract address format!');
   }
   ```

3. **User Rejection**
   ```javascript
   if (error.code === 4001) {
       showError('Connection rejected by user');
   }
   ```

4. **No Contract at Address**
   ```javascript
   const code = await provider.getCode(contractAddress);
   if (code === '0x') {
       showError('No contract found at this address!');
   }
   ```

### Dynamic UI Updates

- Real-time status indicators (connected/disconnected)
- Loading states during async operations
- Formatted display of blockchain values
- Responsive error and success messages

## 🧪 Testing Instructions

1. **Test MetaMask Connection**
   - Try connecting without MetaMask installed
   - Try rejecting the connection request
   - Try switching accounts in MetaMask
   - Try switching networks

2. **Test Contract Initialization**
   - Try with empty contract address
   - Try with invalid address format
   - Try with valid address but no contract
   - Try with correct SimpleToken contract address

3. **Test Contract Interaction**
   - Try reading before connecting MetaMask
   - Try reading before initializing contract
   - Successfully read all contract values
   - Verify values match expected data

## 📸 Screenshot Checklist

For proof of successful execution, include screenshots showing:

1. ✅ Initial page load
2. ✅ MetaMask connection popup
3. ✅ Connected account information
4. ✅ Contract address input
5. ✅ Successful contract initialization
6. ✅ Token information display
7. ✅ Balance check results
8. ✅ Total supply display
9. ✅ Error handling examples (optional)

## 🔍 Troubleshooting

### MetaMask Not Connecting
- Ensure MetaMask is unlocked
- Check that you're on the correct network
- Refresh the page and try again

### Contract Not Found
- Verify the contract address is correct
- Ensure you're on the same network where contract is deployed
- Check that the contract is actually deployed

### Balance Shows Zero
- This is normal if you haven't received any tokens yet
- Only the contract owner or recipients of transfers will have balances

## 📚 Dependencies

- **Ethers.js v5.7.2**: JavaScript library for Ethereum interaction
  - Loaded via CDN: `https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js`
- **MetaMask**: Browser extension for Ethereum wallet

## 🎓 Learning Outcomes

This assignment demonstrates:
1. Frontend integration with Web3 wallets
2. Creating contract instances from ABI
3. Reading blockchain data using view functions
4. Proper error handling in Web3 applications
5. Dynamic UI updates based on blockchain state
6. Event listening for account/network changes

## 📝 Notes

- The application uses Ethers.js v5.7.2 (stable version)
- All contract calls are read-only (view functions)
- No transaction signing or gas fees required
- Works with any EVM-compatible network
- Compatible with the SimpleToken contract from Assignment 2

## 🔗 Related Files

- SimpleToken Contract: `../assignment-2/contracts/SimpleToken.sol`
- Contract ABI is derived from the Solidity contract

## ✅ Assignment Requirements Met

- [x] HTML file with user interface
- [x] JavaScript logic with Ethers.js
- [x] MetaMask connection functionality
- [x] Account address retrieval and display
- [x] ABI definition for contract
- [x] Contract instance creation
- [x] Read values from deployed contract
- [x] Dynamic frontend display of results
- [x] Comprehensive error handling
- [x] Ready for screenshots/proof of execution