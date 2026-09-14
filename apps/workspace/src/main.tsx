import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  registerOfflineShell,
  registerOfflineShellBeforeReload,
  prepareEmbeddedApplicationsForReload,
} from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { WorkspaceApp } from "./WorkspaceApp";

registerOfflineShell();
registerOfflineShellBeforeReload(prepareEmbeddedApplicationsForReload);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorkspaceApp />
  </StrictMode>,
);
