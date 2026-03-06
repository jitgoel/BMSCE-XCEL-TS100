import { ExternalLink, MessageSquare, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import usePermission from "../auth/usePermission";
import AITriagePanel from "../ai-triage/AITriagePanel";
import {
  useAddBugCommentMutation,
  useDeleteBugMutation,
  useGetBugQuery,
  useUpdateBugMutation,
} from "./bugs.api";
import useBugSocket from "./useBugSocket";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "(empty)";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const getProjectMemberDisplay = (member) => {
  const user = member?.user;
  const memberId =
    typeof user === "string"
      ? user
      : String(user?._id || user?.id || "").trim();
  const memberName = String(user?.name || "").trim();
  const memberEmail = String(user?.email || "").trim();

  if (memberName && memberEmail && memberId) {
    return `${memberName} <${memberEmail}> (${memberId})`;
  }

  if (memberEmail && memberId) {
    return `${memberEmail} (${memberId})`;
  }

  return memberId;
};

export default function BugDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: bug, isLoading, isError } = useGetBugQuery(id);
  const [updateBug, { isLoading: isUpdating }] = useUpdateBugMutation();
  const [deleteBug] = useDeleteBugMutation();
  const [addComment, { isLoading: isCommenting }] = useAddBugCommentMutation();

  const [activeTab, setActiveTab] = useState("details");
  const [comment, setComment] = useState("");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [actionError, setActionError] = useState("");

  const canDelete = usePermission("delete_bug");
  const canClose = usePermission("close_bug");
  const canChangeStatus = usePermission("change_status");
  const canAssign = usePermission("assign_bug");

  useBugSocket(bug?.project?._id || bug?.project || null);

  const historyTimeline = useMemo(
    () =>
      [...(bug?.history || [])].sort(
        (left, right) => new Date(right.timestamp) - new Date(left.timestamp),
      ),
    [bug?.history],
  );

  const updateStatus = async (status) => {
    if (status === "closed" && !canClose) {
      return;
    }

    if (status !== "closed" && !canChangeStatus) {
      return;
    }

    setActionError("");
    try {
      await updateBug({ bugId: id, payload: { status } }).unwrap();
    } catch (error) {
      setActionError(error?.data?.message || "Failed to update bug status");
    }
  };

  const saveAssignees = async () => {
    const assignees = assigneeInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    setActionError("");
    try {
      await updateBug({ bugId: id, payload: { assignees } }).unwrap();
      setAssigneeInput("");
    } catch (error) {
      setActionError(error?.data?.message || "Failed to update assignees");
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) {
      return;
    }

    setActionError("");
    try {
      await addComment({ bugId: id, text: comment }).unwrap();
      setComment("");
    } catch (error) {
      setActionError(error?.data?.message || "Failed to add comment");
    }
  };

  const removeBug = async () => {
    if (!window.confirm("Delete this bug permanently?")) {
      return;
    }

    setActionError("");
    try {
      await deleteBug(id).unwrap();
      navigate("/bugs");
    } catch (error) {
      setActionError(error?.data?.message || "Failed to delete bug");
    }
  };

  if (isLoading) {
    return <p className="subtle-copy">Loading bug details...</p>;
  }

  if (isError || !bug) {
    return <p className="error-copy">Bug not found.</p>;
  }

  return (
    <section className="feature-page">
      <div className="page-header">
        <div>
          <p className="brand-kicker">Bug Detail</p>
          <h2>{bug.title}</h2>
        </div>
        <div className="header-actions">
          {canChangeStatus && (
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => updateStatus("in-progress")}
              >
                Set In Progress
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => updateStatus("resolved")}
              >
                Mark Resolved
              </button>
            </>
          )}
          {canClose && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => updateStatus("closed")}
            >
              Close
            </button>
          )}
          {canDelete && (
            <button type="button" className="danger-button" onClick={removeBug}>
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>

      {actionError && <p className="error-copy">{actionError}</p>}

      <div className="detail-grid">
        <article className="content-card">
          <div className="tab-row">
            <button
              type="button"
              className={`tab-button ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              Changelog / Audit Trail
            </button>
          </div>

          {activeTab === "details" && (
            <>
              <dl className="detail-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={`status-pill ${bug.status}`}>
                      {bug.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd>
                    <span className={`status-pill ${bug.priority}`}>
                      {bug.priority}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Reporter</dt>
                  <dd>{bug.reporter?.name || "Unknown"}</dd>
                </div>
                <div>
                  <dt>Project</dt>
                  <dd>{bug.project?.name || "Unknown project"}</dd>
                </div>
              </dl>

              <section className="copy-section">
                <h3>Description</h3>
                <p>{bug.description}</p>
              </section>

              <section className="copy-section">
                <h3>Steps To Reproduce</h3>
                <p>{bug.steps_to_reproduce || "Not provided"}</p>
              </section>

              <section className="copy-section">
                <h3>Expected vs Actual</h3>
                <p>
                  <strong>Expected:</strong> {bug.expected || "Not provided"}
                </p>
                <p>
                  <strong>Actual:</strong> {bug.actual || "Not provided"}
                </p>
              </section>

              <section className="copy-section">
                <h3>GitHub Links</h3>
                <div className="tag-row">
                  {(bug.githubLinks || []).length === 0 && (
                    <p className="subtle-copy">No linked commits yet.</p>
                  )}
                  {(bug.githubLinks || []).map((link) => (
                    <a
                      key={`${link.sha}-${link.commitUrl}`}
                      href={link.commitUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="tag-chip link-chip"
                    >
                      {link.sha.slice(0, 7)}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </section>

              {canAssign && (
                <section className="copy-section">
                  <h3>Assignee Management</h3>
                  <p className="subtle-copy">
                    Update assignees using comma-separated user IDs or emails.
                  </p>
                  <p className="subtle-copy">
                    Project members:{" "}
                    {(bug.project?.members || [])
                      .map((member) => getProjectMemberDisplay(member))
                      .filter(Boolean)
                      .join(", ") || "No members found"}
                  </p>
                  <div className="inline-form-row">
                    <input
                      value={assigneeInput}
                      onChange={(event) => setAssigneeInput(event.target.value)}
                      placeholder="userId1, teammate@example.com"
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={saveAssignees}
                    >
                      Save assignees
                    </button>
                  </div>
                </section>
              )}

              <section className="copy-section">
                <h3>
                  <MessageSquare size={16} />
                  Comments
                </h3>
                <ul className="comment-thread">
                  {(bug.comments || []).map((entry) => (
                    <li key={entry._id}>
                      <strong>{entry.author?.name || "Unknown"}</strong>
                      <p>{entry.text}</p>
                      <small>
                        {new Date(entry.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>

                <form className="inline-form-row" onSubmit={submitComment}>
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Add a comment"
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isCommenting}
                  >
                    {isCommenting ? "Posting..." : "Post"}
                  </button>
                </form>
              </section>
            </>
          )}

          {activeTab === "audit" && (
            <section className="timeline-list">
              {historyTimeline.length === 0 && (
                <p className="subtle-copy">No changelog entries yet.</p>
              )}
              {historyTimeline.map((entry, index) => (
                <article
                  key={`${entry.timestamp}-${entry.field}-${index}`}
                  className="timeline-entry"
                >
                  <p>
                    <strong>{entry.changedBy?.name || "Automation"}</strong>{" "}
                    changed {entry.field} from
                    <code> {formatValue(entry.oldValue)} </code>to
                    <code> {formatValue(entry.newValue)} </code>
                  </p>
                  <small>{new Date(entry.timestamp).toLocaleString()}</small>
                </article>
              ))}
            </section>
          )}
        </article>

        <AITriagePanel bug={bug} similarBugs={[]} />
      </div>

      {isUpdating && <p className="subtle-copy">Saving updates...</p>}
    </section>
  );
}
