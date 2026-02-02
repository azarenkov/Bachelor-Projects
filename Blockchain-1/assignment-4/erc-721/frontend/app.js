// Contract Configuration
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
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

    document.getElementById("collectionInfoSection").style.display = "block";
    document.getElementById("nftListSection").style.display = "block";

    // Load NFT info
    await loadNFTInfo();

    // Listen for account changes
    window.ethereum.on("accountsChanged", function (accounts) {
      if (accounts.length === 0) {
        location.reload();
      } else {
        userAddress = accounts[0];
        document.getElementById("walletAddress").textContent = userAddress;
        loadNFTInfo();
      }
    });
  } catch (error) {
    console.error("Error connecting wallet:", error);
    alert("Failed to connect wallet: " + error.message);
  }
}

async function loadNFTInfo() {
  try {
    // Get collection information
    const name = await contract.name();
    const symbol = await contract.symbol();
    const balance = await contract.balanceOf(userAddress);

    // Update UI
    document.getElementById("collectionName").textContent = name;
    document.getElementById("collectionSymbol").textContent = symbol;
    document.getElementById("nftBalance").textContent =
      balance.toString() + " NFTs";

    // Load owned NFTs
    await loadOwnedNFTs();
  } catch (error) {
    console.error("Error loading NFT info:", error);
    alert("Error loading NFT information: " + error.message);
  }
}

async function loadOwnedNFTs() {
  const nftListElement = document.getElementById("nftList");

  try {
    // Get tokens owned by user
    const tokenIds = await contract.tokensOfOwner(userAddress);

    if (tokenIds.length === 0) {
      nftListElement.innerHTML =
        '<div class="empty-state">You don\'t own any NFTs yet</div>';
      return;
    }

    // Clear previous content
    nftListElement.innerHTML = "";

    // Load each NFT
    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      await displayNFT(tokenId, nftListElement);
    }
  } catch (error) {
    console.error("Error loading owned NFTs:", error);
    nftListElement.innerHTML =
      '<div class="empty-state">Error loading NFTs</div>';
  }
}

async function displayNFT(tokenId, container) {
  try {
    // Get token metadata
    const owner = await contract.ownerOf(tokenId);
    const tokenURI = await contract.tokenURI(tokenId);

    // Create NFT card
    const nftCard = document.createElement("div");
    nftCard.className = "nft-card";

    // Get name based on token ID
    const names = [
      "Dragon",
      "Phoenix",
      "Unicorn",
      "Star",
      "Diamond",
      "Art",
      "Sparkle",
      "Rocket",
    ];
    const name = names[(tokenId.toNumber() - 1) % names.length];

    nftCard.innerHTML = `
            <div class="nft-image">#${tokenId.toString()}</div>
            <div class="nft-info">
                <div class="nft-title">${name} NFT #${tokenId.toString()}</div>
                <div class="nft-detail"><strong>Owner:</strong> ${owner.substring(
                  0,
                  10
                )}...${owner.substring(owner.length - 8)}</div>
                <div class="nft-detail"><strong>Token URI:</strong></div>
                <div class="nft-detail" style="font-size: 0.8em; word-break: break-all;">${tokenURI}</div>
            </div>
        `;

    container.appendChild(nftCard);
  } catch (error) {
    console.error(`Error displaying NFT ${tokenId}:`, error);
  }
}
