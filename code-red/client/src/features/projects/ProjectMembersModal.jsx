import { useEffect, useMemo, useState } from "react";

const getMemberDisplay = (member) => {
  const user = member?.user;
  const id =
    typeof user === "string"
      ? user
      : String(user?._id || user?.id || "").trim();
  const name = user?.name || user?.email || id || "Unknown user";

  return {
    id,
    name,
  };
};

export default function ProjectMembersModal({
  isOpen,
  project,
  onClose,
  onSubmit,
  isLoading,
}) {
  const [membersInput, setMembersInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMembersInput("");
    setErrorMessage("");
  }, [isOpen, project?._id]);

  const existingMembers = useMemo(
    () => (project?.members || []).map(getMemberDisplay).filter((row) => row.id),
    [project],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const tokens = [
      ...new Set(
        membersInput
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean),
      ),
    ];

    if (tokens.length === 0) {
      setErrorMessage("Enter at least one member email or user id.");
      return;
    }

    try {
      await onSubmit(tokens);
    } catch (error) {
      setErrorMessage(error?.data?.message || "Failed to add members.");
    }
  };

  if (!isOpen || !project) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card">
        <div className="modal-header-row">
          <h3>Add Members</h3>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="subtle-copy">
          Project: <strong>{project.name}</strong>
        </p>

        <div>
          <p className="subtle-copy">Current members</p>
          <div className="inline-actions">
            {existingMembers.length === 0 && (
              <span className="subtle-copy">No members yet.</span>
            )}
            {existingMembers.map((member) => (
              <span key={member.id} className="tag-chip" title={member.id}>
                {member.name}
              </span>
            ))}
          </div>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Member User IDs or Emails (comma separated)
            <input
              value={membersInput}
              onChange={(event) => setMembersInput(event.target.value)}
              placeholder="66f1..., teammate@example.com"
            />
          </label>

          <small className="subtle-copy">
            Members are added without changing project details.
          </small>

          {errorMessage && <p className="error-copy">{errorMessage}</p>}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Members"}
          </button>
        </form>
      </div>
    </div>
  );
}
