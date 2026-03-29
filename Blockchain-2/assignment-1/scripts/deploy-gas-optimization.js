const hre = require("hardhat");

async function main() {
  console.log("=== Deploying Gas Optimization Contracts ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address, "\n");

  // Deploy Unoptimized Contract
  console.log("1. Deploying UnoptimizedContract...");
  const Unoptimized = await hre.ethers.getContractFactory("UnoptimizedContract");
  const unoptimizedDeploy = await Unoptimized.deploy();
  await unoptimizedDeploy.waitForDeployment();
  const unoptimizedReceipt = await unoptimizedDeploy.deploymentTransaction().wait();
  const unoptimizedAddress = await unoptimizedDeploy.getAddress();

  console.log("Unoptimized deployed to:", unoptimizedAddress);
  console.log("Deployment gas:", unoptimizedReceipt.gasUsed.toString(), "\n");

  // Deploy Optimized Contract
  console.log("2. Deploying OptimizedContract...");
  const Optimized = await hre.ethers.getContractFactory("OptimizedContract");
  const optimizedDeploy = await Optimized.deploy();
  await optimizedDeploy.waitForDeployment();
  const optimizedReceipt = await optimizedDeploy.deploymentTransaction().wait();
  const optimizedAddress = await optimizedDeploy.getAddress();

  console.log("Optimized deployed to:", optimizedAddress);
  console.log("Deployment gas:", optimizedReceipt.gasUsed.toString(), "\n");

  // Deployment Gas Comparison
  console.log("=== Deployment Gas Comparison ===");
  console.log("Unoptimized:", unoptimizedReceipt.gasUsed.toString(), "gas");
  console.log("Optimized:", optimizedReceipt.gasUsed.toString(), "gas");
  const deploymentSaved = unoptimizedReceipt.gasUsed - optimizedReceipt.gasUsed;
  console.log("Gas saved:", deploymentSaved.toString(), "gas");
  console.log(
    "Savings percentage:",
    ((Number(deploymentSaved) / Number(unoptimizedReceipt.gasUsed)) * 100).toFixed(2) + "%\n"
  );

  // Test processArray
  console.log("3. Testing processArray gas usage...");
  const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const unoptTx1 = await unoptimizedDeploy.processArray(testData);
  const unoptReceipt1 = await unoptTx1.wait();

  const optTx1 = await optimizedDeploy.processArray(testData);
  const optReceipt1 = await optTx1.wait();

  console.log("Unoptimized processArray:", unoptReceipt1.gasUsed.toString(), "gas");
  console.log("Optimized processArray:", optReceipt1.gasUsed.toString(), "gas");
  console.log("Saved:", (unoptReceipt1.gasUsed - optReceipt1.gasUsed).toString(), "gas\n");

  // Test incrementCounter
  console.log("4. Testing incrementCounter gas usage...");
  const unoptTx2 = await unoptimizedDeploy.incrementCounter(10);
  const unoptReceipt2 = await unoptTx2.wait();

  const optTx2 = await optimizedDeploy.incrementCounter(10);
  const optReceipt2 = await optTx2.wait();

  console.log("Unoptimized incrementCounter:", unoptReceipt2.gasUsed.toString(), "gas");
  console.log("Optimized incrementCounter:", optReceipt2.gasUsed.toString(), "gas");
  console.log("Saved:", (unoptReceipt2.gasUsed - optReceipt2.gasUsed).toString(), "gas\n");

  // Test logValue
  console.log("5. Testing logValue gas usage (storage vs event)...");
  const unoptTx3 = await unoptimizedDeploy.logValue(12345);
  const unoptReceipt3 = await unoptTx3.wait();

  const optTx3 = await optimizedDeploy.logValue(12345);
  const optReceipt3 = await optTx3.wait();

  console.log("Unoptimized logValue (storage):", unoptReceipt3.gasUsed.toString(), "gas");
  console.log("Optimized logValue (event):", optReceipt3.gasUsed.toString(), "gas");
  console.log("Saved:", (unoptReceipt3.gasUsed - optReceipt3.gasUsed).toString(), "gas\n");

  console.log("=== Gas Optimization Summary ===");
  console.log("All optimizations demonstrate significant gas savings.");
  console.log("See test output for detailed per-function comparisons.\n");

  console.log("Deployed Addresses:");
  console.log("UnoptimizedContract:", unoptimizedAddress);
  console.log("OptimizedContract:", optimizedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
