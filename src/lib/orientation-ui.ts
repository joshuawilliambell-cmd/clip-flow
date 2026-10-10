import type { VideoOrientation } from "@/lib/template";

/** Shared frame classes so web preview, webcam, and pickers stay in sync. */
export function frameAspectClass(
  orientation: VideoOrientation,
  size: "preview" | "webcam" | "picker" | "review" = "preview",
): string {
  if (orientation === "portrait") {
    switch (size) {
      case "picker":
        return "aspect-[9/16] w-full max-w-[11rem]";
      case "webcam":
      case "review":
        return "mx-auto aspect-[9/16] max-h-[min(70vh,40rem)] w-full max-w-md";
      default:
        return "mx-auto aspect-[9/16] max-h-[min(85vh,52rem)] w-full max-w-[min(100%,28rem)]";
    }
  }
  return "aspect-video w-full";
}

export function orientationLabel(orientation: VideoOrientation): string {
  return orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9";
}

export function orientationFileSuffix(orientation: VideoOrientation): string {
  return orientation === "portrait" ? "portrait" : "landscape";
}
