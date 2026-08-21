import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { ReferenceApp } from "./ReferenceApp";

registerOfflineShell();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReferenceApp />
  </StrictMode>,
);
