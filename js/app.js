// ============ ROOT — MAIN APP ============
class RootApp {
    constructor() {
        this.wallet = new WalletManager();
        this.contracts = new ContractLayer(this.wallet);
        this.stream = new YieldStream();
        this.bridge = null;
        this.history = [];
        this.autoRefreshInterval = null;
        
        this.init();
    }

    init() {
        console.log('🌱 ROOT initializing...');
        this.bindOnboardingEvents();
        this.bindDashboardEvents();
        this.bindKeyboardShortcuts();
        console.log('✅ ROOT ready');
    }

    // ============ ONBOARDING ============
    bindOnboardingEvents() {
        const connectBtn = $('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnect());
        }
    }

    async handleConnect() {
        const btn = $('connect-wallet-btn');
        const status = $('wallet-status-msg');
        
        // Loading state
        btn.classList.add('loading');
        btn.innerHTML = '<span class="spinner-sm"></span> Connecting...';
        if (status) {
            status.textContent = 'Requesting wallet connection...';
            status.className = 'wallet-status info';
        }

        try {
            const result = await this.wallet.connect();
            
            if (!result) {
                throw new Error('Connection failed');
            }

            // Success state
            btn.classList.remove('loading');
            btn.classList.add('connected');
            btn.innerHTML = '✅ Connected';
            if (status) {
                status.textContent = 'Connected! Loading dashboard...';
                status.className = 'wallet-status success';
            }

            // Initialize contracts
            this.contracts.init();
            
            // Short delay to show success state
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Show dashboard
            this.showDashboard();
            await this.refreshAll();
            this.startAutoRefresh();
            
            // Setup listeners
            this.wallet.onAccountsChanged((account) => {
                if (!account) this.showOnboarding();
                else this.refreshAll();
            });
            
            this.wallet.onChainChanged(() => {
                this.refreshAll();
            });

        } catch (error) {
            console.error('Connection error:', error);
            
            // Error state
            btn.classList.remove('loading');
            btn.classList.add('error-state');
            btn.innerHTML = '❌ Connection Failed';
            
            if (status) {
                status.textContent = this.getErrorMessage(error);
                status.className = 'wallet-status error';
            }

            // Reset after delay
            setTimeout(() => {
                btn.classList.remove('error-state');
                btn.innerHTML = '🌱 Plant Your Capital';
                if (status) {
                    status.textContent = '';
                    status.className = 'wallet-status';
                }
            }, 3000);
        }
    }

    getErrorMessage(error) {
        if (error.message === 'NO_WALLET') return 'Please install MetaMask to continue';
        if (error.message === 'NO_ACCOUNTS') return 'No accounts found. Please unlock MetaMask';
        if (error.code === 'ACTION_REJECTED') return 'Connection rejected. Please try again';
        return error.message || 'Connection failed. Please try again';
    }

