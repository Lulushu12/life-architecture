import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "@shared/ErrorBoundary.jsx";
import { ToastProvider } from "@shared/ui.jsx";
import { STORE_KEY } from "./storage.js";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary storageKey={STORE_KEY} appName="Games">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
