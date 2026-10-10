"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Maximize2, RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { clsx } from "clsx";
import { getPipLayout, VIDEO_TEMPLATE } from "@/lib/template";
import {
  frameAspectClass,
  orientationLabel,
} from "@/lib/orientation-ui";
import { THUMBNAIL_TEMPLATE } from "@/lib/thumbnail-template";
import { HelpTip } from "@/components/HelpTip";
import { VideoFilmstripBar } from "@/components/VideoFilmstripBar";
import { filledTeamPhotos } from "@/lib/team-slots";
import {
  createQuietAudio,
  createQuietVideoVoice,
  type QuietAudio,
  type QuietVideoVoice,
} from "@/lib/quiet-audio";

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
    videoOrientation,
    introThumbnailUrl,
    introThumbnailEnabled,
    videoVolume,
    musicEnabled,
    musicVolume,
    musicTrackId,
    compositionProps,
    reconcileVideoDuration,
  } = useStudio();

  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<QuietAudio | null>(null);
  const voiceRef = useRef<QuietVideoVoice | null>(null);
  const [voiceDecoded, setVoiceDecoded] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [hasFrame, setHasFrame] = useState(false);

  const musicSrc = compositionProps?.musicSrc ?? null;
  const layout = useMemo(
    () => getPipLayout(pipSide, videoOrientation),
    [pipSide, videoOrientation],
  );
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

  // Talking-video voice via decoded Web Audio + GainNode. Required on iPhone —
  // HTMLVideoElement.volume is ignored there (always full device level).
  // Picture stays on <video> (muted when decode succeeds).
  useEffect(() => {
    if (!video?.url) {
      voiceRef.current?.dispose();
      voiceRef.current = null;
      setVoiceDecoded(false);
      return;
    }
    const voice = createQuietVideoVoice(video.url, videoVolume);
    voiceRef.current = voice;
    setVoiceDecoded(false);
    let cancelled = false;
    void voice.ready.then((ok) => {
      if (cancelled) return;
      setVoiceDecoded(ok);
      const el = videoRef.current;
      if (!el) return;
      if (ok) {
        el.muted = true;
        el.volume = 0;
      } else {
        el.muted = false;
        el.volume = Math.min(1, Math.max(0, videoVolume));
      }
    });
    return () => {
      cancelled = true;
      voice.dispose();
      if (voiceRef.current === voice) voiceRef.current = null;
      setVoiceDecoded(false);
    };
    // Recreate only when the source changes; volume synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.url]);

  useEffect(() => {
    voiceRef.current?.setVolume(videoVolume);
    if (!voiceDecoded) {
      const el = videoRef.current;
      if (el) el.volume = Math.min(1, Math.max(0, videoVolume));
    }
  }, [videoVolume, voiceDecoded, video?.url]);

  // Looping music bed via Web Audio (GainNode). Required on iPhone — HTML
  // <audio>.volume is ignored there and can play at full device level.
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.dispose();
      musicRef.current = null;
    }
    if (!musicSrc) return;
    const audio = createQuietAudio(musicSrc, musicVolume, { loop: true });
    musicRef.current = audio;
    return () => {
      audio.dispose();
      if (musicRef.current === audio) musicRef.current = null;
    };
    // musicVolume synced separately so track swaps do not recreate on every fader move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicSrc, musicTrackId, video?.url]);

  useEffect(() => {
    musicRef.current?.setVolume(musicVolume);
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
      if (voiceDecoded) {
        el.muted = true;
        el.volume = 0;
        voiceRef.current?.setVolume(videoVolume);
        void voiceRef.current?.playFrom(el.currentTime);
      } else {
        el.muted = false;
        el.volume = Math.min(1, Math.max(0, videoVolume));
      }
      void el.play().catch(() => {
        setIsPlaying(false);
        setNativeError(
          "Could not play this video in the browser. Try an H.264 MP4 or the webcam recorder.",
        );
      });

      if (musicEnabled && musicRef.current) {
        musicRef.current.setVolume(musicVolume);
        void musicRef.current.play().catch(() => {
          /* music is optional — never fall back to loud HTMLAudio on iOS */
        });
      } else {
        musicRef.current?.pause();
      }
    } else {
      el.pause();
      voiceRef.current?.pause();
      musicRef.current?.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPlaying,
    video,
    musicEnabled,
    musicVolume,
    musicSrc,
    outputDuration,
    voiceDecoded,
    videoVolume,
  ]);

  // Reset frame flag when source changes
  useEffect(() => {
    setHasFrame(false);
    setNativeError(null);
  }, [video?.url]);

  // WebM often under-reports duration as ~60s. Seek past the end once on load
  // so Step 2 timeline/preview grow to the real length (incl. 2+ minutes).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;
    let cancelled = false;
    let probing = false;

    const finishProbe = () => {
      if (cancelled || !probing) return;
      probing = false;
      const at = el.currentTime;
      const reported =
        Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
      const discovered = Math.max(at, reported);
      if (discovered > 0.5) reconcileVideoDuration(discovered);
      try {
        el.currentTime = trimStart + Math.max(0, currentTime);
      } catch {
        /* ignore */
      }
    };

    const startProbe = () => {
      if (cancelled || probing) return;
      probing = true;
      const onSeeked = () => {
        el.removeEventListener("seeked", onSeeked);
        finishProbe();
      };
      el.addEventListener("seeked", onSeeked);
      try {
        const reported =
          Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
        el.currentTime = Math.max(reported + 3600, 1e101);
      } catch {
        el.removeEventListener("seeked", onSeeked);
        probing = false;
      }
      window.setTimeout(() => {
        if (probing) {
          el.removeEventListener("seeked", onSeeked);
          finishProbe();
        }
      }, 4000);
    };

    if (el.readyState >= 1) startProbe();
    else el.addEventListener("loadedmetadata", startProbe, { once: true });

    return () => {
      cancelled = true;
    };
    // Only re-probe when the source file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.url, reconcileVideoDuration]);

  const onTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !video) return;
    const t = Math.max(0, el.currentTime - trimStart);
    if (t >= outputDuration) {
      el.pause();
      setIsPlaying(false);
      setCurrentTime(outputDuration);
      voiceRef.current?.pause();
      musicRef.current?.pause();
      return;
    }
    if (isPlaying) {
      setCurrentTime(t);
      if (voiceDecoded) voiceRef.current?.syncTo(el.currentTime);
    }
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

  // iOS native fullscreen plays element audio (GainNode voice is paused).
  useEffect(() => {
    const el = videoRef.current as
      | (HTMLVideoElement & {
          webkitDisplayingFullscreen?: boolean;
        })
      | null;
    if (!el || !video) return;

    const onBegin = () => {
      voiceRef.current?.pause();
      // Native player ignores volume fader, but must not stay muted.
      el.muted = false;
      try {
        el.volume = 1;
      } catch {
        /* ignore */
      }
    };
    const onEnd = () => {
      if (voiceDecoded) {
        el.muted = true;
        el.volume = 0;
        if (isPlaying) {
          voiceRef.current?.setVolume(videoVolume);
          void voiceRef.current?.playFrom(el.currentTime);
        }
      } else {
        el.muted = false;
        el.volume = Math.min(1, Math.max(0, videoVolume));
      }
    };

    el.addEventListener("webkitbeginfullscreen", onBegin);
    el.addEventListener("webkitendfullscreen", onEnd);
    return () => {
      el.removeEventListener("webkitbeginfullscreen", onBegin);
      el.removeEventListener("webkitendfullscreen", onEnd);
    };
  }, [video, voiceDecoded, isPlaying, videoVolume]);

  const fullScreen = useCallback(async () => {
    const shell = shellRef.current;
    const videoEl = videoRef.current;
    if (!shell && !videoEl) return;

    type FsDoc = Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    type FsEl = HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    type FsVideo = HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };

    const doc = document as FsDoc;
    const inFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

    try {
      if (inFs) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        return;
      }

      // iPhone/iPad: only <video> can go fullscreen (not a wrapper div).
      const iosVideo = videoEl as FsVideo | null;
      if (iosVideo && typeof iosVideo.webkitEnterFullscreen === "function") {
        // Hand off audio to the native player for the fullscreen session.
        voiceRef.current?.pause();
        iosVideo.muted = false;
        try {
          iosVideo.volume = 1;
        } catch {
          /* ignore */
        }
        iosVideo.webkitEnterFullscreen();
        return;
      }

      const target = (shell ?? videoEl) as FsEl | null;
      if (!target) return;
      if (target.requestFullscreen) await target.requestFullscreen();
      else if (target.webkitRequestFullscreen)
        await target.webkitRequestFullscreen();
    } catch (e) {
      console.warn("Fullscreen failed", e);
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
          Video Preview
        </h3>
        <span className="rounded-full border-2 border-[var(--ink)] bg-[var(--yellow)] px-2.5 py-0.5 text-[12px] font-bold text-[var(--ink)]">
          {orientationLabel(videoOrientation)}
        </span>
        <HelpTip title="Video preview">
          <p>This window shows what your finished video will look like.</p>
          <p>
            Shape matches your Video Format (
            {orientationLabel(videoOrientation)}). Change it above if needed.
          </p>
          <p>Team photos and names appear when it is their turn.</p>
          <p>
            Tap play on the bar under the video to watch and listen, or tap the
            video itself.
          </p>
          <p>
            Background music starts at{" "}
            {Math.round(VIDEO_TEMPLATE.defaultMusicVolume * 100)}% (max{" "}
            {Math.round(VIDEO_TEMPLATE.maxMusicVolume * 100)}%) so your voice
            stays clear.
          </p>
          <p>
            Preview uses your browser&apos;s built-in video player so uploads
            show correctly. If it stays black, the file may be iPhone HEVC —
            export as H.264 MP4 or use Record with webcam.
          </p>
        </HelpTip>
      </div>

      {/* Video + filmstrip transport as one flush unit (iOS Photos–style). */}
      <div className="overflow-hidden rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-black">
        <div ref={shellRef} className="relative bg-black">
          <div
            className={clsx(
              frameAspectClass(videoOrientation, "preview"),
              compact && videoOrientation === "portrait" && "max-w-xs",
            )}
          >
            {video ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  key={video.url}
                  ref={videoRef}
                  src={video.url}
                  playsInline
                  preload="auto"
                  className="h-full w-full object-contain bg-black"
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
                    // WebM duration may resolve after first load — extend past any
                    // mistaken ~60s fallback so 2+ minute clips stay full length.
                    if (
                      el &&
                      Number.isFinite(el.duration) &&
                      el.duration > 0
                    ) {
                      reconcileVideoDuration(el.duration);
                    }
                  }}
                  onDurationChange={() => {
                    const el = videoRef.current;
                    if (
                      el &&
                      Number.isFinite(el.duration) &&
                      el.duration > 0
                    ) {
                      reconcileVideoDuration(el.duration);
                    }
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
                            borderRadius:
                              VIDEO_TEMPLATE.pip.label.borderRadiusPx,
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
                                fontWeight:
                                  VIDEO_TEMPLATE.pip.label.titleWeight,
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

                {/* Optional 1s opener thumbnail (letterbox on portrait canvas). */}
                {showIntro && introThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={introThumbnailUrl}
                    alt="Team thumbnail opener"
                    className={clsx(
                      "pointer-events-none absolute inset-0 h-full w-full bg-[var(--yellow)]",
                      videoOrientation === "portrait"
                        ? "object-contain"
                        : "object-cover",
                    )}
                  />
                ) : null}
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

        {video ? <VideoFilmstripBar /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <HelpTip title="Scrub, trim, and full screen">
          <p>
            Use the dark bar under the video to play, scrub, and trim — drag the
            white edges to shorten the start or end, and drag the filmstrip to
            jump.
          </p>
          <p>
            <strong>Full screen</strong> expands the preview to fill your phone
            or computer screen so it is easier to watch. On iPhone it uses the
            built-in video full screen. Tap Done or swipe down to exit.
          </p>
        </HelpTip>
      </div>
    </div>
  );
}
