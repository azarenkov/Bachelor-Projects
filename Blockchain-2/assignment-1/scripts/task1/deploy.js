const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ── Deploy Factory ──
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddr);

  // ── Deploy via CREATE ──
  const tx1 = await factory.deployWithCreate("AlphaChild");
  const r1 = await tx1.wait();
  const gasCreate = r1.gasUsed;
  console.log(`\nCREATE  deployment gas: ${gasCreate}`);

  // ── Deploy via CREATE2 ──
  const salt = ethers.keccak256(ethers.toUtf8Bytes("unique-salt-001"));
  const tx2 = await factory.deployWithCreate2("BetaChild", salt);
  const r2 = await tx2.wait();
  const gasCreate2 = r2.gasUsed;
  console.log(`CREATE2 deployment gas: ${gasCreate2}`);

  // ── Print gas comparison ──
  console.log("\n╔══════════════════════════════════╗");
  console.log("║   CREATE vs CREATE2 Gas Table    ║");
  console.log("╠══════════════════════════════════╣");
  console.log(`║ CREATE :  ${String(gasCreate).padStart(10)} gas         ║`);
  console.log(`║ CREATE2:  ${String(gasCreate2).padStart(10)} gas         ║`);
  console.log(`║ Delta  :  ${String(gasCreate2 > gasCreate ? "+" : "") + (gasCreate2 - gasCreate)} gas         ║`);
  console.log("╚══════════════════════════════════╝");

  // ── List all deployed contracts ──
  const deployed = await factory.getDeployedContracts();
  console.log("\nAll deployed child contracts:");
  deployed.forEach((addr, i) => console.log(`  [${i}] ${addr}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
