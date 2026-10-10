"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { clsx } from "clsx";
import { useStudio } from "@/lib/studio-context";
import { formatClock } from "@/lib/timeline";

const THUMB_COUNT = 14;

/**
 * iOS Photos–style transport: play + filmstrip scrubber + trim handles,
 * meant to sit flush under the video preview.
 */
export function VideoFilmstripBar() {
  const {
    video,
    trimStart,
    trimEnd,
    currentTime,
    isPlaying,
    outputDuration,
    setCurrentTime,
    setIsPlaying,
    setTrim,
  } = useStudio();

  const stripRef = useRef<HTMLDivElement>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [stripWidth, setStripWidth] = useState(0);
  const scrubbing = useRef(false);
  const trimOrigin = useRef({ start: 0, end: 0 });

  const sourceDuration = video?.durationSeconds ?? 0;

  useEffect(() => {
    const node = stripRef.current;
    if (!node) return;
    const update = () => setStripWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [video?.url]);

  // Build a short filmstrip of frames across the full source clip.
  useEffect(() => {
    if (!video?.url || sourceDuration <= 0) {
      setThumbs([]);
      return;
    }
    let cancelled = false;
    const el = document.createElement("video");
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    el.setAttribute("playsinline", "true");
    el.src = video.url;

    const run = async () => {
      await new Promise<void>((resolve, reject) => {
        el.onloadeddata = () => resolve();
        el.onerror = () => reject(new Error("thumb load failed"));
        window.setTimeout(() => resolve(), 4000);
      });
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = 72;
      const h = 48;
      canvas.width = w;
      canvas.height = h;

      const frames: string[] = [];
      for (let i = 0; i < THUMB_COUNT; i++) {
        if (cancelled) return;
        const t =
          sourceDuration <= 0.05
            ? 0
            : (i / Math.max(1, THUMB_COUNT - 1)) * Math.max(0, sourceDuration - 0.05);
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            el.removeEventListener("seeked", onSeeked);
            try {
              ctx.fillStyle = "#111";
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(el, 0, 0, w, h);
              frames.push(canvas.toDataURL("image/jpeg", 0.6));
            } catch {
              frames.push("");
            }
            resolve();
          };
          el.addEventListener("seeked", onSeeked);
          try {
            el.currentTime = t;
          } catch {
            el.removeEventListener("seeked", onSeeked);
            frames.push("");
            resolve();
          }
          window.setTimeout(() => {
            el.removeEventListener("seeked", onSeeked);
            resolve();
          }, 800);
        });
      }
      if (!cancelled) setThumbs(frames.filter(Boolean));
    };

    void run().catch(() => {
      if (!cancelled) setThumbs([]);
    });

    return () => {
      cancelled = true;
      el.removeAttribute("src");
      el.load();
    };
  }, [video?.url, sourceDuration]);

  const togglePlay = () => {
    if (!video) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (currentTime >= outputDuration - 0.05) setCurrentTime(0);
    setIsPlaying(true);
  };

  const sourceFromClientX = useCallback(
    (clientX: number) => {
      const strip = stripRef.current;
      if (!strip || sourceDuration <= 0 || stripWidth <= 0) return 0;
      const rect = strip.getBoundingClientRect();
      const x = Math.max(0, Math.min(stripWidth, clientX - rect.left));
      return (x / stripWidth) * sourceDuration;
    },
    [sourceDuration, stripWidth],
  );

  const scrubTo = useCallback(
    (clientX: number) => {
      setIsPlaying(false);
      const sourceSec = sourceFromClientX(clientX);
      const outputSec = Math.max(
        0,
        Math.min(outputDuration, sourceSec - trimStart),
      );
      setCurrentTime(outputSec);
    },
    [sourceFromClientX, outputDuration, trimStart, setCurrentTime, setIsPlaying],
  );

  const beginScrub = (e: React.PointerEvent) => {
    e.preventDefault();
    scrubbing.current = true;
    scrubTo(e.clientX);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      if (!scrubbing.current) return;
      scrubTo(ev.clientX);
    };
    const onUp = () => {
      scrubbing.current = false;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (!video) return null;

  const keptLeftPct =
    sourceDuration > 0 ? (trimStart / sourceDuration) * 100 : 0;
  const keptWidthPct =
    sourceDuration > 0 ? (outputDuration / sourceDuration) * 100 : 100;
  const playheadPct =
    sourceDuration > 0
      ? ((trimStart + currentTime) / sourceDuration) * 100
      : 0;

  return (
    <div className="border-t border-black/40 bg-[#1c1c1e] px-1.5 py-1.5">
      <div className="flex items-stretch gap-1.5">
        <button
          type="button"
          onClick={togglePlay}
          className="flex w-11 shrink-0 items-center justify-center rounded-md bg-black/40 text-white"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
        </button>

        <div className="w-px shrink-0 self-stretch bg-white/20" aria-hidden />

        <div
          ref={stripRef}
          className="relative min-h-[3.25rem] min-w-0 flex-1 touch-none overflow-hidden rounded-md bg-[#2c2c2e]"
          onPointerDown={beginScrub}
          role="slider"
          aria-label="Scrub and trim video"
          aria-valuemin={0}
          aria-valuemax={outputDuration}
          aria-valuenow={currentTime}
        >
          {/* Filmstrip frames */}
          <div className="absolute inset-0 flex">
            {(thumbs.length > 0
              ? thumbs
              : Array.from({ length: THUMB_COUNT }, () => "")
            ).map((src, i) => (
              <div
                key={i}
                className="h-full flex-1 border-r border-black/40 bg-[#3a3a3c] last:border-r-0"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                    draggable={false}
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* Dim regions outside the keep window */}
          {keptLeftPct > 0.2 ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-black/55"
              style={{ width: `${keptLeftPct}%` }}
            />
          ) : null}
          {keptLeftPct + keptWidthPct < 99.8 ? (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 bg-black/55"
              style={{ width: `${Math.max(0, 100 - keptLeftPct - keptWidthPct)}%` }}
            />
          ) : null}

          {/* Keep window + trim chevrons */}
          <div
            className="absolute inset-y-0 z-10 rounded-sm ring-2 ring-white"
            style={{ left: `${keptLeftPct}%`, width: `${Math.max(keptWidthPct, 4)}%` }}
          >
            <TrimHandle
              side="left"
              onPointerDownCapture={() => {
                trimOrigin.current = { start: trimStart, end: trimEnd };
              }}
              onDelta={(dxPx) => {
                if (stripWidth <= 0 || sourceDuration <= 0) return;
                const deltaSec = (dxPx / stripWidth) * sourceDuration;
                setTrim("start", trimOrigin.current.start + deltaSec);
              }}
            />
            <TrimHandle
              side="right"
              onPointerDownCapture={() => {
                trimOrigin.current = { start: trimStart, end: trimEnd };
              }}
              onDelta={(dxPx) => {
                if (stripWidth <= 0 || sourceDuration <= 0) return;
                const deltaSec = (dxPx / stripWidth) * sourceDuration;
                setTrim("end", trimOrigin.current.end + deltaSec);
              }}
            />
          </div>

          {/* Playhead */}
          <div
            className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{ left: `${Math.min(100, Math.max(0, playheadPct))}%` }}
          />
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between px-1 text-[11px] font-semibold tabular-nums text-white/75">
        <span>
          {formatClock(currentTime)} / {formatClock(outputDuration)}
        </span>
        <span>Drag edges to trim · drag strip to scrub</span>
      </div>
    </div>
  );
}

function TrimHandle({
  side,
  onDelta,
  onPointerDownCapture,
}: {
  side: "left" | "right";
  onDelta: (dxPx: number) => void;
  onPointerDownCapture: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Trim start" : "Trim end"}
      className={clsx(
        "absolute inset-y-0 z-30 flex w-7 touch-none items-center justify-center bg-white text-black",
        side === "left" ? "left-0 rounded-l-sm" : "right-0 rounded-r-sm",
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPointerDownCapture();
        const originX = e.clientX;
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const onMove = (ev: PointerEvent) => {
          onDelta(ev.clientX - originX);
        };
        const onUp = () => {
          try {
            target.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    >
      {side === "left" ? (
        <ChevronLeft className="h-4 w-4" strokeWidth={3} />
      ) : (
        <ChevronRight className="h-4 w-4" strokeWidth={3} />
      )}
    </button>
  );
}
