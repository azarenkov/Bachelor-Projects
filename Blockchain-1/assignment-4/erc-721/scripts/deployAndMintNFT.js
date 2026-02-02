const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("ERC-721 NFT: DEPLOYMENT + MINTING 3 NFTs");
  console.log("=".repeat(70));

  const [owner, addr1, addr2] = await hre.ethers.getSigners();

  console.log("\nDeployment Information:");
  console.log("  Deployer Address:", owner.address);
  console.log("  Network:", hre.network.name);
  console.log(
    "  Balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(owner.address)),
    "ETH"
  );

  // STEP 1: DEPLOY
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: DEPLOYING NFT CONTRACT");
  console.log("=".repeat(70));

  const NFT_NAME = "MyAwesomeNFT";
  const NFT_SYMBOL = "MANFT";

  console.log("\n  Collection Name:", NFT_NAME);
  console.log("  Collection Symbol:", NFT_SYMBOL);

  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  console.log("\n  Deploying...");

  const nft = await MyNFT.deploy(NFT_NAME, NFT_SYMBOL);
  await nft.waitForDeployment();

  const nftAddress = await nft.getAddress();
  console.log("\n  Contract deployed successfully!");
  console.log("  Contract Address:", nftAddress);

  // STEP 2: MINT 3 NFTs
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: MINTING 3 NFTs WITH METADATA");
  console.log("=".repeat(70));

  const nftData = [
    {
      recipient: owner.address,
      recipientName: "Owner (Deployer)",
      uri: "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/dragon.json",
      name: "Epic Dragon NFT",
      description: "A legendary dragon with fire-breathing abilities",
    },
    {
      recipient: addr1.address,
      recipientName: "Address 1",
      uri: "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/phoenix.json",
      name: "Mystical Phoenix NFT",
      description: "A rare phoenix that rises from ashes",
    },
    {
      recipient: addr2.address,
      recipientName: "Address 2",
      uri: "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/unicorn.json",
      name: "Sacred Unicorn NFT",
      description: "A magical unicorn with healing powers",
    },
  ];

  const mintedNFTs = [];

  for (let i = 0; i < nftData.length; i++) {
    const data = nftData[i];
    console.log(`\n  ${data.name}`);
    console.log("  " + "-".repeat(66));
    console.log(`  Description: ${data.description}`);
    console.log(`  Recipient: ${data.recipientName}`);
    console.log(`  Address: ${data.recipient}`);
    console.log(`  Token URI: ${data.uri}`);

    console.log(`  Minting...`);
    const tx = await nft.mint(data.recipient, data.uri);
    const receipt = await tx.wait();

    const tokenId = i + 1;
    console.log(`  Successfully minted!`);
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Transaction Hash: ${receipt.hash}`);

    mintedNFTs.push({ ...data, tokenId, txHash: receipt.hash });
  }

  // STEP 3: VERIFY OWNERSHIP
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: NFT OWNERSHIP VERIFICATION");
  console.log("=".repeat(70));

  for (const nftInfo of mintedNFTs) {
    console.log(`\n  NFT: ${nftInfo.name}`);
    console.log("  " + "-".repeat(66));

    const currentOwner = await nft.ownerOf(nftInfo.tokenId);
    const tokenURI = await nft.tokenURI(nftInfo.tokenId);

    console.log(`  Token ID: ${nftInfo.tokenId}`);
    console.log(`  Current Owner: ${currentOwner}`);
    console.log(`  Token URI: ${tokenURI}`);
    console.log(`  Mint Transaction: ${nftInfo.txHash}`);
  }

  // STEP 4: STATISTICS
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: OWNERSHIP STATISTICS");
  console.log("=".repeat(70));

  const addresses = [
    { name: "Owner (Deployer)", addr: owner.address },
    { name: "Address 1", addr: addr1.address },
    { name: "Address 2", addr: addr2.address },
  ];

  for (const account of addresses) {
    const balance = await nft.balanceOf(account.addr);
    const tokens = await nft.tokensOfOwner(account.addr);

    console.log(`\n  Account: ${account.name}`);
    console.log("  " + "-".repeat(66));
    console.log(`  Address: ${account.addr}`);
    console.log(`  NFT Balance: ${balance}`);
    console.log(`  Owned Token IDs: [${tokens.join(", ")}]`);
  }

  // FINAL SUMMARY
  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYMENT AND MINTING COMPLETED SUCCESSFULLY");
  console.log("=".repeat(70));
  console.log(`\n  Contract Address: ${nftAddress}`);
  console.log(`  Network: ${hre.network.name}`);
  console.log(`  Collection: ${NFT_NAME} (${NFT_SYMBOL})`);
  console.log(`  Total NFTs Minted: ${mintedNFTs.length}`);
  console.log("\n  TAKE SCREENSHOTS OF THIS OUTPUT FOR YOUR ASSIGNMENT");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error);
    process.exit(1);
  });
