import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scan,
  Zap,
  BarChart3,
  FileText,
  ArrowRight,
  GitBranch,
  Cpu,
  Shield,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const features = [
  {
    icon: Scan,
    tag: "01",
    title: "Structured Extraction",
    desc: "LLM converts raw PDF/DOCX into clean JSON with skills, experience, and projects.",
  },
  {
    icon: BarChart3,
    tag: "02",
    title: "ATS Compatibility Score",
    desc: "Evaluates formatting and keywords against ATS parsing rules.",
  },
  {
    icon: Zap,
    tag: "03",
    title: "Skill Gap Analysis",
    desc: "Compares your skills with job requirements and shows match percentage.",
  },
  {
    icon: FileText,
    tag: "04",
    title: "Intelligent Rewriting",
    desc: "Turns weak bullet points into quantified achievements.",
  },
  {
    icon: GitBranch,
    tag: "05",
    title: "PDF Report Export",
    desc: "Download a full analysis report of resume performance.",
  },
  {
    icon: Cpu,
    tag: "06",
    title: "Pipeline Architecture",
    desc: "FastAPI + React pipeline for fast real-time analysis.",
  },
];

const stats = [
  { value: "94%", label: "ATS Pass Rate" },
  { value: "3×", label: "Interview Lift" },
  { value: "<2s", label: "Analysis Time" },
  { value: "50+", label: "ATS Signals" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6">

      {/* HERO */}
      <motion.section
        className="max-w-6xl mx-auto py-24 text-center"
        variants={stagger}
        initial="initial"
        animate="animate"
      >

        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 text-xs border border-zinc-700 px-3 py-1 rounded-full mb-6"
        >
          <Shield size={12} />
          <span>LLM Powered · ATS Optimized</span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-5xl font-bold leading-tight"
        >
          Bridge the gap between
          <br />
          <span className="text-indigo-400">raw talent</span> and ATS algorithms
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-zinc-400 mt-6 max-w-2xl mx-auto"
        >
          Upload your resume and job description to get ATS scoring,
          skill-gap analysis, and AI optimized resume bullet points.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex justify-center gap-4 mt-8"
        >
          <button
            onClick={() => navigate("/analyze")}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg flex items-center gap-2"
          >
            Start Analysis <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate("/results")}
            className="border border-zinc-700 px-6 py-3 rounded-lg hover:bg-zinc-800"
          >
            View Demo
          </button>
        </motion.div>

        {/* stats */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-zinc-400 text-sm">{s.label}</div>
            </div>
          ))}
        </motion.div>

      </motion.section>

      {/* FEATURES */}
      <motion.section
        className="max-w-6xl mx-auto py-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
      >

        <motion.h2
          variants={fadeUp}
          className="text-3xl font-semibold mb-12 text-center"
        >
          Everything you need to beat ATS filters
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">

          {features.map((f) => {
            const Icon = f.icon;

            return (
              <motion.div
                key={f.tag}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl"
              >

                <div className="flex justify-between mb-4">
                  <Icon size={22} className="text-indigo-400" />
                  <span className="text-xs text-zinc-500">{f.tag}</span>
                </div>

                <h3 className="text-lg font-semibold mb-2">
                  {f.title}
                </h3>

                <p className="text-zinc-400 text-sm">
                  {f.desc}
                </p>

              </motion.div>
            );
          })}

        </div>

      </motion.section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto text-center py-20">

        <h2 className="text-3xl font-bold mb-4">
          Ready to optimize your resume?
        </h2>

        <p className="text-zinc-400 mb-8">
          Upload a resume and job description to see how well you match.
        </p>

        <button
          onClick={() => navigate("/analyze")}
          className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-lg flex items-center gap-2 mx-auto"
        >
          Analyze Resume <ArrowRight size={18} />
        </button>

      </section>

    </div>
  );
}