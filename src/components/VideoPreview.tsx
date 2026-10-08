"use client";

import { Player, type PlayerRef } from "@remotion/player";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { IntroductionVideo } from "@/remotion/IntroductionVideo";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { formatClock } from "@/lib/timeline";
import { HelpTip } from "@/components/HelpTip";

export function VideoPreview({ compact = false }: { compact?: boolean }) {
  const {
    compositionProps,
    outputDuration,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    video,
  } = useStudio();

  const playerRef = useRef<PlayerRef>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [, setReady] = useState(false);

  const durationInFrames = Math.max(
    1,
    Math.round(outputDuration * VIDEO_TEMPLATE.fps),
  );

  const inputProps = useMemo(
    () =>
      compositionProps ?? {
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
      },
    [compositionProps],
  );

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      setCurrentTime(e.detail.frame / VIDEO_TEMPLATE.fps);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    setReady(true);

    // Nudge decode so the first frame paints (blob uploads can otherwise stay black).
    const warm = window.setTimeout(() => {
      try {
        const frame = Math.max(0, Math.round(currentTime * VIDEO_TEMPLATE.fps));
        player.seekTo(Math.min(frame, Math.max(0, durationInFrames - 1)));
      } catch {
        /* ignore */
      }
    }, 80);

    return () => {
      window.clearTimeout(warm);
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTime, setIsPlaying, inputProps.videoSrc, durationInFrames]);

  // Keep Remotion in sync when timeline (or other UI) seeks while paused.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || isPlaying) return;
    const frame = Math.round(currentTime * VIDEO_TEMPLATE.fps);
    const id = window.setTimeout(() => {
      if (Math.abs(player.getCurrentFrame() - frame) > 1) {
        player.seekTo(Math.min(frame, Math.max(0, durationInFrames - 1)));
      }
    }, 16);
    return () => window.clearTimeout(id);
  }, [currentTime, isPlaying, durationInFrames]);

  // Honor isPlaying from timeline Play/Pause (and the preview buttons).
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !video) return;
    const playing = player.isPlaying();
    if (isPlaying && !playing) {
      const frame = Math.round(currentTime * VIDEO_TEMPLATE.fps);
      if (Math.abs(player.getCurrentFrame() - frame) > 1) {
        player.seekTo(Math.min(frame, durationInFrames - 1));
      }
      player.play();
    } else if (!isPlaying && playing) {
      player.pause();
    }
    // currentTime intentionally read only when play starts (not while scrubbing mid-play).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, video, durationInFrames]);

  const togglePlay = useCallback(() => {
    if (!video) return;
    setIsPlaying(!isPlaying);
  }, [video, isPlaying, setIsPlaying]);

  const restart = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    player.seekTo(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [setCurrentTime, setIsPlaying]);

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
            If you only see a black screen, the file may use a phone codec this
            browser cannot play. Re-export as an H.264 MP4, or record with the
            webcam option here.
          </p>
        </HelpTip>
      </div>

      <div
        ref={shellRef}
        className="relative overflow-hidden rounded-2xl border-2 border-[var(--ink)] bg-black"
      >
        <div className={compact ? "aspect-video" : "aspect-video"}>
          {video ? (
            <Player
              key={video.url}
              ref={playerRef}
              component={IntroductionVideo}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              compositionWidth={VIDEO_TEMPLATE.width}
              compositionHeight={VIDEO_TEMPLATE.height}
              fps={VIDEO_TEMPLATE.fps}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              clickToPlay
              loop={false}
              spaceKeyToPlayOrPause
              acknowledgeRemotionLicense
              overflowVisible={false}
            />
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
          <p>Press Escape on a keyboard, or use your device’s back control, to exit.</p>
        </HelpTip>
        <div className="ml-auto rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-3 py-2 text-lg font-bold text-[var(--ink)]">
          {formatClock(currentTime)} / {formatClock(outputDuration)}
        </div>
      </div>
    </div>
  );
}
