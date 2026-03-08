/**
 * ResumAI — Antigravity Particle Engine
 * Floating glowing orbs with physics — inspired by Google's Antigravity Easter egg.
 */
(function () {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to full window
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // ── CONFIG ─────────────────────────────────────────
    const COLORS = [
        'rgba(139,92,246,',   // purple
        'rgba(236,72,153,',   // pink
        'rgba(6,182,212,',    // cyan
        'rgba(16,185,129,',   // green
        'rgba(245,158,11,',   // amber
    ];

    const ORBS = [];
    const NUM_ORBS = 18;
    const MOUSE = { x: -9999, y: -9999 };

    // Cursor tracking for mouse-repel effect
    window.addEventListener('mousemove', e => {
        MOUSE.x = e.clientX;
        MOUSE.y = e.clientY;
    });

    function rand(min, max) { return Math.random() * (max - min) + min; }

    class Orb {
        constructor() { this.reset(true); }

        reset(init = false) {
            this.x = rand(0, canvas.width);
            this.y = init ? rand(0, canvas.height) : canvas.height + 60;
            this.r = rand(6, 28);
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.alpha = rand(0.18, 0.55);
            this.vx = rand(-0.35, 0.35);
            this.vy = rand(-0.55, -0.15);
            this.pulse = rand(0, Math.PI * 2);
            this.pulseSpeed = rand(0.012, 0.028);
            this.glow = rand(8, 26);
        }

        update() {
            this.pulse += this.pulseSpeed;
            const pulseFactor = Math.sin(this.pulse) * 0.15;

            // Mouse repel
            const dx = this.x - MOUSE.x;
            const dy = this.y - MOUSE.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
                const force = (160 - dist) / 160 * 0.6;
                this.vx += (dx / dist) * force;
                this.vy += (dy / dist) * force;
            }

            // Dampen velocity
            this.vx *= 0.985;
            this.vy *= 0.985;

            // Gentle drift push so they keep floating up
            this.vy += rand(-0.008, 0.002);

            this.x += this.vx;
            this.y += this.vy;

            // Wrap horizontal edges
            if (this.x < -this.r * 2) this.x = canvas.width + this.r;
            if (this.x > canvas.width + this.r * 2) this.x = -this.r;

            // Recycle when it exits top
            if (this.y < -this.r * 3) this.reset();
        }

        draw() {
            const r = this.r * (1 + Math.sin(this.pulse) * 0.12);
            const glow = this.glow * (1 + Math.sin(this.pulse) * 0.3);
            const a = this.alpha;

            // Outer glow
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 3);
            grad.addColorStop(0, this.color + (a * 0.9).toFixed(2) + ')');
            grad.addColorStop(0.4, this.color + (a * 0.35).toFixed(2) + ')');
            grad.addColorStop(1, this.color + '0)');

            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Core solid orb
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fillStyle = this.color + a.toFixed(2) + ')';
            ctx.fill();

            // Specular highlight
            ctx.beginPath();
            ctx.arc(this.x - r * 0.28, this.y - r * 0.28, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fill();
        }
    }

    // Populate orbs
    for (let i = 0; i < NUM_ORBS; i++) ORBS.push(new Orb());

    // ── LINE CONNECTIONS ──────────────────────────────
    function drawConnections() {
        for (let i = 0; i < ORBS.length; i++) {
            for (let j = i + 1; j < ORBS.length; j++) {
                const dx = ORBS[i].x - ORBS[j].x;
                const dy = ORBS[i].y - ORBS[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const MAX = 200;
                if (dist < MAX) {
                    const a = (1 - dist / MAX) * 0.08;
                    ctx.strokeStyle = `rgba(139,92,246,${a})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(ORBS[i].x, ORBS[i].y);
                    ctx.lineTo(ORBS[j].x, ORBS[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // ── RENDER LOOP ───────────────────────────────────
    function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawConnections();
        ORBS.forEach(o => { o.update(); o.draw(); });
        requestAnimationFrame(frame);
    }
    frame();
})();
