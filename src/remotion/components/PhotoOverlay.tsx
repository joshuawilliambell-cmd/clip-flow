import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { VIDEO_TEMPLATE } from "@/lib/template";

type PhotoOverlayProps = {
  src: string;
  name: string;
  title: string;
  department: string;
  startFrame: number;
  durationFrames: number;
};

export function PhotoOverlay({
  src,
  name,
  title,
  department,
  startFrame,
  durationFrames,
}: PhotoOverlayProps) {
  const frame = useCurrentFrame();
  const { fps, fadeInSeconds, fadeOutSeconds, pip } = VIDEO_TEMPLATE;
  const fadeIn = Math.max(1, Math.round(fadeInSeconds * fps));
  const fadeOut = Math.max(1, Math.round(fadeOutSeconds * fps));
  const local = frame - startFrame;

  const opacity = interpolate(
    local,
    [0, fadeIn, Math.max(fadeIn + 1, durationFrames - fadeOut), durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const labelLines = [title, department].filter(Boolean).join(" · ");

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: `${pip.xPercent}%`,
          top: `${pip.yPercent}%`,
          width: `${pip.widthPercent}%`,
          height: `${pip.heightPercent}%`,
          borderRadius: pip.borderRadiusPx,
          overflow: "hidden",
          border: `${pip.borderWidthPx}px solid ${pip.borderColor}`,
          boxShadow: pip.shadow,
          backgroundColor: "#111",
        }}
      >
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // Slight upward bias approximates face-aware framing for portraits
            objectPosition: "center 28%",
          }}
        />
      </div>

      {(name || labelLines) && (
        <div
          style={{
            position: "absolute",
            left: `${pip.xPercent}%`,
            top: `calc(${pip.yPercent}% + ${pip.heightPercent}% + ${pip.label.belowGapPx}px)`,
            width: `${pip.label.maxWidthPercent}%`,
            background: pip.label.background,
            color: pip.label.textColor,
            padding: `${pip.label.paddingY}px ${pip.label.paddingX}px`,
            borderRadius: pip.label.borderRadiusPx,
            boxSizing: "border-box",
          }}
        >
          {name ? (
            <div
              style={{
                fontSize: pip.label.nameSizePx,
                fontWeight: pip.label.nameWeight,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              {name}
            </div>
          ) : null}
          {labelLines ? (
            <div
              style={{
                marginTop: 4,
                fontSize: pip.label.titleSizePx,
                fontWeight: pip.label.titleWeight,
                lineHeight: 1.2,
                opacity: 0.92,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "Source Sans 3, Helvetica, sans-serif",
              }}
            >
              {labelLines}
            </div>
          ) : null}
        </div>
      )}
    </AbsoluteFill>
  );
}
