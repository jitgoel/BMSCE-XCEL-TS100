import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import BugDetailPage from "../features/bugs/BugDetailPage";
import BugListPage from "../features/bugs/BugListPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import LandingPage from "../features/landing/LandingPage";
import ProjectsPage from "../features/projects/ProjectsPage";
import Layout from "../shared/components/Layout";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/bugs" element={<BugListPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
