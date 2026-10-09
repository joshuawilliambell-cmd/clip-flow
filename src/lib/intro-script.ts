import type { TeamMemberCount } from "@/lib/template";
import { defaultDutiesForTitle } from "@/lib/job-titles";

/** Official Fleet Hub teleprompter scripts by how many teammates you introduce. */

const OPENING =
  "Hey, [Customer Name], [Your Name] with Love's here. Welcome to your Fleet Hub. This is a portal where you can learn all about what Love's can do for your fleet.";

const TEAMMATE_LINE =
  "This is [Team Member Name], and [he/she] [is/are] [a/an] [Job Title], and [he/she] can help you with things like [Job Duties]";

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

export type TeamIntroPronoun = "he" | "she" | "they" | "";

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
      pronounRaw === "he" || pronounRaw === "she" || pronounRaw === "they"
        ? pronounRaw
        : "[he/she]";
    const beVerb =
      pronoun === "they" ? "are" : pronoun === "[he/she]" ? "[is/are]" : "is";
    const article =
      title === "[Job Title]" ? "[a/an]" : indefiniteArticle(title);

    // Order matches TEAMMATE_LINE placeholders left-to-right.
    text = replaceFirst(text, "[Team Member Name]", name);
    text = replaceFirst(text, "[he/she]", pronoun);
    text = replaceFirst(text, "[is/are]", beVerb);
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

/** Scroll speed presets (pixels added every TELEPROMPTER_TICK_MS). */
export const TELEPROMPTER_SPEEDS = [
  { id: "slow", label: "Slow", pixelsPerTick: 0.55 },
  { id: "medium", label: "Medium", pixelsPerTick: 1.15 },
  { id: "fast", label: "Fast", pixelsPerTick: 2.0 },
  { id: "very-fast", label: "Very fast", pixelsPerTick: 3.1 },
] as const;

export type TeleprompterSpeedId = (typeof TELEPROMPTER_SPEEDS)[number]["id"];

export function pixelsPerTickForSpeed(id: TeleprompterSpeedId): number {
  return (
    TELEPROMPTER_SPEEDS.find((s) => s.id === id)?.pixelsPerTick ??
    TELEPROMPTER_SPEEDS[1].pixelsPerTick
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
  if (ticks <= 0) return TELEPROMPTER_SPEEDS[1].pixelsPerTick;
  return Math.max(0.35, distancePx / ticks);
}

/**
 * Preset for a px/tick target. Prefers the slowest speed that still finishes
 * by ~TARGET_INTRO_SECONDS (slightly fast rather than running long).
 */
export function nearestSpeedForPixelsPerTick(
  pixelsPerTick: number,
): TeleprompterSpeedId {
  const fastEnough = TELEPROMPTER_SPEEDS.filter(
    (s) => s.pixelsPerTick + 0.02 >= pixelsPerTick,
  );
  if (fastEnough.length > 0) return fastEnough[0].id;
  return TELEPROMPTER_SPEEDS[TELEPROMPTER_SPEEDS.length - 1].id;
}

/** Default preset paced for ~60s for this script text. */
export function suggestedSpeedForScript(
  script: string,
  fontLarge = true,
): TeleprompterSpeedId {
  const distance = estimateScrollDistancePx(script, fontLarge);
  return nearestSpeedForPixelsPerTick(idealPixelsPerTickForDistance(distance));
}

/** Default preset for an official team-size script (~60s intro). */
export function suggestedSpeedForTeamCount(
  count: TeamMemberCount,
): TeleprompterSpeedId {
  return suggestedSpeedForScript(scriptForTeamCount(count));
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
