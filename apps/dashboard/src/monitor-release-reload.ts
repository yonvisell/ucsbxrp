export interface MonitorReloadActivity {
  runActive: boolean;
  exportActive: boolean;
  recordingActive: boolean;
  retainedRecording: boolean;
}

/** A Monitor reload is safe only when it cannot interrupt or discard work. */
export function monitorReloadIsSafe(activity: MonitorReloadActivity): boolean {
  return !(
    activity.runActive ||
    activity.exportActive ||
    activity.recordingActive ||
    activity.retainedRecording
  );
}
