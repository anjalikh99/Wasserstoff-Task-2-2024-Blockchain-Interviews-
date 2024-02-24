const hre = require("hardhat");
require("dotenv").config();

let proxy;
let signerModerator;

async function main() {
  // Provider instance to be initiated at particular url
  const provider = new hre.ethers.JsonRpcProvider(process.env.PROVIDER_URL);

  try {
    // Initiate the signer as moderator for carrying out transaction over the proxy contracts
    // @dev -- make sure to paste the moderator's private key to the .env file
    signerModerator = new hre.ethers.Wallet(
      process.env.PRIVATE_KEY_MODERATOR,
      provider
    );

    // Get the instance of deployed proxy contract for interaction
    const proxyFactory = await hre.ethers.getContractFactory("LoadBalancer");
    proxy = proxyFactory.attach(process.env.PROXY_CONTRACT_ADDRESS);
  } catch (err) {
    console.log("Error while setting contract factory ", err);
  }
  // call the testcases function with the required function signature that you want to add to the proxy contract

  // @dev - make sure to insert the function signature along with parameters with no spaces (eg. transfer(address,uint256))
  // Make sure to include function signatures one by one as adding together may cause errors

  // adding entry for initialize() function to the proxy contract as this is the entry point for all implementation contracts
  try {
    const initializeHash = await testCases("initialize()");
    console.log("Initialized Successfully");
  } catch (err) {
    console.log("Initialization error", err);
  }

  
  // For example interaction we have added mintToken(uint256) function signature
  try {
    const mintHash = await testCases("mintToken(uint256)");
    console.log("Minted Successfully");
  } catch (err) {
    console.log("Error including function signature ", err);
  }
}

async function testCases(functionName) {
  // Create the keccak256 hash of the function signature --> first 4 bytes of call data
  const tokenFunction = hre.ethers
    .keccak256(hre.ethers.toUtf8Bytes(`${functionName}`))
    .slice(0, 10);

  // Update the registry via addEntry function in the proxy contract which takes function signature
  // and the corresponding implementation address to which this function belongs.
  //@dev - This function can be only called by moderator of the contract
  try {
    const result = await proxy
      .connect(signerModerator)
      .addEntry(
        tokenFunction.slice(0, 10),
        process.env.IMPLEMENTATION_CONTRACT_ADDRESS
      );
      return result.hash;
  } catch (err) {
    console.log("Error occurred while adding signature", err);
  }
  
  // The console to make sure transaction is successful
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
