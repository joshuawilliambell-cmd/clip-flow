import { clsx } from "clsx";

/** Numbered cue used inside each studio panel (Step 1 → Step 2 → Step 3). */
export function PanelStep({
  n,
  children,
  className,
}: {
  n: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-2 text-[13px] font-medium leading-snug text-[var(--ink)] md:text-[14px]",
        className,
      )}
    >
      <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-[var(--olive)] px-1.5 text-[11px] font-bold text-[var(--yellow)]">
        {n}
      </span>
      <span className="min-w-0 pt-0.5">{children}</span>
    </div>
  );
}

export function PanelSteps({
  steps,
  className,
}: {
  steps: React.ReactNode[];
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {steps.map((step, i) => (
        <PanelStep key={i} n={i + 1}>
          {step}
        </PanelStep>
      ))}
    </div>
  );
}
