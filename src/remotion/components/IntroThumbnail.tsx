import { AbsoluteFill, Img } from "remotion";

type IntroThumbnailProps = {
  src: string;
};

/** Full-frame opening card — shown only for the first second of the video. */
export function IntroThumbnail({ src }: IntroThumbnailProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFD400", zIndex: 20 }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
}
