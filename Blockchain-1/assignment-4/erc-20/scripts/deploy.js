const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString(),
  );

  const initialSupply = hre.ethers.parseUnits("1000000", 18); // 1 миллион токенов с 18 decimals

  console.log("\nDeploying MyToken...");
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(initialSupply);

  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("MyToken deployed to:", tokenAddress);
  console.log(
    "Initial supply:",
    hre.ethers.formatUnits(initialSupply, 18),
    "MTK",
  );
  console.log("Owner:", deployer.address);

  console.log("\n--- Deployment Summary ---");
  console.log("Contract Address:", tokenAddress);
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
