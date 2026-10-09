"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { getPipLayout, VIDEO_TEMPLATE } from "@/lib/template";
import { THUMBNAIL_TEMPLATE } from "@/lib/thumbnail-template";
import { formatClock } from "@/lib/timeline";
import { HelpTip } from "@/components/HelpTip";
import { filledTeamPhotos } from "@/lib/team-slots";

/**
 * Native HTML5 preview — Remotion Player often stays black on blob: uploads
 * (esp. phone MP4s). Export still uses Remotion separately.
 */
export function VideoPreview({ compact = false }: { compact?: boolean }) {
  const {
    video,
    trimStart,
    outputDuration,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    photos,
    pipSide,
    introThumbnailUrl,
    introThumbnailEnabled,
    videoVolume,
    musicEnabled,
    musicVolume,
    musicTrackId,
    compositionProps,
  } = useStudio();

  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [hasFrame, setHasFrame] = useState(false);

  const musicSrc = compositionProps?.musicSrc ?? null;
  const layout = useMemo(() => getPipLayout(pipSide), [pipSide]);
  const activePhotos = useMemo(() => {
    return filledTeamPhotos(photos).filter(
      (p) =>
        currentTime >= p.startSeconds &&
        currentTime < p.startSeconds + p.durationSeconds,
    );
  }, [photos, currentTime]);

  const showIntro =
    introThumbnailEnabled &&
    Boolean(introThumbnailUrl) &&
    currentTime < THUMBNAIL_TEMPLATE.introDurationSeconds;

  // Map composition time → source file time (respect trim).
  const sourceTime = (t: number) => trimStart + Math.max(0, t);

  // Keep the native element in sync when scrubbing / restarting while paused.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video || isPlaying) return;
    const target = sourceTime(currentTime);
    if (Math.abs(el.currentTime - target) > 0.12) {
      try {
        el.currentTime = target;
      } catch {
        /* ignore seek races while metadata loads */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, isPlaying, video, trimStart]);

  // Volume
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.volume = Math.min(1, Math.max(0, videoVolume));
  }, [videoVolume, video]);

  // Keep a looping music bed element for the selected track.
  // Always apply musicVolume immediately (default 2%) — never leave HTMLAudio
  // at its built-in 100% volume.
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current = null;
    }
    if (!musicSrc) return;
    const audio = new Audio(musicSrc);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = Math.min(1, Math.max(0, musicVolume));
    musicRef.current = audio;
    return () => {
      audio.pause();
      if (musicRef.current === audio) musicRef.current = null;
    };
    // musicVolume applied in a separate sync effect so track swaps stay quiet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicSrc, musicTrackId, video?.url]);

  // Keep bed music at the studio level (2% default) whenever it changes.
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = Math.min(1, Math.max(0, musicVolume));
    }
  }, [musicVolume, musicSrc]);

  // Play / pause the native video + optional music bed.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;

    if (isPlaying) {
      const atEnd = currentTime >= outputDuration - 0.05;
      if (atEnd) {
        el.currentTime = sourceTime(0);
        setCurrentTime(0);
      }
      void el.play().catch(() => {
        setIsPlaying(false);
        setNativeError(
          "Could not play this video in the browser. Try an H.264 MP4 or the webcam recorder.",
        );
      });

      if (musicEnabled && musicRef.current) {
        musicRef.current.volume = Math.min(1, Math.max(0, musicVolume));
        void musicRef.current.play().catch(() => {
          /* music is optional */
        });
      } else {
        musicRef.current?.pause();
      }
    } else {
      el.pause();
      musicRef.current?.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, video, musicEnabled, musicVolume, musicSrc, outputDuration]);

  // Reset frame flag when source changes
  useEffect(() => {
    setHasFrame(false);
    setNativeError(null);
  }, [video?.url]);

  const onTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !video) return;
    const t = Math.max(0, el.currentTime - trimStart);
    if (t >= outputDuration) {
      el.pause();
      setIsPlaying(false);
      setCurrentTime(outputDuration);
      musicRef.current?.pause();
      return;
    }
    if (isPlaying) setCurrentTime(t);
  };

  const togglePlay = useCallback(() => {
    if (!video) return;
    setIsPlaying(!isPlaying);
  }, [video, isPlaying, setIsPlaying]);

  const restart = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.currentTime = sourceTime(0);
    }
    musicRef.current?.pause();
    setCurrentTime(0);
    setIsPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTime, setIsPlaying, trimStart]);

  const fullScreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-bold text-[var(--ink)]">Video preview</h3>
        <HelpTip title="Video preview">
          <p>This window shows what your finished video will look like.</p>
          <p>Team photos and names appear when it is their turn.</p>
          <p>Tap the big Play button to watch and listen.</p>
          <p>
            Background music starts at{" "}
            {Math.round(VIDEO_TEMPLATE.defaultMusicVolume * 100)}% so your voice
            stays clear. You can change it in Finish &amp; Download.
          </p>
          <p>
            Preview uses your browser&apos;s built-in video player so uploads
            show correctly. If it stays black, the file may be iPhone HEVC —
            export as H.264 MP4 or use Record with webcam.
          </p>
        </HelpTip>
      </div>

      <div
        ref={shellRef}
        className="relative overflow-hidden section-card bg-black"
      >
        <div className={compact ? "aspect-video" : "aspect-video"}>
          {video ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                key={video.url}
                ref={videoRef}
                src={video.url}
                playsInline
                preload="auto"
                className="h-full w-full object-cover"
                onLoadedData={() => {
                  setHasFrame(true);
                  const el = videoRef.current;
                  if (el) {
                    try {
                      el.currentTime = sourceTime(currentTime);
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                onLoadedMetadata={() => {
                  const el = videoRef.current;
                  if (el && el.videoWidth > 0) setHasFrame(true);
                }}
                onSeeked={() => setHasFrame(true)}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => {
                  /* only sync if user paused via element; timeline drives pause */
                }}
                onError={() =>
                  setNativeError(
                    "This browser cannot decode that video. Export as H.264 MP4, or record with the webcam option.",
                  )
                }
                onClick={togglePlay}
              />

              {!hasFrame && !nativeError ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/80">
                  <p className="text-lg font-semibold text-white">
                    Loading video preview…
                  </p>
                </div>
              ) : null}

              {nativeError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 px-6 text-center">
                  <p className="max-w-lg text-lg font-semibold text-white">
                    {nativeError}
                  </p>
                </div>
              ) : null}

              {/* Team photo PIP overlays */}
              {activePhotos.map((photo) => {
                if (!photo.url) return null;
                const labelLines = [photo.title, photo.department]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={photo.id}
                    className="pointer-events-none absolute inset-0"
                  >
                    <div
                      className="absolute overflow-hidden"
                      style={{
                        left: `${layout.xPercent}%`,
                        top: `${layout.yPercent}%`,
                        width: `${layout.widthPercent}%`,
                        height: `${layout.heightPercent}%`,
                        borderRadius: VIDEO_TEMPLATE.pip.borderRadiusPx,
                        border: `${VIDEO_TEMPLATE.pip.borderWidthPx}px solid ${VIDEO_TEMPLATE.pip.borderColor}`,
                        boxShadow: VIDEO_TEMPLATE.pip.shadow,
                        backgroundColor: "#111",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.name || "Teammate"}
                        className="h-full w-full object-cover object-[center_22%]"
                      />
                    </div>
                    {(photo.name || labelLines) && (
                      <div
                        className="absolute box-border"
                        style={{
                          left: `${layout.xPercent}%`,
                          top: `calc(${layout.yPercent}% + ${layout.heightPercent}% + ${VIDEO_TEMPLATE.pip.label.belowGapPx}px)`,
                          width: `${layout.widthPercent}%`,
                          background: VIDEO_TEMPLATE.pip.label.background,
                          color: VIDEO_TEMPLATE.pip.label.textColor,
                          padding: `${VIDEO_TEMPLATE.pip.label.paddingY}px ${VIDEO_TEMPLATE.pip.label.paddingX}px`,
                          borderRadius: VIDEO_TEMPLATE.pip.label.borderRadiusPx,
                        }}
                      >
                        {photo.name ? (
                          <div
                            style={{
                              fontSize: Math.max(
                                12,
                                VIDEO_TEMPLATE.pip.label.nameSizePx * 0.45,
                              ),
                              fontWeight: VIDEO_TEMPLATE.pip.label.nameWeight,
                              lineHeight: 1.2,
                            }}
                          >
                            {photo.name}
                          </div>
                        ) : null}
                        {labelLines ? (
                          <div
                            style={{
                              marginTop: 2,
                              fontSize: Math.max(
                                11,
                                VIDEO_TEMPLATE.pip.label.titleSizePx * 0.45,
                              ),
                              fontWeight: VIDEO_TEMPLATE.pip.label.titleWeight,
                              opacity: 0.92,
                              lineHeight: 1.25,
                            }}
                          >
                            {labelLines}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Optional 1s opener thumbnail */}
              {showIntro && introThumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={introThumbnailUrl}
                  alt="Team thumbnail opener"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
              ) : null}

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${VIDEO_TEMPLATE.branding.primary} 0%, ${VIDEO_TEMPLATE.branding.accent} 100%)`,
                }}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#ed2024_0%,#000000_55%,#997b1d_100%)] px-6 text-center">
              <div>
                <p className="font-display text-4xl tracking-wide text-white">
                  Your preview will show here
                </p>
                <p className="mt-3 text-lg text-white">
                  First, upload a video in Step 1.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!video}
          className="btn-primary min-w-[11rem] text-xl"
        >
          {isPlaying ? (
            <>
              <Pause className="h-6 w-6" /> Pause
            </>
          ) : (
            <>
              <Play className="h-6 w-6 fill-current" /> Play
            </>
          )}
        </button>
        <HelpTip title="Play and Pause">
          <p>
            <strong>Play</strong> starts the preview.
          </p>
          <p>
            <strong>Pause</strong> stops it so you can look at one moment.
          </p>
        </HelpTip>
        {musicEnabled && musicSrc ? (
          <span className="rounded-xl border-2 border-[var(--ink)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--ink)]">
            Music {Math.round(musicVolume * 100)}%
          </span>
        ) : null}
        <button
          type="button"
          onClick={restart}
          disabled={!video}
          className="btn-secondary"
        >
          <RotateCcw className="h-5 w-5" /> Restart from beginning
        </button>
        <button
          type="button"
          onClick={fullScreen}
          disabled={!video}
          className="btn-secondary"
        >
          <Maximize2 className="h-5 w-5" /> Full screen
        </button>
        <HelpTip title="Full screen">
          <p>Makes the preview fill your screen so it is easier to see.</p>
          <p>
            Press Escape on a keyboard, or use your device’s back control, to
            exit.
          </p>
        </HelpTip>
        <div className="ml-auto rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-3 py-2 text-lg font-bold text-[var(--ink)]">
          {formatClock(currentTime)} / {formatClock(outputDuration)}
        </div>
      </div>
    </div>
  );
}
