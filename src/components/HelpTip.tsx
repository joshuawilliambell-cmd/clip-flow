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
          "inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
          size === "lg" ? "h-9 w-9" : "h-8 w-8",
        )}
        title={`Help: ${title}`}
      >
        <HelpCircle className="h-4 w-4" />
        <span className="sr-only">Help: {title}</span>
      </button>

      {open ? (
        <div
          id={tipId}
          role="dialog"
          aria-label={title}
          className="absolute left-1/2 top-[calc(100%+0.45rem)] z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--ink)] bg-white p-3.5 text-left shadow-[var(--elevate)]"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-[15px] font-semibold leading-snug tracking-tight text-[var(--ink)]">
              {title}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-sm)] p-1 text-[var(--ink)] hover:bg-black/5"
              aria-label="Close tip"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 text-[14px] leading-relaxed text-[var(--ink)]">
            {children}
          </div>
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[var(--ink)] bg-white" />
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
