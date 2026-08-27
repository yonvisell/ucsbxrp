import { isEmbeddedApplication } from "./embedded-application";
import { SplitWorkspaceIcon } from "./HeaderIcons";

/** Opens the permission-free, same-tab IDE and Monitor workspace. */
export function SplitWorkspaceLink() {
  if (isEmbeddedApplication()) return null;

  return (
    <a
      aria-label="Open IDE and Monitor together"
      className="header-icon-button split-workspace-link"
      href="../workspace/"
      title="Open the IDE and Monitor together in this tab."
    >
      <SplitWorkspaceIcon />
      <span className="visually-hidden">IDE and Monitor together</span>
    </a>
  );
}
