import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Target, AlertTriangle, Zap, BookOpen, 
  XCircle, ArrowLeft, FileText, TrendingUp, BarChart3, Activity
} from "lucide-react";

/* ─────────────────────────────────────────
   PROFESSIONAL UI STYLES (MINIMALIST)
───────────────────────────────────────── */
const StyleLayers = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

    :root {
      --bg: #0a0a0b;
      --card-bg: #111114;
      --border: #222226;
      --accent: #6366f1;
      --green: #10b981;
      --red: #ef4444;
      --yellow: #f59e0b;
      --text-main: #ffffff;
      --text-dim: #a1a1aa;
      
      --font-body: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    body { 
      background: var(--bg); 
      color: var(--text-main); 
      font-family: var(--font-body);
      margin: 0;
    }

    .dashboard-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 60px 24px;
    }

    .bento-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      position: relative;
    }

    .label-mono {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .progress-track {
      height: 6px;
      background: #1e1e22;
      border-radius: 3px;
      overflow: hidden;
    }

    .header-score-pill {
      background: #16161a;
      border: 1px solid var(--border);
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
  `}</style>
);

const ScorePill = ({ value, label, color }) => (
  <div className="header-score-pill">
    <div style={{ width: 40, height: 40, borderRadius: 6, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      <Activity size={20} />
    </div>
    <div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}%</div>
      <div className="label-mono">{label}</div>
    </div>
  </div>
);

const Section = ({ title, children, span = "span 6" }) => (
  <div className="card" style={{ gridColumn: span }}>
    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
      {title}
    </h3>
    {children}
  </div>
);

const FinalResume = ({ data }) => {
  const resume = data?.final_resume?.final_resume;
  console.log('Rendering Final Resume with data:', resume);

  if (!resume) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#111",
        padding: "40px",
        borderRadius: "10px",
        fontFamily: "Inter, sans-serif",
        lineHeight: 1.6,
      }}
    >
      {/* NAME */}
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>{resume.name}</h1>

      {/* CONTACT */}
      <div style={{ fontSize: 13, color: "#444", marginBottom: 20 }}>
        {resume.contact.email} | {resume.contact.phone} |{" "}
        {resume.contact.location}
      </div>

      {/* SUMMARY */}
      <section style={{ marginBottom: 18 }}>
        <h3 style={{ borderBottom: "1px solid #ddd" }}>Summary</h3>
        <p style={{ fontSize: 13 }}>{resume.summary}</p>
      </section>

      {/* SKILLS */}
      <section style={{ marginBottom: 18 }}>
        <h3 style={{ borderBottom: "1px solid #ddd" }}>Skills</h3>

        <p>
          <b>Technical:</b> {resume.skills.technical.join(", ")}
        </p>

        <p>
          <b>Tools:</b> {resume.skills.tools.join(", ")}
        </p>

        <p>
          <b>Soft:</b> {resume.skills.soft.join(", ")}
        </p>
      </section>

      {/* EXPERIENCE */}
      {resume.experience?.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h3 style={{ borderBottom: "1px solid #ddd" }}>Experience</h3>

          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <b>{exp.title}</b> — {exp.company}

              <ul style={{ marginTop: 6 }}>
                {exp.bullets?.map((b, idx) => (
                  <li key={idx} style={{ fontSize: 13 }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* PROJECTS */}
      <section style={{ marginBottom: 18 }}>
        <h3 style={{ borderBottom: "1px solid #ddd" }}>Projects</h3>

        {resume.projects.map((proj, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <b>{proj.name}</b>

            <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>
              Tech: {proj.tech_stack.join(", ")}
            </div>

            <ul>
              {proj.bullets?.map((b, idx) => (
                <li key={idx} style={{ fontSize: 13 }}>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* EDUCATION */}
      <section style={{ marginBottom: 18 }}>
        <h3 style={{ borderBottom: "1px solid #ddd" }}>Education</h3>

        {resume.education.map((edu, i) => (
          <div key={i} style={{ fontSize: 13 }}>
            <b>{edu.degree}</b> — {edu.school}
          </div>
        ))}
      </section>

      {/* CERTIFICATIONS */}
      <section>
        <h3 style={{ borderBottom: "1px solid #ddd" }}>Certifications</h3>

        <ul>
          {resume.certifications.map((c, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              {c}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default function ProfessionalDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.analysis?.analysis;
  console.log('Received analysis data:', data);

  if (!data) return <div style={{ color: 'white', padding: 100, textAlign: 'center' }}>No analysis record found.</div>;

  return (
    <div className="dashboard-container">
      <StyleLayers />

      {/* Navigation & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Resume Evaluation Report</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <ScorePill value={data.ats_analysis.ats_overall_score} label="ATS Score" color="var(--accent)" />
          <ScorePill value={data.manual_skill_check.manual_match_percentage} label="Job Match" color="var(--green)" />
        </div>
      </div>

      <div className="bento-grid">
        
        {/* ATS Metric Breakdown */}
        <Section title="ATS Parameter Scoring" span="span 5">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(data.ats_analysis.breakdown).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-dim)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                  <span style={{ fontWeight: 600 }}>{val}%</span>
                </div>
                <div className="progress-track">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} style={{ height: '100%', background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Skill Gap Matrix */}
        <Section title="Technical Skill Alignment" span="span 7">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div className="label-mono" style={{ marginBottom: 12, color: 'var(--green)' }}>Matched Competencies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.manual_skill_check.manual_matched_skills.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '4px 10px', background: '#161d19', color: '#34d399', borderRadius: 4, border: '1px solid #1e2923' }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="label-mono" style={{ marginBottom: 12, color: 'var(--red)' }}>Identified Gaps</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.manual_skill_check.manual_missing_skills.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '4px 10px', background: '#1d1616', color: '#f87171', borderRadius: 4, border: '1px solid #291e1e' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Executive Summary Rewrite */}
        <Section title="Content Recommendation: Professional Summary" span="span 12">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div>
              <div className="label-mono" style={{ marginBottom: 12 }}>Current Version</div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>"{data.resume_improvements.summary_section.current}"</p>
            </div>
            <div style={{ padding: '20px', background: '#16161a', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div className="label-mono" style={{ marginBottom: 12, color: 'var(--accent)' }}>Proposed Revision</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>{data.resume_improvements.summary_section.improved}</p>
            </div>
          </div>
        </Section>

        {/* Formatting & Parsing Issues */}
        <Section title="Parsing Warnings & Formatting" span="span 6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.ats_analysis.ats_killers.map((k, i) => (
              <div key={i} style={{ padding: '12px', borderLeft: '3px solid var(--red)', background: '#16161a' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{k.issue}</div>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, marginBottom: 0 }}>{k.fix}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Industry Keywords */}
        <Section title="Industry Keyword Density" span="span 6">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.ats_analysis.keyword_density_analysis.found_in_resume.map(k => (
              <span key={k} style={{ fontSize: 11, padding: '4px 10px', background: '#1e1e22', color: 'var(--text-dim)', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>{k}</span>
            ))}
          </div>
        </Section>

        {/* Career & Project Impact */}
        <Section title="Project Evaluation" span="span 6">
          {data.project_ratings.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div className="label-mono" style={{ color: 'var(--yellow)' }}>Impact Score: {p.rating}/10</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>{p.rating_reason}</p>
            </div>
          ))}
        </Section>

        <Section title="Target Career Domains" span="span 6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {data.next_domain_targets.next_domains.map((d, i) => (
              <div key={i} style={{ padding: '12px', background: '#16161a', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{d.domain}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)' }}>Fit Score: {d.fit_score}/10</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Final Optimized Resume (ATS Ready)" span="span 12">
  <FinalResume data={data} />
</Section>

      </div>
    </div>
  );
}