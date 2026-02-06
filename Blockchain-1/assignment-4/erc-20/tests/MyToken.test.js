const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken ERC-20 Contract", function () {
  let MyToken;
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1 million tokens

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("MyToken");
      expect(await token.symbol()).to.equal("MTK");
    });

    it("Should have 18 decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to a specific address", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await token.mint(addr1.address, mintAmount);

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(mintAmount);
    });

    it("Should increase total supply after minting", async function () {
      const initialSupply = await token.totalSupply();
      const mintAmount = ethers.parseUnits("500", 18);

      await token.mint(addr1.address, mintAmount);

      const newSupply = await token.totalSupply();
      expect(newSupply).to.equal(initialSupply + mintAmount);
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      await expect(token.mint(addr1.address, mintAmount))
        .to.emit(token, "TokensMinted")
        .withArgs(addr1.address, mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should fail to mint to zero address", async function () {
      const mintAmount = ethers.parseUnits("100", 18);

      await expect(
        token.mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should fail to mint zero amount", async function () {
      await expect(token.mint(addr1.address, 0)).to.be.revertedWith(
        "Amount must be greater than 0"
      );
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("50", 18);

      await token.transfer(addr1.address, transferAmount);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      await token.connect(addr1).transfer(addr2.address, transferAmount);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const excessAmount = initialOwnerBalance + ethers.parseUnits("1", 18);

      await expect(
        token.connect(owner).transfer(addr1.address, excessAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const transferAmount = ethers.parseUnits("100", 18);

      await token.transfer(addr1.address, transferAmount);
      await token.transfer(addr2.address, transferAmount);

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(
        initialOwnerBalance - transferAmount * 2n
      );

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail to transfer to zero address", async function () {
      const transferAmount = ethers.parseUnits("100", 18);

      await expect(
        token.transfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
    });

    it("Should fail to transfer zero tokens", async function () {
      await expect(token.transfer(addr1.address, 0)).to.not.be.reverted; // ERC-20 standard allows 0 transfers
    });
  });
});
