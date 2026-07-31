import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../../shared/theme.css";
import "./styles.css";
import { GuideApp } from "./GuideApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GuideApp />
  </StrictMode>,
);
