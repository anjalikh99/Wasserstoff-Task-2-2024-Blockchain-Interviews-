require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "sepolia",
  solidity: "0.8.20",
  networks: {
    // hardhat local node confguration
    hardhat: {
    },
    //sepolia testnet configuration
    sepolia: {
      url: `${process.env.ALCHEMY_URL}`,
      accounts: [process.env.PRIVATE_KEY_ADMIN]
    },
    // To include ganache as the provider to execute transactions
    ganache: {
      url: 'http://127.0.0.1:7545',
      chainId: 1337,
      from: `account[0]`,
      gas: 3000000
    }
  }
};
