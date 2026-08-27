import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import { consumeAuthorDraftHandoff } from "../../shared/author-draft-handoff";
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
const authorDraftProject = consumeAuthorDraftHandoff(window.location.search);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IdeApp
      authorDraftProject={authorDraftProject}
      projectBootstrapOwner={projectBootstrapOwner}
    />
  </StrictMode>,
);
