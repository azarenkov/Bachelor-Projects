import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    showTimeSpent: true,
    showMethodSig: true,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
};
