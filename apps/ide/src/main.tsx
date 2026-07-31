import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../../shared/theme.css";
import "./styles.css";
import { IdeApp } from "./IdeApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IdeApp />
  </StrictMode>,
);
