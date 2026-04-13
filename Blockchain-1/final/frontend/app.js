import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { CONTRACTS } from "./contracts.js";

const CROWDFUNDING_ADDRESS = CONTRACTS.CROWDFUNDING_ADDRESS;
const CROWDFUNDING_ABI = CONTRACTS.CROWDFUNDING_ABI;
const TOKEN_ABI = CONTRACTS.TOKEN_ABI;

let provider;
let signer;
let crowdfundingContract;
let tokenContract;
let userAddress;

// CONNECT WALLET
document.getElementById("connectWallet").addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    crowdfundingContract = new ethers.Contract(
      CROWDFUNDING_ADDRESS,
      CROWDFUNDING_ABI,
      signer
    );

    const rewardTokenAddress = await crowdfundingContract.rewardToken();
    tokenContract = new ethers.Contract(
      rewardTokenAddress,
      TOKEN_ABI,
      provider
    );

    await updateWalletInfo();
    await loadCampaigns();

    document.getElementById("walletInfo").style.display = "block";
    document.getElementById("connectWallet").textContent = "Connected ✓";
    document.getElementById("connectWallet").disabled = true;

    showStatus("Wallet connected successfully!", "success");
  } catch (err) {
    console.error(err);
    showStatus(err.message, "error");
  }
});

// WALLET INFO
async function updateWalletInfo() {
  try {
    document.getElementById("userAddress").textContent =
      userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

    const balance = await provider.getBalance(userAddress);
    document.getElementById("ethBalance").textContent =
      parseFloat(ethers.utils.formatEther(balance)).toFixed(4);

    const tokenBalance = await tokenContract.balanceOf(userAddress);
    document.getElementById("tokenBalance").textContent =
      parseFloat(ethers.utils.formatEther(tokenBalance)).toFixed(2);
  } catch (err) {
    console.error("updateWalletInfo:", err);
  }
}

// CREATE CAMPAIGN
document.getElementById("createBtn").addEventListener("click", async () => {
  const title = document.getElementById("campaignTitle").value.trim();
  const description = document.getElementById("campaignDescription").value.trim();
  const goal = document.getElementById("campaignGoal").value;
  const duration = document.getElementById("campaignDuration").value;

  if (!title || !description || !goal || !duration) {
    return alert("Fill all fields");
  }

  try {
    showStatus("Creating campaign...", "pending");

    const tx = await crowdfundingContract.createCampaign(
      title,
      description,
      ethers.utils.parseEther(goal),
      duration * 60
    );

    await tx.wait();

    showStatus("Campaign created", "success");
    await loadCampaigns();
    await updateWalletInfo();
  } catch (err) {
    console.error(err);
    showStatus(err.reason || err.message, "error");
  }
});

// LOAD CAMPAIGNS
async function loadCampaigns() {
  const list = document.getElementById("campaignList");
  list.innerHTML = "<p>Loading campaigns...</p>";

  try {
    const count = (await crowdfundingContract.campaignCount()).toNumber();

    if (count === 0) {
      list.innerHTML = "<p>No campaigns yet</p>";
      return;
    }

    list.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const c = await crowdfundingContract.getCampaign(i);

      const creator = c[0];
      const title = c[1];
      const description = c[2];
      const goalBN = c[3];
      const raisedBN = c[4];
      const deadlineBN = c[5];
      const finalized = c[7];

      const goal = ethers.utils.formatEther(goalBN);
      const raised = ethers.utils.formatEther(raisedBN);
      const deadline = new Date(deadlineBN.toNumber() * 1000);

      const expired = deadline < new Date();
      const completed = raisedBN.gte(goalBN);
      const isCreator = creator.toLowerCase() === userAddress.toLowerCase();

      let status = finalized
        ? completed ? "Completed" : "Failed"
        : completed ? "Goal Reached"
        : expired ? "Expired"
        : "Active";

      let actions = "";

      if (!finalized && !expired && !completed) {
        actions += `
          <input id="amount${i}" type="number" step="0.01" placeholder="ETH">
          <button onclick="contribute(${i})">Contribute</button>
        `;
      }

      if (!finalized && isCreator && (expired || completed)) {
        actions += `
          <button onclick="finalizeCampaign(${i})">Finalize</button>
        `;
      }

      list.innerHTML += `
        <div class="campaign-card">
          <h3>${title}</h3>
          <p>${description}</p>
          <p><strong>Goal:</strong> ${goal} ETH</p>
          <p><strong>Raised:</strong> ${raised} ETH</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
          <p><strong>Status:</strong> ${status}</p>
          ${actions}
        </div>
      `;
    }
  } catch (err) {
    console.error("loadCampaigns:", err);
    list.innerHTML = "<p>Error loading campaigns</p>";
  }
}

// CONTRIBUTE
window.contribute = async (id) => {
  const amount = document.getElementById("amount" + id).value;
  if (!amount) return;

  try {
    showStatus("Contributing...", "pending");

    const tx = await crowdfundingContract.contribute(id, {
      value: ethers.utils.parseEther(amount),
    });

    await tx.wait();

    showStatus("Contribution successful", "success");
    await updateWalletInfo();
    await loadCampaigns();
  } catch (err) {
    console.error(err);
    showStatus(err.reason || err.message, "error");
  }
};

// FINALIZE
window.finalizeCampaign = async (id) => {
  try {
    showStatus("Finalizing...", "pending");

    const tx = await crowdfundingContract.finalizeCampaign(id);
    await tx.wait();

    showStatus("Campaign finalized", "success");
    await loadCampaigns();
    await updateWalletInfo();
  } catch (err) {
    console.error(err);
    showStatus(err.reason || err.message, "error");
  }
};

// STATUS UI
function showStatus(msg, type) {
  const el = document.getElementById("txStatus");
  el.textContent = msg;
  el.className = type;
  el.style.display = "block";
  if (type !== "pending") {
    setTimeout(() => (el.style.display = "none"), 4000);
  }
}

console.log("🚀 DApp loaded");
