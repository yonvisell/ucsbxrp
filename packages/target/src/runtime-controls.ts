import type {
  RuntimeParameter,
  RuntimeParameterValue,
  RuntimeState,
} from "./types";

export const MAX_RUNTIME_PARAMETERS = 16;
export const MAX_RUNTIME_WATCHES = 16;
export const MAX_RUNTIME_STATE_LENGTH = 32_768;
const MAX_ENCODED_PARAMETER_VALUE = 2_147_483_647;

export const EMPTY_RUNTIME_STATE: RuntimeState = Object.freeze({
  revision: 0,
  parameters: [],
  watches: [],
});

export function encodeRuntimeParameter(
  parameter: RuntimeParameter,
  value: RuntimeParameterValue,
): number {
  if (parameter.kind === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      parameter.minimum === undefined ||
      parameter.maximum === undefined ||
      parameter.step === undefined ||
      parameter.step <= 0 ||
      value < parameter.minimum ||
      value > parameter.maximum
    ) {
      throw new Error(`${parameter.label} is outside its declared range`);
    }
    const encoded = Math.round((value - parameter.minimum) / parameter.step);
    const snapped = parameter.minimum + encoded * parameter.step;
    if (Math.abs(value - snapped) > Math.max(1e-9, parameter.step * 1e-6)) {
      throw new Error(`${parameter.label} must follow its declared step`);
    }
    if (encoded < 0 || encoded > MAX_ENCODED_PARAMETER_VALUE) {
      throw new Error(`${parameter.label} declares too many steps`);
    }
    return encoded;
  }
  if (parameter.kind === "toggle") {
    if (typeof value !== "boolean") {
      throw new Error(`${parameter.label} must be on or off`);
    }
    return value ? 1 : 0;
  }
  if (typeof value !== "string" || !parameter.options?.includes(value)) {
    throw new Error(`${parameter.label} is not one of its declared choices`);
  }
  return parameter.options.indexOf(value);
}

export function parseRuntimeState(value: string): RuntimeState {
  if (value.length > MAX_RUNTIME_STATE_LENGTH) {
    throw new Error("Student runtime state is malformed");
  }
  const candidate = JSON.parse(value) as Partial<RuntimeState> | null;
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    !Number.isInteger(candidate.revision) ||
    (candidate.revision ?? -1) < 0 ||
    !Array.isArray(candidate.parameters) ||
    !Array.isArray(candidate.watches) ||
    candidate.parameters.length > MAX_RUNTIME_PARAMETERS ||
    candidate.watches.length > MAX_RUNTIME_WATCHES ||
    !candidate.parameters.every(isRuntimeParameter) ||
    !candidate.watches.every(isRuntimeWatch) ||
    new Set(candidate.parameters.map((parameter) => parameter.name)).size !==
      candidate.parameters.length ||
    new Set(candidate.watches.map((watch) => watch.name)).size !==
      candidate.watches.length
  ) {
    throw new Error("Student runtime state is malformed");
  }
  return candidate as RuntimeState;
}

function isRuntimeValue(value: unknown): value is RuntimeParameterValue {
  return (
    typeof value === "boolean" ||
    (typeof value === "string" && value.length <= 64) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isNonemptyText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 80;
}

function isRuntimeName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 32 &&
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
  );
}

function hasOptionalText(value: unknown): boolean {
  return (
    value === undefined || (typeof value === "string" && value.length <= 24)
  );
}

function isRuntimeParameter(value: unknown): value is RuntimeParameter {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const parameter = value as Partial<RuntimeParameter>;
  if (
    !isRuntimeName(parameter.name) ||
    !isNonemptyText(parameter.label) ||
    !hasOptionalText(parameter.unit) ||
    !["number", "toggle", "choice"].includes(parameter.kind ?? "") ||
    !isRuntimeValue(parameter.value) ||
    (parameter.pendingValue !== undefined &&
      !isRuntimeValue(parameter.pendingValue))
  ) {
    return false;
  }
  if (
    parameter.kind === "number" &&
    (typeof parameter.minimum !== "number" ||
      !Number.isFinite(parameter.minimum) ||
      typeof parameter.maximum !== "number" ||
      !Number.isFinite(parameter.maximum) ||
      typeof parameter.step !== "number" ||
      !Number.isFinite(parameter.step) ||
      parameter.maximum <= parameter.minimum ||
      parameter.step <= 0 ||
      parameter.step > parameter.maximum - parameter.minimum ||
      !hasRepresentableNumericRange(
        parameter.minimum,
        parameter.maximum,
        parameter.step,
      ))
  ) {
    return false;
  }
  if (
    parameter.kind === "choice" &&
    (!Array.isArray(parameter.options) ||
      parameter.options.length < 2 ||
      parameter.options.length > 6 ||
      parameter.options.some(
        (option) => typeof option !== "string" || option.length > 24,
      ) ||
      new Set(parameter.options).size !== parameter.options.length)
  ) {
    return false;
  }
  try {
    if (parameter.pendingValue !== undefined) {
      encodeRuntimeParameter(
        parameter as RuntimeParameter,
        parameter.pendingValue,
      );
    }
    encodeRuntimeParameter(parameter as RuntimeParameter, parameter.value);
  } catch {
    return false;
  }
  return true;
}

function isRuntimeWatch(value: unknown): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const watch = value as Record<string, unknown>;
  return (
    isRuntimeName(watch.name) &&
    isNonemptyText(watch.label) &&
    hasOptionalText(watch.unit) &&
    isRuntimeValue(watch.value)
  );
}

function hasRepresentableNumericRange(
  minimum: number,
  maximum: number,
  step: number,
): boolean {
  const stepCount = (maximum - minimum) / step;
  const encodedMaximum = Math.round(stepCount);
  return (
    encodedMaximum <= MAX_ENCODED_PARAMETER_VALUE &&
    Math.abs(stepCount - encodedMaximum) <=
      Math.max(1e-9, Math.abs(stepCount) * 1e-9)
  );
}
