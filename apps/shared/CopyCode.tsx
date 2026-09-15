import { useState } from "react";

export function CopyCode({
  code,
  label = "Copy code",
}: {
  code: string;
  label?: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="copyable-code">
      <div className="copyable-code-actions">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setMessage("Copied");
            } catch {
              setMessage(
                "Select the code below and copy it with your keyboard.",
              );
            }
          }}
        >
          {label}
        </button>
        <span role="status">{message}</span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
