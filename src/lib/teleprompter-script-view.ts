/**
 * Tokenize script for word highlighting (Teleprompter Premium+ style)
 * and cue jumps (TeleprompterPAD markers).
 */

export type ScriptToken =
  | { type: "word"; text: string; wordIndex: number }
  | { type: "gap"; text: string };

export type ScriptCue = {
  label: string;
  /** Word index to jump to in the practice scroller. */
  wordIndex: number;
};

/** Split script into words + gaps so we can highlight the current word. */
export function tokenizeScript(script: string): ScriptToken[] {
  const tokens: ScriptToken[] = [];
  let wordIndex = 0;
  const re = /([A-Za-z0-9']+)|([^A-Za-z0-9']+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(script)) !== null) {
    if (match[1]) {
      tokens.push({ type: "word", text: match[1], wordIndex: wordIndex++ });
    } else if (match[2]) {
      tokens.push({ type: "gap", text: match[2] });
    }
  }
  return tokens;
}

/**
 * Cue points for teammate intros and major sections — inspired by
 * TeleprompterPAD script markers.
 */
export function findScriptCues(
  script: string,
  teammateNames: string[] = [],
): ScriptCue[] {
  const lower = script.toLowerCase();
  const words = lower.replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
  const cues: ScriptCue[] = [{ label: "Start", wordIndex: 0 }];

  const pushUnique = (label: string, wordIndex: number) => {
    if (cues.some((c) => Math.abs(c.wordIndex - wordIndex) < 3)) return;
    cues.push({ label, wordIndex });
  };

  // "This is <Name>" teammate cues
  for (const name of teammateNames) {
    const needle = name.trim().toLowerCase();
    if (needle.length < 2) continue;
    const idx = words.findIndex((w, i) => {
      if (w !== needle.split(/\s+/)[0]) return false;
      // Prefer when preceded by "this" "is"
      return i >= 2 && words[i - 2] === "this" && words[i - 1] === "is";
    });
    if (idx >= 0) {
      pushUnique(name.trim().split(/\s+/)[0] || "Teammate", Math.max(0, idx - 2));
    }
  }

  // Welcome / Fleet Hub section cues when present
  const sectionNeedles: Array<{ label: string; match: string }> = [
    { label: "Welcome", match: "welcome" },
    { label: "Fleet Hub", match: "fleet" },
  ];
  for (const section of sectionNeedles) {
    const idx = words.indexOf(section.match);
    if (idx >= 0) pushUnique(section.label, idx);
  }

  return cues.sort((a, b) => a.wordIndex - b.wordIndex);
}

/** Map word index → approximate scrollTop fraction. */
export function wordIndexToScrollFraction(
  wordIndex: number,
  totalWords: number,
): number {
  if (totalWords <= 0) return 0;
  return Math.min(1, Math.max(0, (wordIndex + 1) / totalWords));
}
