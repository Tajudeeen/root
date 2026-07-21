// ============ ROOT CONTRACT LAYER ============
// UPDATE THESE AFTER DEPLOYMENT
const YIELD_CONTRACT_ADDRESS = '0xBCfED15984d6A7a203D3D52B8728e132f7658893';
const BRIDGE_CONTRACT_ADDRESS = '0x0d9Dd9fCe1c27EaafABBe6c7F57D1da95Bc5B859';

const YIELD_VAULT_ABI = [
    "function deposit() external payable",
    "function withdrawAll() external",
    "function claimYield() external",
    "function compound() external",
    "function emergencyWithdraw() external",
    "function getUserPosition(address) view returns (uint256,uint256,uint256,uint256,uint256,bool)",
    "function apyBasisPoints() view returns (uint256)",
    "event Deposited(address indexed,uint256,uint256,uint256)",
    "event Withdrawn(address indexed,uint256,uint256,uint256)",
    "event Compounded(address indexed,uint256,uint256,uint256)",
    "event YieldClaimed(address indexed,uint256,uint256)"
];

const BRIDGE_ROUTER_ABI = [
    "function lockTokens(uint256,address,uint256,address) external payable",
    "event TokensLocked(bytes32 indexed,address indexed,uint256,uint256,address,uint256,address,uint256)"
];

class ContractLayer {
    constructor(walletManager) {
        this.wallet = walletManager;
        this.yieldContract = null;
        this.bridgeContract = null;
    }

    init() {
        if (!this.wallet.signer) return false;
        
        this.yieldContract = new ethers.Contract(
            YIELD_CONTRACT_ADDRESS,
            YIELD_VAULT_ABI,
            this.wallet.signer
        );
        
        this.bridgeContract = new ethers.Contract(
            BRIDGE_CONTRACT_ADDRESS,
            BRIDGE_ROUTER_ABI,
            this.wallet.signer
        );
        
        console.log('✅ Contracts initialized');
        return true;
    }

    // ============ YIELD VAULT ============
    async getPosition() {
        if (!this.yieldContract || !this.wallet.address) return null;
        
        try {
            const pos = await this.yieldContract.getUserPosition(this.wallet.address);
            const apy = await this.yieldContract.apyBasisPoints();
            
            return {
                deposited: ethers.utils.formatEther(pos[0]),
                pendingYield: ethers.utils.formatEther(pos[1]),
                accumulatedYield: ethers.utils.formatEther(pos[2]),
                totalClaimable: ethers.utils.formatEther(pos[3]),
                lastDepositTime: new Date(pos[4].toNumber() * 1000),
                exists: pos[5],
                apy: (apy.toNumber() / 100).toFixed(1)
            };
        } catch (error) {
            console.error('Error reading position:', error);
            return null;
        }
    }

    async deposit(amountInEth) {
        if (!this.yieldContract) throw new Error('Contract not initialized');
        
        const tx = await this.yieldContract.deposit({
            value: ethers.utils.parseEther(amountInEth.toString()),
            gasLimit: 200000
        });
        
        return tx;
    }

    async withdrawAll() {
        if (!this.yieldContract) throw new Error('Contract not initialized');
        return await this.yieldContract.withdrawAll({ gasLimit: 250000 });
    }

    async compound() {
        if (!this.yieldContract) throw new Error('Contract not initialized');
        return await this.yieldContract.compound({ gasLimit: 200000 });
    }

    async claimYield() {
        if (!this.yieldContract) throw new Error('Contract not initialized');
        return await this.yieldContract.claimYield({ gasLimit: 200000 });
    }

    // ============ HISTORY FROM EVENTS ============
    async getHistory() {
        if (!this.yieldContract) return [];
        
        try {
            const [deps, wds, cmps, claims] = await Promise.all([
                this.yieldContract.queryFilter(
                    this.yieldContract.filters.Deposited(this.wallet.address), 0, 'latest'
                ),
                this.yieldContract.queryFilter(
                    this.yieldContract.filters.Withdrawn(this.wallet.address), 0, 'latest'
                ),
                this.yieldContract.queryFilter(
                    this.yieldContract.filters.Compounded(this.wallet.address), 0, 'latest'
                ),
                this.yieldContract.queryFilter(
                    this.yieldContract.filters.YieldClaimed(this.wallet.address), 0, 'latest'
                )
            ]);

            const all = [
                ...deps.map(e => ({
                    type: 'deposit',
                    amount: ethers.utils.formatEther(e.args[1]),
                    hash: e.transactionHash,
                    ts: e.args[3].toNumber() * 1000,
                    block: e.blockNumber
                })),
                ...wds.map(e => ({
                    type: 'withdraw',
                    amount: ethers.utils.formatEther(e.args[1].add(e.args[2])),
                    hash: e.transactionHash,
                    ts: e.args[3].toNumber() * 1000,
                    block: e.blockNumber
                })),
                ...cmps.map(e => ({
                    type: 'reward',
                    amount: ethers.utils.formatEther(e.args[1]),
                    hash: e.transactionHash,
                    ts: e.args[3].toNumber() * 1000,
                    block: e.blockNumber
                })),
                ...claims.map(e => ({
                    type: 'reward',
                    amount: ethers.utils.formatEther(e.args[1]),
                    hash: e.transactionHash,
                    ts: e.args[2].toNumber() * 1000,
                    block: e.blockNumber
                }))
            ];

            return all.sort((a, b) => b.ts - a.ts);
        } catch (error) {
            console.error('Error reading history:', error);
            return [];
        }
    }

    // ============ BRIDGE ============
    async bridgeTokens(toChainId, amountInEth) {
        if (!this.bridgeContract) throw new Error('Bridge not initialized');
        
        const tx = await this.bridgeContract.lockTokens(
            toChainId,
            '0x0000000000000000000000000000000000000000', // Native ETH
            ethers.utils.parseEther(amountInEth.toString()),
            this.wallet.address,
            { value: ethers.utils.parseEther(amountInEth.toString()), gasLimit: 300000 }
        );
        
        return tx;
    }
}

console.log('✅ ContractLayer loaded');