// ── ResumAI Theme Manager ─────────────────────────────────────────────────────
(function () {
    const saved = localStorage.getItem('resumai-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('resumai-theme', next);
    _updateIcon(next);
}

function _updateIcon(t) {
    document.querySelectorAll('.theme-icon').forEach(el => {
        el.textContent = t === 'dark' ? '🌙' : '☀️';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const t = localStorage.getItem('resumai-theme') || 'dark';
    _updateIcon(t);
});
