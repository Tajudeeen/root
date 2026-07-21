// ============ ROOT WALLET MANAGER ============
class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnecting = false;
    }

    async connect() {
        if (this.isConnecting) return null;
        this.isConnecting = true;

        try {
            // Check if MetaMask exists
            if (!window.ethereum) {
                throw new Error('NO_WALLET');
            }

            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('NO_ACCOUNTS');
            }

            // Setup provider
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.address = accounts[0];

            // Check network
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;

            if (this.chainId !== 11155111) {
                await this.switchToSepolia();
            }

            console.log('✅ Wallet connected:', shortAddr(this.address));
            
            return {
                address: this.address,
                chainId: this.chainId
            };

        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    async switchToSepolia() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }]
            });
            console.log('✅ Switched to Sepolia');
        } catch (switchError) {
            if (switchError.code === 4902) {
                // Chain not added
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xaa36a7',
                        chainName: 'Sepolia Testnet',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://sepolia.infura.io/v3/'],
                        blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }]
                });
            } else {
                throw switchError;
            }
        }
    }

    async getBalance() {
        if (!this.provider || !this.address) return '0';
        return await this.provider.getBalance(this.address);
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        console.log('👋 Wallet disconnected');
    }

    onAccountsChanged(callback) {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                    callback(null);
                } else {
                    this.address = accounts[0];
                    this.signer = this.provider.getSigner();
                    callback(this.address);
                }
            });
        }
    }

    onChainChanged(callback) {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', (chainIdHex) => {
                this.chainId = parseInt(chainIdHex, 16);
                callback(this.chainId);
            });
        }
    }

    copyAddress() {
        if (this.address) {
            navigator.clipboard.writeText(this.address);
            return true;
        }
        return false;
    }
}

console.log('✅ WalletManager loaded');