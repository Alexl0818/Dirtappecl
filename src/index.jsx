import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// Frontend error monitoring. Inert unless VITE_SENTRY_DSN is set at build time,
// so the app behaves identically with or without monitoring configured.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0, // error monitoring only for now
  });
}

const container = document.getElementById("root");

// Reuse a single root across Vite HMR reloads so we never call createRoot()
// twice on the same node (which causes "removeChild" reconciler errors in dev).
const root = (window.__APP_ROOT__ ??= ReactDOM.createRoot(container));

root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
