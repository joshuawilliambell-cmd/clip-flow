/**
 * Conservative speech→script cursor advance for Follow My Voice.
 * Prefers staying put over skipping ahead on filler / mishears.
 */

/** Strip punctuation-ish differences ASR often drops. */
export function normalizeVoiceToken(word: string): string {
  return word.toLowerCase().replace(/'/g, "").trim();
}

function lightStem(word: string): string {
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * True when the heard token is a solid match for the script word.
 * Avoids short-prefix traps ("in" → "introduction", "a" → "and").
 */
export function voiceTokensMatch(scriptWord: string, heardWord: string): boolean {
  const a = normalizeVoiceToken(scriptWord);
  const b = normalizeVoiceToken(heardWord);
  if (!a || !b) return false;
  if (a === b) return true;

  // Very short words must match exactly (after normalize).
  if (a.length <= 3 || b.length <= 3) return false;

  // Common -s / -ed / -ing soft match when stems share 4+ chars.
  const stemA = lightStem(a);
  const stemB = lightStem(b);
  if (stemA.length >= 4 && stemA === stemB) return true;

  // Near-prefix only when both are long and lengths are close
  // (e.g. "working"/"workin").
  const lenDiff = Math.abs(a.length - b.length);
  if (lenDiff > 2) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;

  return false;
}

/**
 * Advance the script cursor using newly heard tokens.
 * - Match only at the current word (no multi-word jump on one token).
 * - Allow skipping at most one script word when the *next* word matches
 *   exactly (covers a single missed/mumbled word).
 * - Ignore unmatched heard tokens (filler like "um", ASR noise).
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

    if (voiceTokensMatch(scriptWords[idx]!, token)) {
      idx += 1;
      continue;
    }

    // One-word skip: only when the following script word is an exact
    // (normalized) match — never on fuzzy/prefix hits.
    const next = scriptWords[idx + 1];
    if (
      next &&
      normalizeVoiceToken(next) === token &&
      token.length >= 2
    ) {
      idx += 2;
    }
    // else: ignore this heard token (filler / wrong guess)
  }

  return idx;
}
