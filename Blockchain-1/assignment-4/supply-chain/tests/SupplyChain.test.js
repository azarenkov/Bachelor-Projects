const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Supply Chain Tracking System", function () {
  let supplyChain;
  let manufacturer, distributor, warehouse, courier, customer;

  const Status = {
    Manufactured: 0,
    InTransit: 1,
    AtWarehouse: 2,
    OutForDelivery: 3,
    Delivered: 4,
  };

  beforeEach(async function () {
    [manufacturer, distributor, warehouse, courier, customer] =
      await ethers.getSigners();

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    await supplyChain.authorizeParticipant(distributor.address);
    await supplyChain.authorizeParticipant(warehouse.address);
    await supplyChain.authorizeParticipant(courier.address);
  });

  describe("DEMO WORKFLOW: iPhone 15 Pro Journey", function () {
    let productId;

    it("STEP 1: Manufacturer registers iPhone 15 Pro", async function () {
      console.log("\n" + "=".repeat(70));
      console.log("SUPPLY CHAIN DEMO: iPhone 15 Pro Tracking");
      console.log("=".repeat(70));

      console.log("\nSTEP 1: MANUFACTURING");
      console.log("-".repeat(70));
      console.log("Location: Apple Factory, Shenzhen, China");
      console.log("Manufacturer:", manufacturer.address);

      const tx = await supplyChain
        .connect(manufacturer)
        .registerProduct(
          "iPhone 15 Pro 256GB",
          "Apple Inc.",
          "Shenzhen Factory, China",
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });

      productId = supplyChain.interface.parseLog(event).args.productId;

      console.log("Product ID:", productId.toString());
      console.log("Status: Manufactured");
      console.log("Transaction Hash:", receipt.hash);

      const product = await supplyChain.getProduct(productId);
      expect(product.name).to.equal("iPhone 15 Pro 256GB");
      expect(product.status).to.equal(Status.Manufactured);
    });

    it("STEP 2: Distributor ships to regional warehouse", async function () {
      const tx1 = await supplyChain
        .connect(manufacturer)
        .registerProduct(
          "iPhone 15 Pro 256GB",
          "Apple Inc.",
          "Shenzhen Factory, China",
        );
      const receipt1 = await tx1.wait();
      const event = receipt1.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });
      productId = supplyChain.interface.parseLog(event).args.productId;

      console.log("\nSTEP 2: IN TRANSIT TO WAREHOUSE");
      console.log("-".repeat(70));
      console.log("From: Shenzhen, China");
      console.log("To: Distribution Center, Singapore");
      console.log("Handler:", distributor.address);

      const tx2 = await supplyChain
        .connect(distributor)
        .updateStatus(
          productId,
          Status.InTransit,
          "En route to Singapore Distribution Center",
        );

      const receipt2 = await tx2.wait();
      console.log("Status: In Transit");
      console.log("Transaction Hash:", receipt2.hash);

      const product = await supplyChain.getProduct(productId);
      expect(product.status).to.equal(Status.InTransit);
      expect(product.location).to.equal(
        "En route to Singapore Distribution Center",
      );
    });

    it("STEP 3: Arrived at warehouse", async function () {
      const tx1 = await supplyChain
        .connect(manufacturer)
        .registerProduct(
          "iPhone 15 Pro 256GB",
          "Apple Inc.",
          "Shenzhen Factory, China",
        );
      const receipt1 = await tx1.wait();
      const event = receipt1.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });
      productId = supplyChain.interface.parseLog(event).args.productId;

      await supplyChain
        .connect(distributor)
        .updateStatus(productId, Status.InTransit, "En route to Singapore");

      console.log("\nSTEP 3: AT WAREHOUSE");
      console.log("-".repeat(70));
      console.log("Location: Singapore Distribution Center");
      console.log("Warehouse Manager:", warehouse.address);

      const tx3 = await supplyChain
        .connect(warehouse)
        .updateStatus(
          productId,
          Status.AtWarehouse,
          "Singapore Distribution Center - Bay 5",
        );

      const receipt3 = await tx3.wait();
      console.log("Status: At Warehouse");
      console.log("Transaction Hash:", receipt3.hash);

      const product = await supplyChain.getProduct(productId);
      expect(product.status).to.equal(Status.AtWarehouse);
    });

    it("STEP 4: Out for delivery to customer", async function () {
      const tx1 = await supplyChain
        .connect(manufacturer)
        .registerProduct(
          "iPhone 15 Pro 256GB",
          "Apple Inc.",
          "Shenzhen Factory, China",
        );
      const receipt1 = await tx1.wait();
      const event = receipt1.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });
      productId = supplyChain.interface.parseLog(event).args.productId;

      await supplyChain
        .connect(distributor)
        .updateStatus(productId, Status.InTransit, "En route");
      await supplyChain
        .connect(warehouse)
        .updateStatus(productId, Status.AtWarehouse, "Singapore DC");

      console.log("\nSTEP 4: OUT FOR DELIVERY");
      console.log("-".repeat(70));
      console.log("Courier:", courier.address);
      console.log("Destination: Customer Address");

      const tx4 = await supplyChain
        .connect(courier)
        .updateStatus(
          productId,
          Status.OutForDelivery,
          "Last mile delivery - Route 42",
        );

      const receipt4 = await tx4.wait();
      console.log("Status: Out for Delivery");
      console.log("Transaction Hash:", receipt4.hash);

      const product = await supplyChain.getProduct(productId);
      expect(product.status).to.equal(Status.OutForDelivery);
    });

    it("STEP 5: Delivered to customer", async function () {
      const tx1 = await supplyChain
        .connect(manufacturer)
        .registerProduct(
          "iPhone 15 Pro 256GB",
          "Apple Inc.",
          "Shenzhen Factory, China",
        );
      const receipt1 = await tx1.wait();
      const event = receipt1.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });
      productId = supplyChain.interface.parseLog(event).args.productId;

      await supplyChain
        .connect(distributor)
        .updateStatus(productId, Status.InTransit, "En route");
      await supplyChain
        .connect(warehouse)
        .updateStatus(productId, Status.AtWarehouse, "Singapore DC");
      await supplyChain
        .connect(courier)
        .updateStatus(productId, Status.OutForDelivery, "Route 42");

      console.log("\nSTEP 5: DELIVERED");
      console.log("-".repeat(70));
      console.log("Final Destination: Customer");
      console.log("Delivery Confirmed By:", courier.address);

      const tx5 = await supplyChain
        .connect(courier)
        .updateStatus(
          productId,
          Status.Delivered,
          "Delivered to customer - Signed by John Doe",
        );

      const receipt5 = await tx5.wait();
      console.log("Status: DELIVERED ✓");
      console.log("Transaction Hash:", receipt5.hash);

      const product = await supplyChain.getProduct(productId);
      expect(product.status).to.equal(Status.Delivered);
      expect(product.location).to.equal(
        "Delivered to customer - Signed by John Doe",
      );

      console.log("\n" + "=".repeat(70));
      console.log("COMPLETE TRACKING HISTORY");
      console.log("=".repeat(70));

      const history = await supplyChain.getStatusHistory(productId);
      const statusNames = [
        "Manufactured",
        "In Transit",
        "At Warehouse",
        "Out for Delivery",
        "Delivered",
      ];

      for (let i = 0; i < history.length; i++) {
        const update = history[i];
        const date = new Date(Number(update.timestamp) * 1000);
        console.log(`\n${i + 1}. ${statusNames[update.status]}`);
        console.log(`   Location: ${update.location}`);
        console.log(`   Updated by: ${update.updatedBy}`);
        console.log(`   Timestamp: ${date.toISOString()}`);
      }

      console.log("\n" + "=".repeat(70));
      console.log("DELIVERY COMPLETE!");
      console.log("=".repeat(70) + "\n");
    });
  });

  describe("Additional Features", function () {
    it("Should transfer ownership", async function () {
      const tx = await supplyChain.registerProduct(
        "MacBook Pro",
        "Apple",
        "Factory",
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });
      const productId = supplyChain.interface.parseLog(event).args.productId;

      await supplyChain.transferOwnership(productId, distributor.address);

      const product = await supplyChain.getProduct(productId);
      expect(product.currentOwner).to.equal(distributor.address);
    });

    it("Should prevent unauthorized access", async function () {
      await expect(
        supplyChain
          .connect(customer)
          .registerProduct("Product", "Manufacturer", "Location"),
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent backward status updates", async function () {
      const tx = await supplyChain.registerProduct(
        "Product",
        "Manufacturer",
        "Location",
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return (
            supplyChain.interface.parseLog(log).name === "ProductRegistered"
          );
        } catch {
          return false;
        }
      });
      const productId = supplyChain.interface.parseLog(event).args.productId;

      await supplyChain
        .connect(distributor)
        .updateStatus(productId, Status.InTransit, "Transit");

      await expect(
        supplyChain
          .connect(distributor)
          .updateStatus(productId, Status.Manufactured, "Factory"),
      ).to.be.revertedWith("Can only move forward in status");
    });
  });
});
