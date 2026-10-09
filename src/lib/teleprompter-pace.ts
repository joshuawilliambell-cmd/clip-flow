/**
 * Industry-style pacing helpers (PromptSmart / BIGVU patterns):
 * slow slightly near sentence endings so delivery sounds more natural.
 */

/** Multiply base px/tick when the reading window is near end punctuation. */
export function punctuationEaseMultiplier(
  script: string,
  scrollTop: number,
  maxScroll: number,
): number {
  if (!script.trim() || maxScroll <= 0) return 1;
  const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
  const at = Math.floor(progress * script.length);
  const window = script.slice(Math.max(0, at - 24), Math.min(script.length, at + 28));
  // Extra breath after a period / question / exclamation (or blank line).
  if (/[.!?]\s*$/.test(window.slice(0, Math.min(window.length, 30))) || /\n\n/.test(window)) {
    return 0.55;
  }
  if (/[.!?]/.test(window)) return 0.72;
  return 1;
}

/** Rough words-per-minute from scroll distance and elapsed seconds. */
export function estimateWpm(
  script: string,
  scrolledFraction: number,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0.4) return 0;
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const spoken = words * Math.min(1, Math.max(0, scrolledFraction));
  return Math.round((spoken / elapsedSeconds) * 60);
}
