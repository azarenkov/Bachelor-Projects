// Global variables
let provider;
let signer;
let contract;
let userAccount;
let eventListener;
let isListening = false;
let eventCount = 0;

// Token contract ABI with Transfer event
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

/**
 * Wait for MetaMask to load
 */
async function waitForMetaMask(maxWaitTime = 3000) {
  return new Promise((resolve) => {
    if (typeof window.ethereum !== "undefined") {
      console.log("MetaMask found immediately");
      resolve(true);
      return;
    }

    console.log("Waiting for MetaMask to load...");
    let waited = 0;
    const interval = 100;

    const checkInterval = setInterval(() => {
      if (typeof window.ethereum !== "undefined") {
        console.log("MetaMask loaded after", waited, "ms");
        clearInterval(checkInterval);
        resolve(true);
      } else if (waited >= maxWaitTime) {
        console.log("MetaMask not found after", maxWaitTime, "ms");
        clearInterval(checkInterval);
        resolve(false);
      }
      waited += interval;
    }, interval);
  });
}

/**
 * Connect to MetaMask wallet
 */
async function connectWallet() {
  try {
    // Show initial loading
    const connectBtn = document.getElementById("connectBtn");
    connectBtn.innerHTML = '🔄 Checking... <span class="loading"></span>';
    connectBtn.disabled = true;

    // Wait for MetaMask
    const metamaskAvailable = await waitForMetaMask();

    if (!metamaskAvailable) {
      showError(
        "accountInfo",
        '⚠️ MetaMask not found!<br><br>Make sure:<br>1. MetaMask is installed<br>2. MetaMask is enabled<br>3. Page is opened via http:// (not file://)<br><br><a href="https://metamask.io" target="_blank" style="color: #721c24; text-decoration: underline;">Install MetaMask</a>',
      );
      connectBtn.innerHTML = "🦊 Connect Wallet";
      connectBtn.disabled = false;
      return;
    }

    console.log("MetaMask available, requesting accounts...");
    connectBtn.innerHTML = '🔄 Connecting... <span class="loading"></span>';

    // Request accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("Accounts received:", accounts);

    // Create provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = accounts[0];

    // Get network info
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(userAccount);
    const balanceInEth = ethers.utils.formatEther(balance);

    // Update UI
    document.getElementById("connectionStatus").classList.add("connected");
    connectBtn.innerHTML = "✓ Connected";
    connectBtn.style.background = "#28a745";
    connectBtn.disabled = true;

    showSuccess(
      "accountInfo",
      `
            <div class="info-box">
                <div class="info-label">Connected Account</div>
                <div class="info-value">${userAccount}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Network</div>
                <div class="info-value">${network.name} (Chain ID: ${network.chainId})</div>
            </div>
            <div class="info-box">
                <div class="info-label">ETH Balance</div>
                <div class="info-value">${parseFloat(balanceInEth).toFixed(4)} ETH</div>
            </div>
        `,
    );

    console.log("Successfully connected to MetaMask");

    // Listen for changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    showToast("Wallet connected successfully!", "success");
  } catch (error) {
    console.error("Connection error:", error);
    const connectBtn = document.getElementById("connectBtn");
    connectBtn.innerHTML = "🦊 Connect Wallet";
    connectBtn.disabled = false;

    if (error.code === 4001) {
      showError(
        "accountInfo",
        "❌ Connection rejected. Click the button again to retry.",
      );
    } else {
      showError("accountInfo", `❌ Error: ${error.message}`);
    }
  }
}

/**
 * Initialize contract instance
 */
async function initializeContract() {
  try {
    // Check if wallet is connected
    if (!provider || !signer) {
      showError("contractInfo", "⚠️ Please connect to MetaMask first!");
      return;
    }

    // Get contract address from input
    const contractAddress = document
      .getElementById("contractAddress")
      .value.trim();

    // Validate contract address
    if (!contractAddress) {
      showError("contractInfo", "⚠️ Please enter a contract address!");
      return;
    }

    if (!ethers.utils.isAddress(contractAddress)) {
      showError("contractInfo", "❌ Invalid contract address format!");
      return;
    }

    showLoading("contractInfo", "Initializing contract...");

    // Create contract instance
    contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    // Verify contract exists by checking code at address
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      showError("contractInfo", "❌ No contract found at this address!");
      contract = null;
      return;
    }

    // Get token information
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    showSuccess(
      "contractInfo",
      `
            <div class="info-box">
                <div class="info-label">Contract Address</div>
                <div class="info-value">${contractAddress}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Token Name</div>
                <div class="info-value">${name} (${symbol})</div>
            </div>
            <div class="success">
                ✓ Contract initialized successfully!
            </div>
        `,
    );

    // Show relevant sections
    document.getElementById("balanceSection").style.display = "block";
    document.getElementById("transferSection").style.display = "block";
    document.getElementById("tokenInfoSection").style.display = "block";
    document.getElementById("eventsSection").style.display = "block";

    // Load initial data
    await refreshBalance();
    await loadTokenInfo();

    console.log("Contract initialized:", contractAddress);
    showToast("Contract initialized successfully!", "success");
  } catch (error) {
    console.error("Error initializing contract:", error);
    showError("contractInfo", `❌ Error: ${error.message}`);
    contract = null;
  }
}

