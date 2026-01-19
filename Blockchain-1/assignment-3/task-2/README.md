# PART 3 — Full DApp for Token Contract

A complete decentralized application (DApp) for interacting with ERC-20 style token contracts. This DApp includes wallet connection, balance viewing, token transfers, real-time event listening, and comprehensive error handling.

## 📋 Features

### ✅ Core Requirements

1. **UI for Viewing Balances**
   - Real-time balance display in a styled card
   - Auto-refresh on transfers
   - Formatted display with decimals
   - Manual refresh button

2. **Input Fields for Transfer**
   - Recipient address input with validation
   - Amount input with validation
   - Clear error messaging
   - Input field error highlighting

3. **Connect Wallet Button**
   - MetaMask detection and connection
   - Account information display
   - Network information display
   - Connection status indicator

4. **Transfer Button**
   - Execute token transfers
   - Transaction confirmation
   - Loading states during processing
   - Success/failure feedback

5. **Real-time Balance Updates**
   - Automatic balance refresh after transfers
   - Event-driven updates
   - Visual refresh indicator

6. **Event Listener for Transfer Events**
   - Start/Stop listening controls
   - Real-time event display
   - Event categorization (Sent/Received/Transfer)
   - Event history with details

7. **Handling of Rejected Transactions**
   - User rejection handling
   - Insufficient funds detection
   - Reverted transaction handling
   - Clear error messages

8. **Proper Asynchronous Workflow**
   - All async operations use async/await
   - Proper error handling with try/catch
   - Loading states for all async operations
   - No callback hell

## 🚀 Quick Start

### Prerequisites

