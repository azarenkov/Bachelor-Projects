const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Crowdfunding contract (it will automatically deploy RewardToken)
  console.log("Deploying Crowdfunding contract...");
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();
  await crowdfunding.waitForDeployment();

  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("✅ Crowdfunding deployed to:", crowdfundingAddress);

  // Get RewardToken address
  const rewardTokenAddress = await crowdfunding.rewardToken();
  console.log("✅ RewardToken deployed to:", rewardTokenAddress);

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Crowdfunding Contract:", crowdfundingAddress);
  console.log("RewardToken Contract:", rewardTokenAddress);
  console.log("=".repeat(60) + "\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    crowdfundingAddress: crowdfundingAddress,
    rewardTokenAddress: rewardTokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", filepath);

  // Update frontend contracts.js file
  const frontendContractsPath = path.join(
    __dirname,
    "../frontend/contracts.js"
  );

  if (fs.existsSync(frontendContractsPath)) {
    let contractsContent = fs.readFileSync(frontendContractsPath, "utf8");

    // Update the address
    contractsContent = contractsContent.replace(
      /CROWDFUNDING_ADDRESS:\s*"0x[a-fA-F0-9]{40}"/,
      `CROWDFUNDING_ADDRESS: "${crowdfundingAddress}"`
    );

    fs.writeFileSync(frontendContractsPath, contractsContent);
    console.log("✅ Frontend contracts.js updated with new address\n");
  }

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n" + "=".repeat(60));
    console.log("Contract Verification");
    console.log("=".repeat(60));
    console.log(
      "To verify the Crowdfunding contract on Etherscan, run:\n"
    );
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${crowdfundingAddress}`
    );
    console.log("=".repeat(60) + "\n");
  }

  console.log("🎉 Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
