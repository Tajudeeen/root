// ============ ROOT SMART SUGGESTIONS ============
class SmartSuggestions {
    constructor() {
        this.lastAPY = null;
        this.lastGasPrice = null;
        this.dismissedUntil = 0; // timestamp when the dismissed suggestion can reappear
    }

    async generate(position) {
        // Don't show if recently dismissed (30 min cooldown)
        if (Date.now() < this.dismissedUntil) return null;

        const suggestions = [];

        // Heuristic 1: Gas-based suggestion (estimate or use a simple fetch)
        const gasPrice = await this.fetchGasPrice();
        if (gasPrice && gasPrice < 15 && position && parseFloat(position.deposited) > 0) {
            const pendingYield = parseFloat(position.totalClaimable || position.pendingYield || 0);
            if (pendingYield > 0.001) {
                suggestions.push({
                    priority: 1,
                    text: `Gas is low (~${gasPrice} gwei). Consider compounding your ${pendingYield.toFixed(4)} ETH.`
                });
            } else {
                suggestions.push({
                    priority: 2,
                    text: `Gas is low (~${gasPrice} gwei). A good time to deposit more.`
                });
            }
        }

        // Heuristic 2: Unclaimed yield threshold
        if (position && position.exists && parseFloat(position.deposited) > 0) {
            const pendingYield = parseFloat(position.totalClaimable || position.pendingYield || 0);
            if (pendingYield > 0.01) {
                suggestions.push({
                    priority: 1,
                    text: `You've earned ${pendingYield.toFixed(4)} ETH. Compound it to maximize growth.`
                });
            } else if (pendingYield > 0.001) {
                suggestions.push({
                    priority: 3,
                    text: `Your yield is growing (${pendingYield.toFixed(4)} ETH). Keep it planted.`
                });
            }
        }

        // Heuristic 3: APY movement
        if (position && position.apy && this.lastAPY) {
            const currentAPY = parseFloat(position.apy);
            const previousAPY = parseFloat(this.lastAPY);
            if (currentAPY > previousAPY * 1.05) {
                suggestions.push({
                    priority: 1,
                    text: `APY just increased to ${currentAPY}%! Deposit more to lock in higher returns.`
                });
            }
        }

        // Update tracked APY
        if (position && position.apy) {
            this.lastAPY = position.apy;
        }

        // Return highest priority suggestion
        suggestions.sort((a, b) => a.priority - b.priority);
        return suggestions.length > 0 ? suggestions[0].text : null;
    }

    async fetchGasPrice() {
        // Simple gas estimation: use provider's getGasPrice and convert to gwei
        try {
            if (window.rootApp && window.rootApp.wallet && window.rootApp.wallet.provider) {
                const gasPrice = await window.rootApp.wallet.provider.getGasPrice();
                return Math.round(parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei')));
            }
        } catch (e) {
            // fallback
        }
        // If we can't get it, return a reasonable estimate or null
        return null;
    }

    dismiss() {
        // 30-minute cooldown
        this.dismissedUntil = Date.now() + 30 * 60 * 1000;
        const card = document.getElementById('suggestions-card');
        if (card) card.classList.add('hidden');
    }

    show(text) {
        const card = document.getElementById('suggestions-card');
        const textEl = document.getElementById('suggestion-text');
        if (card && textEl) {
            textEl.textContent = text;
            card.classList.remove('hidden');
        }
    }

    hide() {
        const card = document.getElementById('suggestions-card');
        if (card) card.classList.add('hidden');
    }
}

console.log('✅ SmartSuggestions loaded');