const { expect } = require("chai");
const hre = require("hardhat");
require("dotenv").config();

let tokenAddress;
let stakingAddress;

// Tests group for both proxy contract and implementation contracts
describe("Proxy contract and Implementation tests", function () {
  async function deployFixture() {
    // Deploy the proxy contract with moderator account address
    const proxyContract = await hre.ethers.getContractFactory("LoadBalancer");
    const proxy = await proxyContract.deploy(
      process.env.MODERATOR_ACCOUNT_ADDRESS
    );

    // Deployment of implementation contract (Token.sol)
    const implementationFactoryToken = await hre.ethers.getContractFactory("Token");
    const Token = await implementationFactoryToken.deploy();
    tokenAddress = Token.target;

    // Deployment of implementation contract (Staking.sol)
    const implementationFactoryStaking = await hre.ethers.getContractFactory("Staking");
    const Staking = await implementationFactoryStaking.deploy();
    stakingAddress = Staking.target;

    // Proxy contract with implementation as Token contract
    const proxyAsToken = new hre.ethers.Contract(
      proxy.target,
      Token.interface.formatJson()
    );

    // Proxy contract with implementation as Staking contract
    const proxyAsStaking = new hre.ethers.Contract(
      proxy.target,
      Staking.interface.formatJson()
    );

    return { proxy, proxyAsToken, proxyAsStaking };
  }

  // Test group for testing only proxy contract functions
  describe("Proxy Contract Tests", function () {

    // check if proxy contract deployed correctly
    it("Proxy Contract deployed successfully", async () => {
      const [deployer] = await hre.ethers.getSigners();
      const { proxy } = await deployFixture();

      // deployer address retrieved from transaction should equal actual deployer's address
      expect(proxy.deploymentTransaction().from).to.equal(deployer.address);
    });

    // To check if function reverts on incorrect caller
    it("updating registry functions not called by moderator should revert", async () => {
       const [deployer] = await hre.ethers.getSigners();
       const { proxy } = await deployFixture();
       
       // Get the signature of initialize() function
       const tokenFunction = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`initialize()`)).slice(0, 10);

       // whenever any other user other than the moderator tries to update the registry it will revert
       expect(proxy.connect(deployer).addEntry(tokenFunction, tokenAddress)).to.be.revertedWith("You are not the moderator");
       expect(proxy.connect(deployer).updateEntry(tokenFunction, stakingAddress)).to.be.revertedWith("You are not the moderator");
       expect(proxy.connect(deployer).removeEntry(tokenFunction)).to.be.revertedWith("You are not the moderator");
    });

    // To check if correct event emitted with correct arguments on adding new entry
    it("EntryAdded event should fire on successful function addition to registry", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy } = await deployFixture();

      const tokenFunction = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`initialize()`)).slice(0, 10);

      // on successful entry addition to registry EntryAdded event is emitted with given arguments
      expect(proxy.connect(moderator).addEntry(tokenFunction, tokenAddress)).to.emit(proxy, "EntryAdded").withArgs(tokenFunction, tokenAddress);
    });

    // To check if correct event emitted with correct arguments on updating registry
    it("EntryUpdated event should fire on successful updation of registry", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy } = await deployFixture();

      const tokenFunction = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`initialize()`)).slice(0, 10);

      // on successful update of registry EntryUpdated event is emitted with given arguments
      expect(proxy.connect(moderator).updateEntry(tokenFunction, stakingAddress)).to.emit(proxy, "EntryUpdated").withArgs(tokenFunction, stakingAddress);
    });

    // To check if correct event emitted with correct arguments on removing function from registry
    it("EntryRemoved event should fire on successful removal of function from registry", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy } = await deployFixture();

      const tokenFunction = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`initialize()`)).slice(0, 10);

      // on successful entry removal from registry EntryRemoved event is emitted with given arguments
      expect(proxy.connect(moderator).removeEntry(tokenFunction)).to.emit(proxy, "EntryRemoved").withArgs(tokenFunction);
    });

    // To check if correct event emitted with correct arguments on admin change
    it("AdminChanged event should fire on successful change of Admin", async () => {
      const [deployer,, newAdmin] = await hre.ethers.getSigners();
      const { proxy } = await deployFixture();

      // on successful admin change AdminChanged event is emitted with given arguments
      expect(proxy.connect(deployer).renounceAdmin(newAdmin.address)).to.emit(proxy, "AdminChanged").withArgs(deployer.address, newAdmin.address);
    });

    // To check if correct event emitted with correct arguments on moderator change
    it("ModeratorChanged event should fire on successful change of Moderator", async () => {
      const [, moderator, newModerator] = await hre.ethers.getSigners();
      const { proxy } = await deployFixture();

      // on successful moderator change ModeratorChanged event is emitted with given arguments
      expect(proxy.connect(moderator).renounceModerator(newModerator.address)).to.emit(proxy, "ModeratorChanged").withArgs(moderator.address, newModerator.address);
    });
  });

  // Set of tests for proxy contract with implementation as Token contract
  describe("Proxy Contract with implementation as Token contract", function() {
    const tokenFunction = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`initialize()`)).slice(0, 10);

    // To ensure required parameters are initialized correctly by the initializer function
    it("Correct initialization of the implementation contract", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsToken } = await deployFixture();
      
      const tokenOwner = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`owner()`)).slice(0, 10);
      await proxy.connect(moderator).addEntry(tokenFunction, tokenAddress);
      await proxy.connect(moderator).addEntry(tokenOwner, tokenAddress);

      await proxyAsToken.connect(deployer).initialize();

      // If correctly initialized then the owner() public variable should return the deployer address
      expect(await proxyAsToken.connect(deployer).owner()).to.equal(deployer.address);

    });

    // To check if minting new tokens work correctly
    it("Token minted correctly to owner address", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsToken } = await deployFixture();

      const mintToken = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`mintToken(uint256)`)).slice(0, 10);
      const tokenBalance = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`balanceOf(address)`)).slice(0, 10);
      await proxy.connect(moderator).addEntry(tokenFunction, tokenAddress);
      await proxy.connect(moderator).addEntry(mintToken, tokenAddress);
      await proxy.connect(moderator).addEntry(tokenBalance, tokenAddress);

      // call initialize to set initial values for new instance
      await proxyAsToken.connect(deployer).initialize();
      // minting function to mint 10000 tokens and add to the balance of the deployer of contract
      await proxyAsToken.connect(deployer).mintToken(10000);

      // After minting balance of minter/deployer should equal 10000 * 10**18( for decimals = 18)
      expect(parseInt(await proxyAsToken.connect(deployer).balanceOf(deployer.address))).to.equal(1e+22);

    });

    // To ensure token transfer functionality works properly
    it("Token transfer functionality working properly", async () => {
      const [deployer, moderator, user] = await hre.ethers.getSigners();
      const { proxy, proxyAsToken } = await deployFixture();

      const mintToken = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`mintToken(uint256)`)).slice(0, 10);
      const tokenTransfer = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`transfer(address,uint256)`)).slice(0, 10);
      const tokenBalance = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`balanceOf(address)`)).slice(0, 10);
      await proxy.connect(moderator).addEntry(tokenFunction, tokenAddress);
      await proxy.connect(moderator).addEntry(mintToken, tokenAddress);
      await proxy.connect(moderator).addEntry(tokenTransfer, tokenAddress);
      await proxy.connect(moderator).addEntry(tokenBalance, tokenAddress);

      await proxyAsToken.connect(deployer).initialize();
      await proxyAsToken.connect(deployer).mintToken(10000);

      // transfer the amount of token to the user's address by the deployer of the contract
      let amount = 100 * 10**18;
      await proxyAsToken.connect(deployer).transfer(user.address, amount.toString());

      // balances after transfer for user and deployer should change
      expect(parseInt(await proxyAsToken.connect(deployer).balanceOf(deployer.address))).to.equal(9.9e+21);
      expect(parseInt(await proxyAsToken.connect(user).balanceOf(user.address))).to.equal(1e+20);
    });
  });

  // Tests for proxy contract with staking contract as implementation contract
  describe("Proxy Contract with implementation as Staking Contract", function () {
    const stake = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`stake(uint256)`)).slice(0, 10);
    const unstake = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`unstake(uint256)`)).slice(0, 10);
    const balance = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`getBalance(address)`)).slice(0, 10);
    
    // To check if call is delegated to staking contract correctly through stake function
    it("Staking of particular amount should work correctly", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsStaking } = await deployFixture();
      
      await proxy.connect(moderator).addEntry(stake, stakingAddress);
      await proxy.connect(moderator).addEntry(balance, stakingAddress);

      await proxyAsStaking.connect(deployer).stake(200);
      
      // To expect balance of any user to increase after staking

      expect(await proxyAsStaking.connect(deployer).getBalance(deployer.address)).to.equal(200);

    });

    // To check if call is delegated to staking contract correctly through unstake function
    it("Unstaking of particular amount should work", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsStaking } = await deployFixture();
      
      await proxy.connect(moderator).addEntry(stake, stakingAddress);
      await proxy.connect(moderator).addEntry(unstake, stakingAddress);
      await proxy.connect(moderator).addEntry(balance, stakingAddress);

      await proxyAsStaking.connect(deployer).stake(500);
      await proxyAsStaking.connect(deployer).unstake(200);

      // To expect balance of any user to increase after staking
      expect(await proxyAsStaking.connect(deployer).getBalance(deployer.address)).to.equal(300);

    });


    // To check if correct event is emitted with correct arguments on staking some amount
    it("Staking on successful should emit Staked event", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsStaking } = await deployFixture();
      
      await proxy.connect(moderator).addEntry(stake, stakingAddress);

      // to expect Staked event called with caller address and amount as args
      expect(proxyAsStaking.connect(deployer).stake(200)).to.emit(proxyAsStaking, "Staked").withArgs(deployer.address, 200);
    });

     // To check if correct event is emitted with correct arguments on staking some amount
    it("Unstaking on successful should emit Unstaked event", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsStaking } = await deployFixture();
      
      await proxy.connect(moderator).addEntry(stake, stakingAddress);
      await proxy.connect(moderator).addEntry(unstake, stakingAddress);

      await proxyAsStaking.connect(deployer).stake(500);

      // to expect Unstaked event called with caller address and amount as args
      expect(proxyAsStaking.connect(deployer).unstake(100)).to.emit(proxyAsStaking, "Unstaked").withArgs(deployer.address, 100);
    });

    // To check if contract/function reverts on incorrect input
    it("Staking and unstaking amount less or equal to zero should revert", async () => {
      const [deployer, moderator] = await hre.ethers.getSigners();
      const { proxy, proxyAsStaking } = await deployFixture();
      
      await proxy.connect(moderator).addEntry(stake, stakingAddress);
      await proxy.connect(moderator).addEntry(unstake, stakingAddress);

      //expect stake and unstake should be reverted with appropiate reason on incorrect amount
      expect(proxyAsStaking.connect(deployer).stake(0)).to.be.revertedWith("Amount must be greater than 0");
      expect(proxyAsStaking.connect(deployer).unstake(0)).to.be.revertedWith("Invalid Amount");
    });
  })
});
