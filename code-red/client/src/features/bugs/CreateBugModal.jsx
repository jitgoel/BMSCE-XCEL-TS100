import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useCheckBugDuplicatesMutation,
  useCreateBugMutation,
} from "./bugs.api";

const steps = ["Basic", "Reproduction", "Attachments"];

const blankForm = {
  title: "",
  project: "",
  description: "",
  steps_to_reproduce: "",
  expected: "",
  actual: "",
  attachments: "",
  tags: "",
  dueDate: "",
};

export default function CreateBugModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onCreated,
}) {
  const [createBug, { isLoading }] = useCreateBugMutation();
  const [checkBugDuplicates, { isLoading: isCheckingDuplicates }] =
    useCheckBugDuplicatesMutation();
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState(blankForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultPayload, setResultPayload] = useState(null);
  const [preflightResult, setPreflightResult] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [requiresDuplicateConfirmation, setRequiresDuplicateConfirmation] =
    useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setErrorMessage("");
      setResultPayload(null);
      setPreflightResult(null);
      setPendingPayload(null);
      setRequiresDuplicateConfirmation(false);
      setFormState({ ...blankForm, project: defaultProjectId || "" });
    }
  }, [isOpen, defaultProjectId]);

  const projectOptions = useMemo(() => projects || [], [projects]);

  const nextStep = () =>
    setStep((current) => Math.min(current + 1, steps.length - 1));
  const previousStep = () => setStep((current) => Math.max(current - 1, 0));

  const updateFormField = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (requiresDuplicateConfirmation || preflightResult || pendingPayload) {
      setPreflightResult(null);
      setPendingPayload(null);
      setRequiresDuplicateConfirmation(false);
    }
  };

  const buildPayload = () => ({
    title: formState.title,
    project: formState.project,
    description: formState.description,
    steps_to_reproduce: formState.steps_to_reproduce,
    expected: formState.expected,
    actual: formState.actual,
    attachments: formState.attachments
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    tags: formState.tags
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    dueDate: formState.dueDate || null,
  });

  const createBugWithPayload = async (payload) => {
    const response = await createBug(payload).unwrap();
    setResultPayload(response);
    onCreated?.(response.bug);
    setPreflightResult(null);
    setRequiresDuplicateConfirmation(false);
    setPendingPayload(null);
    return response;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      const payload = buildPayload();

      const preflight = await checkBugDuplicates({
        title: payload.title,
        description: payload.description,
        project: payload.project,
      }).unwrap();

      setPreflightResult(preflight);
      if ((preflight.similarBugs || []).length > 0) {
        setPendingPayload(payload);
        setRequiresDuplicateConfirmation(true);
        return;
      }

      await createBugWithPayload(payload);
    } catch (error) {
      setErrorMessage(error?.data?.message || "Failed to create bug");
    }
  };

  const handleConfirmCreate = async () => {
    if (!pendingPayload) {
      return;
    }

    setErrorMessage("");
    try {
      await createBugWithPayload(pendingPayload);
    } catch (error) {
      setErrorMessage(error?.data?.message || "Failed to create bug");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card large">
        <div className="modal-header-row">
          <h3>Create Bug Report</h3>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="step-row">
          {steps.map((stepLabel, index) => (
            <span
              key={stepLabel}
              className={`step-pill ${index === step ? "active" : ""}`}
            >
              {index + 1}. {stepLabel}
            </span>
          ))}
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          {step === 0 && (
            <>
              <label>
                Bug title
                <input
                  required
                  value={formState.title}
                  onChange={(event) =>
                    updateFormField("title", event.target.value)
                  }
                  placeholder="Crash when saving draft invoice"
                />
              </label>

              <label>
                Project
                <select
                  required
                  value={formState.project}
                  onChange={(event) =>
                    updateFormField("project", event.target.value)
                  }
                >
                  <option value="">Select project</option>
                  {projectOptions.map((project) => (
                    <option value={project._id} key={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  required
                  rows={4}
                  value={formState.description}
                  onChange={(event) =>
                    updateFormField("description", event.target.value)
                  }
                />
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <label>
                Steps to reproduce
                <textarea
                  rows={4}
                  value={formState.steps_to_reproduce}
                  onChange={(event) =>
                    updateFormField("steps_to_reproduce", event.target.value)
                  }
                />
              </label>

              <label>
                Expected behavior
                <textarea
                  rows={3}
                  value={formState.expected}
                  onChange={(event) =>
                    updateFormField("expected", event.target.value)
                  }
                />
              </label>

              <label>
                Actual behavior
                <textarea
                  rows={3}
                  value={formState.actual}
                  onChange={(event) =>
                    updateFormField("actual", event.target.value)
                  }
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label>
                Attachment URLs (comma separated)
                <input
                  value={formState.attachments}
                  onChange={(event) =>
                    updateFormField("attachments", event.target.value)
                  }
                  placeholder="https://..."
                />
              </label>

              <label>
                Tags (comma separated)
                <input
                  value={formState.tags}
                  onChange={(event) =>
                    updateFormField("tags", event.target.value)
                  }
                  placeholder="ui, regression, checkout"
                />
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={formState.dueDate}
                  onChange={(event) =>
                    updateFormField("dueDate", event.target.value)
                  }
                />
              </label>
            </>
          )}

          {errorMessage && <p className="error-copy">{errorMessage}</p>}

          <div className="modal-action-row">
            <button
              type="button"
              className="ghost-button"
              onClick={previousStep}
              disabled={step === 0}
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                className="primary-button"
                onClick={nextStep}
              >
                Next
              </button>
            ) : requiresDuplicateConfirmation ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmCreate}
                disabled={isLoading || isCheckingDuplicates}
              >
                {isLoading ? "Creating bug..." : "Create Anyway"}
              </button>
            ) : (
              <button
                type="submit"
                className="primary-button"
                disabled={isLoading || isCheckingDuplicates}
              >
                {isCheckingDuplicates
                  ? "Checking similar bugs..."
                  : isLoading
                    ? "Running AI triage..."
                    : "Check Duplicates & Submit"}
              </button>
            )}
          </div>
        </form>

        {requiresDuplicateConfirmation &&
          (preflightResult?.similarBugs || []).length > 0 && (
            <section className="similar-bugs-warning">
              <strong>Similar Bugs Found Before Submission</strong>
              <p className="subtle-copy">
                Review potential duplicates and confirm if you still want to
                create this bug.
              </p>
              <ul>
                {preflightResult.similarBugs.map((similar) => (
                  <li key={similar._id}>
                    <Link to={`/bugs/${similar._id}`}>{similar.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        {resultPayload && (
          <section className="triage-result-panel">
            <h4>AI Triage Result</h4>
            <p>
              <strong>Severity:</strong>{" "}
              {resultPayload.triage?.severity || resultPayload.bug?.severity}
            </p>
            <p>
              <strong>Priority:</strong>{" "}
              {resultPayload.triage?.priority || resultPayload.bug?.priority}
            </p>
            <p>
              <strong>Suggested Fix:</strong>{" "}
              {resultPayload.triage?.suggestedFix || "No suggestion"}
            </p>

            {resultPayload.similarBugs?.length > 0 && (
              <div className="similar-bugs-warning">
                <strong>Similar Bugs Found</strong>
                <ul>
                  {resultPayload.similarBugs.map((similar) => (
                    <li key={similar._id}>
                      <Link to={`/bugs/${similar._id}`}>{similar.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
