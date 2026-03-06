import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────
   FONTS & GLOBAL STYLES
───────────────────────────────────────── */
const FontInjector = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #060608;
      --surface: #0d0d12;
      --surface2: #111118;
      --border: rgba(255,255,255,0.06);
      --border-bright: rgba(255,255,255,0.12);
      --text: #f0f0f5;
      --muted: #6b6b7a;
      --accent: #7c6aff;
      --accent2: #00d4aa;
      --accent-glow: rgba(124,106,255,0.3);
      --green: #00d4aa;
      --red: #ff5a5a;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
    }

    .font-display { font-family: 'Syne', sans-serif; }
    .font-mono    { font-family: 'DM Mono', monospace; }

    /* noise */
    .noise::after {
      content: '';
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      opacity: 0.45;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 4px; }

    /* shimmer on headline */
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .shimmer-text {
      background: linear-gradient(90deg, var(--text) 30%, var(--accent) 50%, var(--text) 70%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      animation: shimmer 5s linear infinite;
    }

    /* pulse ring on orb */
    @keyframes pulseRing {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.6); opacity: 0;   }
    }

    /* card */
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      overflow: hidden;
      position: relative;
    }

    /* dropzone hover */
    .dropzone-idle {
      border: 1.5px dashed rgba(255,255,255,0.1);
      border-radius: 16px;
      transition: border-color 0.25s, background 0.25s;
      cursor: pointer;
    }
    .dropzone-idle:hover {
      border-color: rgba(124,106,255,0.5);
      background: rgba(124,106,255,0.04);
    }
    .dropzone-active {
      border: 1.5px dashed rgba(124,106,255,0.7) !important;
      background: rgba(124,106,255,0.08) !important;
    }

    /* textarea */
    .jd-textarea {
      width: 100%;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      color: var(--text);
      resize: none;
      outline: none;
      line-height: 1.7;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .jd-textarea::placeholder { color: var(--muted); }
    .jd-textarea:focus {
      border-color: rgba(124,106,255,0.4);
      box-shadow: 0 0 0 3px rgba(124,106,255,0.08);
    }

    /* CTA button */
    .cta-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 17px 24px; border-radius: 14px; border: none; cursor: pointer;
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
      letter-spacing: 0.02em; transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
      position: relative; overflow: hidden;
    }
    .cta-btn-active {
      background: linear-gradient(135deg, #7c6aff, #a78bfa);
      color: #fff;
      box-shadow: 0 8px 32px rgba(124,106,255,0.35);
    }
    .cta-btn-active:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 40px rgba(124,106,255,0.5);
    }
    .cta-btn-active:active { transform: translateY(0); }
    .cta-btn-disabled {
      background: rgba(255,255,255,0.04);
      color: var(--muted); cursor: not-allowed;
      border: 1px solid var(--border);
    }

    /* cta shimmer sweep */
    .cta-btn-active::after {
      content: '';
      position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      animation: sweep 3s linear infinite;
    }
    @keyframes sweep {
      0%   { left: -60%; }
      100% { left: 160%; }
    }

    /* loading dots */
    @keyframes blink { 0%,80%,100% { opacity: 0.2; } 40% { opacity: 1; } }
    .dot { animation: blink 1.4s infinite; display: inline-block; }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    /* panel accent top line */
    .accent-line-purple { height: 2px; background: linear-gradient(90deg, #7c6aff, transparent); }
    .accent-line-teal   { height: 2px; background: linear-gradient(90deg, #00d4aa, transparent); }
  `}</style>
);

const stagger = { animate: { transition: { staggerChildren: 0.09 } } };
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

/* ── small stat badge ── */
function StatBadge({ icon, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: "6px 12px", borderRadius: 99,
      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
      fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace",
    }}>
      {icon}
      {label}
    </div>
  );
}

/* ── panel header row ── */
function PanelHeader({ icon, label, badge, accentColor = "#7c6aff" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${accentColor}18`, border: `1px solid ${accentColor}30`,
        display: "flex", alignItems: "center", justifyContent: "center", color: accentColor,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15 }}>{label}</span>
      {badge && (
        <span style={{
          marginLeft: "auto", fontSize: 11, color: "var(--muted)",
          fontFamily: "DM Mono, monospace", letterSpacing: "0.05em",
        }}>{badge}</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function AnalyzePage() {
  const navigate = useNavigate();

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jdFocused, setJdFocused] = useState(false);

  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) { setError("Please upload a PDF or DOCX file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File size must be under 10MB."); return; }
    setError(""); setResumeFile(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  const handleAnalyze = async () => {
    if (!resumeFile) { setError("Please upload a resume first."); return; }
    if (!jobDescription.trim()) { setError("Please paste a job description."); return; }
    setError(""); setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jd_text", jobDescription);
      const response = await fetch("http://localhost:8000/extract-skills", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Backend error");
      const data = await response.json();
      setLoading(false);
      navigate("/results", { state: { analysis: data, fileName: resumeFile.name, jd: jobDescription } });
    } catch (err) {
      console.error(err);
      setError("Failed to analyze resume. Check backend.");
      setLoading(false);
    }
  };

  const canAnalyze = resumeFile && jobDescription.trim().length > 20;
  const wordCount = jobDescription.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <FontInjector />

      {/* bg */}
      <div className="noise" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 700, height: 700, top: -250, left: -200, borderRadius: "50%", background: "rgba(124,106,255,0.10)", filter: "blur(130px)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 500, height: 500, bottom: -150, right: -150, borderRadius: "50%", background: "rgba(0,212,170,0.06)", filter: "blur(100px)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "52px 24px 80px" }}>
        <motion.div
          variants={stagger} initial="initial" animate="animate"
          style={{ maxWidth: 860, margin: "0 auto" }}
        >

          {/* ── HERO ── */}
          <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 60 }}>
            {/* pill badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(124,106,255,0.1)", border: "1px solid rgba(124,106,255,0.25)",
                borderRadius: 99, padding: "6px 16px", marginBottom: 28,
              }}
            >
              <Zap size={12} color="#7c6aff" />
              <span style={{ fontSize: 11, color: "#7c6aff", fontFamily: "DM Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                AI Analysis Engine
              </span>
            </motion.div>

            <h1
              className="font-display shimmer-text"
              style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 18 }}
            >
              Analyze Your Resume
            </h1>

            <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Upload your resume and paste a job description. The AI pipeline extracts skills, scores ATS compatibility, and surfaces deep insights.
            </p>

            {/* stat row */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
              <StatBadge icon={<Sparkles size={11} />} label="Skill Matching" />
              <StatBadge icon={<CheckCircle2 size={11} />} label="ATS Scoring" />
              <StatBadge icon={<Zap size={11} />} label="Keyword Analysis" />
            </div>
          </motion.div>

          {/* ── TWO PANELS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

            {/* Resume Upload */}
            <motion.div variants={fadeUp} className="panel">
              <div className="accent-line-purple" />
              <div style={{ padding: "28px 28px 28px" }}>
                <PanelHeader icon={<FileText size={15} />} label="Resume" badge="PDF · DOCX" accentColor="#7c6aff" />

                <AnimatePresence mode="wait">
                  {resumeFile ? (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        background: "rgba(0,212,170,0.05)",
                        border: "1px solid rgba(0,212,170,0.2)",
                        borderRadius: 14, padding: "16px 18px",
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4aa", flexShrink: 0,
                      }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Syne, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {resumeFile.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#00d4aa", fontFamily: "DM Mono, monospace", marginTop: 2 }}>
                          {(resumeFile.size / 1024).toFixed(0)} KB · ready
                        </div>
                      </div>
                      <button
                        onClick={() => setResumeFile(null)}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                          background: "rgba(255,90,90,0.1)", color: "#ff5a5a",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <X size={13} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={dragActive ? "dropzone-active" : "dropzone-idle"}
                      style={{ padding: "44px 24px", textAlign: "center" }}
                    >
                      <motion.div
                        animate={dragActive ? { scale: 1.15 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{
                          width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
                          background: dragActive ? "rgba(124,106,255,0.15)" : "rgba(255,255,255,0.05)",
                          border: "1px solid " + (dragActive ? "rgba(124,106,255,0.4)" : "var(--border)"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: dragActive ? "#7c6aff" : "var(--muted)",
                        }}
                      >
                        <Upload size={20} />
                      </motion.div>

                      <p style={{ fontSize: 14, marginBottom: 6 }}>
                        Drag & drop or{" "}
                        <span style={{ color: "#7c6aff", fontWeight: 600 }}>browse files</span>
                      </p>
                      <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
                        PDF or DOCX · max 10MB
                      </p>

                      <input ref={fileInputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
                        onChange={(e) => handleFile(e.target.files[0])} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Job Description */}
            <motion.div variants={fadeUp} className="panel">
              <div className="accent-line-teal" />
              <div style={{ padding: "28px 28px 28px" }}>
                <PanelHeader
                  icon={<Briefcase size={15} />}
                  label="Job Description"
                  badge={wordCount > 0 ? `${wordCount} words` : undefined}
                  accentColor="#00d4aa"
                />

                <textarea
                  className="jd-textarea"
                  rows={9}
                  placeholder="Paste the full job description here — the more detail, the better the analysis..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  onFocus={() => setJdFocused(true)}
                  onBlur={() => setJdFocused(false)}
                />

                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
                    min. 20 words recommended
                  </span>
                  {wordCount >= 20 && (
                    <motion.div
                      initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#00d4aa", fontFamily: "DM Mono, monospace" }}
                    >
                      <CheckCircle2 size={11} /> looks good
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── ERROR ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,90,90,0.06)", border: "1px solid rgba(255,90,90,0.2)",
                  borderLeft: "3px solid #ff5a5a",
                  borderRadius: 12, padding: "14px 18px", marginBottom: 16,
                  fontSize: 13, color: "#ff8080",
                }}
              >
                <AlertCircle size={15} color="#ff5a5a" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA BUTTON ── */}
          <motion.div variants={fadeUp}>
            <motion.button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className={`cta-btn ${canAnalyze && !loading ? "cta-btn-active" : "cta-btn-disabled"}`}
              whileHover={canAnalyze && !loading ? { scale: 1.005 } : {}}
              whileTap={canAnalyze && !loading ? { scale: 0.997 } : {}}
            >
              {loading ? (
                <>
                  <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                  <span>
                    Analyzing
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run Analysis Pipeline
                  <ChevronRight size={16} />
                </>
              )}
            </motion.button>

            {/* sub-hint */}
            {!canAnalyze && !loading && (
              <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
                {!resumeFile ? "↑ upload your resume to continue" : "↑ paste a job description to continue"}
              </p>
            )}
          </motion.div>

        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}