/**
 * Refresh balance display
 */
async function refreshBalance() {
  try {
    if (!contract || !userAccount) {
      return;
    }

    const balanceAmount = document.getElementById("balanceAmount");
    balanceAmount.innerHTML = '<span class="refresh-indicator">🔄</span>';

    // Get decimals, balance, and symbol
    const [decimals, balance, symbol] = await Promise.all([
      contract.decimals(),
      contract.balanceOf(userAccount),
      contract.symbol(),
    ]);

    // Format balance with decimals
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    // Update balance card
    balanceAmount.textContent = parseFloat(formattedBalance).toFixed(4);
    document.getElementById("balanceSymbol").textContent = symbol;

    console.log(
      "Balance updated:",
      formattedBalance,
      symbol,
      "Raw:",
      balance.toString(),
    );
  } catch (error) {
    console.error("Error refreshing balance:", error);
    document.getElementById("balanceAmount").textContent = "Error";
  }
}

/**
 * Load token information
 */
async function loadTokenInfo() {
  try {
    if (!contract) {
      return;
    }

    showLoading("tokenInfo", "Loading token information...");

    // Call view functions in parallel
    const [name, symbol, decimals, totalSupply, owner] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.owner(),
    ]);

    // Format total supply with decimals
    const formattedSupply = ethers.utils.formatUnits(totalSupply, decimals);

    // Display results
    showSuccess(
      "tokenInfo",
      `
            <div class="grid">
                <div class="card">
                    <div class="info-label">Token Name</div>
                    <div class="card-value">${name}</div>
                </div>
                <div class="card">
                    <div class="info-label">Symbol</div>
                    <div class="card-value">${symbol}</div>
                </div>
                <div class="card">
                    <div class="info-label">Decimals</div>
                    <div class="card-value">${decimals}</div>
                </div>
                <div class="card">
                    <div class="info-label">Total Supply</div>
                    <div class="card-value">${formattedSupply}</div>
                </div>
            </div>
            <div class="info-box">
                <div class="info-label">Contract Owner</div>
                <div class="info-value">${owner}</div>
            </div>
        `,
    );

    console.log("Token Info:", {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
      owner,
    });
  } catch (error) {
    console.error("Error loading token info:", error);
    showError("tokenInfo", `❌ Error loading token info: ${error.message}`);
  }
}

/**
 * Execute token transfer
 */
