"use client";

import { useEffect, useId, useRef, useState } from "react";
import { clsx } from "clsx";

type ControlTipProps = {
  /** Short plain-language explanation shown on hover / focus / tap. */
  tip: string;
  children: React.ReactNode;
  className?: string;
  /** Prefer tip above (default) or below the control. */
  side?: "top" | "bottom";
};

/**
 * Hover / focus tip for teleprompter controls.
 * Also opens on tap so touch screens get the same help.
 */
export function ControlTip({
  tip,
  children,
  className,
  side = "top",
}: ControlTipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={clsx("group/tip relative inline-flex max-w-full", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        const next = e.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        setOpen(false);
      }}
      onClick={(e) => {
        // Don't steal clicks from nested buttons/inputs — those must keep
        // working (e.g. Bigger/Smaller Text). Tip still opens on hover/focus.
        const target = e.target;
        if (
          target instanceof Element &&
          target.closest("button, a, input, textarea, select, label")
        ) {
          return;
        }
        if (e.detail === 0) return;
        setOpen(true);
      }}
    >
      <div aria-describedby={open ? tipId : undefined} className="inline-flex">
        {children}
      </div>
      <span
        id={tipId}
        role="tooltip"
        className={clsx(
          "pointer-events-none absolute left-1/2 z-50 w-[min(16.5rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-[var(--yellow)] bg-[var(--ink)] px-2.5 py-2 text-left text-[11px] font-medium leading-snug text-white shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-opacity",
          side === "top"
            ? "bottom-[calc(100%+0.4rem)]"
            : "top-[calc(100%+0.4rem)]",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {tip}
      </span>
    </div>
  );
}
