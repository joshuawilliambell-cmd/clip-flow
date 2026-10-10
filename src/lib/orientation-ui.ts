import type { VideoOrientation } from "@/lib/template";

/** Shared frame classes so web preview, webcam, and pickers stay in sync. */
export function frameAspectClass(
  orientation: VideoOrientation,
  size: "preview" | "webcam" | "picker" | "review" = "preview",
): string {
  if (orientation === "portrait") {
    switch (size) {
      case "picker":
        return "aspect-[3/4] w-full max-w-[12rem]";
      case "webcam":
      case "review":
        return "mx-auto aspect-[3/4] max-h-[min(70vh,40rem)] w-full max-w-md";
      default:
        return "mx-auto aspect-[3/4] max-h-[min(85vh,52rem)] w-full max-w-[min(100%,28rem)]";
    }
  }
  return "aspect-video w-full";
}

export function orientationLabel(orientation: VideoOrientation): string {
  return orientation === "portrait" ? "Portrait 4:3" : "Landscape 16:9";
}

export function orientationRatioLabel(orientation: VideoOrientation): string {
  return orientation === "portrait" ? "4:3" : "16:9";
}

export function orientationFileSuffix(orientation: VideoOrientation): string {
  return orientation === "portrait" ? "portrait-4x3" : "landscape-16x9";
}
