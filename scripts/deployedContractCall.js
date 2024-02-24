const hre = require("hardhat");
require("dotenv").config();

let implementationABI;
let signerUser;
let proxyContractWithAbi;

async function main() {
  // Initiate the provider with required url and signer as the Admin or deployer of the proxy contract
  const provider = new hre.ethers.JsonRpcProvider(process.env.PROVIDER_URL);
  signerUser = new hre.ethers.Wallet(process.env.PRIVATE_KEY_USER, provider);

  // Get the ABI of the implementation contract whose function you want to access or call (eg. Token, Staking, Voting)
  //@dev -- In this we are using the Token contract. Please change the contract name if the function is part of different implementation
  const implementationFactory = await hre.ethers.getContractFactory("Token");
  implementationABI = implementationFactory.interface.formatJson();

  // Instance of proxy contract initaited using the abi of the required implementation contract
  proxyContractWithAbi = new hre.ethers.Contract(
    process.env.PROXY_CONTRACT_ADDRESS,
    implementationABI,
    provider
  );

  // example for call delegated to implementation contract
  // Call to the mintToken function from the Token contract
  // @dev -- make sure to add mintToken(uint256) with 10000 tokens to be minted function signature to the proxy contract before calling the function
  try {
    const amount = 10000;
    const tokenMinted = await proxyContractWithAbi
      .connect(signerUser)
      .mintToken(amount);
    console.log(tokenMinted.hash);
  } catch (err) {
    console.log("Error minting new tokens: ", err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
