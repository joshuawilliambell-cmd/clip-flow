/**
 * Shared layout for Script Teleprompter Practice and the webcam overlay
 * so wrap width (and thus scroll pace) stays the same in both places.
 */

/** ~5 words wide — eyes move top-to-bottom, not left-to-right. */
export const TELEPROMPTER_COLUMN_CH = 28;

/** Tailwind max-width class matching TELEPROMPTER_COLUMN_CH. */
export const TELEPROMPTER_COLUMN_CLASS = "max-w-[28ch]";

/**
 * Same type size in practice and on the webcam so pixels-per-tick
 * feels the same when the user records.
 */
export const TELEPROMPTER_TEXT_CLASS_LARGE =
  "text-[1.35rem] md:text-[1.5rem] font-semibold leading-snug tracking-wide";

export const TELEPROMPTER_TEXT_CLASS_COMPACT =
  "text-[1.15rem] md:text-[1.25rem] font-semibold leading-snug tracking-wide";

/**
 * Insert a blank line after each sentence so readers get a natural breath
 * pause. Display-only — does not change the saved script text.
 */
export function formatScriptForNaturalReading(script: string): string {
  const text = script.replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  return text
    .replace(/([.!?])([“"')\]]*)(\s+)/g, "$1$2\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Lowercase word tokens for speech matching. */
export function scriptWords(script: string): string[] {
  return script
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
