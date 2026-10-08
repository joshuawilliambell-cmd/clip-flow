import {
  AbsoluteFill,
  Audio,
  Sequence,
  OffthreadVideo,
  useVideoConfig,
} from "remotion";
import { IntroThumbnail } from "@/remotion/components/IntroThumbnail";
import { PhotoOverlay } from "@/remotion/components/PhotoOverlay";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { THUMBNAIL_TEMPLATE } from "@/lib/thumbnail-template";
import type { CompositionProps } from "@/lib/types";

export const defaultCompositionProps: CompositionProps = {
  videoSrc: "",
  trimStartSeconds: 0,
  durationInSeconds: VIDEO_TEMPLATE.targetDurationSeconds,
  photos: [],
  pipSide: VIDEO_TEMPLATE.pip.defaultSide,
  introThumbnailSrc: null,
  introThumbnailEnabled: false,
  videoVolume: VIDEO_TEMPLATE.defaultVideoVolume,
  musicSrc: null,
  musicVolume: VIDEO_TEMPLATE.defaultMusicVolume,
  musicEnabled: false,
};

export function IntroductionVideo(props: CompositionProps) {
  const { fps } = useVideoConfig();
  const {
    videoSrc,
    trimStartSeconds,
    durationInSeconds,
    photos,
    pipSide,
    introThumbnailSrc,
    introThumbnailEnabled,
    videoVolume,
    musicSrc,
    musicVolume,
    musicEnabled,
  } = props;

  const durationFrames = Math.max(1, Math.round(durationInSeconds * fps));
  const musicFadeFrames = Math.round(VIDEO_TEMPLATE.musicFadeSeconds * fps);
  const introFrames = Math.max(
    1,
    Math.round(THUMBNAIL_TEMPLATE.introDurationSeconds * fps),
  );
  const showIntro =
    introThumbnailEnabled && Boolean(introThumbnailSrc);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0b" }}>
      {videoSrc ? (
        <AbsoluteFill>
          <OffthreadVideo
            src={videoSrc}
            trimBefore={Math.round(trimStartSeconds * fps)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            volume={videoVolume}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "Source Sans 3, sans-serif",
            fontSize: 48,
          }}
        >
          Upload your introduction video to begin
        </AbsoluteFill>
      )}

      {photos.map((photo) => {
        const startFrame = Math.round(photo.startSeconds * fps);
        const durationFramesPhoto = Math.max(
          1,
          Math.round(photo.durationSeconds * fps),
        );
        return (
          <Sequence
            key={photo.id}
            from={startFrame}
            durationInFrames={durationFramesPhoto}
            layout="none"
          >
            <PhotoOverlay
              src={photo.src}
              name={photo.name}
              title={photo.title}
              department={photo.department}
              startFrame={0}
              durationFrames={durationFramesPhoto}
              pipSide={pipSide}
            />
          </Sequence>
        );
      })}

      {musicEnabled && musicSrc ? (
        <Audio
          src={musicSrc}
          volume={(f) => {
            const fadeIn = Math.min(1, f / Math.max(1, musicFadeFrames));
            const fadeOut = Math.min(
              1,
              (durationFrames - f) / Math.max(1, musicFadeFrames),
            );
            return musicVolume * Math.min(fadeIn, fadeOut);
          }}
          loop
        />
      ) : null}

      {/* Subtle brand footer bar — unobtrusive */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 8,
          background: `linear-gradient(90deg, ${VIDEO_TEMPLATE.branding.primary} 0%, ${VIDEO_TEMPLATE.branding.accent} 100%)`,
        }}
      />

      {showIntro && introThumbnailSrc ? (
        <Sequence from={0} durationInFrames={introFrames} layout="none">
          <IntroThumbnail src={introThumbnailSrc} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
}