1. **MetaMask Browser Extension**
   - Install from [metamask.io](https://metamask.io/)
   - Create or import a wallet
   - Connect to a test network (Sepolia, Goerli, etc.)

2. **Test ETH**
   - Get test ETH from a faucet
   - Needed for gas fees during transfers
   - Sepolia: https://sepoliafaucet.com/
   - Goerli: https://goerlifaucet.com/

3. **Deployed Token Contract**
   - Deploy SimpleToken contract (from Week 4)
   - Copy the deployed contract address
   - Make sure you have some tokens in your balance

### Running the Application

1. **Open the HTML file**
   ```bash
   # Navigate to the project directory
   cd Blockchain-1/assignment-3/task-2
   
   # Option 1: Open directly (might have CORS issues)
   open index.html
   
   # Option 2: Use a local server (recommended)
   python3 -m http.server 8000
   # Then open http://localhost:8000
   ```

2. **Connect Your Wallet**
   - Click "🦊 Connect Wallet" button
   - Approve the connection in MetaMask popup
   - Your account info and ETH balance will display

3. **Initialize Contract**
   - Paste your token contract address in the input field
   - Click "Initialize Contract"
   - Wait for confirmation
   - Token info and balance will load automatically

4. **Transfer Tokens**
   - Enter recipient address in "Recipient Address" field
   - Enter amount to send in "Amount" field
   - Click "Send Tokens"
   - Confirm transaction in MetaMask
   - Wait for confirmation
   - Balance will update automatically

5. **Monitor Events**
   - Click "▶️ Start Listening" to monitor Transfer events
   - See real-time events as they happen
   - Events involving your account trigger balance updates
   - Click "⏸️ Stop Listening" to stop monitoring
   - Click "🗑️ Clear Events" to clear the event history

## 📁 File Structure

```
task-2/
├── index.html          # Full DApp UI with all components
├── app.js             # Complete JavaScript logic with async/await
└── README.md          # This file
```

## 🔧 Technical Implementation

### 1. Wallet Connection (Async/Await)

```javascript
async function connectWallet() {
    try {
        // Wait for MetaMask to load
        const metamaskAvailable = await waitForMetaMask();
        
        if (!metamaskAvailable) {
            showError("MetaMask not found!");
            return;
        }
        
        // Request accounts
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        
        // Create provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAccount = accounts[0];
        
        // Get network info
        const network = await provider.getNetwork();
        const balance = await provider.getBalance(userAccount);
        
        // Update UI...
    } catch (error) {
        // Handle errors...
    }
}
```

### 2. Balance Display & Refresh

```javascript
async function refreshBalance() {
    try {
        // Get contract data in parallel
        const [decimals, balance, symbol] = await Promise.all([
            contract.decimals(),
            contract.balanceOf(userAccount),
            contract.symbol(),
        ]);
        
        // Format and display
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        
        // Update UI
        document.getElementById("balanceAmount").textContent = 
            parseFloat(formattedBalance).toFixed(4);
        document.getElementById("balanceSymbol").textContent = symbol;
    } catch (error) {
        console.error("Error refreshing balance:", error);
    }
}
```

### 3. Token Transfer with Error Handling

```javascript
async function executeTransfer() {
    try {
        // Validate inputs
        if (!toAddress || !ethers.utils.isAddress(toAddress)) {
            showError("Invalid address!");
            return;
        }
        
        // Parse amount with decimals
        const decimals = await contract.decimals();
        const parsedAmount = ethers.utils.parseUnits(amount, decimals);
        
        // Check balance
        const balance = await contract.balanceOf(userAccount);
        if (balance.lt(parsedAmount)) {
            showError("Insufficient balance!");
            return;
        }
        
        // Execute transfer
        const tx = await contract.transfer(toAddress, parsedAmount);
        showWarning("Transaction submitted, waiting for confirmation...");
        
        // Wait for confirmation
        const receipt = await tx.wait();
        showSuccess("Transfer successful!");
        
        // Refresh balance
        await refreshBalance();
        
    } catch (error) {
        // Handle different error types
        if (error.code === 4001) {
            showError("Transaction rejected by user.");
        } else if (error.code === "INSUFFICIENT_FUNDS") {
            showError("Insufficient ETH for gas fees!");
        } else {
            showError(`Error: ${error.message}`);
        }
    }
}
```

### 4. Real-time Event Listening

```javascript
async function startListening() {
    try {
        // Create event filter
        const filter = contract.filters.Transfer();
        
        // Listen for Transfer events
        contract.on(filter, async (from, to, value, event) => {
            console.log("Transfer event:", { from, to, value: value.toString() });
            
            // Handle event and update UI
            await handleTransferEvent(from, to, value, event);
        });
        
        isListening = true;
        showToast("Started listening for events");
    } catch (error) {
        console.error("Error starting listener:", error);
    }
}

async function handleTransferEvent(from, to, value, event) {
    // Format amount
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();
    const formattedValue = ethers.utils.formatUnits(value, decimals);
    
    // Check if event involves current user
    const isFromUser = from.toLowerCase() === userAccount.toLowerCase();
    const isToUser = to.toLowerCase() === userAccount.toLowerCase();
    
    // Display event in UI
    displayEventInUI(from, to, formattedValue, symbol, event);
    
    // Refresh balance if event involves user
    if (isFromUser || isToUser) {
        await refreshBalance();
    }
}
```

### 5. Transaction Rejection Handling

The DApp handles various rejection and error scenarios:

```javascript
// User rejection (code 4001)
if (error.code === 4001) {
    showError("Transaction rejected by user.");
    showToast("Transaction rejected", "error");
}

// Insufficient gas funds
else if (error.code === "INSUFFICIENT_FUNDS") {
    showError("Insufficient ETH for gas fees!");
    showToast("Insufficient gas funds", "error");
}

// Reverted transaction
else if (error.message.includes("execution reverted")) {
    showError("Transaction reverted! Check token balance and allowances.");
    showToast("Transaction reverted", "error");
}

// Generic error
else {
    showError(`Error: ${error.message}`);
    showToast("Transfer failed", "error");
}
```

## 🎯 Key Features Demonstrated

### Async/Await Pattern

All asynchronous operations use proper async/await syntax:
- No callback hell
- Clean error handling with try/catch
- Sequential and parallel async operations
- Proper promise handling

### UI/UX Features

1. **Loading States**
   - Spinning indicators during async operations
   - Disabled buttons during processing
   - Status messages for user feedback

2. **Error Handling**
   - Input validation with visual feedback
   - Clear error messages
   - Toast notifications for quick feedback
   - Error recovery suggestions

3. **Real-time Updates**
   - Balance updates after transfers
   - Event-driven UI updates
   - Automatic refresh on relevant events
   - Visual indicators for active listeners

4. **Event Display**
   - Categorized events (Sent/Received/Transfer)
   - Detailed event information
   - Chronological ordering (newest first)
   - Visual highlighting for new events

### Contract ABI

```javascript
const CONTRACT_ABI = [
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "function decimals() public view returns (uint8)",
    "function totalSupply() public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function owner() public view returns (address)",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
];
```

## 🧪 Testing Instructions

### 1. Test Wallet Connection
- [ ] Try connecting without MetaMask installed
- [ ] Try rejecting the connection request
- [ ] Verify account information displays correctly
- [ ] Switch accounts and verify detection
- [ ] Switch networks and verify detection

### 2. Test Contract Initialization
- [ ] Try with empty address field
- [ ] Try with invalid address format
- [ ] Try with valid address but no contract
- [ ] Try with correct token contract
- [ ] Verify token info loads correctly
- [ ] Verify balance displays correctly

### 3. Test Token Transfer
- [ ] Try transferring to invalid address
- [ ] Try transferring invalid amount (0, negative)
- [ ] Try transferring more than balance
- [ ] Try rejecting transaction in MetaMask
- [ ] Execute successful transfer
- [ ] Verify balance updates after transfer
- [ ] Verify transaction details display

### 4. Test Event Listening
- [ ] Start event listener
- [ ] Verify events display in real-time
- [ ] Make a transfer and verify event appears
- [ ] Receive tokens and verify event appears
- [ ] Verify balance updates on relevant events
- [ ] Stop event listener
- [ ] Clear event history

### 5. Test Error Handling
- [ ] Test with insufficient token balance
- [ ] Test with insufficient ETH for gas
- [ ] Test rejected transactions
- [ ] Test network disconnection
- [ ] Test contract errors

## 📸 Screenshot Checklist

For proof of successful execution:

1. ✅ Initial page load
2. ✅ MetaMask connection popup
3. ✅ Connected wallet information
4. ✅ Contract initialization
5. ✅ Token balance display
6. ✅ Transfer form with inputs
7. ✅ MetaMask transaction confirmation
8. ✅ Pending transaction status
9. ✅ Successful transfer confirmation
10. ✅ Updated balance after transfer
11. ✅ Event listener active
12. ✅ Transfer events displayed
13. ✅ Error handling example (optional)

## 🔍 Troubleshooting

### MetaMask Not Connecting
- Ensure MetaMask is installed and unlocked
- Check browser console for errors
- Try refreshing the page
- Verify you're on http:// or https:// (not file://)

### Balance Shows Zero
- This is normal if you haven't received tokens
- Make sure you're connected to the right network
- Verify the contract address is correct
- Check if owner minted tokens to your address

### Transfer Fails
- Check you have enough tokens
- Ensure you have ETH for gas fees
- Verify recipient address is valid
- Check network congestion

### Events Not Showing
- Click "Start Listening" button
- Make sure contract is initialized
- Try making a transfer to trigger events
- Check browser console for errors

## 🎓 Learning Outcomes

This DApp demonstrates:

1. **Frontend Web3 Integration**
   - MetaMask connection and management
   - Provider and signer creation
   - Account and network detection

2. **Smart Contract Interaction**
   - Reading contract state (view functions)
   - Writing to contract (transactions)
   - Event listening and filtering
   - ABI usage and contract instances

3. **Asynchronous JavaScript**
   - Async/await patterns
   - Promise handling
   - Error handling with try/catch
   - Parallel async operations with Promise.all

4. **User Experience**
   - Loading states and feedback
   - Error handling and recovery
   - Real-time updates
   - Toast notifications

5. **Transaction Management**
   - Transaction submission
   - Transaction confirmation waiting
   - Receipt handling
   - Gas estimation

6. **Event-Driven Architecture**
   - Event listeners
   - Real-time UI updates
   - Event filtering
   - Cleanup on page unload

## 📚 Dependencies

- **Ethers.js v5.7.2**: JavaScript library for Ethereum
  - CDN: `https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js`
- **MetaMask**: Browser extension for Ethereum wallet
- **Modern Browser**: Chrome, Firefox, or Brave with Web3 support

## 🔗 Related Files

- Token Contract: From Week 4 assignment
- Task 1: Basic MetaMask interaction (previous task)

## ✅ Assignment Requirements

- [x] UI for viewing balances
- [x] Input fields for transfer target/amount
- [x] Connect Wallet button
- [x] Transfer button
- [x] Real-time balance updates
- [x] Event listener for Transfer events
- [x] Handling of rejected transactions
- [x] Proper asynchronous workflow (await/async)
- [x] Comprehensive error handling
- [x] Professional UI/UX
- [x] Loading states
- [x] Toast notifications
- [x] Event history display
- [x] Transaction details display

## 💡 Additional Features

Beyond the requirements, this DApp includes:

- Toast notifications for quick feedback
- Event categorization (Sent/Received/Transfer)
- Transaction hash display and linking
- Gas usage display
- Block number display
- Event history with timestamps
- Clear events functionality
- Manual balance refresh
- Input validation with visual feedback
- Responsive design
- Animated UI elements
- Network change detection
- Account change detection

## 📝 Notes

- Uses Ethers.js v5.7.2 for stability
- Compatible with any ERC-20 style token contract
- Works on any EVM-compatible network
- No backend required - fully decentralized
- All data fetched directly from blockchain
- Events are listened to in real-time using WebSocket

## 🚀 Future Enhancements

Potential improvements:
- Approval and allowance management
- Multi-token support
- Transaction history from blockchain
- Network switching within app
- ENS name resolution
- QR code scanning for addresses
- Export transaction history
- Dark mode toggle

---

Built with ❤️ using Ethers.js | Full DApp for Token Contract | Assignment 3 - Part 3