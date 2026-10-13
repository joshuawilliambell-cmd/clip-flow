import {
  AbsoluteFill,
  Img,
  getRemotionEnvironment,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  getPipLayout,
  VIDEO_TEMPLATE,
  type PipSide,
  type VideoOrientation,
} from "@/lib/template";
import { youtubePipEmbedSrc } from "@/lib/youtube-pip";

type PhotoOverlayProps = {
  src: string;
  name: string;
  title: string;
  department: string;
  startFrame: number;
  durationFrames: number;
  pipSide?: PipSide;
  orientation?: VideoOrientation;
  sourceWidth?: number;
  sourceHeight?: number;
  /** YouTube video id — muted autoplay in preview; poster used while exporting. */
  youtubeId?: string | null;
};

export function PhotoOverlay({
  src,
  name,
  title,
  department,
  startFrame,
  durationFrames,
  pipSide = VIDEO_TEMPLATE.pip.defaultSide,
  orientation = VIDEO_TEMPLATE.defaultOrientation,
  sourceWidth,
  sourceHeight,
  youtubeId = null,
}: PhotoOverlayProps) {
  const frame = useCurrentFrame();
  const { fps, fadeInSeconds, fadeOutSeconds, pip } = VIDEO_TEMPLATE;
  const layout = getPipLayout(
    pipSide,
    orientation,
    sourceWidth && sourceHeight
      ? { width: sourceWidth, height: sourceHeight }
      : null,
  );
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
  const { isRendering } = getRemotionEnvironment();
  const playYoutube = Boolean(youtubeId) && !isRendering;

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: `${layout.xPercent}%`,
          top: `${layout.yPercent}%`,
          width: `${layout.widthPercent}%`,
          height: `${layout.heightPercent}%`,
          borderRadius: pip.borderRadiusPx,
          overflow: "hidden",
          border: `${pip.borderWidthPx}px solid ${pip.borderColor}`,
          boxShadow: pip.shadow,
          backgroundColor: "#111",
        }}
      >
        {playYoutube && youtubeId ? (
          <>
            <Img
              src={src}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
              }}
            />
            <iframe
              src={youtubePipEmbedSrc(youtubeId)}
              title={title || name || "PIP video"}
              width="100%"
              height="100%"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
                pointerEvents: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen={false}
            />
          </>
        ) : (
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // Portrait headshot framing — keep faces near upper-center
              objectPosition: youtubeId ? "center center" : "center 22%",
            }}
          />
        )}
      </div>

      {/* Name/title bars are for teammate photos — hide under video PIPs. */}
      {!youtubeId && (name || labelLines) ? (
        <div
          style={{
            position: "absolute",
            left: `${layout.xPercent}%`,
            top: `calc(${layout.yPercent}% + ${layout.heightPercent}% + ${pip.label.belowGapPx}px)`,
            width: `${layout.widthPercent}%`,
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
      ) : null}
    </AbsoluteFill>
  );
}
