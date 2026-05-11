const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const TIMELOCK_DELAY = 2 * 24 * 60 * 60;

const PCT_TEAM      = 40n;
const PCT_TREASURY  = 30n;
const PCT_AIRDROP   = 20n;
const PCT_LIQUIDITY = 10n;

const VEST_DURATION = 12n * 30n * 24n * 60n * 60n;

async function main() {
  const [deployer, team, airdrop, liquidity] = await ethers.getSigners();
  console.log("deployer  :", deployer.address);
  console.log("team      :", team.address);
  console.log("airdrop   :", airdrop.address);
  console.log("liquidity :", liquidity.address);

  const Token = await ethers.getContractFactory("GovernanceToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  console.log("\nGovernanceToken :", await token.getAddress());

  const Timelock = await ethers.getContractFactory("TimelockController");
  const timelock = await Timelock.deploy(TIMELOCK_DELAY, [], [], deployer.address);
  await timelock.waitForDeployment();
  console.log("Timelock        :", await timelock.getAddress());

  const Governor = await ethers.getContractFactory("MyGovernor");
  const governor = await Governor.deploy(await token.getAddress(), await timelock.getAddress());
  await governor.waitForDeployment();
  console.log("Governor        :", await governor.getAddress());

  const PROPOSER = await timelock.PROPOSER_ROLE();
  const EXECUTOR = await timelock.EXECUTOR_ROLE();
  const ADMIN    = await timelock.DEFAULT_ADMIN_ROLE();
  await (await timelock.grantRole(PROPOSER, await governor.getAddress())).wait();
  await (await timelock.grantRole(EXECUTOR, ethers.ZeroAddress)).wait();
  await (await timelock.renounceRole(ADMIN, deployer.address)).wait();
  console.log("roles wired: Governor=proposer, anyone=executor, deployer renounced admin");

  const Box = await ethers.getContractFactory("Box");
  const box = await Box.deploy(await timelock.getAddress());
  await box.waitForDeployment();
  console.log("Box             :", await box.getAddress());

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(await timelock.getAddress());
  await treasury.waitForDeployment();
  console.log("Treasury        :", await treasury.getAddress());

  const total = await token.totalSupply();
  const teamAlloc      = (total * PCT_TEAM)      / 100n;
  const treasuryAlloc  = (total * PCT_TREASURY)  / 100n;
  const airdropAlloc   = (total * PCT_AIRDROP)   / 100n;
  const liquidityAlloc = (total * PCT_LIQUIDITY) / 100n;

  const Vesting = await ethers.getContractFactory("TokenVesting");
  const start = BigInt(Math.floor(Date.now() / 1000));
  const vesting = await Vesting.deploy(
    await token.getAddress(),
    team.address,
    start,
    VEST_DURATION,
    teamAlloc
  );
  await vesting.waitForDeployment();
  console.log("TokenVesting    :", await vesting.getAddress());

  await (await token.transfer(await vesting.getAddress(), teamAlloc)).wait();
  await (await token.transfer(await treasury.getAddress(), treasuryAlloc)).wait();
  await (await token.transfer(airdrop.address, airdropAlloc)).wait();
  await (await token.transfer(liquidity.address, liquidityAlloc)).wait();

  console.log("\n--- token distribution ---");
  console.log("team (vested)  :", ethers.formatEther(teamAlloc));
  console.log("treasury       :", ethers.formatEther(treasuryAlloc));
  console.log("airdrop        :", ethers.formatEther(airdropAlloc));
  console.log("liquidity      :", ethers.formatEther(liquidityAlloc));
  console.log("deployer leftover:", ethers.formatEther(await token.balanceOf(deployer.address)));

  const addrs = {
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    GovernanceToken: await token.getAddress(),
    Timelock:        await timelock.getAddress(),
    Governor:        await governor.getAddress(),
    Box:             await box.getAddress(),
    Treasury:        await treasury.getAddress(),
    TokenVesting:    await vesting.getAddress(),
    distribution: {
      team:      ethers.formatEther(teamAlloc),
      treasury:  ethers.formatEther(treasuryAlloc),
      airdrop:   ethers.formatEther(airdropAlloc),
      liquidity: ethers.formatEther(liquidityAlloc),
    },
  };
  const outPath = path.join(__dirname, "..", "deployed.json");
  fs.writeFileSync(outPath, JSON.stringify(addrs, null, 2));
  const frontPath = path.join(__dirname, "..", "frontend", "deployed.json");
  fs.writeFileSync(frontPath, JSON.stringify(addrs, null, 2));
  console.log("\nWrote", outPath);
  console.log("Wrote", frontPath);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
