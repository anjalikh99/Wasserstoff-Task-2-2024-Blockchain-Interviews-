// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Staking{
    mapping(address => uint256) public balances;

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);

    function stake(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        balances[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) public {
        require(amount > 0 && amount <= balances[msg.sender], "Invalid amount");
        balances[msg.sender] -= amount;
        emit Unstaked(msg.sender, amount);
    }

    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }

}