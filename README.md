# Proxy Contract for Load Balancing and Function Delegation

To interact with the project following steps need to be followed:

NOTE: 
1. To interact with an already deployed contract with implementation contracts already present in the project, utilize the scripts/deployedContractCall.js and call the required function (After completing project setup -> Steps 1 - 8).

2. Make sure to replace the proxy_contract_address in .env file to the address of proxy contract over sepolia testnet.

3. Following are the addresses of contracts deployed over sepolia testnet:

PROXY_CONTRACT_ADDRESS =`0x8DA21CFC7DCf394b0972F5c6695afE3AfB8F4446`
IMPLEMENTATION_TOKEN_ADDRESS = `0x899f46e4e57216F0EEeD7D56602098a517Cb212E`
IMPLEMENTATION_STAKING_ADDRESS = `0xB059A07138dA863FA0E0E77FFE6542a2d62c46fc`


// Deployment and Interaction Steps for the project

1. Clone the project from the github repository: `https://github.com/anjalikh99/Wasserstoff-Task-2-2024-Blockchain-Interviews`

2. Execute the command `npm install` --> This would install all the required packages and modules to your project.

3. Create a .env file and create the following variables PRIVATE_KEY_ADMIN, PRIVATE_KEY_MODERATOR, PROXY_CONTRACT_ADDRESS, IMPLEMENTATION_CONTRACT_ADDRESS, MODERATOR_ACCOUNT_ADDRESS, PROVIDER_URL, ALCHEMY_URL.

4. Assign values to the variables leaving PROXY_CONTRACT_ADDRESS and IMPLEMENTATION_CONTRACT_ADDRESS as they will be assigned after deploying the corresponding contracts over the network.

5. In the hardhat.config.js file configure the network you want to use and set it as default network.

6. In the contracts folder add the code for the implementation contract with which you want to interact make sure to use initialize function if contract needs to be initialized to a state beforehand. 
// The sample code for the same is provided in the Token.sol contract for reference.

7. Replace the implementation contract name with the name of your implementation contract(eg. Token to be replaced with XYZImplementation) in scripts/deploy.js, scripts/proxyInteraction.js, scripts/delegate.js and test/proxyTest.js 

8. Your project is completely setup now.

9. Execute the command `npx hardhat run scripts/deploy.js` to execute deployment script for the contracts. The console will display the addresses of contracts deployed, copy them and paste in the .env file accordingly.

10. Next execute the command `npx hardhat run scripts/proxyInteraction.js` -- This will add function signatures to the registry of proxy contract. Replace the function signature with the signature of your implementation contract while calling `testcases(functionName)` from main() method.

11. Execute `npx hardhat run scripts/delegate.js`(Make sure to add the function signature of the required function in proxyInteraction.js and call the function in delegate.js) -- This will delegate the call via proxy to implementation contracts.

12. To execute the tests execute command `npx hardhat test`
