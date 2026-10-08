"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { clsx } from "clsx";

type HelpTipProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Larger touch target for primary controls */
  size?: "md" | "lg";
};

/**
 * Click/tap tip bubble — works better than hover-only for touch screens
 * and for users who are not used to hovering.
 */
export function HelpTip({
  title,
  children,
  className,
  size = "md",
}: HelpTipProps) {
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
    <div ref={rootRef} className={clsx("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "inline-flex items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)] shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--yellow)]",
          size === "lg" ? "h-11 w-11" : "h-9 w-9",
        )}
        title={`Help: ${title}`}
      >
        <HelpCircle className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
        <span className="sr-only">Help: {title}</span>
      </button>

      {open ? (
        <div
          id={tipId}
          role="dialog"
          aria-label={title}
          className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border-2 border-[var(--ink)] bg-white p-4 text-left shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-base font-bold leading-snug text-[var(--ink)] md:text-lg">
              {title}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-[var(--ink)] hover:bg-black/5"
              aria-label="Close tip"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2 text-base leading-relaxed text-[var(--ink)] md:text-[1.05rem]">
            {children}
          </div>
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-[var(--ink)] bg-white" />
        </div>
      ) : null}
    </div>
  );
}

export function TipLine({
  label,
  tipTitle,
  tip,
  className,
}: {
  label: React.ReactNode;
  tipTitle: string;
  tip: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className="min-w-0 flex-1">{label}</div>
      <HelpTip title={tipTitle} size="lg">
        {tip}
      </HelpTip>
    </div>
  );
}
