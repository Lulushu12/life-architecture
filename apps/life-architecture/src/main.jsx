import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@shared/tokens.css";
import "@shared/base.css";
import "./theme.css";
import { ErrorBoundary } from "@shared/ErrorBoundary.jsx";
import { ToastProvider } from "@shared/ui.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary storageKey="la3_local_user" appName="Life Architecture">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
