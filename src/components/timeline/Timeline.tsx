"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import {
  formatClock,
  formatTime,
  roundToSecond,
  sortPhotosByStart,
} from "@/lib/timeline";
import { filledTeamPhotos } from "@/lib/team-slots";
import { clsx } from "clsx";
import { HelpTip } from "@/components/HelpTip";

function useTimelineMetrics(duration: number, width: number) {
  const pxPerSecond = Math.max(
    8,
    width > 0 && duration > 0 ? (width - 24) / Math.max(duration, 1) : 8,
  );
  return { pxPerSecond };
}

export function Timeline() {
  const {
    video,
    trimStart,
    trimEnd,
    photos,
    currentTime,
    isPlaying,
    outputDuration,
    setCurrentTime,
    setIsPlaying,
    setTrim,
    movePhoto,
    resizePhoto,
    reorderPhoto,
  } = useStudio();

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(800);
  const sorted = useMemo(
    () => sortPhotosByStart(filledTeamPhotos(photos)),
    [photos],
  );
  const trimOrigin = useRef({ start: 0, end: 0 });
  const scrubbingRef = useRef(false);
  const [dragPhotoId, setDragPhotoId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    scrollRef.current = node;
    const update = () => setTrackWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
  }, []);

  const sourceDuration = video?.durationSeconds ?? 0;
  // Scale the full source file so trim handles move visibly along the bar.
  const { pxPerSecond } = useTimelineMetrics(
    Math.max(sourceDuration, outputDuration, 1),
    trackWidth,
  );

  const sourceSecondsFromClientX = useCallback(
    (clientX: number) => {
      const content = contentRef.current;
      const scroll = scrollRef.current;
      if (!content || !scroll) return 0;
      const rect = content.getBoundingClientRect();
      const x = clientX - rect.left + scroll.scrollLeft;
      return Math.max(0, Math.min(sourceDuration, x / pxPerSecond));
    },
    [sourceDuration, pxPerSecond],
  );

  const scrubTo = useCallback(
    (clientX: number) => {
      setIsPlaying(false);
      const sourceSec = sourceSecondsFromClientX(clientX);
      // Playhead lives in output time (0 = trim start).
      const outputSec = Math.max(
        0,
        Math.min(outputDuration, sourceSec - trimStart),
      );
      setCurrentTime(outputSec);
    },
    [
      sourceSecondsFromClientX,
      outputDuration,
      trimStart,
      setCurrentTime,
      setIsPlaying,
    ],
  );

  const beginScrub = (e: React.PointerEvent) => {
    e.preventDefault();
    scrubbingRef.current = true;
    scrubTo(e.clientX);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      if (!scrubbingRef.current) return;
      scrubTo(ev.clientX);
    };
    const onUp = () => {
      scrubbingRef.current = false;
      target.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const togglePlay = () => {
    if (!video) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (currentTime >= outputDuration - 0.05) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  };

  if (!video) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--ink)] bg-[var(--panel-soft)] px-4 py-8 text-center text-lg text-[var(--muted)]">
        Add a video in Step 1 to use the timeline.
      </div>
    );
  }

  const trackInnerWidth = Math.max(
    trackWidth - 8,
    Math.max(sourceDuration, 1) * pxPerSecond,
  );
  const keptLeft = trimStart * pxPerSecond;
  const keptWidth = Math.max(40, outputDuration * pxPerSecond);
  const playheadLeft = (trimStart + currentTime) * pxPerSecond;
  const cutStartSec = roundToSecond(trimStart);
  const cutEndSec = roundToSecond(Math.max(0, sourceDuration - trimEnd));

  const nudgeTrim = (edge: "start" | "end", delta: number) => {
    if (edge === "start") setTrim("start", trimStart + delta);
    else setTrim("end", trimEnd + delta);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
              Timeline
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
              Trim with red handles · hover a team photo for a hand cursor, then
              drag · edges show ↔ to change length · drag playhead to scrub
            </p>
          </div>
          <HelpTip title="How to use the timeline" size="lg">
            <p>
              <strong>Track 1</strong> shows your full recording. The dark
              middle is what you keep — drag the <strong>red handles</strong>{" "}
              (or use Cut start / Cut end) to remove time from the beginning or
              end. Gray areas are discarded.
            </p>
            <p>
              <strong>Track 2 (colored bars)</strong> are team photos. Defaults
              are about 23s, 35s, 47s, and 56s (10s each). Drag one bar{" "}
              <strong>onto another</strong> to reorder, or drag ends to resize.
            </p>
            <p>
              Drag the <strong>red play line</strong> (ball on top) to jump to
              any moment. Use <strong>Play</strong> / <strong>Pause</strong> on
              the timeline to preview from there.
            </p>
          </HelpTip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="btn-primary min-w-[9.5rem]"
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
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
          <div className="rounded-xl border-2 border-[var(--ink)] bg-white px-3 py-2 text-base font-bold tabular-nums text-[var(--ink)]">
            {formatClock(currentTime)} / {formatClock(outputDuration)}
          </div>
          <div className="rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-3 py-2 text-base font-bold text-[var(--ink)]">
            Finished length: {formatClock(outputDuration)}
          </div>
        </div>
      </div>

      <div
        ref={measure}
        className="relative overflow-x-auto section-card bg-[var(--panel-soft)] p-3"
      >
        <div
          ref={contentRef}
          className="relative"
          style={{ width: trackInnerWidth }}
        >
          <div
            className="relative mb-2 h-7 cursor-ew-resize touch-none"
            onPointerDown={beginScrub}
            role="slider"
            aria-label="Scrub timeline"
            aria-valuemin={0}
            aria-valuemax={outputDuration}
            aria-valuenow={currentTime}
          >
            {Array.from({
              length: Math.floor(sourceDuration) + 1,
            }).map((_, s) => (
              <div
                key={s}
                className="pointer-events-none absolute top-0 text-[10px] text-[var(--muted)]"
                style={{ left: s * pxPerSecond }}
              >
                <div className="h-2 w-px bg-[var(--border-strong)]" />
                {s % 5 === 0 ? formatClock(s) : ""}
              </div>
            ))}
          </div>

          <div className="mb-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--ink)]">
                Track 1 · Your video (trim)
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary !min-h-0 !px-2.5 !py-1.5 text-[13px]"
                  onClick={() => nudgeTrim("start", 1)}
                  disabled={outputDuration <= 3}
                  title="Remove 1 second from the beginning"
                >
                  Cut start +1s
                </button>
                <button
                  type="button"
                  className="btn-secondary !min-h-0 !px-2.5 !py-1.5 text-[13px]"
                  onClick={() => nudgeTrim("start", -1)}
                  disabled={trimStart <= 0}
                  title="Put 1 second back at the beginning"
                >
                  Undo start −1s
                </button>
                <button
                  type="button"
                  className="btn-secondary !min-h-0 !px-2.5 !py-1.5 text-[13px]"
                  onClick={() => nudgeTrim("end", -1)}
                  disabled={outputDuration <= 3}
                  title="Remove 1 second from the end"
                >
                  Cut end +1s
                </button>
                <button
                  type="button"
                  className="btn-secondary !min-h-0 !px-2.5 !py-1.5 text-[13px]"
                  onClick={() => nudgeTrim("end", 1)}
                  disabled={trimEnd >= sourceDuration}
                  title="Put 1 second back at the end"
                >
                  Undo end −1s
                </button>
              </div>
            </div>
            <div
              className="relative h-16 touch-none rounded-lg bg-[#d9d4c4]"
              style={{ width: trackInnerWidth }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).dataset.handle) return;
                beginScrub(e);
              }}
            >
              {/* Discarded regions */}
              {cutStartSec > 0 ? (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center bg-black/25"
                  style={{ width: keptLeft }}
                >
                  <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                    Cut {formatClock(cutStartSec)}
                  </span>
                </div>
              ) : null}
              {cutEndSec > 0 ? (
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center bg-black/25"
                  style={{ width: cutEndSec * pxPerSecond }}
                >
                  <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                    Cut {formatClock(cutEndSec)}
                  </span>
                </div>
              ) : null}

              {/* Kept selection — moves when you drag the red handles */}
              <div
                className="absolute top-1 bottom-1 rounded-md bg-[var(--track-video)] text-white shadow-md ring-2 ring-[var(--primary)]"
                style={{ left: keptLeft, width: keptWidth }}
              >
                <div className="flex h-full items-center justify-between gap-2 px-4 text-xs font-medium">
                  <span className="min-w-0 truncate">
                    Keep {formatTime(trimStart)}–{formatTime(trimEnd)}
                  </span>
                  <span className="shrink-0 font-bold text-[var(--yellow)]">
                    {formatClock(outputDuration)}
                  </span>
                </div>
                <EdgeDrag
                  side="left"
                  onPointerDownCapture={() => {
                    trimOrigin.current = { start: trimStart, end: trimEnd };
                  }}
                  onDeltaSeconds={(delta) => {
                    setTrim("start", trimOrigin.current.start + delta);
                  }}
                  pxPerSecond={pxPerSecond}
                />
                <EdgeDrag
                  side="right"
                  onPointerDownCapture={() => {
                    trimOrigin.current = { start: trimStart, end: trimEnd };
                  }}
                  onDeltaSeconds={(delta) => {
                    setTrim("end", trimOrigin.current.end + delta);
                  }}
                  pxPerSecond={pxPerSecond}
                />
              </div>
            </div>
            <p className="mt-2 text-base text-[var(--muted)]">
              Original {formatClock(sourceDuration)}
              {cutStartSec > 0 || cutEndSec > 0
                ? ` · keeping ${formatClock(outputDuration)} (cut ${formatClock(cutStartSec)} from start, ${formatClock(cutEndSec)} from end)`
                : " · drag the red handles inward to shorten"}
              . Photos below line up with the kept section.
            </p>
          </div>

          <div>
            <div className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[var(--ink)]">
              Track 2 · Team photos
            </div>
            <div
              className="relative h-16 touch-none rounded-lg bg-black/5"
              style={{ width: trackInnerWidth }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("[data-photo-block]")) return;
                beginScrub(e);
              }}
            >
              {sorted.length === 0 ? (
                <div className="flex h-full items-center px-3 text-base text-[var(--muted)]">
                  Add team photos above. They will show up here as colored bars.
                </div>
              ) : (
                sorted.map((photo, index) => {
                  const color =
                    VIDEO_TEMPLATE.branding.trackPhotoPalette[
                      index % VIDEO_TEMPLATE.branding.trackPhotoPalette.length
                    ];
                  return (
                    <PhotoBlock
                      key={photo.id}
                      id={photo.id}
                      name={photo.name || "Teammate"}
                      thumb={photo.url ?? ""}
                      color={color}
                      left={(trimStart + photo.startSeconds) * pxPerSecond}
                      width={Math.max(36, photo.durationSeconds * pxPerSecond)}
                      start={photo.startSeconds}
                      duration={photo.durationSeconds}
                      pxPerSecond={pxPerSecond}
                      dragging={dragPhotoId === photo.id}
                      dropTarget={dropTargetId === photo.id}
                      onDragState={(dragging, targetId) => {
                        setDragPhotoId(dragging ? photo.id : null);
                        setDropTargetId(targetId);
                      }}
                      onMove={(start) => movePhoto(photo.id, start)}
                      onResizeStart={(v) => resizePhoto(photo.id, "start", v)}
                      onResizeEnd={(v) => resizePhoto(photo.id, "end", v)}
                      onReorder={(toId) => reorderPhoto(photo.id, toId)}
                      others={sorted
                        .filter((p) => p.id !== photo.id)
                        .map((p) => ({
                          id: p.id,
                          left: (trimStart + p.startSeconds) * pxPerSecond,
                          right:
                            (trimStart + p.startSeconds + p.durationSeconds) *
                            pxPerSecond,
                          mid:
                            (trimStart +
                              p.startSeconds +
                              p.durationSeconds / 2) *
                            pxPerSecond,
                        }))}
                    />
                  );
                })
              )}
            </div>
            {sorted.length > 1 ? (
              <p className="mt-2 text-base text-[var(--muted)]">
                Drag one photo bar onto another to change the order they appear
                in the video.
              </p>
            ) : null}
          </div>

          <div
            className="absolute bottom-0 top-0 z-20 w-0 touch-none"
            style={{ left: playheadLeft }}
          >
            <button
              type="button"
              aria-label="Drag playhead to scrub"
              title="Drag to scrub"
              className="absolute -top-0.5 left-1/2 z-30 flex h-7 w-7 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[var(--primary)] shadow active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                beginScrub(e);
              }}
            >
              <span className="sr-only">Playhead</span>
            </button>
            <div className="pointer-events-none absolute bottom-0 top-6 left-1/2 w-0.5 -translate-x-1/2 bg-[var(--primary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EdgeDrag({
  side,
  onDeltaSeconds,
  onPointerDownCapture,
  pxPerSecond,
}: {
  side: "left" | "right";
  onDeltaSeconds: (delta: number) => void;
  onPointerDownCapture: () => void;
  pxPerSecond: number;
}) {
  return (
    <button
      type="button"
      data-handle={side}
      aria-label={side === "left" ? "Trim start" : "Trim end"}
      title={
        side === "left"
          ? "Drag to cut or restore time at the start"
          : "Drag to cut or restore time at the end"
      }
      className={clsx(
        "absolute top-0 z-40 h-full w-7 cursor-ew-resize touch-none bg-[var(--primary)] shadow-md",
        side === "left"
          ? "left-0 rounded-l-md"
          : "right-0 rounded-r-md",
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPointerDownCapture();
        const originX = e.clientX;
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const onMove = (ev: PointerEvent) => {
          onDeltaSeconds((ev.clientX - originX) / pxPerSecond);
        };
        const onUp = () => {
          target.releasePointerCapture(e.pointerId);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    >
      <span className="pointer-events-none absolute inset-y-2 left-1/2 w-0.5 -translate-x-1/2 rounded bg-white/80" />
    </button>
  );
}

function hitPhotoAt(
  pointerXInTrack: number,
  others: Array<{ id: string; left: number; right: number; mid: number }>,
): string | null {
  // Prefer the bar whose center is closest while the pointer is over it.
  let best: { id: string; dist: number } | null = null;
  for (const o of others) {
    if (pointerXInTrack < o.left - 8 || pointerXInTrack > o.right + 8) continue;
    const dist = Math.abs(pointerXInTrack - o.mid);
    if (!best || dist < best.dist) best = { id: o.id, dist };
  }
  return best?.id ?? null;
}

function PhotoBlock({
  id,
  name,
  thumb,
  color,
  left,
  width,
  start,
  duration,
  pxPerSecond,
  dragging,
  dropTarget,
  onDragState,
  onMove,
  onResizeStart,
  onResizeEnd,
  onReorder,
  others,
}: {
  id: string;
  name: string;
  thumb: string;
  color: string;
  left: number;
  width: number;
  start: number;
  duration: number;
  pxPerSecond: number;
  dragging: boolean;
  dropTarget: boolean;
  onDragState: (dragging: boolean, dropTargetId: string | null) => void;
  onMove: (start: number) => void;
  onResizeStart: (start: number) => void;
  onResizeEnd: (end: number) => void;
  onReorder: (toId: string) => void;
  others: Array<{ id: string; left: number; right: number; mid: number }>;
}) {
  const origin = useRef({ x: 0, start: 0, left: 0 });
  const [dragDx, setDragDx] = useState(0);
  const trackLeftRef = useRef(0);

  return (
    <div
      data-photo-block
      data-photo-id={id}
      className={clsx(
        // Open hand on hover; closed hand while dragging. Edge handles use ↔.
        "absolute top-1 bottom-1 flex touch-none overflow-hidden rounded-md text-white shadow transition-[box-shadow,outline]",
        dragging ? "z-30 opacity-90 ring-2 ring-[var(--yellow)]" : "z-10",
        dropTarget && "z-20 ring-2 ring-white outline outline-2 outline-offset-2 outline-[var(--yellow)]",
      )}
      style={{
        left,
        width,
        backgroundColor: color,
        transform: dragging ? `translateX(${dragDx}px)` : undefined,
        // Inline cursor so the hand wins over parent timeline cursors.
        cursor: dragging ? "grabbing" : "grab",
      }}
      title={`${name}: ${formatTime(start)}–${formatTime(start + duration)}. Hand cursor: drag to reposition or onto another photo to reorder. Edge arrows: change length.`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).dataset.handle) return;
        e.preventDefault();
        e.stopPropagation();
        const block = e.currentTarget;
        const track = block.parentElement;
        trackLeftRef.current = track?.getBoundingClientRect().left ?? 0;
        origin.current = { x: e.clientX, start, left };
        setDragDx(0);
        onDragState(true, null);
        // Keep the closed-hand cursor while pointer is captured outside the bar.
        const prevCursor = document.body.style.cursor;
        document.body.style.cursor = "grabbing";
        block.setPointerCapture(e.pointerId);

        const onMovePtr = (ev: PointerEvent) => {
          document.body.style.cursor = "grabbing";
          const dx = ev.clientX - origin.current.x;
          setDragDx(dx);
          const scrollEl = track?.closest(".overflow-x-auto");
          const scrollLeft =
            scrollEl instanceof HTMLElement ? scrollEl.scrollLeft : 0;
          const x = ev.clientX - trackLeftRef.current + scrollLeft;
          onDragState(true, hitPhotoAt(x, others));
        };

        const onUp = (ev: PointerEvent) => {
          document.body.style.cursor = prevCursor;
          const scrollEl = track?.closest(".overflow-x-auto");
          const scrollLeft = scrollEl instanceof HTMLElement ? scrollEl.scrollLeft : 0;
          const x = ev.clientX - trackLeftRef.current + scrollLeft;
          const hitId = hitPhotoAt(x, others);
          if (hitId) {
            onReorder(hitId);
          } else {
            const dx = ev.clientX - origin.current.x;
            // Small nudge without a drop target = slide within neighbor gap.
            if (Math.abs(dx) > 4) {
              onMove(origin.current.start + dx / pxPerSecond);
            }
          }
          setDragDx(0);
          onDragState(false, null);
          block.releasePointerCapture(e.pointerId);
          window.removeEventListener("pointermove", onMovePtr);
          window.removeEventListener("pointerup", onUp);
        };

        window.addEventListener("pointermove", onMovePtr);
        window.addEventListener("pointerup", onUp);
      }}
    >
      <button
        type="button"
        data-handle="start"
        aria-label="Adjust photo start"
        className="h-full w-3 shrink-0 cursor-ew-resize bg-black/25 hover:bg-black/40"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startOrigin = start;
          const originX = e.clientX;
          const target = e.currentTarget;
          target.setPointerCapture(e.pointerId);
          const onMoveAbs = (ev: PointerEvent) => {
            onResizeStart(startOrigin + (ev.clientX - originX) / pxPerSecond);
          };
          const onUp = () => {
            target.releasePointerCapture(e.pointerId);
            window.removeEventListener("pointermove", onMoveAbs);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMoveAbs);
          window.addEventListener("pointerup", onUp);
        }}
      />
      <div
        className="flex min-w-0 flex-1 items-center gap-2 px-1.5"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          draggable={false}
          className="pointer-events-none h-10 w-10 shrink-0 rounded object-cover object-[center_28%] ring-1 ring-white/40"
        />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-xs font-semibold">{name}</div>
          <div className="truncate text-[10px] opacity-90">
            {formatTime(start)} · {duration.toFixed(0)}s
          </div>
        </div>
      </div>
      <button
        type="button"
        data-handle="end"
        aria-label="Adjust photo end"
        className="h-full w-3 shrink-0 cursor-ew-resize bg-black/25 hover:bg-black/40"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const endOrigin = start + duration;
          const originX = e.clientX;
          const target = e.currentTarget;
          target.setPointerCapture(e.pointerId);
          const onMoveAbs = (ev: PointerEvent) => {
            onResizeEnd(endOrigin + (ev.clientX - originX) / pxPerSecond);
          };
          const onUp = () => {
            target.releasePointerCapture(e.pointerId);
            window.removeEventListener("pointermove", onMoveAbs);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMoveAbs);
          window.addEventListener("pointerup", onUp);
        }}
      />
    </div>
  );
}
