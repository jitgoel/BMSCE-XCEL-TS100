import { Routes, Route } from "react-router-dom";

import HomePage from "./HomePage.jsx";
import AnalyzePage from "./AnalyzePage.jsx";
import ResultsPage from "./ResultsPage.jsx";

export default function App() {
  return (
    <Routes>

      {/* Landing */}
      <Route path="/" element={<HomePage />} />

      {/* Upload + Analyze */}
      <Route path="/analyze" element={<AnalyzePage />} />

      {/* Results */}
      <Route path="/results" element={<ResultsPage />} />

      {/* Fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
            404 Page Not Found
          </div>
        }
      />

    </Routes>
  );
}