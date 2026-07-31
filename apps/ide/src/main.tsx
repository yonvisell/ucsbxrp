import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { configureLocalMonaco } from "./configure-local-monaco";
import { IdeApp } from "./IdeApp";

registerOfflineShell();
configureLocalMonaco();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IdeApp />
  </StrictMode>,
);
