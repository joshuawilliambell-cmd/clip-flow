import type { TeamMemberCount } from "@/lib/template";
import { defaultDutiesForTitle } from "@/lib/job-titles";

/** Official Fleet Hub teleprompter scripts by how many teammates you introduce. */

const OPENING =
  "Hey, [Customer Name], [Your Name] with Love's here. Welcome to your Fleet Hub. This is a portal where you can learn all about what Love's can do for your fleet.";

const TEAMMATE_LINE =
  "This is [Team Member Name], and [he/she] is [a/an] [Job Title], and [he/she] can help you with things like [Job Duties]";

function scriptWithTeammates(count: 1 | 2 | 3 | 4): string {
  if (count === 1) {
    return `${OPENING} I also wanted to take a quick minute and introduce our team member who will be working with us. ${TEAMMATE_LINE}, and you can reach out to either one of us for support.`;
  }
  const lines = Array.from({ length: count }, () => TEAMMATE_LINE).join(". ");
  return `${OPENING} I also wanted to take a quick minute and introduce our team members who will be working with us. ${lines}. And you can reach out to any of us for support.`;
}

export const INTRO_SCRIPTS: Record<
  TeamMemberCount,
  { title: string; script: string }
> = {
  0: {
    title: "Just me",
    script: `${OPENING} Take a look when you have a chance, and you can reach out to me anytime for support.`,
  },
  1: {
    title: "1 teammate",
    script: scriptWithTeammates(1),
  },
  2: {
    title: "2 teammates",
    script: scriptWithTeammates(2),
  },
  3: {
    title: "3 teammates",
    script: scriptWithTeammates(3),
  },
  4: {
    title: "4 teammates",
    script: scriptWithTeammates(4),
  },
};

export function scriptForTeamCount(count: TeamMemberCount): string {
  return INTRO_SCRIPTS[count].script;
}

export type TeamIntroPronoun = "he" | "she" | "";

export type TeamIntroPerson = {
  name: string;
  title?: string;
  pronoun?: TeamIntroPronoun | string;
  duties?: string;
};

export type ScriptFillIns = {
  customerName?: string;
  speakerName?: string;
  people?: TeamIntroPerson[];
};

function indefiniteArticle(title: string): string {
  const trimmed = title.trim().toLowerCase();
  if (!trimmed) return "[a/an]";
  return /^[aeiou]/.test(trimmed) ? "an" : "a";
}

function replaceFirst(text: string, needle: string, value: string): string {
  const index = text.indexOf(needle);
  if (index === -1) return text;
  return text.slice(0, index) + value + text.slice(index + needle.length);
}

/** Fill customer, speaker, and each teammate's name / pronoun / title / duties. */
export function personalizeScript(
  template: string,
  peopleOrFillIns: TeamIntroPerson[] | ScriptFillIns = [],
): string {
  const fillIns: ScriptFillIns = Array.isArray(peopleOrFillIns)
    ? { people: peopleOrFillIns }
    : peopleOrFillIns;
  const people = fillIns.people ?? [];
  const customer = fillIns.customerName?.trim();
  const speaker = fillIns.speakerName?.trim();

  let text = template;
  if (customer) {
    text = text.replace(/\[Customer Name\]/g, customer);
  }
  if (speaker) {
    text = text.replace(/\[Your Name\]/g, speaker);
  }

  const teammateSlots = (text.match(/\[Team Member Name\]/g) ?? []).length;
  for (let i = 0; i < teammateSlots; i += 1) {
    const person = people[i];
    const name = person?.name?.trim() || "[Team Member Name]";
    const title = person?.title?.trim() || "[Job Title]";
    const duties =
      person?.duties?.trim() ||
      defaultDutiesForTitle(person?.title ?? "") ||
      "[Job Duties]";
    const pronounRaw = (person?.pronoun ?? "").trim().toLowerCase();
    const pronoun =
      pronounRaw === "he" || pronounRaw === "she" ? pronounRaw : "[he/she]";
    const article =
      title === "[Job Title]" ? "[a/an]" : indefiniteArticle(title);

    // Order matches TEAMMATE_LINE placeholders left-to-right.
    text = replaceFirst(text, "[Team Member Name]", name);
    text = replaceFirst(text, "[he/she]", pronoun);
    text = replaceFirst(text, "[a/an]", article);
    text = replaceFirst(text, "[Job Title]", title);
    text = replaceFirst(text, "[he/she]", pronoun);
    text = replaceFirst(text, "[Job Duties]", duties);
  }

  return text;
}

