import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import {
  beginProjectBootstrap,
  finishProjectBootstrap,
} from "../../shared/project-bootstrap";
import "../../shared/theme.css";
import "./styles.css";
import { configureLocalMonaco } from "./configure-local-monaco";
import { IdeApp } from "./IdeApp";

const projectBootstrapOwner = beginProjectBootstrap();
window.addEventListener(
  "pagehide",
  () => finishProjectBootstrap(projectBootstrapOwner),
  { once: true },
);

registerOfflineShell();
configureLocalMonaco();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IdeApp projectBootstrapOwner={projectBootstrapOwner} />
  </StrictMode>,
);
