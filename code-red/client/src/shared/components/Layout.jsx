import { Outlet } from "react-router-dom";
import useNotificationSocket from "../../features/notifications/useNotificationSocket";
import Navbar from "./Navbar";

export default function Layout() {
  useNotificationSocket();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
