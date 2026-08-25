import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerOfflineShell } from "../../shared/offline-shell";
import "../../shared/theme.css";
import "./styles.css";
import { AuthorApp } from "./AuthorApp";

registerOfflineShell();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthorApp />
  </StrictMode>,
);
