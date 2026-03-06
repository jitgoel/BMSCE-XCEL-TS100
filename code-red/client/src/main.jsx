import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "./app/providers/AppProvider";
import AppRoutes from "./routes/AppRoutes";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  </React.StrictMode>,
);
