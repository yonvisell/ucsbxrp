export interface MonitorReloadActivity {
  targetCommandActive: boolean;
  runActive: boolean;
  exportActive: boolean;
  recordingActive: boolean;
  retainedRecording: boolean;
  retainedAnnotations: boolean;
  annotationDraftActive: boolean;
  folderInteractionActive: boolean;
  saveActive: boolean;
}

/** A Monitor reload is safe only when it cannot interrupt or discard work. */
export function monitorReloadIsSafe(activity: MonitorReloadActivity): boolean {
  return !(
    activity.targetCommandActive ||
    activity.runActive ||
    activity.exportActive ||
    activity.recordingActive ||
    activity.retainedRecording ||
    activity.retainedAnnotations ||
    activity.annotationDraftActive ||
    activity.folderInteractionActive ||
    activity.saveActive
  );
}
