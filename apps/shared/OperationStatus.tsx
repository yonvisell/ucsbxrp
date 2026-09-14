import { useEffect, useState } from "react";

/** Announces phase changes, without announcing an elapsed-time tick each second. */
export function OperationStatus({
  phase,
  pending = true,
}: {
  phase: string;
  pending?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    if (!pending) return;
    const started = performance.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((performance.now() - started) / 1_000)),
      1_000,
    );
    return () => clearInterval(timer);
  }, [phase, pending]);
  return (
    <div className="operation-status">
      <span role="status">{phase}</span>
      {pending && elapsed >= 2 ? (
        <span aria-hidden="true"> · {elapsed} s</span>
      ) : null}
    </div>
  );
}
