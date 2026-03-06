import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token, loading, bootstrapComplete, user, isAuthenticated } =
    useSelector((state) => state.auth);
  const location = useLocation();

  if (!bootstrapComplete || loading) {
    return <p className="subtle-copy">Checking session...</p>;
  }

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
