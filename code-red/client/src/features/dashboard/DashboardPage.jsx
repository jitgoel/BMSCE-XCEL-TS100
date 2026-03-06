import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetProjectsQuery } from "../projects/projects.api";
import useBugSocket from "../bugs/useBugSocket";
import { useGetProjectAnalyticsQuery } from "./dashboard.api";
import ActivityFeedPanel from "./ActivityFeedPanel";

const colors = ["#ff6846", "#ffb347", "#1dd1a1", "#4a7bff", "#48dbfb"];

const emptyAnalytics = {
  statusByProject: {
    open: 0,
    "in-progress": 0,
    resolved: 0,
    closed: 0,
  },
  priorityCounts: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
  avgResolutionHours: 0,
  trend: [],
};

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState("");

  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.projects || [];

  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]._id);
    }
  }, [projects, selectedProject]);

  const {
    data: analyticsData,
    isFetching,
    isError,
  } = useGetProjectAnalyticsQuery(selectedProject, {
    skip: !selectedProject,
  });

  useBugSocket(selectedProject || null);

  const analytics = analyticsData || emptyAnalytics;

  const unresolvedBugs =
    analytics.statusByProject.open + analytics.statusByProject["in-progress"];
  const criticalBugs = analytics.priorityCounts.critical;

  const priorityChartData = useMemo(
    () =>
      Object.entries(analytics.priorityCounts).map(([key, value]) => ({
        name: key,
        value,
      })),
    [analytics.priorityCounts],
  );

  const statusChartData = useMemo(
    () =>
      Object.entries(analytics.statusByProject).map(([key, value]) => ({
        name: key,
        value,
      })),
    [analytics.statusByProject],
  );

  return (
    <section className="feature-page">
      <div className="page-header">
        <div>
          <p className="brand-kicker">Analytics Dashboard</p>
          <h2>Delivery Health</h2>
        </div>
        <select
          className="project-select"
          value={selectedProject}
          onChange={(event) => setSelectedProject(event.target.value)}
        >
          {projects.map((project) => (
            <option value={project._id} key={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <p>Open + In Progress</p>
          <strong>{unresolvedBugs}</strong>
        </article>
        <article className="stat-card">
          <p>Critical Bugs</p>
          <strong>{criticalBugs}</strong>
        </article>
        <article className="stat-card">
          <p>Avg Resolution Time</p>
          <strong>{analytics.avgResolutionHours}h</strong>
        </article>
      </div>

      {isFetching && <p className="subtle-copy">Loading analytics...</p>}
      {isError && <p className="error-copy">Failed to load analytics.</p>}

      <div className="dashboard-grid">
        <article className="content-card">
          <h3>Bug Count By Priority</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d7d2ff" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {priorityChartData.map((entry, index) => (
                  <Cell
                    key={`priority-${entry.name}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="content-card">
          <h3>Open/Close Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d7d2ff" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="opened"
                stroke="#ff6846"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="#1dd1a1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="content-card">
          <h3>Bug Status Split</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {statusChartData.map((entry, index) => (
                  <Cell
                    key={`status-${entry.name}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <ActivityFeedPanel />
      </div>
    </section>
  );
}
