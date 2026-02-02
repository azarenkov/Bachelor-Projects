const hre = require("hardhat");

async function main() {
  const address = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";
  console.log("Checking contract at:", address);
  
  const code = await hre.ethers.provider.getCode(address);
  console.log("Contract code length:", code.length);
  
  if (code === "0x") {
    console.log("ERROR: No contract at this address!");
    return;
  }
  
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = MyToken.attach(address);
  
  try {
    const name = await token.name();
    console.log("SUCCESS! Contract name:", name);
  } catch (e) {
    console.log("ERROR calling contract:", e.message);
  }
}

main().catch(console.error);
