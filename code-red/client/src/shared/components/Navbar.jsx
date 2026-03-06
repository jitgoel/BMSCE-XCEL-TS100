import { LogOut } from "lucide-react";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../features/auth/useAuth";
import NotificationBell from "./NotificationBell";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/bugs", label: "Bugs" },
];

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="top-nav">
      <div className="brand-block">
        <p className="brand-kicker">AI + Collaboration</p>
        <h1>DevCollab Tracker</h1>
      </div>

      <nav className="main-nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-chip ${isActive ? "active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        <div className="user-pill">
          <span>{user?.name || "Anonymous"}</span>
          <small>{user?.role || "guest"}</small>
        </div>
        <NotificationBell />
        <button type="button" className="logout-button" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
