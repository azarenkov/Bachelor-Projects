// Contract Configuration
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

let provider;
let signer;
let contract;
let userAddress;

async function connectWallet() {
  // Check if ethers is loaded
  if (typeof ethers === "undefined") {
    alert(
      "Ethers library is not loaded. Please check your internet connection and refresh the page."
    );
    return;
  }

  if (typeof window.ethereum === "undefined") {
    alert(
      "MetaMask is not installed! Please install MetaMask to use this app."
    );
    return;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    userAddress = accounts[0];

    // Setup provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    // Setup contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Update UI
    document.getElementById("walletAddress").textContent = userAddress;
    document.getElementById("walletInfo").style.display = "block";
    document.getElementById("connectBtn").textContent = "Connected";
    document.getElementById("connectBtn").disabled = true;

    document.getElementById("tokenInfoSection").style.display = "block";
    document.getElementById("transferSection").style.display = "block";

    // Load token info
    await loadTokenInfo();

    // Listen for account changes
    window.ethereum.on("accountsChanged", function (accounts) {
      if (accounts.length === 0) {
        location.reload();
      } else {
        userAddress = accounts[0];
        document.getElementById("walletAddress").textContent = userAddress;
        loadTokenInfo();
      }
    });
  } catch (error) {
    console.error("Error connecting wallet:", error);
    alert("Failed to connect wallet: " + error.message);
  }
}

async function loadTokenInfo() {
  try {
    // Get token information
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(userAddress);

    // Update UI
    document.getElementById("tokenName").textContent = name;
    document.getElementById("tokenSymbol").textContent = symbol;
    document.getElementById("tokenBalance").textContent =
      ethers.utils.formatUnits(balance, decimals) + " " + symbol;
    document.getElementById("totalSupply").textContent =
      ethers.utils.formatUnits(totalSupply, decimals) + " " + symbol;
  } catch (error) {
    console.error("Error loading token info:", error);
    showStatus(
      "transferStatus",
      "Error loading token information: " + error.message,
      "error"
    );
  }
}

async function transferTokens() {
  const recipient = document.getElementById("recipientAddress").value.trim();
  const amount = document.getElementById("transferAmount").value.trim();

  // Validation
  if (!ethers.utils.isAddress(recipient)) {
    showStatus("transferStatus", "Invalid recipient address", "error");
    return;
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    showStatus("transferStatus", "Invalid amount", "error");
    return;
  }

  try {
    showStatus("transferStatus", "Preparing transaction...", "info");

    // Get decimals
    const decimals = await contract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount, decimals);

    // Send transaction
    showStatus(
      "transferStatus",
      "Waiting for MetaMask confirmation...",
      "info"
    );
    const tx = await contract.transfer(recipient, amountInWei);

    showStatus(
      "transferStatus",
      "Transaction submitted! Waiting for confirmation...",
      "info"
    );
    const receipt = await tx.wait();

    // Show success
    const message = `
            <strong>Transfer Successful!</strong><br>
            Amount: ${amount} tokens<br>
            To: ${recipient}<br>
            Transaction Hash: ${receipt.transactionHash}<br>
            Block: ${receipt.blockNumber}
        `;
    showStatus("transferStatus", message, "success");

    // Clear inputs
    document.getElementById("recipientAddress").value = "";
    document.getElementById("transferAmount").value = "";

    // Refresh balance
    await loadTokenInfo();
  } catch (error) {
    console.error("Transfer error:", error);
    let errorMessage = "Transfer failed: ";

    if (error.code === 4001) {
      errorMessage += "Transaction rejected by user";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage += "Insufficient balance";
    } else {
      errorMessage += error.message;
    }

    showStatus("transferStatus", errorMessage, "error");
  }
}

function showStatus(elementId, message, type) {
  const statusElement = document.getElementById(elementId);
  statusElement.innerHTML = message;
  statusElement.className = "status " + type;
  statusElement.style.display = "block";

  if (type === "success") {
    setTimeout(() => {
      statusElement.style.display = "none";
    }, 10000);
  }
}
