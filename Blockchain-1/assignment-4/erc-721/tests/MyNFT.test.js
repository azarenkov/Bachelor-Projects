const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT ERC-721 Contract", function () {
  let MyNFT;
  let nft;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const NFT_NAME = "MyAwesomeNFT";
  const NFT_SYMBOL = "MANFT";
  const TOKEN_URI_1 = "https://ipfs.io/ipfs/QmTest1/metadata.json";
  const TOKEN_URI_2 = "https://ipfs.io/ipfs/QmTest2/metadata.json";
  const TOKEN_URI_3 = "https://ipfs.io/ipfs/QmTest3/metadata.json";

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy(NFT_NAME, NFT_SYMBOL);
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nft.name()).to.equal(NFT_NAME);
      expect(await nft.symbol()).to.equal(NFT_SYMBOL);
    });

    it("Should start with zero total supply", async function () {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should successfully mint an NFT", async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);

      const balance = await nft.balanceOf(addr1.address);
      expect(balance).to.equal(1);
    });

    it("Should mint with correct token ID", async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);

      const owner1 = await nft.ownerOf(1);
      expect(owner1).to.equal(addr1.address);
    });

    it("Should mint multiple NFTs with sequential IDs", async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);
      await nft.mint(addr2.address, TOKEN_URI_2);
      await nft.mint(addr1.address, TOKEN_URI_3);

      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.ownerOf(2)).to.equal(addr2.address);
      expect(await nft.ownerOf(3)).to.equal(addr1.address);
    });

    it("Should emit NFTMinted event", async function () {
      await expect(nft.mint(addr1.address, TOKEN_URI_1))
        .to.emit(nft, "NFTMinted")
        .withArgs(addr1.address, 1, TOKEN_URI_1);
    });

    it("Should fail if non-owner tries to mint", async function () {
      await expect(
        nft.connect(addr1).mint(addr2.address, TOKEN_URI_1)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("Should fail to mint to zero address", async function () {
      await expect(
        nft.mint(ethers.ZeroAddress, TOKEN_URI_1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should fail to mint with empty URI", async function () {
      await expect(nft.mint(addr1.address, "")).to.be.revertedWith(
        "URI cannot be empty"
      );
    });

    it("Should update balance correctly after minting", async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);

      await nft.mint(addr1.address, TOKEN_URI_2);
      expect(await nft.balanceOf(addr1.address)).to.equal(2);

      await nft.mint(addr2.address, TOKEN_URI_3);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
    });
  });

  describe("Ownership Checks", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);
      await nft.mint(addr2.address, TOKEN_URI_2);
      await nft.mint(addr1.address, TOKEN_URI_3);
    });

    it("Should return correct owner of token", async function () {
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.ownerOf(2)).to.equal(addr2.address);
      expect(await nft.ownerOf(3)).to.equal(addr1.address);
    });

    it("Should return correct balance for address", async function () {
      expect(await nft.balanceOf(addr1.address)).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.balanceOf(owner.address)).to.equal(0);
    });

    it("Should fail to query owner of non-existent token", async function () {
      await expect(nft.ownerOf(999)).to.be.revertedWithCustomError(
        nft,
        "ERC721NonexistentToken"
      );
    });

    it("Should fail to query balance of zero address", async function () {
      await expect(
        nft.balanceOf(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(nft, "ERC721InvalidOwner");
    });

    it("Should track tokens owned by address", async function () {
      const addr1Tokens = await nft.tokensOfOwner(addr1.address);
      expect(addr1Tokens.length).to.equal(2);
      expect(addr1Tokens[0]).to.equal(1);
      expect(addr1Tokens[1]).to.equal(3);

      const addr2Tokens = await nft.tokensOfOwner(addr2.address);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0]).to.equal(2);
    });

    it("Should fail to query tokens of zero address", async function () {
      await expect(nft.tokensOfOwner(ethers.ZeroAddress)).to.be.revertedWith(
        "Cannot query zero address"
      );
    });
  });

  describe("TokenURI Retrieval", function () {
    it("Should return correct tokenURI after minting", async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);

      const uri = await nft.tokenURI(1);
      expect(uri).to.equal(TOKEN_URI_1);
    });

    it("Should return different URIs for different tokens", async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);
      await nft.mint(addr2.address, TOKEN_URI_2);
      await nft.mint(addr1.address, TOKEN_URI_3);

      expect(await nft.tokenURI(1)).to.equal(TOKEN_URI_1);
      expect(await nft.tokenURI(2)).to.equal(TOKEN_URI_2);
      expect(await nft.tokenURI(3)).to.equal(TOKEN_URI_3);
    });

    it("Should fail to get URI of non-existent token", async function () {
      await expect(nft.tokenURI(999)).to.be.revertedWithCustomError(
        nft,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const uris = [TOKEN_URI_1, TOKEN_URI_2, TOKEN_URI_3];

      await nft.batchMint(addr1.address, uris);

      expect(await nft.balanceOf(addr1.address)).to.equal(3);
      expect(await nft.tokenURI(1)).to.equal(TOKEN_URI_1);
      expect(await nft.tokenURI(2)).to.equal(TOKEN_URI_2);
      expect(await nft.tokenURI(3)).to.equal(TOKEN_URI_3);
    });

    it("Should fail to batch mint to zero address", async function () {
      const uris = [TOKEN_URI_1];

      await expect(nft.batchMint(ethers.ZeroAddress, uris)).to.be.revertedWith(
        "Cannot mint to zero address"
      );
    });

    it("Should fail to batch mint with empty array", async function () {
      await expect(nft.batchMint(addr1.address, [])).to.be.revertedWith(
        "Must mint at least one token"
      );
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, TOKEN_URI_1);
    });

    it("Should transfer NFT between accounts", async function () {
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 1);

      expect(await nft.ownerOf(1)).to.equal(addr2.address);
      expect(await nft.balanceOf(addr1.address)).to.equal(0);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
    });

    it("Should fail to transfer if not owner", async function () {
      await expect(
        nft.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(nft, "ERC721InsufficientApproval");
    });
  });

  describe("SupportsInterface", function () {
    it("Should support ERC721 interface", async function () {
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
    });

    it("Should support ERC721Metadata interface", async function () {
      expect(await nft.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata
    });
  });
});
