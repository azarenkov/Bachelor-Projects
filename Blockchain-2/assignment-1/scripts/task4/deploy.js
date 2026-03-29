/**
 * Task 4 — Deploy Script
 *
 * Deploys the AssemblyOps contract.
 *
 * Usage:
 *   npx hardhat run scripts/task4/deploy.js --network localhost
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const AssemblyOps = await ethers.getContractFactory("AssemblyOps");
  const contract = await AssemblyOps.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();

  const receipt = await ethers.provider.getTransactionReceipt(
    contract.deploymentTransaction().hash
  );

  console.log("\nAssemblyOps deployed:", addr);
  console.log("Deployment gas used :", receipt.gasUsed.toString());
  console.log("\nInitial state:");
  console.log("  owner       :", await contract.owner());
  console.log("  storedValue :", (await contract.readStorageAssembly.staticCall()).toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
