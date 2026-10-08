"use client";

import { useRef } from "react";
import { Move, RotateCcw, ZoomIn } from "lucide-react";
import {
  THUMBNAIL_TEMPLATE,
  type ThumbnailPhotoFit,
} from "@/lib/thumbnail-template";

type PhotoFrameEditorProps = {
  photoUrl: string;
  fit: ThumbnailPhotoFit;
  onChange: (fit: ThumbnailPhotoFit) => void;
  label?: string;
};

/**
 * Simple portrait crop control: drag to move, slider to zoom.
 * Matches the thumbnail card's portrait photo area.
 */
export function PhotoFrameEditor({
  photoUrl,
  fit,
  onChange,
  label = "Move and size photo",
}: PhotoFrameEditorProps) {
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const { minScale, maxScale } = THUMBNAIL_TEMPLATE.photoFit;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    const box = e.currentTarget.getBoundingClientRect();
    // Dragging the photo moves the focus opposite the pointer
    const nextX = Math.min(
      1,
      Math.max(0, fit.focusX - dx / (box.width * fit.scale)),
    );
    const nextY = Math.min(
      1,
      Math.max(0, fit.focusY - dy / (box.height * fit.scale)),
    );
    onChange({ ...fit, focusX: nextX, focusY: nextY });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    last.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-bold text-[var(--ink)]">{label}</p>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]"
          onClick={() =>
            onChange({
              scale: THUMBNAIL_TEMPLATE.photoFit.defaultScale,
              focusX: THUMBNAIL_TEMPLATE.photoFit.defaultFocusX,
              focusY: THUMBNAIL_TEMPLATE.photoFit.defaultFocusY,
            })
          }
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div
        role="img"
        aria-label="Drag to move the photo inside the portrait frame"
        className="relative mx-auto w-full max-w-[11rem] cursor-grab touch-none overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-[#d9dee7] active:cursor-grabbing"
        style={{
          aspectRatio: `${THUMBNAIL_TEMPLATE.card.width} / ${THUMBNAIL_TEMPLATE.card.photoHeight}`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none"
          style={{
            objectFit: "cover",
            objectPosition: `${fit.focusX * 100}% ${fit.focusY * 100}%`,
            transform: `scale(${fit.scale})`,
            transformOrigin: `${fit.focusX * 100}% ${fit.focusY * 100}%`,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-center text-xs font-semibold text-white">
          <span className="inline-flex items-center gap-1">
            <Move className="h-3 w-3" /> Drag to move
          </span>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-sm font-semibold text-[var(--ink)]">
          <ZoomIn className="h-4 w-4" /> Size (zoom)
        </span>
        <input
          type="range"
          min={minScale}
          max={maxScale}
          step={0.05}
          value={fit.scale}
          onChange={(e) => onChange({ ...fit, scale: Number(e.target.value) })}
          className="w-full accent-[var(--primary)]"
          aria-label="Zoom photo in portrait frame"
        />
        <span className="text-sm text-[var(--muted)]">
          Smaller ← → Larger face
        </span>
      </label>
    </div>
  );
}
