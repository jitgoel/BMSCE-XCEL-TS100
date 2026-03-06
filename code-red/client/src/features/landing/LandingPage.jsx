import {
  Activity,
  ArrowRight,
  BellRing,
  Bot,
  Bug,
  ShieldCheck,
} from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Structured bug reporting",
    description:
      "Capture severity, status, and ownership in one consistent workflow across all projects.",
    Icon: Bug,
  },
  {
    title: "AI-assisted triage",
    description:
      "Generate recommended severity, labels, and likely duplicate context before assigning work.",
    Icon: Bot,
  },
  {
    title: "Realtime notifications",
    description:
      "Assignees are notified instantly when bugs move, comments land, or owners change.",
    Icon: BellRing,
  },
  {
    title: "Project-level access",
    description:
      "Keep collaboration safe with project membership checks and role-aware actions.",
    Icon: ShieldCheck,
  },
  {
    title: "Analytics dashboard",
    description:
      "Track open versus resolved trends, throughput, and lifecycle signals per workspace.",
    Icon: Activity,
  },
];

const workflowSteps = [
  "Create a project and add team members by email or user ID.",
  "Report bugs with clear context, expected behavior, and priority.",
  "Use AI triage suggestions, then assign owners and plan fixes.",
  "Monitor progress in dashboard and update status until closure.",
];

const modulePills = [
  "Projects",
  "Bug Tracking",
  "Assignments",
  "Notifications",
  "Dashboard",
  "AI Triage",
  "GitHub Webhook",
];

export default function LandingPage() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const primaryAction = isAuthenticated
    ? { to: "/dashboard", label: "Open Dashboard" }
    : { to: "/register", label: "Create Account" };

  const secondaryAction = isAuthenticated
    ? { to: "/projects", label: "Go To Projects" }
    : { to: "/login", label: "Sign In" };

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="landing-kicker">DevCollab Tracker</p>
        <h1>Bug Tracking Built For Fast Collaboration</h1>
        <p>
          DevCollab combines project-based access, assignment workflows,
          realtime updates, and AI triage so teams can move from bug report to
          resolved issue with less friction.
        </p>

        <div className="landing-pill-row">
          {modulePills.map((pill) => (
            <span key={pill} className="meta-pill">
              {pill}
            </span>
          ))}
        </div>

        <div className="landing-actions">
          <Link to={primaryAction.to} className="primary-button">
            {primaryAction.label}
            <ArrowRight size={16} />
          </Link>
          <Link to={secondaryAction.to} className="ghost-button">
            {secondaryAction.label}
          </Link>
        </div>

        <p className="subtle-copy">
          {isAuthenticated
            ? `Signed in as ${user?.name || "your account"}.`
            : "Create an account as reporter or developer to start collaborating."}
        </p>
      </section>

      <section className="landing-grid">
        {features.map(({ title, description, Icon }) => (
          <article key={title} className="landing-feature-card content-card">
            <div className="landing-icon-row">
              <span className="landing-icon-wrap" aria-hidden>
                <Icon size={18} />
              </span>
              <h3>{title}</h3>
            </div>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="landing-panel content-card">
        <h2>Typical Workflow</h2>
        <ol className="landing-flow">
          {workflowSteps.map((step, index) => (
            <li key={step}>
              <span className="landing-step">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
