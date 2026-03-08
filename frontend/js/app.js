// ─── ResumAI Shared App Logic ─────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api';

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
function showToast(icon, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size:1.1rem;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity .4s, transform .4s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function apiPost(endpoint, data) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    } catch (e) { return { error: e.message }; }
}

async function apiGet(endpoint) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`);
        return res.json();
    } catch (e) { return { error: e.message }; }
}

// ─── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
});

// ─── SMOOTH SCROLL FOR NAV ANCHORS ────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

// ─── SIDEBAR LINK ACTIVE TRACKING ────────────────────────────────────────────
(function () {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        link.addEventListener('click', function () {
            if (this.href && !this.href.endsWith('#') && !this.href.startsWith('javascript')) {
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
})();

// ─── SAFE FADE-IN (cards always visible, subtle animation only) ───────────────
// NOTE: We do NOT set opacity:0 globally — that caused black screens.
// Instead, we add a gentle entrance only if IntersectionObserver is supported
// and only on cards that are NOT already in the viewport on load.
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-done');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });

    // Only animate cards that are BELOW the fold (not immediately visible)
    requestAnimationFrame(() => {
        const viewH = window.innerHeight;
        document.querySelectorAll('.card:not([data-no-anim])').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top > viewH) {
                // Card is below the fold — animate it on scroll
                el.classList.add('fade-in-pending');
                io.observe(el);
            }
            // Cards already visible: leave them completely alone (always visible)
        });
    });
}
