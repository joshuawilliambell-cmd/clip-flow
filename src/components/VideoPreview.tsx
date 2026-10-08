"use client";

import { Player, type PlayerRef } from "@remotion/player";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { IntroductionVideo } from "@/remotion/IntroductionVideo";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { formatClock } from "@/lib/timeline";

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
  const [ready, setReady] = useState(false);

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

    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
    };
  }, [setCurrentTime, setIsPlaying, inputProps.videoSrc, durationInFrames]);

  // External scrub sync
  useEffect(() => {
    const player = playerRef.current;
    if (!player || isPlaying) return;
    const frame = Math.round(currentTime * VIDEO_TEMPLATE.fps);
    if (Math.abs(player.getCurrentFrame() - frame) > 1) {
      player.seekTo(frame);
    }
  }, [currentTime, isPlaying]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player || !video) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      if (player.getCurrentFrame() >= durationInFrames - 1) {
        player.seekTo(0);
      }
      player.play();
    }
  }, [video, durationInFrames]);

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
      <div
        ref={shellRef}
        className="relative overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_rgba(0,0,0,0.28)] ring-1 ring-black/10"
      >
        <div className={compact ? "aspect-video" : "aspect-video"}>
          {video ? (
            <Player
              ref={playerRef}
              component={IntroductionVideo}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              compositionWidth={VIDEO_TEMPLATE.width}
              compositionHeight={VIDEO_TEMPLATE.height}
              fps={VIDEO_TEMPLATE.fps}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              clickToPlay={false}
              loop={false}
              acknowledgeRemotionLicense
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2a1218] via-[#1a1a1a] to-[#0f1720] px-6 text-center">
              <div>
                <p className="font-display text-3xl tracking-wide text-white md:text-4xl">
                  Your preview appears here
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Upload an introduction video to see the 16:9 canvas with team
                  overlays.
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
          className="inline-flex h-14 min-w-[9.5rem] items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-base font-semibold text-white shadow transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? (
            <>
              <Pause className="h-5 w-5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current" /> Play
            </>
          )}
        </button>
        <button
          type="button"
          onClick={restart}
          disabled={!video}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-4 text-sm font-semibold text-[var(--ink)] disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" /> Restart
        </button>
        <button
          type="button"
          onClick={fullScreen}
          disabled={!video}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-4 text-sm font-semibold text-[var(--ink)] disabled:opacity-40"
        >
          <Maximize2 className="h-4 w-4" /> Full Screen Preview
        </button>
        <div className="ml-auto font-mono text-sm text-[var(--muted)]">
          {formatClock(currentTime)} / {formatClock(outputDuration)}
          {ready ? "" : ""}
        </div>
      </div>
    </div>
  );
}
