// ============ ROOT LIVE YIELD STREAM ============
class YieldStream {
    constructor() {
        this.interval = null;
        this.startTime = null;
        this.startDeposit = 0;
        this.startYield = 0;
        this.apy = 0.125;
        this.lastPulseValue = 0;
    }

    start(position) {
        this.stop();
        
        if (!position || !position.exists || parseFloat(position.deposited) <= 0) {
            this.showEmpty();
            return;
        }

        this.showStreaming();
        
        this.startTime = Date.now();
        this.startDeposit = parseFloat(position.deposited);
        this.startYield = parseFloat(position.totalClaimable || position.pendingYield || 0);
        this.apy = parseFloat(position.apy) / 100;
        this.lastPulseValue = this.startYield;

        const secondsPerYear = 365 * 24 * 60 * 60;
        const perSecondRate = this.startDeposit * this.apy / secondsPerYear;
        
        setText('per-second-rate', perSecondRate.toFixed(8));

        this.interval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const streamed = this.startDeposit * this.apy * (elapsed / secondsPerYear);
            const total = this.startYield + streamed;
            
            setText('streaming-yield', total.toFixed(8) + ' ETH');

            // Pulse on digit rollover
            if (Math.floor(total * 100000) > Math.floor(this.lastPulseValue * 100000)) {
                const el = $('streaming-yield');
                if (el) {
                    el.classList.add('pulse');
                    setTimeout(() => el.classList.remove('pulse'), 180);
                }
            }
            this.lastPulseValue = total;
        }, 80);

        console.log('🌊 Yield stream started');
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    showEmpty() {
        const amount = $('streaming-yield');
        const empty = $('streaming-empty');
        
        if (amount) amount.classList.add('hidden');
        if (empty) {
            empty.classList.remove('hidden');
            const cta = empty.querySelector('.streaming-cta');
            if (cta) {
                cta.onclick = () => {
                    if (typeof openDeposit === 'function') openDeposit();
                };
            }
        }
    }

    showStreaming() {
        const amount = $('streaming-yield');
        const empty = $('streaming-empty');
        
        if (amount) amount.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');
    }
}

console.log('✅ YieldStream loaded');