import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import { CommissionApp } from "./CommissionApp";
import "./styles.css";

registerOfflineShell();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommissionApp />
  </StrictMode>,
);
