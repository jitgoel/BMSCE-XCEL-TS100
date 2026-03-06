import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "./useAuth";

const roles = ["reporter", "developer"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading: isLoading } = useAuth();

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    role: "reporter",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await register(formState);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error?.data?.message || "Registration failed.");
    }
  };

  return (
    <section className="auth-screen">
      <div className="auth-panel">
        <p className="brand-kicker">Create Workspace Identity</p>
        <h2>Join DevCollab</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              required
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength={6}
              required
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Role
            <select
              value={formState.role}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, role: event.target.value }))
              }
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {errorMessage && <p className="error-copy">{errorMessage}</p>}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="subtle-copy">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
