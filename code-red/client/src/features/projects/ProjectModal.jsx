import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  description: "",
  tags: "",
};

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isLoading,
}) {
  const [formState, setFormState] = useState(initialForm);

  useEffect(() => {
    if (initialValues) {
      setFormState({
        name: initialValues.name || "",
        description: initialValues.description || "",
        tags: (initialValues.tags || []).join(", "),
      });
    } else {
      setFormState(initialForm);
    }
  }, [initialValues, isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: formState.name.trim(),
      description: formState.description.trim(),
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card">
        <div className="modal-header-row">
          <h3>{initialValues ? "Edit Project" : "Create Project"}</h3>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Project Name
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Payments Revamp"
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Scope, ownership, and expected outcomes"
              rows={4}
            />
          </label>

          <label>
            Tags (comma separated)
            <input
              value={formState.tags}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, tags: event.target.value }))
              }
              placeholder="frontend, sprint-12, mobile"
            />
          </label>

          {initialValues && (
            <small className="subtle-copy">
              Use the separate "Add Members" action from the project card to
              update team access.
            </small>
          )}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
