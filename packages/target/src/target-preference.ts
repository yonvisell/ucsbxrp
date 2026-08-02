export type TargetKind = "virtual" | "physical";

export interface TargetPreference {
  kind: TargetKind;
  physicalEndpoint: string;
}

export const TARGET_PREFERENCE_KEY = "ucsb-xrp-target-v1";
export const DEFAULT_TARGET_PREFERENCE: TargetPreference = {
  kind: "virtual",
  physicalEndpoint: "http://192.168.7.30",
};

export function loadTargetPreference(): TargetPreference {
  try {
    const raw = localStorage.getItem(TARGET_PREFERENCE_KEY);
    if (!raw) {
      return DEFAULT_TARGET_PREFERENCE;
    }
    const value = JSON.parse(raw) as Partial<TargetPreference>;
    return {
      kind: value.kind === "physical" ? "physical" : "virtual",
      physicalEndpoint:
        typeof value.physicalEndpoint === "string" &&
        value.physicalEndpoint.trim()
          ? value.physicalEndpoint
          : DEFAULT_TARGET_PREFERENCE.physicalEndpoint,
    };
  } catch {
    return DEFAULT_TARGET_PREFERENCE;
  }
}

export function storeTargetPreference(value: TargetPreference): void {
  localStorage.setItem(TARGET_PREFERENCE_KEY, JSON.stringify(value));
}
