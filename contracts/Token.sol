// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Token is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    // Initializer function for the contract which sets initial values for the contract
    function initialize() initializer public {
        __ERC20_init("GoldToken", "GLD");
        __Ownable_init(msg.sender);
    }

    // function to mint new tokens and add to the balance of the owner/deployer of the contract
    function mintToken(uint256 _amount) public onlyOwner returns(bool)
    {
        require(_amount > 0, "Amount should be greater than zero");
        _mint(msg.sender, _amount * 10**18);
        return true;
    }
    
}