/** Official script for team size, with fill-ins and roster names. */
export function scriptForTeam(
  count: TeamMemberCount,
  peopleOrFillIns: TeamIntroPerson[] | ScriptFillIns = [],
): string {
  return personalizeScript(INTRO_SCRIPTS[count].script, peopleOrFillIns);
}

/** @deprecated use INTRO_SCRIPTS / scriptForTeamCount */
export const SAMPLE_INTRO_SCRIPT = INTRO_SCRIPTS[2].script;

/** Target intro length the teleprompter is paced for. */
export const TARGET_INTRO_SECONDS = 60;

/** Scroll loop interval used by the teleprompter UI. */
export const TELEPROMPTER_TICK_MS = 40;

/**
 * Continuous scroll speed range (pixels added every TELEPROMPTER_TICK_MS).
 * Min is intentionally slower than the old “Slow” preset so readers can keep up.
 */
export const TELEPROMPTER_SPEED_MIN = 0.1;
export const TELEPROMPTER_SPEED_MAX = 3.5;
export const TELEPROMPTER_SPEED_STEP = 0.05;

export function clampTeleprompterSpeed(pixelsPerTick: number): number {
  const stepped =
    Math.round(pixelsPerTick / TELEPROMPTER_SPEED_STEP) *
    TELEPROMPTER_SPEED_STEP;
  return Math.min(
    TELEPROMPTER_SPEED_MAX,
    Math.max(TELEPROMPTER_SPEED_MIN, Number(stepped.toFixed(2))),
  );
}

/**
 * Rough scroll distance for a script before layout (large teleprompter type).
 * Used to pick a default speed that finishes near TARGET_INTRO_SECONDS.
 */
export function estimateScrollDistancePx(
  script: string,
  fontLarge = true,
): number {
  const text = script.trim();
  if (!text) return 0;
  const lines = text.split("\n");
  // Large centered type wraps earlier than body copy.
  const charsPerLine = fontLarge ? 28 : 38;
  let visualLines = 0;
  for (const line of lines) {
    const len = line.trim().length || 1;
    visualLines += Math.max(1, Math.ceil(len / charsPerLine));
  }
  const linePx = fontLarge ? 48 : 36;
  const bottomSpacerPx = 160;
  const viewportPx = 280;
  return Math.max(120, visualLines * linePx + bottomSpacerPx - viewportPx);
}

/** Ideal px/tick so `distancePx` scrolls in about TARGET_INTRO_SECONDS. */
export function idealPixelsPerTickForDistance(
  distancePx: number,
  durationSeconds = TARGET_INTRO_SECONDS,
): number {
  const ticks = (durationSeconds * 1000) / TELEPROMPTER_TICK_MS;
  if (ticks <= 0) return clampTeleprompterSpeed(0.45);
  return clampTeleprompterSpeed(distancePx / ticks);
}

/** Estimated seconds to scroll `distancePx` at this speed. */
export function estimatedScrollSeconds(
  distancePx: number,
  pixelsPerTick: number,
): number {
  const speed = Math.max(TELEPROMPTER_SPEED_MIN, pixelsPerTick);
  if (distancePx <= 0) return 0;
  const ticks = distancePx / speed;
  return Math.max(1, Math.round((ticks * TELEPROMPTER_TICK_MS) / 1000));
}

/** Default continuous speed paced for ~60s for this script text. */
export function suggestedPixelsPerTickForScript(
  script: string,
  fontLarge = true,
): number {
  const distance = estimateScrollDistancePx(script, fontLarge);
  return idealPixelsPerTickForDistance(distance);
}

/** Default continuous speed for an official team-size script (~60s intro). */
export function suggestedPixelsPerTickForTeamCount(
  count: TeamMemberCount,
): number {
  return suggestedPixelsPerTickForScript(scriptForTeamCount(count));
}

/** Accept plain-text script uploads. */
export function isScriptUploadFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    /\.(txt|md|text|rtf)$/i.test(name) ||
    file.type === "application/rtf"
  );
}
