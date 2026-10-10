/**
 * Speech→script cursor advance for Follow My Voice.
 * Balanced for pace: small exact lookahead + glue-word skip, without
 * the old 6-word fuzzy jumps that skipped ahead.
 */

/** Strip punctuation-ish differences ASR often drops. */
export function normalizeVoiceToken(word: string): string {
  return word.toLowerCase().replace(/'/g, "").trim();
}

/** Short function words that ASR often drops or mumbles. */
const GLUE_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "for",
  "with",
  "in",
  "on",
  "at",
  "is",
  "are",
  "be",
  "as",
  "by",
  "from",
  "that",
  "this",
  "it",
  "its",
  "you",
  "your",
  "we",
  "our",
  "i",
  "im",
  "me",
  "my",
  "he",
  "she",
  "they",
  "them",
  "their",
  "can",
  "will",
  "just",
  "like",
  "so",
  "also",
  "here",
  "all",
  "about",
  "what",
  "do",
]);

export function isGlueWord(word: string): boolean {
  return GLUE_WORDS.has(normalizeVoiceToken(word));
}

function lightStem(word: string): string {
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * Solid match: exact for short words; stem/near-prefix for longer ones.
 * Never lets "in" match "introduction".
 */
export function voiceTokensMatch(scriptWord: string, heardWord: string): boolean {
  const a = normalizeVoiceToken(scriptWord);
  const b = normalizeVoiceToken(heardWord);
  if (!a || !b) return false;
  if (a === b) return true;

  // Short words: exact only (after normalize).
  if (a.length <= 3 || b.length <= 3) return false;

  const stemA = lightStem(a);
  const stemB = lightStem(b);
  if (stemA.length >= 4 && stemA === stemB) return true;

  const lenDiff = Math.abs(a.length - b.length);
  if (lenDiff > 2) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;

  return false;
}

/**
 * Search window size from the current index (inclusive span).
 * 4 ≈ current + up to 3 words ahead — enough to catch up on dropped
 * glue words without the old 6-word fuzzy skips.
 */
export const VOICE_FOLLOW_LOOKAHEAD = 4;

/**
 * Advance the script cursor using heard tokens.
 * - Prefer matching at the current word.
 * - Allow landing up to LOOKAHEAD words ahead on a solid match (catch-up).
 * - If stuck on glue words, allow one extra step of look-ahead.
 */
export function advanceVoiceFollowIndex(
  scriptWords: readonly string[],
  currentIndex: number,
  heardTokens: readonly string[],
): number {
  let idx = Math.max(0, Math.min(currentIndex, scriptWords.length));
  if (idx >= scriptWords.length || heardTokens.length === 0) return idx;

  for (const raw of heardTokens) {
    if (idx >= scriptWords.length) break;
    const token = normalizeVoiceToken(raw);
    if (!token) continue;

    // Ignore filler the ASR sometimes emits.
    if (token === "um" || token === "uh" || token === "erm") continue;

    let windowEnd = Math.min(scriptWords.length, idx + VOICE_FOLLOW_LOOKAHEAD);
    // Extra catch-up when parked on glue ("the", "and", "to"…).
    if (isGlueWord(scriptWords[idx]!)) {
      windowEnd = Math.min(scriptWords.length, idx + VOICE_FOLLOW_LOOKAHEAD + 1);
    }

    let hit = -1;
    for (let i = idx; i < windowEnd; i++) {
      if (voiceTokensMatch(scriptWords[i]!, token)) {
        hit = i;
        break;
      }
    }
    if (hit >= 0) {
      idx = hit + 1;
    }
  }

  return idx;
}
