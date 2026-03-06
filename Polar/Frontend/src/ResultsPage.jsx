import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import {
  Target,
  AlertTriangle,
  Zap,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Shield,
} from "lucide-react";

/* ─────────────────────────────────────────
   FONTS  (injected once)
───────────────────────────────────────── */
const FontInjector = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #060608;
      --surface: #0d0d12;
      --border: rgba(255,255,255,0.06);
      --border-bright: rgba(255,255,255,0.12);
      --text: #f0f0f5;
      --muted: #6b6b7a;
      --accent: #7c6aff;
      --accent2: #00d4aa;
      --accent3: #ff6b6b;
      --accent-glow: rgba(124,106,255,0.25);
      --green: #00d4aa;
      --red: #ff5a5a;
      --yellow: #ffd060;
    }

    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

    .font-display { font-family: 'Syne', sans-serif; }
    .font-mono { font-family: 'DM Mono', monospace; }

    /* noise overlay */
    .noise::after {
      content: '';
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      opacity: 0.4;
    }

    /* scanlines */
    .scanlines::before {
      content: '';
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
    }

    /* glowing orbs */
    .orb {
      position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0;
    }

    /* scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 4px; }

    /* score ring animation */
    @keyframes dash {
      from { stroke-dashoffset: 440; }
      to   { stroke-dashoffset: var(--target-offset); }
    }
    .ring-anim { animation: dash 1.6s cubic-bezier(0.4,0,0.2,1) forwards; }

    /* shimmer */
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .shimmer-text {
      background: linear-gradient(90deg, var(--text) 30%, var(--accent) 50%, var(--text) 70%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
    }

    /* card hover lift */
    .card-hover {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,106,255,0.15);
    }

    /* progress bar fill */
    @keyframes fillBar {
      from { width: 0%; }
      to   { width: var(--target-width); }
    }
    .bar-fill { animation: fillBar 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }
  `}</style>
);

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

/* Score ring (SVG) */
function ScoreRing({ value, max = 100, size = 120, label }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const pct = value / max;
  const offset = circ * (1 - pct);
  const color = pct > 0.7 ? "#00d4aa" : pct > 0.4 ? "#ffd060" : "#ff5a5a";

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ "--target-offset": offset, transformOrigin: "center", transform: "rotate(-90deg)" }}
          className="ring-anim"
        />
        <text x="72" y="76" textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="22" fontFamily="Syne, sans-serif" fontWeight="700">
          {value}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "DM Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

/* Tag pill */
function Tag({ text, type }) {
  const styles = {
    green: { bg: "rgba(0,212,170,0.1)", border: "rgba(0,212,170,0.25)", color: "#00d4aa" },
    red:   { bg: "rgba(255,90,90,0.1)",  border: "rgba(255,90,90,0.25)",  color: "#ff5a5a" },
    yellow:{ bg: "rgba(255,208,96,0.1)", border: "rgba(255,208,96,0.25)", color: "#ffd060" },
  };
  const s = styles[type] || styles.yellow;
  return (
    <span style={{
      padding: "4px 10px", fontSize: 12, borderRadius: 6,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontFamily: "DM Mono, monospace", letterSpacing: "0.03em",
    }}>
      {text}
    </span>
  );
}

/* Section card */
function Section({ icon, label, accent = "#7c6aff", children, index = 0 }) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div variants={fadeUp} className="card-hover" style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* top accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      {/* header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px", background: "none", border: "none", cursor: "pointer", color: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${accent}18`, border: `1px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center", color: accent,
          }}>
            {icon}
          </div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.01em" }}>
            {label}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="var(--muted)" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div style={{ padding: "0 28px 28px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Progress bar */
function ProgressBar({ label, value, color = "#7c6aff" }) {
  const num = parseFloat(value) || 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--muted)", textTransform: "capitalize", fontFamily: "DM Mono, monospace" }}>
          {label.replace(/_/g, " ")}
        </span>
        <span style={{ fontSize: 13, fontFamily: "DM Mono, monospace", color: "var(--text)" }}>{value}</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div className="bar-fill" style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          "--target-width": `${num}%`,
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
    </div>
  );
}

/* Divider */
const Divider = () => (
  <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />
);

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const analysis = location.state?.analysis;
  const fileName = location.state?.fileName;
  const jd = location.state?.jd;

  /* If user refreshes page */
  if (!analysis) {
    return (
      <>
        <FontInjector />
        <div style={{
          minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Syne, sans-serif",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontSize: 24, marginBottom: 24 }}>No analysis data found</h2>
            <button
              onClick={() => navigate("/analyze")}
              style={{
                background: "linear-gradient(135deg, var(--accent), #9d6aff)",
                border: "none", borderRadius: 12, padding: "12px 28px",
                color: "#fff", fontFamily: "Syne, sans-serif", fontWeight: 700,
                fontSize: 15, cursor: "pointer",
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const a = analysis.analysis;
  const matchPct = a.manual_skill_check.manual_match_percentage;
  const atsScore = a.ats_analysis.ats_overall_score;

  return (
    <>
      <FontInjector />

      {/* Background */}
      <div className="noise scanlines" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: -200, background: "rgba(124,106,255,0.12)" }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: 100, right: -100, background: "rgba(0,212,170,0.07)" }} />

      <div ref={containerRef} style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "48px 24px 100px" }}>
        <motion.div variants={stagger} initial="initial" animate="animate">

          {/* ── Back button ── */}
          <motion.button
            variants={fadeUp}
            onClick={() => navigate("/analyze")}
            whileHover={{ x: -4 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", fontFamily: "DM Mono, monospace",
              fontSize: 13, marginBottom: 40, padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Back to analyzer
          </motion.button>

          {/* ── HERO HEADER ── */}
          <motion.div variants={fadeUp} style={{ marginBottom: 56 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(124,106,255,0.1)", border: "1px solid rgba(124,106,255,0.25)",
              borderRadius: 99, padding: "6px 14px", marginBottom: 20,
            }}>
              <Sparkles size={12} color="#7c6aff" />
              <span style={{ fontSize: 12, color: "#7c6aff", fontFamily: "DM Mono, monospace", letterSpacing: "0.06em" }}>
                AI ANALYSIS COMPLETE
              </span>
            </div>

            <h1 className="font-display shimmer-text" style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 12 }}>
              Resume Analysis
            </h1>

            <p style={{ fontSize: 14, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
              {a.metadata?.resume_file || fileName || "your resume"}
            </p>
          </motion.div>

          {/* ── TOP SCORE TRIO ── */}
          <motion.div variants={fadeUp} style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16, marginBottom: 28,
          }}>
            {[
              { label: "Skill Match", value: matchPct, max: 100, icon: <Target size={16} />, color: "#00d4aa" },
              { label: "ATS Score",   value: atsScore,  max: 100, icon: <Shield size={16} />, color: "#7c6aff" },
              { label: "Fit Rating",  value: a.next_domain_targets?.next_domains?.[0]?.fit_score ?? "—", max: 10, icon: <TrendingUp size={16} />, color: "#ffd060" },
            ].map(({ label, value, max, icon, color }) => (
              <div key={label} className="card-hover" style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 18, padding: "28px 24px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <ScoreRing value={value} max={max} size={110} label={label} />
              </div>
            ))}
          </motion.div>

          {/* ── SKILL MATCH ── */}
          <Section icon={<Target size={16} />} label="Skill Match" accent="#00d4aa" index={0}>
            <div style={{ display: "flex", gap: 32, marginBottom: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 48, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "#00d4aa", lineHeight: 1 }}>
                  {matchPct}<span style={{ fontSize: 22 }}>%</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace", marginTop: 4 }}>match rate</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "#00d4aa", fontFamily: "DM Mono, monospace", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
                  ✓ Matched Skills
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.manual_skill_check.manual_matched_skills.map(s => <Tag key={s} text={s} type="green" />)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#ff5a5a", fontFamily: "DM Mono, monospace", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
                  ✗ Missing Skills
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.manual_skill_check.manual_missing_skills.map(s => <Tag key={s} text={s} type="red" />)}
                </div>
              </div>
            </div>
          </Section>

          <div style={{ height: 16 }} />

          {/* ── ATS SCORE ── */}
          <Section icon={<AlertTriangle size={16} />} label="ATS Analysis" accent="#7c6aff" index={1}>
            <div style={{ marginBottom: 24 }}>
              {Object.entries(a.ats_analysis.breakdown).map(([k, v]) => (
                <ProgressBar key={k} label={k} value={v} color="#7c6aff" />
              ))}
            </div>
          </Section>

          <div style={{ height: 16 }} />

          {/* ── ATS KILLERS ── */}
          <Section icon={<XCircle size={16} />} label="ATS Issues" accent="#ff5a5a" index={2}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {a.ats_analysis.ats_killers.map((issue, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    padding: "16px 20px", borderRadius: 12,
                    background: "rgba(255,90,90,0.04)",
                    border: "1px solid rgba(255,90,90,0.12)",
                    borderLeft: "3px solid #ff5a5a",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ff5a5a", marginBottom: 6 }}>
                    {issue.issue}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                    <span style={{ color: "#00d4aa", fontFamily: "DM Mono, monospace", fontSize: 11, marginRight: 6 }}>FIX →</span>
                    {issue.fix}
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>

          <div style={{ height: 16 }} />

          {/* ── KEYWORD DENSITY ── */}
          <Section icon={<Zap size={16} />} label="Keyword Density" accent="#ffd060" index={3}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "#00d4aa", fontFamily: "DM Mono, monospace", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
                  Found in Resume
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.ats_analysis.keyword_density_analysis.found_in_resume.map(k => <Tag key={k} text={k} type="green" />)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#ff5a5a", fontFamily: "DM Mono, monospace", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
                  Missing Keywords
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.ats_analysis.keyword_density_analysis.missing_from_resume.map(k => <Tag key={k} text={k} type="red" />)}
                </div>
              </div>
            </div>
          </Section>

          <div style={{ height: 16 }} />

          {/* ── PROJECTS ── */}
          <Section icon={<BookOpen size={16} />} label="Project Analysis" accent="#a78bfa" index={4}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {a.project_ratings.projects.map((project, i) => {
                const pct = (project.rating / 10) * 100;
                const rColor = pct > 70 ? "#00d4aa" : pct > 40 ? "#ffd060" : "#ff5a5a";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      padding: "20px 22px", borderRadius: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {project.name}
                      </div>
                      <div style={{
                        fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 500, color: rColor,
                        lineHeight: 1,
                      }}>
                        {project.rating}<span style={{ fontSize: 12, color: "var(--muted)" }}>/10</span>
                      </div>
                    </div>

                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", marginBottom: 14, overflow: "hidden" }}>
                      <div className="bar-fill" style={{
                        height: "100%", borderRadius: 99,
                        background: `linear-gradient(90deg, ${rColor}, ${rColor}88)`,
                        "--target-width": `${pct}%`,
                      }} />
                    </div>

                    <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
                      {project.rating_reason}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#00d4aa", fontFamily: "DM Mono, monospace", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Strengths</div>
                        <ul style={{ paddingLeft: 16 }}>
                          {project.strengths.map((s, j) => (
                            <li key={j} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, lineHeight: 1.5 }}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#ff5a5a", fontFamily: "DM Mono, monospace", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Weaknesses</div>
                        <ul style={{ paddingLeft: 16 }}>
                          {project.weaknesses.map((w, j) => (
                            <li key={j} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, lineHeight: 1.5 }}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          <div style={{ height: 16 }} />

          {/* ── RESUME IMPROVEMENTS ── */}
          <Section icon={<CheckCircle2 size={16} />} label="Resume Improvements" accent="#00d4aa" index={5}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "DM Mono, monospace", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                  Current Summary
                </div>
                <div style={{
                  padding: "16px 18px", borderRadius: 12,
                  background: "rgba(255,90,90,0.04)", border: "1px solid rgba(255,90,90,0.12)",
                  fontSize: 13, color: "var(--muted)", lineHeight: 1.7,
                }}>
                  {a.resume_improvements.summary_section.current}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#00d4aa", fontFamily: "DM Mono, monospace", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                  ✦ Improved Summary
                </div>
                <div style={{
                  padding: "16px 18px", borderRadius: 12,
                  background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.2)",
                  fontSize: 13, color: "var(--text)", lineHeight: 1.7,
                }}>
                  {a.resume_improvements.summary_section.improved}
                </div>
              </div>
            </div>
          </Section>

          <div style={{ height: 16 }} />

          {/* ── CAREER PATH ── */}
          <Section icon={<Target size={16} />} label="Career Path Suggestions" accent="#ffd060" index={6}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {a.next_domain_targets.next_domains.map((domain, i) => {
                const fitPct = (domain.fit_score / 10) * 100;
                const dColor = fitPct > 70 ? "#00d4aa" : fitPct > 40 ? "#ffd060" : "#ff5a5a";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    style={{
                      padding: "20px 22px", borderRadius: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {/* subtle bg glow */}
                    <div style={{
                      position: "absolute", top: -40, right: -40, width: 120, height: 120,
                      borderRadius: "50%", background: `${dColor}0a`, filter: "blur(30px)",
                      pointerEvents: "none",
                    }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {domain.domain}
                      </div>
                      <div style={{
                        fontFamily: "DM Mono, monospace", fontSize: 20, fontWeight: 500, color: dColor,
                      }}>
                        {domain.fit_score}<span style={{ fontSize: 11, color: "var(--muted)" }}>/10</span>
                      </div>
                    </div>

                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", marginBottom: 12, overflow: "hidden" }}>
                      <div className="bar-fill" style={{
                        height: "100%", borderRadius: 99,
                        background: `linear-gradient(90deg, ${dColor}, ${dColor}77)`,
                        "--target-width": `${fitPct}%`,
                      }} />
                    </div>

                    <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
                      {domain.reasoning}
                    </p>

                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                      Example Roles
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {domain.example_roles.map((r, j) => (
                        <Tag key={j} text={r} type="yellow" />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>

        </motion.div>
      </div>
    </>
  );
}