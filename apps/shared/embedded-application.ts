/** True when an application is hosted inside the combined IDE/Monitor view. */
export function isEmbeddedApplication(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embedded") === "1"
  );
}
