import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { GuideApp } from "./GuideApp";

registerOfflineShell({ reloadWithoutAppState: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GuideApp />
  </StrictMode>,
);
