import { ethers } from "https://esm.sh/ethers@6.13.2";

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function delegates(address) view returns (address)",
  "function getVotes(address) view returns (uint256)",
  "function delegate(address) external",
  "function symbol() view returns (string)",
];

const GOVERNOR_ABI = [
  "function state(uint256) view returns (uint8)",
  "function proposalVotes(uint256) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function proposalDeadline(uint256) view returns (uint256)",
  "function castVote(uint256, uint8) external returns (uint256)",
  "function hasVoted(uint256, address) view returns (bool)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)",
];

const STATE_LABELS = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];

const ZERO = "0x0000000000000000000000000000000000000000";

let provider, signer, account;
let deployed;
let token, governor;

const $ = (id) => document.getElementById(id);
const log = (msg) => {
  const el = $("log");
  el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + el.textContent;
};

async function loadDeployed() {
  const res = await fetch("./deployed.json");
  if (!res.ok) throw new Error("deployed.json not found — run `npm run deploy:local` first");
  deployed = await res.json();
  log(`Loaded deployment: chainId=${deployed.chainId}`);
}

async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not detected. Install it and reload.");
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  const net = await provider.getNetwork();
  $("account").textContent = account;
  $("network").textContent = `${net.name} (${net.chainId})`;

  token = new ethers.Contract(deployed.GovernanceToken, TOKEN_ABI, signer);
  governor = new ethers.Contract(deployed.Governor, GOVERNOR_ABI, signer);
  log(`Connected as ${account}`);
  await refreshUserStats();
  await refreshProposals();
}

async function refreshUserStats() {
  if (!account) return;
  const [balance, votes, delegate] = await Promise.all([
    token.balanceOf(account),
    token.getVotes(account),
    token.delegates(account),
  ]);
  $("balance").textContent = Number(ethers.formatEther(balance)).toLocaleString();
  $("votes").textContent = Number(ethers.formatEther(votes)).toLocaleString();
  $("delegate").textContent = delegate === ZERO ? "(not delegated)" : delegate;
}

async function delegate() {
  const raw = $("delegate-input").value.trim();
  const to = raw === "" ? account : raw;
  if (!ethers.isAddress(to)) { alert("Invalid address"); return; }
  log(`delegate(${to})…`);
  const tx = await token.delegate(to);
  await tx.wait();
  log(`delegate confirmed: ${tx.hash}`);
  await refreshUserStats();
}

async function refreshProposals() {
  const container = $("proposals");
  container.innerHTML = "<em>loading…</em>";
  try {
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter, 0, "latest");
    if (events.length === 0) {
      container.innerHTML = "<em>no proposals yet</em>";
      return;
    }
    const items = await Promise.all(events.map(async (ev) => {
      const id = ev.args.proposalId;
      const [state, votes] = await Promise.all([
        governor.state(id),
        governor.proposalVotes(id),
      ]);
      const voted = account ? await governor.hasVoted(id, account) : false;
      return { id, description: ev.args.description, proposer: ev.args.proposer, state: Number(state), votes, voted };
    }));
    container.innerHTML = "";
    for (const p of items.reverse()) {
      const stateLabel = STATE_LABELS[p.state];
      const card = document.createElement("div");
      card.className = "stat";
      card.style.display = "block";
      card.style.marginBottom = "0.8em";
      card.innerHTML = `
        <div><strong>${escapeHtml(p.description)}</strong>
             <span class="pill ${stateLabel}">${stateLabel}</span></div>
        <div class="mono">id: ${p.id.toString().slice(0, 24)}…</div>
        <div class="mono">proposer: ${p.proposer}</div>
        <div class="mono">For: ${ethers.formatEther(p.votes.forVotes)} ·
             Against: ${ethers.formatEther(p.votes.againstVotes)} ·
             Abstain: ${ethers.formatEther(p.votes.abstainVotes)}</div>
      `;
      if (p.state === 1 && !p.voted) {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <button data-vote="1">Vote For</button>
          <button class="danger" data-vote="0">Vote Against</button>
          <button class="ghost" data-vote="2">Abstain</button>
        `;
        row.querySelectorAll("button").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const support = Number(btn.dataset.vote);
            log(`castVote(${p.id.toString().slice(0, 10)}…, ${["Against", "For", "Abstain"][support]})…`);
            const tx = await governor.castVote(p.id, support);
            await tx.wait();
            log(`vote confirmed: ${tx.hash}`);
            await refreshProposals();
          });
        });
        card.appendChild(row);
      } else if (p.voted) {
        const note = document.createElement("div");
        note.className = "mono";
        note.style.marginTop = "0.5em";
        note.style.color = "#16a34a";
        note.textContent = "✓ You have voted on this proposal.";
        card.appendChild(note);
      }
      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = `<span style="color: #f87171">${escapeHtml(err.message)}</span>`;
    log(`refreshProposals failed: ${err.message}`);
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

$("btn-connect").addEventListener("click", connect);
$("btn-delegate").addEventListener("click", delegate);
$("btn-refresh").addEventListener("click", refreshProposals);

window.addEventListener("DOMContentLoaded", async () => {
  try { await loadDeployed(); } catch (e) { log(e.message); }
});
