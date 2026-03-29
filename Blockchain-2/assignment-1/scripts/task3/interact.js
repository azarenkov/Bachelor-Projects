/**
 * Task 3 — Interaction Script
 *
 * Benchmarks every public function of UnoptimizedStore vs OptimizedStore:
 *   1. Deploy both contracts fresh
 *   2. addValues — batch insert with fee deduction (memory vs calldata)
 *   3. sumValues — iterate over stored array
 *   4. isPowerOfTwo — loop vs bitwise check
 *   5. Print full gas comparison table
 *
 * Usage:
 *   npx hardhat run scripts/task3/interact.js --network localhost
 */
const { ethers } = require("hardhat");

function separator(label) {
  const line = "─".repeat(52);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${label.padEnd(50)}│`);
  console.log(`└${line}┘`);
}

async function gasOf(tx) {
  const r = await tx.wait();
  return r.gasUsed;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // ── Deploy both contracts ──────────────────────────────────────────────────
  separator("Deploy — UnoptimizedStore & OptimizedStore");

  const Unopt = await ethers.getContractFactory("UnoptimizedStore");
  const unopt = await Unopt.deploy();
  await unopt.waitForDeployment();
  const unoptAddr = await unopt.getAddress();
  console.log("UnoptimizedStore:", unoptAddr);

  const Opt = await ethers.getContractFactory("OptimizedStore");
  const opt = await Opt.deploy(300, ethers.ZeroAddress);
  await opt.waitForDeployment();
  const optAddr = await opt.getAddress();
  console.log("OptimizedStore  :", optAddr);

  const results = [];

  // ── Benchmark 1: addValues (small batch — 3 items) ────────────────────────
  separator("Benchmark 1 — addValues (3 items)");
  const vals3 = [1000n, 2000n, 3000n];
  const g1u = await gasOf(await unopt.addValues(vals3));
  const g1o = await gasOf(await opt.addValues(vals3));
  console.log("Unoptimized:", g1u.toString(), "gas");
  console.log("Optimized  :", g1o.toString(), "gas");
  console.log("Saved      :", (g1u - g1o).toString(), "gas");
  results.push({ fn: "addValues(3)", unopt: g1u, opt: g1o });

  // ── Benchmark 2: addValues (large batch — 10 items) ───────────────────────
  separator("Benchmark 2 — addValues (10 items)");
  const vals10 = Array.from({ length: 10 }, (_, i) => BigInt((i + 1) * 1000));
  const g2u = await gasOf(await unopt.addValues(vals10));
  const g2o = await gasOf(await opt.addValues(vals10));
  console.log("Unoptimized:", g2u.toString(), "gas");
  console.log("Optimized  :", g2o.toString(), "gas");
  console.log("Saved      :", (g2u - g2o).toString(), "gas");
  results.push({ fn: "addValues(10)", unopt: g2u, opt: g2o });

  // ── Benchmark 3: sumValues ─────────────────────────────────────────────────
  separator("Benchmark 3 — sumValues (reads all stored elements)");
  // sumValues is a view call — use eth_call gas estimation
  const g3u = await unopt.sumValues.estimateGas();
  const g3o = await opt.sumValues.estimateGas();
  console.log("Unoptimized:", g3u.toString(), "gas");
  console.log("Optimized  :", g3o.toString(), "gas");
  console.log("Saved      :", (g3u - g3o).toString(), "gas");
  results.push({ fn: "sumValues()", unopt: g3u, opt: g3o });

  // ── Benchmark 4: isPowerOfTwo ─────────────────────────────────────────────
  separator("Benchmark 4 — isPowerOfTwo(1024)");
  const g4u = await unopt.isPowerOfTwo.estimateGas(1024n);
  const g4o = await opt.isPowerOfTwo.estimateGas(1024n);
  console.log("Unoptimized:", g4u.toString(), "gas  (while-loop)");
  console.log("Optimized  :", g4o.toString(), "gas  (bitwise)");
  console.log("Saved      :", (g4u - g4o).toString(), "gas");
  results.push({ fn: "isPowerOfTwo(1024)", unopt: g4u, opt: g4o });

  // ── Full gas comparison table ─────────────────────────────────────────────
  separator("Gas Optimization Summary Table");
  const col = 20;
  console.log(
    `${"Function".padEnd(col)} │ ${"Unoptimized".padStart(11)} │ ${"Optimized".padStart(9)} │ ${"Saved".padStart(8)} │ ${"Saving %".padStart(9)}`
  );
  console.log("─".repeat(col) + "─┼─" + "─".repeat(13) + "┼─" + "─".repeat(11) + "┼─" + "─".repeat(10) + "┼─" + "─".repeat(11));
  for (const r of results) {
    const saved = r.unopt - r.opt;
    const pct = ((Number(saved) / Number(r.unopt)) * 100).toFixed(1);
    console.log(
      `${r.fn.padEnd(col)} │ ${String(r.unopt).padStart(11)} │ ${String(r.opt).padStart(9)} │ ${String(saved).padStart(8)} │ ${(pct + "%").padStart(9)}`
    );
  }

  // ── Verify correctness ────────────────────────────────────────────────────
  separator("Correctness Verification");
  console.log("UnoptimizedStore totalSupply:", (await unopt.totalSupply()).toString());
  console.log("OptimizedStore   totalSupply:", (await opt.totalSupply()).toString());
  console.log("isPowerOfTwo(16) unopt:", await unopt.isPowerOfTwo(16n));
  console.log("isPowerOfTwo(16) opt  :", await opt.isPowerOfTwo(16n));
  console.log("isPowerOfTwo(15) unopt:", await unopt.isPowerOfTwo(15n));
  console.log("isPowerOfTwo(15) opt  :", await opt.isPowerOfTwo(15n));

  // ── Storage slot layout demo ──────────────────────────────────────────────
  separator("Storage Layout: packing demo");
  const slot0unopt = await ethers.provider.getStorage(unoptAddr, 0);
  const slot0opt = await ethers.provider.getStorage(optAddr, 0);
  console.log("UnoptimizedStore slot 0 (paused only)  :", slot0unopt);
  console.log("OptimizedStore   slot 0 (packed fields):", slot0opt);
  console.log("  → packed slot holds paused+initialized+decimals+owner in one 32-byte word");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