    // ============ DASHBOARD ============
    bindDashboardEvents() {
        // Disconnect
        $('disconnect-btn')?.addEventListener('click', () => this.disconnect());
        
        // Refresh
        $('refresh-btn')?.addEventListener('click', () => this.refreshAll());
        
        // Copy address
        $('wallet-address')?.addEventListener('click', () => {
            if (this.wallet.copyAddress()) {
                const badge = $('wallet-address');
                const original = badge.textContent;
                badge.textContent = 'Copied!';
                setTimeout(() => badge.textContent = original, 1500);
            }
        });

        // Deposit
        $('add-more-btn')?.addEventListener('click', () => this.openDeposit());
        $('quick-deposit')?.addEventListener('click', () => this.openDeposit());
        $('confirm-deposit')?.addEventListener('click', () => this.executeDeposit());
        $('close-deposit')?.addEventListener('click', () => this.closeDeposit());
        $('max-deposit-btn')?.addEventListener('click', () => this.setMaxDeposit());
        
        $('deposit-amount-input')?.addEventListener('input', function() {
            setText('estimated-yield', (parseFloat(this.value || 0) * 0.125).toFixed(4));
        });

        document.querySelectorAll('#deposit-modal .quick-amt').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = $('deposit-amount-input');
                if (input) {
                    input.value = btn.dataset.amt;
                    setText('estimated-yield', (parseFloat(btn.dataset.amt) * 0.125).toFixed(4));
                }
            });
        });

        // Withdraw
        $('withdraw-all-btn')?.addEventListener('click', () => this.executeWithdraw());
        $('quick-withdraw')?.addEventListener('click', () => this.executeWithdraw());

        // Compound
        $('compound-btn')?.addEventListener('click', () => this.executeCompound());
        $('quick-compound')?.addEventListener('click', () => this.executeCompound());

        // Streaming CTA
        const streamingCta = document.querySelector('.streaming-cta');
        if (streamingCta) {
            streamingCta.addEventListener('click', () => this.openDeposit());
        }

        // TX Modal
        $('close-tx')?.addEventListener('click', () => this.closeTx());
        $('tx-modal')?.addEventListener('click', (e) => {
            if (e.target === $('tx-modal')) this.closeTx();
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const tabContent = $('tab-' + btn.dataset.tab);
                if (tabContent) tabContent.classList.add('active');
                if (btn.dataset.tab === 'history') this.renderHistory('all');
                if (btn.dataset.tab === 'bridge' && !this.bridge) {
                    this.bridge = new BridgeController(this.contracts);
                    this.bridge.init();
                }
            });
        });

        // History filters
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.renderHistory(pill.dataset.filter);
            });
        });

        // Quick bridge nav
        $('quick-bridge')?.addEventListener('click', () => {
            const bridgeTab = document.querySelector('.tab-btn[data-tab="bridge"]');
            if (bridgeTab) bridgeTab.click();
        });

        // Close modals on overlay click
        $('deposit-modal')?.addEventListener('click', (e) => {
            if (e.target === $('deposit-modal')) this.closeDeposit();
        });
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
            }
        });
    }

    // ============ SCREEN NAVIGATION ============
    showDashboard() {
        $('onboarding-screen')?.classList.remove('active');
        $('dashboard-screen')?.classList.add('active');
    }

    showOnboarding() {
        this.stream.stop();
        $('dashboard-screen')?.classList.remove('active');
        $('onboarding-screen')?.classList.add('active');
        
        // Reset connect button
        const btn = $('connect-wallet-btn');
        if (btn) {
            btn.classList.remove('loading', 'connected', 'error-state');
            btn.innerHTML = '🌱 Plant Your Capital';
        }
    }

    disconnect() {
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
        this.stream.stop();
        this.wallet.disconnect();
        this.showOnboarding();
    }

    // ============ DATA REFRESH ============
    async refreshAll() {
        if (!this.wallet.address) return;

        // Update address display
        setText('wallet-address', shortAddr(this.wallet.address));

        // Update balance
        const balance = await this.wallet.getBalance();
        const balEth = fmtEth(balance);
        setText('total-balance', balEth + ' ETH');
        setText('balance-usd', '$' + (parseFloat(balEth) * ETH_PRICE).toFixed(2));
        setText('deposit-balance', balEth + ' ETH');

        // Update position from contract
        const position = await this.contracts.getPosition();

        if (position && position.exists && parseFloat(position.deposited) > 0) {
            hideEl('empty-position');
            showEl('active-position');
            
            setText('deposited-amount', position.deposited + ' ETH');
            setText('earned-amount', '+' + position.totalClaimable + ' ETH');
            setText('deposited-stat', parseFloat(position.deposited).toFixed(2));
            setText('earned-stat', '$' + (parseFloat(position.totalClaimable) * ETH_PRICE).toFixed(2));
            setText('apy-badge', '⚡ ' + position.apy + '% APY');
            setText('apy-stat', position.apy + '%');
            
            const pct = Math.min(
                (parseFloat(position.totalClaimable) / parseFloat(position.deposited) * 100),
                100
            ).toFixed(1);
            setText('progress-pct', pct + '%');
            const progressFill = $('progress-fill');
            if (progressFill) progressFill.style.width = pct + '%';

            // Start live stream
            this.stream.start(position);
        } else {
            showEl('empty-position');
            hideEl('active-position');
            setText('deposited-stat', '0.00');
            setText('earned-stat', '$0.00');
            this.stream.stop();
            this.stream.showEmpty();
        }

        // Update history
        this.history = await this.contracts.getHistory();
        const activeHistoryTab = document.querySelector('#tab-history.active');
        if (activeHistoryTab) {
            const activeFilter = document.querySelector('.filter-pill.active');
            this.renderHistory(activeFilter ? activeFilter.dataset.filter : 'all');
        }
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = setInterval(() => this.refreshAll(), 15000);
    }

    // ============ DEPOSIT ============
    openDeposit() {
        if (!this.wallet.address) return;
        
        const input = $('deposit-amount-input');
        if (input) input.value = '';
        setText('estimated-yield', '0.00');
        hideEl('deposit-error');
        $('deposit-modal')?.classList.add('active');
        input?.focus();

        this.wallet.getBalance().then(bal => {
            setText('deposit-balance', fmtEth(bal) + ' ETH');
        });
    }

    closeDeposit() {
        $('deposit-modal')?.classList.remove('active');
    }

    setMaxDeposit() {
        this.wallet.getBalance().then(bal => {
            const max = Math.max(0, parseFloat(fmtEth(bal)) - 0.005);
            const input = $('deposit-amount-input');
            if (input) {
                input.value = max.toFixed(4);
                setText('estimated-yield', (max * 0.125).toFixed(4));
            }
        });
    }

    async executeDeposit() {
        const amount = parseFloat($('deposit-amount-input')?.value);
        
        if (!amount || amount < 0.001) {
            const error = $('deposit-error');
            if (error) {
                error.textContent = 'Minimum 0.001 ETH';
                error.classList.remove('hidden');
            }
            return;
        }

        this.closeDeposit();
        this.showTx('loading', 'Confirm transaction in your wallet...');

        try {
            const tx = await this.contracts.deposit(amount.toString());
            this.showTx('loading', 'Waiting for confirmation...');
            const receipt = await tx.wait();
            this.showTx('success', `Planted ${amount} ETH! Block: ${receipt.blockNumber}`, tx.hash);
            await this.refreshAll();
        } catch (error) {
            if (error.code === 'ACTION_REJECTED') {
                this.showTx('error', 'Transaction cancelled');
            } else {
                this.showTx('error', error.message || 'Transaction failed');
            }
            setTimeout(() => this.closeTx(), 3000);
        }
    }

    // ============ WITHDRAW ============
    async executeWithdraw() {
        if (!confirm('Harvest all planted ETH plus growth? This stops your yield stream.')) return;

        this.showTx('loading', 'Confirm transaction in your wallet...');

        try {
            const tx = await this.contracts.withdrawAll();
            this.showTx('loading', 'Harvesting...');
            const receipt = await tx.wait();
            this.showTx('success', `Harvested successfully! Block: ${receipt.blockNumber}`, tx.hash);
            await this.refreshAll();
        } catch (error) {
            if (error.code === 'ACTION_REJECTED') {
                this.showTx('error', 'Transaction cancelled');
            } else {
                this.showTx('error', error.message || 'Withdrawal failed');
            }
            setTimeout(() => this.closeTx(), 3000);
        }
    }

    // ============ COMPOUND ============
    async executeCompound() {
        this.showTx('loading', 'Confirm transaction in your wallet...');

        try {
            const tx = await this.contracts.compound();
            this.showTx('loading', 'Compounding growth...');
            const receipt = await tx.wait();
            this.showTx('success', `Growth compounded! Block: ${receipt.blockNumber}`, tx.hash);
            await this.refreshAll();
        } catch (error) {
            if (error.code === 'ACTION_REJECTED') {
                this.showTx('error', 'Transaction cancelled');
            } else {
                this.showTx('error', error.message || 'Compound failed');
            }
            setTimeout(() => this.closeTx(), 3000);
        }
    }

    // ============ HISTORY ============
    renderHistory(filter) {
        const list = $('history-list');
        if (!list) return;

        const txs = filter === 'all' ? this.history : this.history.filter(t => t.type === filter);

        if (!txs.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📜</span>
                    <p>No history yet</p>
                    <p class="text-muted">All transactions appear here from the blockchain</p>
                </div>`;
            return;
        }

        list.innerHTML = txs.map(tx => `
            <div class="history-item">
                <div class="history-left">
                    <div class="history-icon-sm ${tx.type}">
                        ${tx.type === 'deposit' ? '💰' : tx.type === 'withdraw' ? '💸' : '🌾'}
                    </div>
                    <div>
                        <div class="history-type">
                            ${tx.type === 'deposit' ? 'Planted' : tx.type === 'withdraw' ? 'Harvested' : 'Growth'}
                        </div>
                        <div class="history-date">${formatDate(tx.ts)}</div>
                    </div>
                </div>
                <div>
                    <div class="history-amount ${tx.type === 'withdraw' ? 'red' : 'green'}">
                        ${tx.type === 'withdraw' ? '-' : '+'}${parseFloat(tx.amount).toFixed(4)} ETH
                    </div>
                    <a class="history-link" href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">
                        Block #${tx.block} ↗
                    </a>
                </div>
            </div>
        `).join('');
    }

    // ============ TX MODAL ============
    showTx(state, message, txHash) {
        const modal = $('tx-modal');
        if (!modal) return;

        modal.classList.add('active');
        
        toggleEl('tx-loading', state === 'loading');
        toggleEl('tx-done', state !== 'loading');

        if (state === 'loading') {
            setText('tx-message', message);
        } else if (state === 'success') {
            setText('tx-icon', '✅');
            setText('tx-title', 'Confirmed On-Chain');
            setText('tx-detail', message);
            const link = $('tx-link');
            if (link && txHash) {
                link.href = 'https://sepolia.etherscan.io/tx/' + txHash;
                link.classList.remove('hidden');
            }
        } else if (state === 'error') {
            setText('tx-icon', '❌');
            setText('tx-title', 'Transaction Failed');
            setText('tx-detail', message);
            const link = $('tx-link');
            if (link) link.classList.add('hidden');
        }
    }

    closeTx() {
        $('tx-modal')?.classList.remove('active');
    }
}

// ============ BOOT ============
document.addEventListener('DOMContentLoaded', () => {
    window.rootApp = new RootApp();
});