// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BridgeRouter {
    address public owner;
    address public validator;
    mapping(uint256 => bool) public supportedChains;
    mapping(bytes32 => bool) public processedTransfers;
    uint256 public bridgeFee = 10;
    uint256 public constant MAX_FEE = 100;
    
    event TokensLocked(bytes32 indexed transferId, address indexed sender, uint256 fromChainId, uint256 toChainId, address token, uint256 amount, address recipient, uint256 timestamp);
    event TokensReleased(bytes32 indexed transferId, address indexed recipient, uint256 fromChainId, uint256 toChainId, address token, uint256 amount, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyValidator() {
        require(msg.sender == validator || msg.sender == owner, "Not validator");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        validator = msg.sender;
    }
    
    function lockTokens(uint256 toChainId, address token, uint256 amount, address recipient) external payable {
        require(supportedChains[toChainId], "Chain not supported");
        require(amount > 0, "Amount must be > 0");
        bytes32 transferId = keccak256(abi.encodePacked(block.chainid, msg.sender, toChainId, token, amount, recipient, block.timestamp, block.number));
        require(!processedTransfers[transferId], "Already processed");
        processedTransfers[transferId] = true;
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        }
        uint256 fee = (amount * bridgeFee) / 10000;
        emit TokensLocked(transferId, msg.sender, block.chainid, toChainId, token, amount - fee, recipient, block.timestamp);
    }
    
    function setChainSupport(uint256 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
    }
    
    receive() external payable {}
}