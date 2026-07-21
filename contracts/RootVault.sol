// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RootVault {
    address public owner;
    uint256 public apyBasisPoints = 1250;
    uint256 public constant MAX_APY = 5000;
    uint256 public totalDeposited;
    uint256 public totalYieldPaid;
    uint256 public totalUsers;
    
    struct UserPosition {
        uint256 deposited;
        uint256 lastDepositTime;
        uint256 accumulatedYield;
        uint256 yieldClaimed;
        bool exists;
    }
    
    mapping(address => UserPosition) public positions;
    address[] public userList;
    
    event Deposited(address indexed user, uint256 amount, uint256 newTotal, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 principal, uint256 yield, uint256 timestamp);
    event YieldClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event Compounded(address indexed user, uint256 yieldAmount, uint256 newDeposit, uint256 timestamp);
    event APYUpdated(uint256 oldAPY, uint256 newAPY, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        UserPosition storage pos = positions[msg.sender];
        if (pos.exists && pos.deposited > 0) {
            uint256 pending = calculateYield(msg.sender);
            pos.accumulatedYield += pending;
            pos.yieldClaimed += pending;
        }
        if (!pos.exists) {
            pos.exists = true;
            totalUsers++;
            userList.push(msg.sender);
        }
        pos.deposited += msg.value;
        pos.lastDepositTime = block.timestamp;
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value, pos.deposited, block.timestamp);
    }
    
    function withdrawAll() external {
        UserPosition storage pos = positions[msg.sender];
        require(pos.exists && pos.deposited > 0, "No deposit");
        uint256 principal = pos.deposited;
        uint256 pendingYield = calculateYield(msg.sender);
        uint256 totalYield = pos.accumulatedYield + pendingYield;
        uint256 total = principal + totalYield;
        pos.deposited = 0;
        pos.lastDepositTime = 0;
        pos.accumulatedYield = 0;
        totalDeposited -= principal;
        totalYieldPaid += totalYield;
        emit Withdrawn(msg.sender, principal, totalYield, block.timestamp);
        (bool success, ) = msg.sender.call{value: total}("");
        require(success, "Transfer failed");
    }
    
    function compound() external {
        UserPosition storage pos = positions[msg.sender];
        require(pos.exists && pos.deposited > 0, "No deposit");
        uint256 pendingYield = calculateYield(msg.sender);
        uint256 totalYield = pos.accumulatedYield + pendingYield;
        require(totalYield > 0, "Nothing to compound");
        pos.accumulatedYield = 0;
        pos.deposited += totalYield;
        pos.lastDepositTime = block.timestamp;
        totalDeposited += totalYield;
        emit Compounded(msg.sender, totalYield, pos.deposited, block.timestamp);
    }
    
    function calculateYield(address user) public view returns (uint256) {
        UserPosition storage pos = positions[user];
        if (pos.deposited == 0 || pos.lastDepositTime == 0) return 0;
        uint256 timeElapsed = block.timestamp - pos.lastDepositTime;
        uint256 secondsPerYear = 365 days;
        return (pos.deposited * apyBasisPoints * timeElapsed) / (10000 * secondsPerYear);
    }
    
    function getUserPosition(address user) external view returns (
        uint256 deposited, uint256 pendingYield, uint256 accumulatedYield,
        uint256 totalClaimable, uint256 lastDepositTime, bool exists
    ) {
        UserPosition storage pos = positions[user];
        pendingYield = calculateYield(user);
        return (pos.deposited, pendingYield, pos.accumulatedYield,
                pos.accumulatedYield + pendingYield, pos.lastDepositTime, pos.exists);
    }
    
    function setAPY(uint256 newAPY) external onlyOwner {
        require(newAPY <= MAX_APY, "APY too high");
        uint256 oldAPY = apyBasisPoints;
        apyBasisPoints = newAPY;
        emit APYUpdated(oldAPY, newAPY, block.timestamp);
    }
    
    receive() external payable {}
}