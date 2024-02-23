// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.20;
 import "./StorageSlot.sol";

contract LoadBalancer {

    // dynamic registry for mapping address of implementation contract corresponding to function signature
    mapping(bytes4 => address) public registry;

    // slots for storing ADMIN, MODERATOR ADDRESSES
    bytes32 private constant ADMIN_SLOT = bytes32(uint(keccak256("eip1967.proxy.admin")) - 1);
    bytes32 private constant MODERATOR_SLOT = bytes32(uint(keccak256("eip1967.proxy.moderator")) - 1);
   
    // constructor to set the admin and moderator addresses to their corresponding slots
    constructor(address _moderator) {
        require(_moderator != msg.sender, "Moderator and Admin cannot be same");
        _setModerator(_moderator);
        _setAdmin(msg.sender);
    }

    // event triggered when entry for function signature and corresponding implementation is added
    event EntryAdded(bytes4 indexed functionId, address indexed implementation);
    // event triggered when entry for function signature is updated with new implementation address
    event EntryUpdated(bytes4 indexed functionId, address indexed implementation);
    // event triggered when entry for function signature is removed
    event EntryRemoved(bytes4 indexed functionId);
    // event triggered when admin is changed
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    // event triggered when moderator is changed
    event ModeratorChanged(address indexed oldModerator, address indexed newModerator);

    // modifier to add contraint to be called by admin only
    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "You are not the admin");
        _;
    }

    // modifier to add contraint to be called by moderator only
    modifier onlyModerator() {
        require(msg.sender == _getModerator(), "You are not the moderator");
        _;
    }


    // fallback function to delegate the call to the required implementation
    fallback() external payable{
        require(msg.sender != _getModerator(), "You are not authorized for this call");
        address implementation = registry[msg.sig];
        require(implementation != address(0), "Implementation not present");
        (bool success, ) = implementation.delegatecall(msg.data);
        require(success, "delegation unsuccessfull");
        assembly {
            returndatacopy(0, 0, returndatasize())
            return (0, returndatasize())
        }
    }

    // receive function to send ether to the required implementation whenever required
    receive() external payable{
        require(msg.sender != _getModerator(), "You are not authorized for this call");
        address implementation = registry[msg.sig];
        require(implementation != address(0), "Implementation not present");
        (bool success, ) = implementation.call{value: msg.value}("");
        require(success, "call successfull");
        assembly {
            returndatacopy(0, 0, returndatasize())
            return (0, returndatasize())
        }
    }

    // private function to set the admin of the contract
    function _setAdmin(address _admin) private{
        require(_admin != address(0), "Incorrect Admin Address(address(0))");
        StorageSlot.getAddressSlot(ADMIN_SLOT).value = _admin;
    }

    // private function to set the moderator of the contract
    function _setModerator(address _moderator) private{
        require(_moderator != address(0), "Incorrect Admin Address(address(0))");
        StorageSlot.getAddressSlot(MODERATOR_SLOT).value = _moderator;
    }

    // private function to retrieve the value of current admin 
    function _getAdmin() private view returns(address){
        return StorageSlot.getAddressSlot(ADMIN_SLOT).value;
    }

    // private function to retrieve the value of current moderator
    function _getModerator() private view returns(address){
        return StorageSlot.getAddressSlot(MODERATOR_SLOT).value;
    }

    // Public function to set a new admin for the contract only called by the current admin
    function renounceAdmin(address _newAdmin) external onlyAdmin{
        _setAdmin(_newAdmin);
        emit AdminChanged(msg.sender, _newAdmin);
    }

    // Public function to set a new moderator for the contract only called by the current moderator
    function renounceModerator(address _newModerator) external onlyModerator{
        _setModerator(_newModerator);
        emit ModeratorChanged(msg.sender, _newModerator);
    }

    // Function for adding a new entry for function signature and its corresponding implementation contract in the registry(can be done by only moderator)
    function addEntry(bytes4 _functionId, address _implementation) public onlyModerator {
        require(registry[_functionId] == address(0), "Function already exists");
        registry[_functionId] = _implementation;
        emit EntryAdded(_functionId, _implementation);
    }

    // Function for updating the implementation contract address for the required function signature in the registry (can be done by only moderator)
    function updateEntry(bytes4 _functionId, address _implementation) public onlyModerator {
        require(registry[_functionId] != address(0), "Function doesnot exist");
        registry[_functionId] = _implementation;
        emit EntryUpdated(_functionId, _implementation);
    }

    // Function to remove the function signature from the registry (called by only moderator)
    function removeEntry(bytes4 _functionId) public onlyModerator {
        require(registry[_functionId] != address(0), "Function doesnot exist");
        delete registry[_functionId];
        emit EntryRemoved(_functionId);
    }

}