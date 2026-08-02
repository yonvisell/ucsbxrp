import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

interface ResizableSeparatorProps {
  label: string;
  maximum?: number;
  minimum?: number;
  onChange: (percent: number) => void;
  orientation: "horizontal" | "vertical";
  value: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** A pointer- and keyboard-operable separator for adjacent grid regions. */
export function ResizableSeparator({
  label,
  maximum = 80,
  minimum = 20,
  onChange,
  orientation,
  value,
}: ResizableSeparatorProps) {
  const updateFromPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    const parent = event.currentTarget.parentElement;
    if (!parent) {
      return;
    }
    const bounds = parent.getBoundingClientRect();
    const next =
      orientation === "vertical"
        ? ((event.clientX - bounds.left) / bounds.width) * 100
        : ((event.clientY - bounds.top) / bounds.height) * 100;
    onChange(clamp(next, minimum, maximum));
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const decrease = orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
    const increase = orientation === "vertical" ? "ArrowRight" : "ArrowDown";
    let next = value;
    if (event.key === decrease) {
      next -= event.shiftKey ? 10 : 2;
    } else if (event.key === increase) {
      next += event.shiftKey ? 10 : 2;
    } else if (event.key === "Home") {
      next = minimum;
    } else if (event.key === "End") {
      next = maximum;
    } else {
      return;
    }
    event.preventDefault();
    onChange(clamp(next, minimum, maximum));
  };

  return (
    <div
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemax={maximum}
      aria-valuemin={minimum}
      aria-valuenow={Math.round(value)}
      className={`resize-separator ${orientation}`}
      onDoubleClick={() => onChange(50)}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      role="separator"
      tabIndex={0}
      title={`${label}. Drag, use arrow keys, or double-click to balance.`}
    />
  );
}
