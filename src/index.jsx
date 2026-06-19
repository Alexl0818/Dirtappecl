import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

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
