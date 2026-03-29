const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory Pattern Tests", function () {
  let factory;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  describe("CREATE deployment", function () {
    it("Should deploy a child contract using CREATE", async function () {
      const tx = await factory.connect(addr1).deployWithCreate("TestChild1");
      const receipt = await tx.wait();

      const deployedContracts = await factory.getDeployedContracts();
      expect(deployedContracts.length).to.equal(1);

      // Get the deployed contract
      const childAddress = deployedContracts[0];
      const ChildContract = await ethers.getContractFactory("ChildContract");
      const child = ChildContract.attach(childAddress);

      // Verify child contract properties
      expect(await child.owner()).to.equal(addr1.address);
      expect(await child.name()).to.equal("TestChild1");
      expect(await child.balance()).to.equal(0);
    });

    it("Should deploy multiple children with CREATE", async function () {
      await factory.connect(addr1).deployWithCreate("Child1");
      await factory.connect(addr2).deployWithCreate("Child2");
      await factory.connect(owner).deployWithCreate("Child3");

      const deployedContracts = await factory.getDeployedContracts();
      expect(deployedContracts.length).to.equal(3);
    });

    it("Should emit ContractDeployed event with CREATE", async function () {
      await expect(factory.connect(addr1).deployWithCreate("TestChild"))
        .to.emit(factory, "ContractDeployed")
        .withArgs(await factory.getDeployedContracts().then(c => c[0] || ethers.ZeroAddress), "CREATE", addr1.address);
    });
  });

  describe("CREATE2 deployment", function () {
    it("Should deploy a child contract using CREATE2", async function () {
      const salt = ethers.encodeBytes32String("salt1");
      const tx = await factory.connect(addr1).deployWithCreate2("TestChild2", salt);
      await tx.wait();

      const deployedContracts = await factory.getDeployedContracts();
      expect(deployedContracts.length).to.equal(1);

      const childAddress = deployedContracts[0];
      const ChildContract = await ethers.getContractFactory("ChildContract");
      const child = ChildContract.attach(childAddress);

      expect(await child.owner()).to.equal(addr1.address);
      expect(await child.name()).to.equal("TestChild2");
    });

    it("Should predict CREATE2 address correctly", async function () {
      const salt = ethers.encodeBytes32String("salt2");
      const predictedAddress = await factory.computeCreate2Address(
        addr1.address,
        "TestChild3",
        salt
      );

      await factory.connect(addr1).deployWithCreate2("TestChild3", salt);
      const deployedContracts = await factory.getDeployedContracts();

      expect(deployedContracts[0]).to.equal(predictedAddress);
    });

    it("Should fail when deploying to same CREATE2 address twice", async function () {
      const salt = ethers.encodeBytes32String("salt3");
      await factory.connect(addr1).deployWithCreate2("TestChild", salt);

      await expect(
        factory.connect(addr1).deployWithCreate2("TestChild", salt)
      ).to.be.reverted;
    });

    it("Should deploy to different addresses with different salts", async function () {
      const salt1 = ethers.encodeBytes32String("salt4");
      const salt2 = ethers.encodeBytes32String("salt5");

      await factory.connect(addr1).deployWithCreate2("TestChild", salt1);
      await factory.connect(addr1).deployWithCreate2("TestChild", salt2);

      const deployedContracts = await factory.getDeployedContracts();
      expect(deployedContracts.length).to.equal(2);
      expect(deployedContracts[0]).to.not.equal(deployedContracts[1]);
    });
  });

  describe("Gas comparison: CREATE vs CREATE2", function () {
    it("Should track gas usage for CREATE deployment", async function () {
      const tx = await factory.connect(addr1).deployWithCreate("GasTestChild");
      const receipt = await tx.wait();
      console.log("CREATE gas used:", receipt.gasUsed.toString());
    });

    it("Should track gas usage for CREATE2 deployment", async function () {
      const salt = ethers.encodeBytes32String("gastest");
      const tx = await factory.connect(addr1).deployWithCreate2("GasTestChild", salt);
      const receipt = await tx.wait();
      console.log("CREATE2 gas used:", receipt.gasUsed.toString());
    });
  });

  describe("ChildContract functionality", function () {
    let childAddress, child;

    beforeEach(async function () {
      await factory.connect(addr1).deployWithCreate("TestChild");
      const deployedContracts = await factory.getDeployedContracts();
      childAddress = deployedContracts[0];

      const ChildContract = await ethers.getContractFactory("ChildContract");
      child = ChildContract.attach(childAddress);
    });

    it("Should update balance by owner", async function () {
      await child.connect(addr1).updateBalance(100);
      expect(await child.balance()).to.equal(100);
    });

    it("Should fail when non-owner tries to update balance", async function () {
      await expect(child.connect(addr2).updateBalance(100)).to.be.revertedWith(
        "Not the owner"
      );
    });

    it("Should update name by owner", async function () {
      await child.connect(addr1).updateName("NewName");
      expect(await child.name()).to.equal("NewName");
    });

    it("Should receive ether and update balance", async function () {
      await addr2.sendTransaction({
        to: childAddress,
        value: ethers.parseEther("1.0"),
      });

      expect(await child.balance()).to.equal(ethers.parseEther("1.0"));
    });
  });
});
