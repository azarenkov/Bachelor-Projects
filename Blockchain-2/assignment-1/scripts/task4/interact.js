/**
 * Task 4 — Interaction Script
 *
 * Benchmarks all three assembly operations vs their Solidity equivalents:
 *   1. caller() vs msg.sender
 *   2. Bitwise power-of-two (assembly and()) vs Solidity bitwise
 *   3. sload/sstore vs normal storage access
 *
 * Also reads raw storage slot to show assembly can access any slot directly.
 *
 * Usage:
 *   npx hardhat run scripts/task4/interact.js --network localhost
 */
const { ethers } = require("hardhat");

function separator(label) {
  const line = "─".repeat(52);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${label.padEnd(50)}│`);
  console.log(`└${line}┘`);
}

async function estimateAndCall(contract, method, ...args) {
  const gas = await contract[method].estimateGas(...args);
  return gas;
}

async function main() {
  const [deployer, caller] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Caller  :", caller.address);

  // ── Deploy ────────────────────────────────────────────────────────────────
  const AssemblyOps = await ethers.getContractFactory("AssemblyOps");
  const contract = await AssemblyOps.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("\nAssemblyOps deployed:", addr);

  const gasResults = [];

  // ───────────────────────────────────────────────────────────────────────────
  separator("Operation 1 — Read caller address");
  // ───────────────────────────────────────────────────────────────────────────

  // Assembly: caller()
  const asmCallerResult = await contract.connect(caller).getCallerAssembly.staticCall();
  const asmCallerGas    = await contract.connect(caller).getCallerAssembly.estimateGas();

  // Solidity: msg.sender
  const solCallerResult = await contract.connect(caller).getCallerSolidity.staticCall();
  const solCallerGas    = await contract.connect(caller).getCallerSolidity.estimateGas();

  console.log("Assembly  result :", asmCallerResult, `(${asmCallerGas} gas)`);
  console.log("Solidity  result :", solCallerResult, `(${solCallerGas} gas)`);
  console.log("Results match    :", asmCallerResult.toLowerCase() === caller.address.toLowerCase());
  gasResults.push({ op: "getCaller()", asm: asmCallerGas, sol: solCallerGas });

  // ───────────────────────────────────────────────────────────────────────────
  separator("Operation 2 — Power-of-two check");
  // ───────────────────────────────────────────────────────────────────────────

  const testValues = [0n, 1n, 2n, 3n, 4n, 7n, 8n, 15n, 16n, 1024n, 1025n];
  console.log("n".padEnd(8), "assembly".padEnd(10), "solidity".padEnd(10), "match");
  for (const v of testValues) {
    const asmR = await contract.isPowerOfTwoAssembly.staticCall(v);
    const solR = await contract.isPowerOfTwoSolidity.staticCall(v);
    const asmBool = asmR === 1n;
    const match = asmBool === solR;
    console.log(String(v).padEnd(8), String(asmBool).padEnd(10), String(solR).padEnd(10), match ? "✓" : "✗");
  }

  const asmPow2Gas = await contract.isPowerOfTwoAssembly.estimateGas(1024n);
  const solPow2Gas = await contract.isPowerOfTwoSolidity.estimateGas(1024n);
  console.log(`\nGas for isPowerOfTwo(1024): assembly=${asmPow2Gas}, solidity=${solPow2Gas}`);
  gasResults.push({ op: "isPowerOfTwo(1024)", asm: asmPow2Gas, sol: solPow2Gas });

  // ───────────────────────────────────────────────────────────────────────────
  separator("Operation 3 — Storage read/write via sload/sstore");
  // ───────────────────────────────────────────────────────────────────────────

  // Write via assembly, read via assembly
  const writeTxAsm = await contract.writeStorageAssembly(999n);
  await writeTxAsm.wait();
  const readAsm = await contract.readStorageAssembly.staticCall();
  console.log("Written via sstore, read via sload:", readAsm.toString());

  // Write via Solidity, read via Solidity
  const writeTxSol = await contract.writeStorageSolidity(12345n);
  await writeTxSol.wait();
  const readSol = await contract.readStorageSolidity.staticCall();
  console.log("Written via Solidity, read via Solidity:", readSol.toString());

  // Cross-verify: write via Solidity, read raw slot 0 via provider
  const rawSlot = await ethers.provider.getStorage(addr, 0);
  console.log("Raw slot 0 via eth_getStorageAt :", BigInt(rawSlot).toString(), "(should be 12345)");

  // Write via assembly, verify with raw slot
  await (await contract.writeStorageAssembly(777777n)).wait();
  const rawSlot2 = await ethers.provider.getStorage(addr, 0);
  console.log("After sstore(0, 777777), raw slot:", BigInt(rawSlot2).toString());

  // Gas comparison for write
  const asmWriteGas = await contract.writeStorageAssembly.estimateGas(42n);
  const solWriteGas = await contract.writeStorageSolidity.estimateGas(42n);
  console.log(`\nGas for write: assembly=${asmWriteGas}, solidity=${solWriteGas}`);
  gasResults.push({ op: "writeStorage", asm: asmWriteGas, sol: solWriteGas });

  const asmReadGas = await contract.readStorageAssembly.estimateGas();
  const solReadGas = await contract.readStorageSolidity.estimateGas();
  console.log(`Gas for read:  assembly=${asmReadGas}, solidity=${solReadGas}`);
  gasResults.push({ op: "readStorage", asm: asmReadGas, sol: solReadGas });

  // ───────────────────────────────────────────────────────────────────────────
  separator("Assembly vs Solidity — Gas Summary Table");
  // ───────────────────────────────────────────────────────────────────────────
  console.log(
    `${"Operation".padEnd(22)} │ ${"Assembly".padStart(9)} │ ${"Solidity".padStart(9)} │ ${"Saved".padStart(8)} │ ${"Note".padStart(16)}`
  );
  console.log("─".repeat(22) + "─┼─" + "─".repeat(11) + "┼─" + "─".repeat(11) + "┼─" + "─".repeat(10) + "┼─" + "─".repeat(17));
  for (const r of gasResults) {
    const saved = r.sol - r.asm;
    const note = saved > 0n ? "asm cheaper" : saved < 0n ? "sol cheaper" : "equal";
    console.log(
      `${r.op.padEnd(22)} │ ${String(r.asm).padStart(9)} │ ${String(r.sol).padStart(9)} │ ${String(saved).padStart(8)} │ ${note.padStart(16)}`
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  separator("When is assembly justified?");
  // ───────────────────────────────────────────────────────────────────────────
  console.log(`
  Assembly (Yul) is justified when:
  ✓ Gas savings are significant in hot paths (e.g. ERC-20 transfers, loops)
  ✓ Low-level storage/memory layout control is required (proxies, EIP-1967)
  ✓ Cryptographic operations not available in Solidity (e.g. custom hash)

  Risks:
  ✗ No type safety — wrong slot writes corrupt state silently
  ✗ Harder to audit — reviewers must understand EVM opcodes
  ✗ Can break on Solidity version changes (optimizer, ABI encoding)
  ✗ Bypasses Solidity overflow checks (must verify manually)
  `);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
