import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "@shared/ErrorBoundary.jsx";
import { ToastProvider } from "@shared/ui.jsx";
import "@fontsource/sora/600.css";
import "@fontsource/sora/800.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary storageKey="chess-v1" appName="Chess">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
