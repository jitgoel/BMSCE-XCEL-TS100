import { useState } from "react";
import ResumeUpload from "../components/ResumeUpload";
import AnalysisResult from "../components/AnalysisResult";

function Home() {
  const [result, setResult] = useState(null);

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">AI-Powered Resume Review</span>
          <h1>
            Turn a plain resume into a
            <span> shortlist-ready profile</span>
          </h1>
          <p>
            Upload your resume and get instant insight on strengths, gaps, and
            market demand across your skills.
          </p>
        </div>

        <div className="hero-card">
          <p className="hero-card-title">What you get</p>
          <ul>
            <li>Clear analysis with actionable suggestions</li>
            <li>Skill demand chart based on market trends</li>
            <li>Readable structure for quick improvement</li>
          </ul>
        </div>
      </section>

      <ResumeUpload setResult={setResult} />

      {result && <AnalysisResult result={result} />}
    </main>
  );
}

export default Home;
