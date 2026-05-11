const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const STATE_NAMES = [
  "Pending", "Active", "Canceled", "Defeated",
  "Succeeded", "Queued", "Expired", "Executed",
];

async function mine(n = 1) {
  for (let i = 0; i < n; i++) await ethers.provider.send("evm_mine", []);
}

async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await mine(1);
}

async function main() {
  const deployed = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployed.json"), "utf8")
  );

  const [, , airdrop, liquidity] = await ethers.getSigners();

  const token = await ethers.getContractAt("GovernanceToken", deployed.GovernanceToken);
  const governor = await ethers.getContractAt("MyGovernor", deployed.Governor);
  const box = await ethers.getContractAt("Box", deployed.Box);

  await (await token.connect(airdrop).delegate(airdrop.address)).wait();
  await (await token.connect(liquidity).delegate(liquidity.address)).wait();
  await mine(1);

  console.log("\n>>> Building proposal: Box.store(42)");
  const targets = [deployed.Box];
  const values = [0];
  const calldatas = [box.interface.encodeFunctionData("store", [42])];
  const description = "Demo #" + Date.now() + ": Set Box value to 42";
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

  console.log(">>> propose()");
  const txProp = await governor.connect(airdrop).propose(targets, values, calldatas, description);
  const rcptProp = await txProp.wait();
  const ev = rcptProp.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
  const proposalId = ev.args.proposalId;
  console.log("    proposalId =", proposalId.toString());
  console.log("    state      =", STATE_NAMES[Number(await governor.state(proposalId))]);

  console.log(">>> Advance past voting delay (1 day)");
  await increaseTime(24 * 60 * 60 + 1);
  console.log("    state      =", STATE_NAMES[Number(await governor.state(proposalId))]);

  console.log(">>> Cast FOR votes from airdrop + liquidity signers");
  await (await governor.connect(airdrop).castVote(proposalId, 1)).wait();
  await (await governor.connect(liquidity).castVote(proposalId, 1)).wait();

  const { againstVotes, forVotes, abstainVotes } = await governor.proposalVotes(proposalId);
  console.log("    for =", ethers.formatEther(forVotes),
              "against =", ethers.formatEther(againstVotes),
              "abstain =", ethers.formatEther(abstainVotes));

  console.log(">>> Advance past voting period (1 week)");
  await increaseTime(7 * 24 * 60 * 60 + 1);
  console.log("    state      =", STATE_NAMES[Number(await governor.state(proposalId))]);

  console.log(">>> queue()");
  await (await governor.queue(targets, values, calldatas, descriptionHash)).wait();
  console.log("    state      =", STATE_NAMES[Number(await governor.state(proposalId))]);

  console.log(">>> Advance past timelock delay (2 days)");
  await increaseTime(2 * 24 * 60 * 60 + 1);

  console.log(">>> execute()");
  await (await governor.execute(targets, values, calldatas, descriptionHash)).wait();
  console.log("    state      =", STATE_NAMES[Number(await governor.state(proposalId))]);

  console.log("\n>>> Box.retrieve() =", (await box.retrieve()).toString());
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
