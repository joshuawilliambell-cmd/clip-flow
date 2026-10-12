/** Fired when Record With Camera claims the device — stop any format-picker preview. */
export const STUDIO_CAMERA_CLAIMED = "studio:camera-claimed";

export function claimStudioCamera() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDIO_CAMERA_CLAIMED));
}