async function executeTransfer() {
  try {
    if (!contract || !userAccount) {
      showError("transferStatus", "⚠️ Please connect wallet and initialize contract first!");
      return;
    }

    // Get input values
    const toAddress = document.getElementById("transferTo").value.trim();
    const amount = document.getElementById("transferAmount").value.trim();

    // Validate inputs
    if (!toAddress) {
      showError("transferStatus", "⚠️ Please enter a recipient address!");
      document.getElementById("transferTo").classList.add("error-input");
      return;
    }

    if (!ethers.utils.isAddress(toAddress)) {
      showError("transferStatus", "❌ Invalid recipient address format!");
      document.getElementById("transferTo").classList.add("error-input");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showError("transferStatus", "⚠️ Please enter a valid amount!");
      document.getElementById("transferAmount").classList.add("error-input");
      return;
    }

    // Remove error styling
    document.getElementById("transferTo").classList.remove("error-input");
    document.getElementById("transferAmount").classList.remove("error-input");

    // Get decimals
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    // Parse amount with decimals
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);

    // Check balance
    const balance = await contract.balanceOf(userAccount);
    if (balance.lt(parsedAmount)) {
      showError(
        "transferStatus",
        `❌ Insufficient balance! You have ${ethers.utils.formatUnits(balance, decimals)} ${symbol}`,
      );
      return;
    }

    // Show loading
    const transferBtn = document.getElementById("transferBtn");
    transferBtn.disabled = true;
    transferBtn.innerHTML = '⏳ Processing... <span class="loading"></span>';

    showWarning(
      "transferStatus",
      `⏳ Sending ${amount} ${symbol} to ${toAddress}...<br>Please confirm the transaction in MetaMask.`,
    );

    console.log("Initiating transfer:", {
      to: toAddress,
      amount: amount,
      parsedAmount: parsedAmount.toString(),
    });

    // Execute transfer
    const tx = await contract.transfer(toAddress, parsedAmount);

    showWarning(
      "transferStatus",
      `⏳ Transaction submitted!<br>Tx Hash: <a href="#" class="tx-link">${tx.hash}</a><br>Waiting for confirmation...`,
    );

    console.log("Transaction submitted:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    console.log("Transaction confirmed:", receipt);

    // Show success
    showSuccess(
      "transferStatus",
      `
            ✅ Transfer successful!<br>
            <div class="info-box" style="margin-top: 10px;">
                <div class="info-label">Transaction Hash</div>
                <div class="info-value">${receipt.transactionHash}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Block Number</div>
                <div class="info-value">${receipt.blockNumber}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Gas Used</div>
                <div class="info-value">${receipt.gasUsed.toString()}</div>
            </div>
        `,
    );

    showToast(`Transfer of ${amount} ${symbol} successful!`, "success");

    // Reset form
    document.getElementById("transferTo").value = "";
    document.getElementById("transferAmount").value = "";

    // Refresh balance
    await refreshBalance();

    // Reset button
    transferBtn.disabled = false;
    transferBtn.innerHTML = "Send Tokens";
  } catch (error) {
    console.error("Transfer error:", error);

    const transferBtn = document.getElementById("transferBtn");
    transferBtn.disabled = false;
    transferBtn.innerHTML = "Send Tokens";

    // Handle different error types
    if (error.code === 4001) {
      showError("transferStatus", "❌ Transaction rejected by user.");
      showToast("Transaction rejected", "error");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      showError("transferStatus", "❌ Insufficient ETH for gas fees!");
      showToast("Insufficient gas funds", "error");
    } else if (error.message.includes("execution reverted")) {
      showError(
        "transferStatus",
        "❌ Transaction reverted! This could be due to insufficient token balance or other contract restrictions.",
      );
      showToast("Transaction reverted", "error");
    } else {
      showError("transferStatus", `❌ Error: ${error.message}`);
      showToast("Transfer failed", "error");
    }
  }
}

/**
 * Start listening for Transfer events
 */
async function startListening() {
  try {
    if (!contract) {
      showToast("Please initialize contract first!", "error");
      return;
    }

    if (isListening) {
      showToast("Already listening to events!", "error");
      return;
    }

    console.log("Starting to listen for Transfer events...");

    // Create event filter
    const filter = contract.filters.Transfer();

    // Listen for Transfer events
    eventListener = contract.on(filter, async (from, to, value, event) => {
      console.log("Transfer event received:", {
        from,
        to,
        value: value.toString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });

      await handleTransferEvent(from, to, value, event);
    });

    isListening = true;

    // Update UI
    document.getElementById("startListenBtn").disabled = true;
    document.getElementById("stopListenBtn").disabled = false;

    // Clear empty state
    const container = document.getElementById("eventsContainer");
    if (container.querySelector(".empty-state")) {
      container.innerHTML = "";
    }

    showToast("Started listening for Transfer events", "success");
    console.log("Event listener started successfully");
  } catch (error) {
    console.error("Error starting event listener:", error);
    showToast("Failed to start listening: " + error.message, "error");
  }
}

/**
 * Stop listening for Transfer events
 */
function stopListening() {
  try {
    if (!isListening) {
      showToast("Not currently listening!", "error");
      return;
    }

    console.log("Stopping event listener...");

    // Remove all listeners
    if (contract) {
      contract.removeAllListeners("Transfer");
    }

    isListening = false;

    // Update UI
    document.getElementById("startListenBtn").disabled = false;
    document.getElementById("stopListenBtn").disabled = true;

    showToast("Stopped listening for events", "success");
    console.log("Event listener stopped");
  } catch (error) {
    console.error("Error stopping event listener:", error);
    showToast("Failed to stop listening: " + error.message, "error");
  }
}

