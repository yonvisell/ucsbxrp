import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { OverviewApp } from "./OverviewApp";

registerOfflineShell({ reloadWithoutAppState: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OverviewApp />
  </StrictMode>,
);
