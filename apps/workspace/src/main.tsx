import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { WorkspaceApp } from "./WorkspaceApp";

registerOfflineShell();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorkspaceApp />
  </StrictMode>,
);
