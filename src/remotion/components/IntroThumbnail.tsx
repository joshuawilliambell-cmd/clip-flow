import { AbsoluteFill, Img } from "remotion";
import type { VideoOrientation } from "@/lib/template";

type IntroThumbnailProps = {
  src: string;
  /** Landscape team card letterboxes on a portrait export canvas. */
  orientation?: VideoOrientation;
};

/** Full-frame opening card — shown only for the first second of the video. */
export function IntroThumbnail({
  src,
  orientation = "landscape",
}: IntroThumbnailProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFD400", zIndex: 20 }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: orientation === "portrait" ? "contain" : "cover",
        }}
      />
    </AbsoluteFill>
  );
}
