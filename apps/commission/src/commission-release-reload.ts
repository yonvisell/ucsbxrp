export interface CommissionReloadActivity {
  appReady: boolean;
  folderInteractionActive: boolean;
  serialInteractionActive: boolean;
  installActive: boolean;
  networkHandoffActive: boolean;
  navigationActive: boolean;
}

/** Setup may adopt a course update only when no student operation can be lost. */
export function commissionReloadIsSafe(
  activity: CommissionReloadActivity,
): boolean {
  return (
    activity.appReady &&
    !activity.folderInteractionActive &&
    !activity.serialInteractionActive &&
    !activity.installActive &&
    !activity.networkHandoffActive &&
    !activity.navigationActive
  );
}