/**
 * Handle incoming Transfer event
 */
async function handleTransferEvent(from, to, value, event) {
  try {
    // Get decimals and symbol
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    // Format amount
    const formattedValue = ethers.utils.formatUnits(value, decimals);

    // Increment event count
    eventCount++;
    document.getElementById("eventBadge").textContent = `${eventCount} events`;

    // Create event item
    const eventItem = document.createElement("div");
    eventItem.className = "event-item new";

    const timestamp = new Date().toLocaleTimeString();

    // Check if event involves current user
    const isFromUser = from.toLowerCase() === userAccount.toLowerCase();
    const isToUser = to.toLowerCase() === userAccount.toLowerCase();

    let eventType = "Transfer";
    if (isFromUser && isToUser) {
      eventType = "Self Transfer";
    } else if (isFromUser) {
      eventType = "Sent";
    } else if (isToUser) {
      eventType = "Received";
    }

    eventItem.innerHTML = `
            <div class="event-header">
                <span class="event-type">${eventType}</span>
                <span class="event-time">${timestamp}</span>
            </div>
            <div class="event-details">
                <span class="event-label">From:</span>
                <span class="event-value">${from}${isFromUser ? " (You)" : ""}</span>
                <span class="event-label">To:</span>
                <span class="event-value">${to}${isToUser ? " (You)" : ""}</span>
                <span class="event-label">Amount:</span>
                <span class="event-amount">${formattedValue} ${symbol}</span>
                <span class="event-label">Block:</span>
                <span class="event-value">${event.blockNumber}</span>
                <span class="event-label">Tx Hash:</span>
                <span class="event-value">${event.transactionHash}</span>
            </div>
        `;

    // Add to container (prepend to show newest first)
    const container = document.getElementById("eventsContainer");
    container.insertBefore(eventItem, container.firstChild);

    // Remove "new" class after animation
    setTimeout(() => {
      eventItem.classList.remove("new");
    }, 2000);

    // Refresh balance if event involves current user
    if (isFromUser || isToUser) {
      await refreshBalance();
      showToast(`${eventType}: ${formattedValue} ${symbol}`, "success");
    }
  } catch (error) {
    console.error("Error handling transfer event:", error);
  }
}

/**
 * Clear all displayed events
 */
function clearEvents() {
  const container = document.getElementById("eventsContainer");
  container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div>No events yet. Start listening to see Transfer events in real-time.</div>
        </div>
    `;
  eventCount = 0;
  document.getElementById("eventBadge").textContent = "0 events";
  showToast("Events cleared", "success");
}

/**
 * Handle account changes
 */
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or user disconnected
    showError("accountInfo", "⚠️ Please connect to MetaMask.");
    document.getElementById("connectionStatus").classList.remove("connected");
    userAccount = null;
    showToast("Wallet disconnected", "error");
  } else if (accounts[0] !== userAccount) {
    // Account changed - reload page
    showToast("Account changed - reloading...", "success");
    setTimeout(() => window.location.reload(), 1000);
  }
}

/**
 * Handle chain changes
 */
function handleChainChanged(chainId) {
  // Reload the page on chain change as recommended by MetaMask
  showToast("Network changed - reloading...", "success");
  setTimeout(() => window.location.reload(), 1000);
}

/**
 * Helper function to show error message
 */
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="error">${message}</div>`;
}

/**
 * Helper function to show success message
 */
function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="success">${message}</div>`;
}

/**
 * Helper function to show warning message
 */
function showWarning(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="warning">${message}</div>`;
}

/**
 * Helper function to show loading state
 */
function showLoading(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div style="padding: 20px; text-align: center;">
        <span class="loading"></span>
        <p style="margin-top: 10px; color: #6c757d;">${message}</p>
    </div>`;
}

/**
 * Show toast notification
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Initialize on page load
 */
window.addEventListener("load", () => {
  console.log("DApp loaded. Ready to connect wallet.");

  // Check if already connected
  if (typeof window.ethereum !== "undefined") {
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          console.log("Already connected to MetaMask");
          // Could auto-connect here, but leaving it manual for clarity
        }
      })
      .catch((err) =>
        console.error("Error checking existing connection:", err),
      );
  }
});

/**
 * Cleanup on page unload
 */
window.addEventListener("beforeunload", () => {
  if (isListening && contract) {
    contract.removeAllListeners("Transfer");
  }
});
