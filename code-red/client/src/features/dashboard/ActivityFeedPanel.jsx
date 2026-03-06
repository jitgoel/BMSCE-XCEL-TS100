import { useSelector } from "react-redux";

export default function ActivityFeedPanel() {
  const activities = useSelector((state) => state.activity.items);

  return (
    <aside className="content-card">
      <h3>Live Activity Feed</h3>
      {activities.length === 0 && (
        <p className="subtle-copy">Waiting for team activity...</p>
      )}

      <ul className="activity-list">
        {activities.map((activity, index) => (
          <li
            key={`${activity.type}-${activity.bugId}-${activity.timestamp}-${index}`}
          >
            <div>
              <strong>{activity.type?.replace(/:/g, " ")}</strong>
              <p>
                {activity.bugTitle || "Bug updated"}
                {activity.commitSha
                  ? ` (${activity.commitSha.slice(0, 7)})`
                  : ""}
              </p>
            </div>
            <small>
              {new Date(activity.timestamp || Date.now()).toLocaleTimeString()}
            </small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
