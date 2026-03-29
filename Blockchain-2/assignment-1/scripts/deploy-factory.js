const hre = require("hardhat");

async function main() {
  console.log("=== Deploying Factory Pattern Contracts ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy Factory
  console.log("1. Deploying Factory contract...");
  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress, "\n");

  // Deploy child contracts using CREATE
  console.log("2. Deploying child contracts using CREATE...");
  const createTx1 = await factory.deployWithCreate("Child1-CREATE");
  const createReceipt1 = await createTx1.wait();
  console.log("CREATE deployment 1 - Gas used:", createReceipt1.gasUsed.toString());

  const createTx2 = await factory.deployWithCreate("Child2-CREATE");
  const createReceipt2 = await createTx2.wait();
  console.log("CREATE deployment 2 - Gas used:", createReceipt2.gasUsed.toString(), "\n");

  // Deploy child contracts using CREATE2
  console.log("3. Deploying child contracts using CREATE2...");
  const salt1 = hre.ethers.encodeBytes32String("salt1");
  const salt2 = hre.ethers.encodeBytes32String("salt2");

  const create2Tx1 = await factory.deployWithCreate2("Child1-CREATE2", salt1);
  const create2Receipt1 = await create2Tx1.wait();
  console.log("CREATE2 deployment 1 - Gas used:", create2Receipt1.gasUsed.toString());

  const create2Tx2 = await factory.deployWithCreate2("Child2-CREATE2", salt2);
  const create2Receipt2 = await create2Tx2.wait();
  console.log("CREATE2 deployment 2 - Gas used:", create2Receipt2.gasUsed.toString(), "\n");

  // Get all deployed contracts
  const deployedContracts = await factory.getDeployedContracts();
  console.log("4. All deployed child contracts:");
  deployedContracts.forEach((address, index) => {
    console.log(`   [${index}] ${address}`);
  });

  // Gas comparison
  console.log("\n=== Gas Comparison ===");
  const avgCREATE = (createReceipt1.gasUsed + createReceipt2.gasUsed) / BigInt(2);
  const avgCREATE2 = (create2Receipt1.gasUsed + create2Receipt2.gasUsed) / BigInt(2);
  console.log("Average CREATE gas:", avgCREATE.toString());
  console.log("Average CREATE2 gas:", avgCREATE2.toString());
  console.log("Difference:", (avgCREATE2 - avgCREATE).toString(), "gas");
  console.log("CREATE2 is", (avgCREATE2 > avgCREATE ? "more" : "less"), "expensive\n");

  // Verify CREATE2 address prediction
  console.log("5. Verifying CREATE2 address prediction...");
  const predictedSalt = hre.ethers.encodeBytes32String("predicted");
  const predictedAddress = await factory.computeCreate2Address(
    deployer.address,
    "PredictedChild",
    predictedSalt
  );
  console.log("Predicted address:", predictedAddress);

  const deployPredictedTx = await factory.deployWithCreate2("PredictedChild", predictedSalt);
  await deployPredictedTx.wait();

  const allContracts = await factory.getDeployedContracts();
  const actualAddress = allContracts[allContracts.length - 1];
  console.log("Actual address:", actualAddress);
  console.log("Prediction matches:", predictedAddress === actualAddress ? "✓" : "✗", "\n");

  console.log("=== Factory Deployment Complete ===");
  console.log("\nDeployed Addresses:");
  console.log("Factory:", factoryAddress);
  console.log("Total child contracts deployed:", allContracts.length);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
