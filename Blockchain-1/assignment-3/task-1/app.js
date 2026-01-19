// Global variables
let provider;
let signer;
let contract;
let userAccount;

// SimpleToken ABI - only the functions we need to interact with
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
 * Connect to MetaMask wallet
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
async function connectMetaMask() {
  try {
    // Show initial loading
    document.getElementById("connectBtn").innerHTML =
      'Checking... <span class="loading"></span>';
    document.getElementById("connectBtn").disabled = true;

    // Wait for MetaMask
    const metamaskAvailable = await waitForMetaMask();

    if (!metamaskAvailable) {
      showError(
        "accountInfo",
        '⚠️ MetaMask не найден!<br><br>Убедитесь что:<br>1. MetaMask установлен<br>2. MetaMask включен в браузере<br>3. Страница открыта через http:// (не file://)<br><br><a href="https://metamask.io" target="_blank" style="color: #721c24; text-decoration: underline;">Установить MetaMask</a>',
      );
      document.getElementById("connectBtn").innerHTML = "Connect to MetaMask";
      document.getElementById("connectBtn").disabled = false;
      return;
    }

    console.log("MetaMask available, requesting accounts...");
    document.getElementById("connectBtn").innerHTML =
      'Connecting... <span class="loading"></span>';

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
    document.getElementById("connectBtn").innerHTML = "✓ Connected";
    document.getElementById("connectBtn").style.background = "#28a745";

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
                 <div class="info-label">Balance</div>
                 <div class="info-value">${parseFloat(balanceInEth).toFixed(4)} ETH</div>
             </div>
         `,
    );

    console.log("Successfully connected to MetaMask");

    // Listen for changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
  } catch (error) {
    console.error("Connection error:", error);
    document.getElementById("connectBtn").innerHTML = "Connect to MetaMask";
    document.getElementById("connectBtn").disabled = false;

    if (error.code === 4001) {
      showError(
        "accountInfo",
        "❌ Вы отклонили подключение. Нажмите кнопку снова чтобы повторить.",
      );
    } else {
      showError("accountInfo", `❌ Ошибка: ${error.message}`);
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

    // Create contract instance
    contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    // Verify contract exists by checking code at address
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      showError("contractInfo", "❌ No contract found at this address!");
      contract = null;
      return;
    }

    // Enable interaction buttons
    document.getElementById("readInfoBtn").disabled = false;
    document.getElementById("checkBalanceBtn").disabled = false;
    document.getElementById("totalSupplyBtn").disabled = false;

    showSuccess(
      "contractInfo",
      `
            <div class="info-box">
                <div class="info-label">Contract Address</div>
                <div class="info-value">${contractAddress}</div>
            </div>
            <div class="success">
                ✓ Contract initialized successfully! You can now interact with it.
            </div>
        `,
    );

    console.log("Contract initialized:", contractAddress);
  } catch (error) {
    console.error("Error initializing contract:", error);
    showError("contractInfo", `❌ Error: ${error.message}`);
  }
}

/**
 * Read token information from contract
 */
async function readTokenInfo() {
  try {
    if (!contract) {
      showError("contractData", "⚠️ Please initialize the contract first!");
      return;
    }

    // Show loading
    showLoading("contractData", "Reading token information...");

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
      "contractData",
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
    console.error("Error reading token info:", error);
    showError("contractData", `❌ Error reading token info: ${error.message}`);
  }
}

/**
 * Check balance of connected account
 */
async function checkBalance() {
  try {
    if (!contract) {
      showError("contractData", "⚠️ Please initialize the contract first!");
      return;
    }

    if (!userAccount) {
      showError("contractData", "⚠️ Please connect to MetaMask first!");
      return;
    }

    // Show loading
    showLoading("contractData", "Checking your balance...");

    // Get decimals and balance
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(userAccount);
    const symbol = await contract.symbol();

    // Format balance with decimals
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    // Display result
    showSuccess(
      "contractData",
      `
            <div class="info-box">
                <div class="info-label">Your Address</div>
                <div class="info-value">${userAccount}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Token Balance</div>
                <div class="card-value">${formattedBalance} ${symbol}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Raw Balance</div>
                <div class="info-value">${balance.toString()}</div>
            </div>
        `,
    );

    console.log("Balance:", balance.toString(), "Formatted:", formattedBalance);
  } catch (error) {
    console.error("Error checking balance:", error);
    showError("contractData", `❌ Error checking balance: ${error.message}`);
  }
}

/**
 * Get total supply of tokens
 */
async function getTotalSupply() {
  try {
    if (!contract) {
      showError("contractData", "⚠️ Please initialize the contract first!");
      return;
    }

    // Show loading
    showLoading("contractData", "Getting total supply...");

    // Get total supply, decimals, and symbol
    const totalSupply = await contract.totalSupply();
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();
    const name = await contract.name();

    // Format total supply
    const formattedSupply = ethers.utils.formatUnits(totalSupply, decimals);

    // Display result
    showSuccess(
      "contractData",
      `
            <div class="info-box">
                <div class="info-label">Token</div>
                <div class="info-value">${name} (${symbol})</div>
            </div>
            <div class="info-box">
                <div class="info-label">Total Supply</div>
                <div class="card-value">${formattedSupply} ${symbol}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Raw Value</div>
                <div class="info-value">${totalSupply.toString()}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Decimals</div>
                <div class="info-value">${decimals}</div>
            </div>
        `,
    );

    console.log(
      "Total Supply:",
      totalSupply.toString(),
      "Formatted:",
      formattedSupply,
    );
  } catch (error) {
    console.error("Error getting total supply:", error);
    showError(
      "contractData",
      `❌ Error getting total supply: ${error.message}`,
    );
  }
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
  } else {
    // Account changed
    userAccount = accounts[0];
    connectMetaMask(); // Reconnect with new account
  }
}

/**
 * Handle chain changes
 */
function handleChainChanged(chainId) {
  // Reload the page on chain change as recommended by MetaMask
  window.location.reload();
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
 * Initialize on page load
 */
window.addEventListener("load", () => {
  console.log("Page loaded. Ready to connect to MetaMask.");

  // Check if already connected
  if (typeof window.ethereum !== "undefined") {
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          console.log("Already connected to MetaMask");
          // Auto-connect if already authorized
          connectMetaMask();
        }
      })
      .catch((err) =>
        console.error("Error checking existing connection:", err),
      );
  }
});
