// ============ ROOT UTILITIES ============
const ETH_PRICE = 3200;

function $(id) {
    return document.getElementById(id);
}

function shortAddr(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function fmtEth(wei) {
    if (!wei) return '0.0000';
    return parseFloat(ethers.utils.formatEther(wei)).toFixed(4);
}

function formatDate(ts) {
    return new Date(ts).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showEl(id) {
    const el = $(id);
    if (el) el.classList.remove('hidden');
}

function hideEl(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
}

function toggleEl(id, show) {
    const el = $(id);
    if (el) el.classList.toggle('hidden', !show);
}

function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
}

function setHTML(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
}

console.log('✅ Utils loaded');