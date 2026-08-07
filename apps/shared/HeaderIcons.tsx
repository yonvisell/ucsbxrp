interface RunStopIconProps {
  running: boolean;
}

export function RunStopIcon({ running }: RunStopIconProps) {
  return (
    <svg aria-hidden="true" className="header-command-icon" viewBox="0 0 16 16">
      {running ? (
        <rect height="8" rx="0.8" width="8" x="4" y="4" />
      ) : (
        <path d="M5 3.4 12.5 8 5 12.6Z" />
      )}
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg
      aria-hidden="true"
      className="header-command-icon reset-icon"
      viewBox="0 0 16 16"
    >
      <path d="M4.3 5.2A5 5 0 1 1 3.2 9" />
      <path d="M2.6 3.3v3.5h3.5" />
    </svg>
  );
}
