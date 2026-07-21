// ============ ROOT BRIDGE UI ============
const CHAINS = {
    11155111: { name: 'Sepolia', icon: '🔷', short: 'ETH' },
    5: { name: 'Goerli', icon: '🔶', short: 'ETH' },
    80001: { name: 'Mumbai', icon: '🟣', short: 'MATIC' },
    97: { name: 'BSC Testnet', icon: '🟡', short: 'BNB' }
};

const TOKENS = ['ETH', 'USDC', 'DAI', 'MATIC', 'BNB'];
const TOKEN_ICONS = { ETH: '💎', USDC: '💵', DAI: '🪙', MATIC: '🟣', BNB: '🟡' };

class BridgeController {
    constructor(contractLayer) {
        this.contracts = contractLayer;
        this.fromChainId = 11155111;
        this.toChainId = 5;
        this.bridgeToken = 'ETH';
        this.swapFrom = 'ETH';
        this.swapTo = 'USDC';
        this.chainTarget = null;
        this.tokenTarget = null;
    }

    init() {
        this.bindEvents();
        this.updateBridgeDisplay();
        console.log('✅ BridgeController initialized');
    }

    bindEvents() {
        // Mode toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                toggleEl('bridge-section', btn.dataset.mode === 'bridge');
                toggleEl('swap-section', btn.dataset.mode === 'swap');
            });
        });

        // Chain selectors
        $('from-chain-display')?.addEventListener('click', () => this.openChainModal('from'));
        $('to-chain-display')?.addEventListener('click', () => this.openChainModal('to'));
        
        // Switch chains
        $('switch-chains-btn')?.addEventListener('click', () => {
            [this.fromChainId, this.toChainId] = [this.toChainId, this.fromChainId];
            this.updateBridgeDisplay();
            this.updateBridgeEstimate();
        });

        // Token selectors
        $('bridge-token-display')?.addEventListener('click', () => this.openTokenModal('bridge'));
        $('swap-from-display')?.addEventListener('click', () => this.openTokenModal('swapFrom'));
        $('swap-to-display')?.addEventListener('click', () => this.openTokenModal('swapTo'));

        // Switch tokens
        $('switch-tokens-btn')?.addEventListener('click', () => {
            [this.swapFrom, this.swapTo] = [this.swapTo, this.swapFrom];
            this.updateSwapDisplay();
            this.updateSwapEstimate();
        });

        // Amount inputs
        $('bridge-input')?.addEventListener('input', () => this.updateBridgeEstimate());
        $('swap-input')?.addEventListener('input', () => this.updateSwapEstimate());

        // Quick amounts
        document.querySelectorAll('#bridge-section .quick-amt').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = $('bridge-input');
                if (input) {
                    input.value = btn.dataset.amt;
                    this.updateBridgeEstimate();
                }
            });
        });

        // Execute
        $('execute-bridge-btn')?.addEventListener('click', () => this.executeBridge());
        $('execute-swap-btn')?.addEventListener('click', () => this.executeSwap());

        // Close modals
        $('close-chain')?.addEventListener('click', () => this.closeModals());
        $('close-token')?.addEventListener('click', () => this.closeModals());
        
        ['chain-modal', 'token-modal'].forEach(id => {
            const modal = $(id);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.closeModals();
                });
            }
        });
    }

    updateBridgeDisplay() {
        const fc = CHAINS[this.fromChainId];
        const tc = CHAINS[this.toChainId];
        
        const fromEl = $('from-chain-display');
        const toEl = $('to-chain-display');
        
        if (fromEl) {
            fromEl.querySelector('.chain-icon-lg').textContent = fc.icon;
            fromEl.querySelector('.chain-name').textContent = fc.name;
        }
        if (toEl) {
            toEl.querySelector('.chain-icon-lg').textContent = tc.icon;
            toEl.querySelector('.chain-name').textContent = tc.name;
        }
    }

    updateSwapDisplay() {
        const fromEl = $('swap-from-display');
        const toEl = $('swap-to-display');
        
        if (fromEl) fromEl.innerHTML = `<span>${TOKEN_ICONS[this.swapFrom]}</span> ${this.swapFrom} ▼`;
        if (toEl) toEl.innerHTML = `<span>${TOKEN_ICONS[this.swapTo]}</span> ${this.swapTo} ▼`;
    }

    updateBridgeEstimate() {
        const amount = parseFloat($('bridge-input')?.value);
        const btn = $('execute-bridge-btn');
        const receive = $('bridge-receive');
        const gas = $('bridge-gas');
        
        if (btn) btn.disabled = !amount || amount <= 0;
        if (receive) receive.textContent = amount ? (amount * 0.999).toFixed(6) + ' ' + this.bridgeToken : '0.00 ' + this.bridgeToken;
        if (gas) gas.textContent = '~' + (0.002 + Math.random() * 0.003).toFixed(4) + ' ' + CHAINS[this.fromChainId].short;
    }

    updateSwapEstimate() {
        const amount = parseFloat($('swap-input')?.value);
        const btn = $('execute-swap-btn');
        
        if (btn) btn.disabled = !amount || amount <= 0;
        
        if (amount) {
            const rate = 0.97 + Math.random() * 0.05;
            setText('swap-receive', (amount * rate).toFixed(6) + ' ' + this.swapTo);
            setText('swap-rate', '1 ' + this.swapFrom + ' = ' + rate.toFixed(4) + ' ' + this.swapTo);
        } else {
            setText('swap-receive', '0.00 ' + this.swapTo);
            setText('swap-rate', '-');
        }
    }

    openChainModal(target) {
        this.chainTarget = target;
        const curId = target === 'from' ? this.fromChainId : this.toChainId;
        const container = $('chain-options');
        
        if (!container) return;
        
        container.innerHTML = Object.entries(CHAINS).map(([id, chain]) => `
            <div class="chain-option${parseInt(id) === curId ? ' selected' : ''}" data-chain="${id}">
                <span style="font-size:26px;">${chain.icon}</span>
                <div>
                    <strong>${chain.name}</strong>
                    <br><small style="color:var(--text-muted);">Testnet</small>
                </div>
                ${parseInt(id) === curId ? '<span style="margin-left:auto;color:var(--green);">✓</span>' : ''}
            </div>
        `).join('');

        container.querySelectorAll('.chain-option').forEach(el => {
            el.onclick = () => {
                const id = parseInt(el.dataset.chain);
                if (this.chainTarget === 'from') this.fromChainId = id;
                else this.toChainId = id;
                this.updateBridgeDisplay();
                this.updateBridgeEstimate();
                this.closeModals();
            };
        });

        $('chain-modal')?.classList.add('active');
    }

    openTokenModal(target) {
        this.tokenTarget = target;
        const container = $('token-options');
        
        if (!container) return;
        
        container.innerHTML = TOKENS.map(token => `
            <div class="chain-option" data-token="${token}">
                <span style="font-size:26px;">${TOKEN_ICONS[token]}</span>
                <div><strong>${token}</strong></div>
            </div>
        `).join('');

        container.querySelectorAll('.chain-option').forEach(el => {
            el.onclick = () => {
                const token = el.dataset.token;
                if (this.tokenTarget === 'bridge') {
                    this.bridgeToken = token;
                    const display = $('bridge-token-display');
                    if (display) display.innerHTML = `<span>${TOKEN_ICONS[token]}</span> ${token} ▼`;
                } else if (this.tokenTarget === 'swapFrom') {
                    this.swapFrom = token;
                    this.updateSwapDisplay();
                    this.updateSwapEstimate();
                } else {
                    this.swapTo = token;
                    this.updateSwapDisplay();
                    this.updateSwapEstimate();
                }
                this.closeModals();
            };
        });

        $('token-modal')?.classList.add('active');
    }

    async executeBridge() {
        const amount = parseFloat($('bridge-input')?.value);
        if (!amount || amount <= 0) return alert('Enter an amount');
        
        if (typeof showTx === 'function') {
            showTx('loading', 'Confirm bridge in wallet...');
        }
        
        try {
            const tx = await this.contracts.bridgeTokens(this.toChainId, amount.toString());
            if (typeof showTx === 'function') {
                showTx('loading', 'Bridging tokens...');
            }
            const receipt = await tx.wait();
            if (typeof showTx === 'function') {
                showTx('success', `Bridged ${amount} ${this.bridgeToken} → ${CHAINS[this.toChainId].name}!`, tx.hash);
            }
            const input = $('bridge-input');
            if (input) input.value = '';
            this.updateBridgeEstimate();
        } catch (error) {
            if (typeof showTx === 'function') {
                if (error.code === 'ACTION_REJECTED') showTx('error', 'Transaction cancelled');
                else showTx('error', error.message || 'Bridge failed');
                setTimeout(() => typeof closeTx === 'function' && closeTx(), 3000);
            }
        }
    }

    executeSwap() {
        const amount = parseFloat($('swap-input')?.value);
        if (!amount || amount <= 0) return alert('Enter an amount');
        
        if (typeof showTx === 'function') {
            showTx('loading', 'Swapping tokens...');
        }
        
        // Simulated swap (integrate DEX in production)
        setTimeout(() => {
            const rate = 0.97 + Math.random() * 0.05;
            const hash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            if (typeof showTx === 'function') {
                showTx('success', `Swapped ${amount} ${this.swapFrom} → ${(amount * rate).toFixed(6)} ${this.swapTo}!`, hash);
            }
            const input = $('swap-input');
            if (input) input.value = '';
            this.updateSwapEstimate();
        }, 1500);
    }

    closeModals() {
        $('chain-modal')?.classList.remove('active');
        $('token-modal')?.classList.remove('active');
    }
}

console.log('✅ BridgeController loaded');