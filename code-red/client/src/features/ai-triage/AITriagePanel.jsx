import { Link } from "react-router-dom";

export default function AITriagePanel({ bug, similarBugs = [] }) {
  if (!bug) {
    return null;
  }

  return (
    <aside className="triage-panel">
      <h3>AI Triage</h3>

      <div className="triage-grid">
        <div>
          <p className="subtle-copy">Severity</p>
          <span className={`status-pill ${bug.severity}`}>{bug.severity}</span>
        </div>

        <div>
          <p className="subtle-copy">Priority</p>
          <span className={`status-pill ${bug.priority}`}>{bug.priority}</span>
        </div>
      </div>

      <div className="triage-copy-block">
        <p className="subtle-copy">Suggested Fix</p>
        <p>{bug.suggestedFix || "No AI suggestion available yet."}</p>
      </div>

      {similarBugs.length > 0 && (
        <div className="triage-copy-block">
          <p className="subtle-copy">Similar Bugs</p>
          <ul className="linked-list">
            {similarBugs.map((similar) => (
              <li key={similar._id}>
                <Link to={`/bugs/${similar._id}`}>{similar.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
