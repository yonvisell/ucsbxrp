import type {
  RuntimeParameterValue,
  RuntimeState,
  TargetRunState,
} from "@ucsb-xrp/target";

interface RuntimeControlsProps {
  drafts: Record<string, RuntimeParameterValue>;
  error: string;
  onChange(
    name: string,
    value: RuntimeParameterValue,
    debounce?: boolean,
  ): void;
  runtime: RuntimeState;
  targetState: TargetRunState;
  canControl?: boolean;
}

export function RuntimeControls({
  drafts,
  error,
  onChange,
  runtime,
  targetState,
  canControl = true,
}: RuntimeControlsProps) {
  return (
    <section
      aria-labelledby="live-controls-title"
      className="live-controls-panel"
    >
      <div
        className="live-program-heading"
        title="Adjust parameters declared by the running program."
      >
        <h2 id="live-controls-title">Live controls</h2>
      </div>
      <div className="live-program-content" id="live-controls-content">
        {runtime.parameters.length === 0 ? (
          <p className="live-program-empty">No controls in this program.</p>
        ) : (
          <div
            aria-label="Live control parameters"
            className="runtime-parameters"
          >
            {runtime.parameters.map((parameter) => {
              const shownValue =
                drafts[parameter.name] ??
                parameter.pendingValue ??
                parameter.value;
              const pending =
                drafts[parameter.name] !== undefined ||
                parameter.pendingValue !== undefined;
              const accepted = String(parameter.value);
              const pendingStatus = pending ? (
                <span className="runtime-accepted" role="status">
                  Applying…{" "}
                  <span>
                    Accepted: {accepted}
                    {parameter.unit ? ` ${parameter.unit}` : ""}
                  </span>
                </span>
              ) : null;
              if (parameter.kind === "number") {
                const shownNumber = Number(shownValue);
                const shownText = shownNumber.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                });
                return (
                  <label
                    className="runtime-number"
                    data-pending={
                      parameter.pendingValue !== undefined ||
                      drafts[parameter.name] !== undefined
                    }
                    data-runtime-parameter={parameter.name}
                    data-runtime-value={shownText}
                    key={parameter.name}
                    title={`Adjust ${parameter.label.toLowerCase()} while the program runs. The value is applied at its next sample boundary.`}
                  >
                    <span>{parameter.label}</span>
                    <output
                      aria-label={`${parameter.label} ${shownText}${parameter.unit ? ` ${parameter.unit}` : ""}`}
                    >
                      {shownText}
                      {parameter.unit ? ` ${parameter.unit}` : ""}
                    </output>
                    <input
                      aria-label={parameter.label}
                      disabled={targetState !== "running" || !canControl}
                      max={parameter.maximum}
                      min={parameter.minimum}
                      onChange={(event) =>
                        onChange(
                          parameter.name,
                          Number(event.target.value),
                          true,
                        )
                      }
                      step={parameter.step}
                      type="range"
                      value={shownNumber}
                    />
                    {pendingStatus}
                  </label>
                );
              }
              if (parameter.kind === "toggle") {
                return (
                  <label
                    className="runtime-toggle"
                    data-pending={
                      parameter.pendingValue !== undefined ||
                      drafts[parameter.name] !== undefined
                    }
                    data-runtime-parameter={parameter.name}
                    data-runtime-value={String(shownValue)}
                    key={parameter.name}
                    title={`Turn ${parameter.label.toLowerCase()} on or off while the program runs.`}
                  >
                    <span>{parameter.label}</span>
                    <input
                      checked={Boolean(shownValue)}
                      disabled={targetState !== "running" || !canControl}
                      onChange={(event) =>
                        onChange(parameter.name, event.target.checked)
                      }
                      type="checkbox"
                    />
                    {pendingStatus}
                  </label>
                );
              }
              return (
                <fieldset
                  className="runtime-choice"
                  data-pending={
                    parameter.pendingValue !== undefined ||
                    drafts[parameter.name] !== undefined
                  }
                  data-runtime-parameter={parameter.name}
                  data-runtime-value={String(shownValue)}
                  key={parameter.name}
                  title={`Choose ${parameter.label.toLowerCase()} while the program runs.`}
                >
                  <legend>{parameter.label}</legend>
                  <div>
                    {parameter.options?.map((option) => (
                      <label key={option}>
                        <input
                          checked={shownValue === option}
                          disabled={targetState !== "running" || !canControl}
                          name={`runtime-${parameter.name}`}
                          onChange={() => onChange(parameter.name, option)}
                          type="radio"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  {pendingStatus}
                </fieldset>
              );
            })}
          </div>
        )}
        {!canControl && runtime.parameters.length > 0 ? (
          <p className="live-program-empty">
            Viewing controls. Take control to change them.
          </p>
        ) : null}
        {error ? (
          <p className="runtime-update-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
