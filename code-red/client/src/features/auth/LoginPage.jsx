import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "./useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading: isLoading } = useAuth();

  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await login(formState);
      const redirectTo = location.state?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.data?.message || "Login failed. Please check credentials.",
      );
    }
  };

  return (
    <section className="auth-screen">
      <div className="auth-panel">
        <p className="brand-kicker">Welcome Back</p>
        <h2>Sign In To DevCollab</h2>
        <p className="subtle-copy">
          Track bugs with AI triage and real-time collaboration.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="you@company.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              placeholder="At least 6 characters"
            />
          </label>

          {errorMessage && <p className="error-copy">{errorMessage}</p>}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="subtle-copy">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </section>
  );
}
