import { clsx } from "clsx";

type PanelTone = "light" | "dark";

/** Numbered cue used inside each studio panel (Step 1 → Step 2 → Step 3). */
export function PanelStep({
  n,
  children,
  className,
  tone = "light",
}: {
  n: number;
  children: React.ReactNode;
  className?: string;
  /** Use dark on olive/black panels so body copy stays readable. */
  tone?: PanelTone;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-2 text-[13px] font-medium leading-snug md:text-[14px]",
        tone === "dark" ? "text-white" : "text-[var(--ink)]",
        className,
      )}
    >
      <span
        className={clsx(
          "mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-bold",
          tone === "dark"
            ? "bg-[var(--yellow)] text-[var(--ink)]"
            : "bg-[var(--olive)] text-[var(--yellow)]",
        )}
      >
        {n}
      </span>
      <span className="min-w-0 pt-0.5">{children}</span>
    </div>
  );
}

export function PanelSteps({
  steps,
  className,
  tone = "light",
}: {
  steps: React.ReactNode[];
  className?: string;
  tone?: PanelTone;
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {steps.map((step, i) => (
        <PanelStep key={i} n={i + 1} tone={tone}>
          {step}
        </PanelStep>
      ))}
    </div>
  );
}
