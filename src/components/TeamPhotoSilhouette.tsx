import { clsx } from "clsx";

type TeamPhotoSilhouetteProps = {
  className?: string;
  /** Accessible label when not decorative. */
  title?: string;
};

/**
 * Simple head-and-shoulders silhouette for “this is where the photo goes”
 * previews (corner placement examples).
 */
export function TeamPhotoSilhouette({
  className,
  title = "Team member photo",
}: TeamPhotoSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      className={clsx("h-full w-full", className)}
      role="img"
      aria-label={title}
    >
      <rect width="80" height="100" fill="#94a3b8" />
      {/* Head */}
      <circle cx="40" cy="32" r="16" fill="#1e293b" />
      {/* Shoulders / suit */}
      <path
        d="M8 100 C8 72 22 58 40 58 C58 58 72 72 72 100 Z"
        fill="#1e293b"
      />
      {/* Collar notch */}
      <path
        d="M32 62 L40 74 L48 62 C44 60 36 60 32 62 Z"
        fill="#475569"
      />
      {/* Tie hint */}
      <path d="M38 72 L40 88 L42 72 L40 68 Z" fill="#0f172a" />
    </svg>
  );
}
