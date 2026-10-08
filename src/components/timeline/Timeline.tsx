"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { formatClock, formatTime, sortPhotosByStart } from "@/lib/timeline";
import { clsx } from "clsx";
import { HelpTip } from "@/components/HelpTip";
import { VIDEO_TEMPLATE } from "@/lib/template";

function useTimelineMetrics(duration: number, width: number) {
  const pxPerSecond = Math.max(
    12,
    width > 0 && duration > 0 ? (width - 24) / Math.max(duration, 1) : 12,
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
    outputDuration,
    setCurrentTime,
    setIsPlaying,
    setTrim,
    movePhoto,
    resizePhoto,
    reorderPhoto,
  } = useStudio();

  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(800);
  const sorted = useMemo(() => sortPhotosByStart(photos), [photos]);
  const trimOrigin = useRef({ start: 0, end: 0 });

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    trackRef.current = node;
    const update = () => setTrackWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
  }, []);

  const { pxPerSecond } = useTimelineMetrics(outputDuration || 60, trackWidth);

  const secondsFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    return Math.max(0, Math.min(outputDuration, x / pxPerSecond));
  };

  const onScrub = (clientX: number) => {
    setIsPlaying(false);
    setCurrentTime(secondsFromClientX(clientX));
  };

  if (!video) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--ink)] bg-[var(--panel-soft)] px-4 py-8 text-center text-lg text-[var(--muted)]">
        Add a video in Step 1 to use the timeline.
      </div>
    );
  }

  const sourceDuration = video.durationSeconds;
  const videoBarWidth = Math.max(48, outputDuration * pxPerSecond);
  const trackInnerWidth = Math.max(trackWidth - 8, outputDuration * pxPerSecond);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="text-2xl font-bold text-[var(--ink)]">Timeline</h3>
            <p className="mt-1 text-lg text-[var(--muted)]">
              Drag the red ends to shorten your video. Drag photo bars to change
              when each teammate appears.
            </p>
          </div>
          <HelpTip title="How to use the timeline" size="lg">
            <p>
              <strong>Track 1 (dark bar)</strong> is your main video. Drag the
              red left or right ends to cut time off the start or end.
            </p>
            <p>
              <strong>Track 2 (colored bars)</strong> are team photos. Drag a
              whole bar to move it. Drag a bar’s ends to make it shorter or
              longer.
            </p>
            <p>
              Tap empty space on a track to jump the red play line to that time.
            </p>
            <p>Photos cannot overlap in this version.</p>
          </HelpTip>
        </div>
        <div className="rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-3 py-2 text-base font-bold text-[var(--ink)]">
          Finished length: {formatClock(outputDuration)}
        </div>
      </div>

      <div
        ref={measure}
        className="relative overflow-x-auto rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] p-3"
      >
        <div className="relative mb-2 h-6" style={{ width: trackInnerWidth }}>
          {Array.from({ length: Math.floor(outputDuration) + 1 }).map((_, s) => (
            <div
              key={s}
              className="absolute top-0 text-[10px] text-[var(--muted)]"
              style={{ left: s * pxPerSecond }}
            >
              <div className="h-2 w-px bg-[var(--border-strong)]" />
              {s % 5 === 0 ? formatClock(s) : ""}
            </div>
          ))}
        </div>

        <div className="mb-3">
          <div className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[var(--ink)]">
            Track 1 · Your video
          </div>
          <div
            className="relative h-14 rounded-lg bg-black/5"
            style={{ width: trackInnerWidth }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).dataset.handle) return;
              onScrub(e.clientX);
            }}
          >
            <div
              className="absolute top-1 bottom-1 rounded-md bg-[var(--track-video)] text-white shadow-sm"
              style={{ left: 0, width: videoBarWidth }}
            >
              <div className="flex h-full items-center justify-between px-3 text-xs font-medium">
                <span className="truncate pr-2">
                  {video.fileName} · {formatTime(trimStart)}–
                  {formatTime(trimEnd)}
                </span>
                <span className="shrink-0 opacity-80">
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
            Original length {formatClock(sourceDuration)}. Drag the red ends to
            keep only the part you want.
          </p>
        </div>

        <div>
          <div className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[var(--ink)]">
            Track 2 · Team photos
          </div>
          <div
            className="relative h-16 rounded-lg bg-black/5"
            style={{ width: trackInnerWidth }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("[data-photo-block]")) return;
              onScrub(e.clientX);
            }}
          >
            {sorted.length === 0 ? (
              <div className="flex h-full items-center px-3 text-base text-[var(--muted)]">
                Add team photos in Step 2. They will show up here as colored bars.
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
                    thumb={photo.url}
                    color={color}
                    left={photo.startSeconds * pxPerSecond}
                    width={Math.max(36, photo.durationSeconds * pxPerSecond)}
                    start={photo.startSeconds}
                    duration={photo.durationSeconds}
                    pxPerSecond={pxPerSecond}
                    onMove={(start) => movePhoto(photo.id, start)}
                    onResizeStart={(v) => resizePhoto(photo.id, "start", v)}
                    onResizeEnd={(v) => resizePhoto(photo.id, "end", v)}
                    onReorder={(toId) => reorderPhoto(photo.id, toId)}
                    others={sorted
                      .filter((p) => p.id !== photo.id)
                      .map((p) => ({
                        id: p.id,
                        mid:
                          (p.startSeconds + p.durationSeconds / 2) *
                          pxPerSecond,
                      }))}
                  />
                );
              })
            )}
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-3 top-10 w-0.5 bg-[var(--primary)]"
          style={{ left: 12 + currentTime * pxPerSecond }}
        >
          <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--primary)] shadow" />
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
      className={clsx(
        "absolute top-0 z-10 h-full w-4 cursor-ew-resize touch-none bg-[var(--primary)]",
        side === "left" ? "left-0 rounded-l-md" : "right-0 rounded-r-md",
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
    />
  );
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
  onMove: (start: number) => void;
  onResizeStart: (start: number) => void;
  onResizeEnd: (end: number) => void;
  onReorder: (toId: string) => void;
  others: Array<{ id: string; mid: number }>;
}) {
  const origin = useRef({ x: 0, start: 0 });

  return (
    <div
      data-photo-block
      data-photo-id={id}
      className="absolute top-1 bottom-1 flex touch-none overflow-hidden rounded-md text-white shadow"
      style={{ left, width, backgroundColor: color }}
      title={`${name}: ${formatTime(start)}–${formatTime(start + duration)}`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).dataset.handle) return;
        e.preventDefault();
        e.stopPropagation();
        origin.current = { x: e.clientX, start };
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const onMovePtr = (ev: PointerEvent) => {
          const dx = ev.clientX - origin.current.x;
          onMove(origin.current.start + dx / pxPerSecond);
        };
        const onUp = (ev: PointerEvent) => {
          const mid = left + width / 2 + (ev.clientX - origin.current.x);
          const hit = others.find((o) => Math.abs(o.mid - mid) < 28);
          if (hit) onReorder(hit.id);
          target.releasePointerCapture(e.pointerId);
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
        className="h-full w-2.5 shrink-0 cursor-ew-resize bg-black/25"
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
      <div className="flex min-w-0 flex-1 items-center gap-2 px-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          className="h-10 w-10 shrink-0 rounded object-cover object-[center_28%] ring-1 ring-white/40"
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
        className="h-full w-2.5 shrink-0 cursor-ew-resize bg-black/25"
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
