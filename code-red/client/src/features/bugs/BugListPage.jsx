import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import usePermission from "../auth/usePermission";
import { useGetProjectsQuery } from "../projects/projects.api";
import {
  useDeleteBugMutation,
  useGetBugsQuery,
  useUpdateBugMutation,
} from "./bugs.api";
import BugKanbanBoard from "./BugKanbanBoard";
import CreateBugModal from "./CreateBugModal";
import useBugSocket from "./useBugSocket";

export default function BugListPage() {
  const [viewMode, setViewMode] = useState("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filters, setFilters] = useState({
    project: "",
    status: "",
    priority: "",
    assignee: "",
    search: "",
  });

  const hasPermission = usePermission();
  const canCreateBug = hasPermission("create_bug");

  const normalizedFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== "",
        ),
      ),
    [filters],
  );

  const { data: projectsData } = useGetProjectsQuery();
  const {
    data: bugs = [],
    isLoading,
    isError,
  } = useGetBugsQuery(normalizedFilters);
  const [updateBug] = useUpdateBugMutation();
  const [deleteBug] = useDeleteBugMutation();

  useBugSocket(normalizedFilters.project || null);

  const sortedBugs = useMemo(() => {
    const clone = [...bugs];
    clone.sort((left, right) => {
      const leftValue = left?.[sortField] || "";
      const rightValue = right?.[sortField] || "";

      if (leftValue < rightValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
    return clone;
  }, [bugs, sortDirection, sortField]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const handleStatusMove = async (bugId, status) => {
    await updateBug({ bugId, payload: { status } }).unwrap();
  };

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm("Delete this bug?")) {
      return;
    }
    await deleteBug(bugId).unwrap();
  };

  const projects = projectsData?.projects || [];

  return (
    <section className="feature-page">
      <div className="page-header">
        <div>
          <p className="brand-kicker">Bug Tracker</p>
          <h2>Issue Backlog</h2>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </button>
          {canCreateBug && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Report Bug
            </button>
          )}
        </div>
      </div>

      <section className="filter-bar">
        <select
          value={filters.project}
          onChange={(event) => updateFilter("project", event.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(event) => updateFilter("priority", event.target.value)}
        >
          <option value="">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <input
          value={filters.assignee}
          onChange={(event) => updateFilter("assignee", event.target.value)}
          placeholder="Assignee user ID"
        />

        <input
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          placeholder="Search title or description"
        />
      </section>

      {isLoading && <p className="subtle-copy">Loading bugs...</p>}
      {isError && <p className="error-copy">Failed to load bugs.</p>}

      {!isLoading && !isError && viewMode === "table" && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleSort("title")}
                  >
                    Title
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleSort("status")}
                  >
                    Status
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleSort("priority")}
                  >
                    Priority
                  </button>
                </th>
                <th>Severity</th>
                <th>Assignees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBugs.map((bug) => (
                <tr key={bug._id}>
                  <td>
                    <Link to={`/bugs/${bug._id}`} className="inline-link">
                      {bug.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-pill ${bug.status}`}>
                      {bug.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${bug.priority}`}>
                      {bug.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${bug.severity}`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td>
                    {(bug.assignees || [])
                      .map((assignee) => assignee.name)
                      .join(", ") || "Unassigned"}
                  </td>
                  <td className="inline-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => handleStatusMove(bug._id, "in-progress")}
                    >
                      Start
                    </button>
                    {hasPermission("delete_bug", {
                      bug,
                      project: bug.project,
                    }) && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteBug(bug._id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && viewMode === "kanban" && (
        <BugKanbanBoard bugs={sortedBugs} onStatusChange={handleStatusMove} />
      )}

      <CreateBugModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projects={projects}
        defaultProjectId={filters.project}
      />
    </section>
  );
}
