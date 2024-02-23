const hre = require("hardhat");
require("dotenv").config();

async function main() {
  try {
    // Deployment of proxy contract with moderator address as input to constructor
    // The admin is responsible for setting the moderator of the contract
    const proxyFactory = await hre.ethers.getContractFactory("LoadBalancer");
    const proxy = await proxyFactory.deploy(
      process.env.MODERATOR_ACCOUNT_ADDRESS
    );

    // @dev - If any other implementation contract is required deploy the corresponding contract

    // Deployment of implementation contract (Token.sol)
    const implementationFactoryToken = await hre.ethers.getContractFactory(
      "Token"
    );
    const implementationToken = await implementationFactoryToken.deploy();

    // Deployment of implementation contract (Staking.sol)
    const implementationFactoryStaking = await hre.ethers.getContractFactory(
      "Staking"
    );
    const implementationStaking = await implementationFactoryStaking.deploy();

    // Get the addresses of all the contracts deployed
    // @dev -- make sure to paste the addresses to .env file for further interaction
    console.log("Proxy deployed to:", proxy.target);
    console.log(
      "Implementation Token deployed to:",
      implementationToken.target
    );
    console.log(
      "Implementation Staking deployed to:",
      implementationStaking.target
    );
  } catch (err) {
    console.log("An error occurred with description ", err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
