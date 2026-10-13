import type { TeamMemberCount } from "@/lib/template";
import { defaultDutiesForTitle } from "@/lib/job-titles";

/** Which official teleprompter script the employee is recording. */
export type ScriptTopic = "fleet-hub" | "express-billing";

export const SCRIPT_TOPIC_OPTIONS: Array<{
  id: ScriptTopic;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "fleet-hub",
    label: "Fleet Hub Welcome",
    shortLabel: "Fleet Hub",
    description: "Introduce yourself and your team inside the customer's Fleet Hub.",
  },
  {
    id: "express-billing",
    label: "Love's Express Billing",
    shortLabel: "Express Billing",
    description:
      "Explain the Love's Express fuel card program in plain language.",
  },
];

export const DEFAULT_SCRIPT_TOPIC: ScriptTopic = "fleet-hub";

/** Official Fleet Hub teleprompter scripts by how many teammates you introduce. */

/** Speaker self-intro first — you are not repeated later as a “team member.” */
const FLEET_HUB_OPENING =
  "Hey, [Customer Name], [Your Name] with Love's here. Welcome to your Fleet Hub. I am your [Your Job Title], and I can help you with things like [Your Job Duties]. This is a portal where you can learn all about what Love's can do for your fleet.";

const TEAMMATE_LINE =
  "This is [Team Member Name], and [he/she] is [a/an] [Job Title], and [he/she] can help you with things like [Job Duties]";

/** Shared closer after the support line on every official Fleet Hub script. */
const FLEET_HUB_CLOSING =
  "Feel free to look around inside the Fleet Hub and if you have any interest in any other services or products that Love's offers, please don't hesitate to reach out and I can help you explore those. Thanks again.";

function fleetHubWithTeammates(count: 1 | 2 | 3 | 4): string {
  if (count === 1) {
    return `${FLEET_HUB_OPENING} I also wanted to take a quick minute and introduce our team member who will be working with us. ${TEAMMATE_LINE}, and you can reach out to either one of us for support. ${FLEET_HUB_CLOSING}`;
  }
  const lines = Array.from({ length: count }, () => TEAMMATE_LINE).join(". ");
  return `${FLEET_HUB_OPENING} I also wanted to take a quick minute and introduce our team members who will be working with us. ${lines}. And you can reach out to any of us for support. ${FLEET_HUB_CLOSING}`;
}

const FLEET_HUB_SCRIPTS: Record<
  TeamMemberCount,
  { title: string; script: string }
> = {
  0: {
    title: "Just me",
    script: `${FLEET_HUB_OPENING} Take a look when you have a chance, and you can reach out to me anytime for support. ${FLEET_HUB_CLOSING}`,
  },
  1: {
    title: "1 teammate",
    script: fleetHubWithTeammates(1),
  },
  2: {
    title: "2 teammates",
    script: fleetHubWithTeammates(2),
  },
  3: {
    title: "3 teammates",
    script: fleetHubWithTeammates(3),
  },
  4: {
    title: "4 teammates",
    script: fleetHubWithTeammates(4),
  },
};

/**
 * Love's Express Billing — plain-language pitch a rep can present to a customer.
 * Same fill-in blanks as Fleet Hub; teammate lines still plug in when selected.
 */
const EXPRESS_OPENING =
  "Hey, [Customer Name], [Your Name] with Love's here. I am your [Your Job Title], and I can help you with things like [Your Job Duties]. I wanted to take a couple minutes and walk you through Love's Express Billing — our Love's fuel card program for fleets.";

const EXPRESS_BODY =
  "Love's Express is a billing card your drivers use at Love's. It works at Love's Travel Stops and Speedco, and it is made for your Love's fueling — not a general all-brand fleet card. Your fleet gets consistent, competitive pricing with no transaction fees and fair, simple terms. There are no application fees and no account maintenance fees. Cards and RFID tags are free. You get the fuel cash price on top of already competitive rates, and you can also use it for in-store merchandise and services at Love's. Premium Wi-Fi comes with your Love's Express transactions. You stay in control of spending. You can set purchase policies, product limits, and driver prompts. RFID tags and cardless fueling help cut fueling time and protect against fuel theft. The Love's Connect Portal is where you go to see your Love's fuel usage and activity. From one login you can view fuel, tire, and maintenance invoices, check available credit in real time, pull the documents and reports your back office needs, and connect with systems like McLeod, Prophesy, and TMW.";

const EXPRESS_CLOSING =
  "If Love's Express sounds like a good fit, reach out anytime and I can help you get set up. Thanks again.";

function expressWithTeammates(count: 1 | 2 | 3 | 4): string {
  if (count === 1) {
    return `${EXPRESS_OPENING} ${EXPRESS_BODY} I also wanted to introduce our team member who can help you with this. ${TEAMMATE_LINE}, and you can reach out to either one of us. ${EXPRESS_CLOSING}`;
  }
  const lines = Array.from({ length: count }, () => TEAMMATE_LINE).join(". ");
  return `${EXPRESS_OPENING} ${EXPRESS_BODY} I also wanted to introduce our team members who can help you with this. ${lines}. And you can reach out to any of us. ${EXPRESS_CLOSING}`;
}

const EXPRESS_BILLING_SCRIPTS: Record<
  TeamMemberCount,
  { title: string; script: string }
> = {
  0: {
    title: "Just me",
    script: `${EXPRESS_OPENING} ${EXPRESS_BODY} ${EXPRESS_CLOSING}`,
  },
  1: {
    title: "1 teammate",
    script: expressWithTeammates(1),
  },
  2: {
    title: "2 teammates",
    script: expressWithTeammates(2),
  },
  3: {
    title: "3 teammates",
    script: expressWithTeammates(3),
  },
  4: {
    title: "4 teammates",
    script: expressWithTeammates(4),
  },
};

const SCRIPTS_BY_TOPIC: Record<
  ScriptTopic,
  Record<TeamMemberCount, { title: string; script: string }>
> = {
  "fleet-hub": FLEET_HUB_SCRIPTS,
  "express-billing": EXPRESS_BILLING_SCRIPTS,
};

/** @deprecated Prefer scriptsForTopic — kept for older call sites. */
export const INTRO_SCRIPTS = FLEET_HUB_SCRIPTS;

export function scriptsForTopic(topic: ScriptTopic = DEFAULT_SCRIPT_TOPIC) {
  return SCRIPTS_BY_TOPIC[topic];
}

export function officialScriptMeta(
  topic: ScriptTopic,
  count: TeamMemberCount,
): { title: string; script: string; topicLabel: string } {
  const topicMeta =
    SCRIPT_TOPIC_OPTIONS.find((t) => t.id === topic) ?? SCRIPT_TOPIC_OPTIONS[0];
  const entry = SCRIPTS_BY_TOPIC[topic][count];
  return {
    title: entry.title,
    script: entry.script,
    topicLabel: topicMeta.shortLabel,
  };
}

export function scriptForTeamCount(
  count: TeamMemberCount,
  topic: ScriptTopic = DEFAULT_SCRIPT_TOPIC,
): string {
  return SCRIPTS_BY_TOPIC[topic][count].script;
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
  speakerTitle?: string;
  speakerDuties?: string;
  /** Other teammates only — never include the speaker here. */
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

/** Fill customer, speaker self-intro, and each teammate's name / pronoun / title / duties. */
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
  const speakerTitle = fillIns.speakerTitle?.trim() || "";
  const speakerDuties =
    fillIns.speakerDuties?.trim() ||
    defaultDutiesForTitle(speakerTitle) ||
    "";

  let text = template;
  if (customer) {
    text = text.replace(/\[Customer Name\]/g, customer);
  }
  if (speaker) {
    text = text.replace(/\[Your Name\]/g, speaker);
  }

  // Speaker self-intro placeholders (opening only — not teammate lines).
  const yourTitle = speakerTitle || "[Your Job Title]";
  const yourDuties = speakerDuties || "[Your Job Duties]";
  text = text.replace(/\[Your Job Title\]/g, yourTitle);
  text = text.replace(/\[Your Job Duties\]/g, yourDuties);
  // Legacy templates that still used “I'm a/an …”
  text = text.replace(/\[Your A\/An\]\s*/g, "");

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

/** Official script for topic + team size, with fill-ins and roster names. */
export function scriptForTeam(
  count: TeamMemberCount,
  peopleOrFillIns: TeamIntroPerson[] | ScriptFillIns = [],
  topic: ScriptTopic = DEFAULT_SCRIPT_TOPIC,
): string {
  return personalizeScript(scriptForTeamCount(count, topic), peopleOrFillIns);
}

/** @deprecated use INTRO_SCRIPTS / scriptForTeamCount */
export const SAMPLE_INTRO_SCRIPT = FLEET_HUB_SCRIPTS[2].script;

/** Target intro length the teleprompter is paced for (Fleet Hub ~60s). */
export const TARGET_INTRO_SECONDS = 60;

/** Longer product pitches (Express Billing) need a slower default pace. */
export function targetSecondsForTopic(topic: ScriptTopic): number {
  return topic === "express-billing" ? 105 : TARGET_INTRO_SECONDS;
}

/** Scroll loop interval used by the teleprompter UI. */
export const TELEPROMPTER_TICK_MS = 40;

/**
 * Continuous scroll speed range (pixels added every TELEPROMPTER_TICK_MS).
 * Min is intentionally slower than the old “Slow” preset so readers can keep up.
 */
export const TELEPROMPTER_SPEED_MIN = 0.1;
export const TELEPROMPTER_SPEED_MAX = 3.5;
export const TELEPROMPTER_SPEED_STEP = 0.05;

/**
 * Snap reference points along the speed slider (slow → fast).
 * Shown as dots so users can park the thumb on a familiar pace.
 */
export const TELEPROMPTER_SPEED_MARKERS = [0.35, 0.7, 1.15, 1.8, 2.6] as const;

export function teleprompterSpeedMarkerPercent(pixelsPerTick: number): number {
  const span = TELEPROMPTER_SPEED_MAX - TELEPROMPTER_SPEED_MIN;
  if (span <= 0) return 0;
  return (
    ((clampTeleprompterSpeed(pixelsPerTick) - TELEPROMPTER_SPEED_MIN) / span) *
    100
  );
}

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
 * Column width matches practice + webcam (see teleprompter-layout.ts).
 */
export function estimateScrollDistancePx(
  script: string,
  fontLarge = true,
): number {
  const text = script.trim();
  if (!text) return 0;
  const lines = text.split("\n");
  // Must match TELEPROMPTER_COLUMN_CH (~5 words) used in both teleprompters.
  const charsPerLine = fontLarge ? 28 : 32;
  let visualLines = 0;
  for (const line of lines) {
    const len = line.trim().length || 1;
    visualLines += Math.max(1, Math.ceil(len / charsPerLine));
  }
  const linePx = fontLarge ? 40 : 34;
  const bottomSpacerPx = 160;
  const viewportPx = 280;
  return Math.max(120, visualLines * linePx + bottomSpacerPx - viewportPx);
}

/** Ideal px/tick so `distancePx` scrolls in about durationSeconds. */
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

/** Default continuous speed paced for the target duration for this script text. */
export function suggestedPixelsPerTickForScript(
  script: string,
  fontLarge = true,
  durationSeconds = TARGET_INTRO_SECONDS,
): number {
  const distance = estimateScrollDistancePx(script, fontLarge);
  return idealPixelsPerTickForDistance(distance, durationSeconds);
}

/** Default continuous speed for an official team-size script. */
export function suggestedPixelsPerTickForTeamCount(
  count: TeamMemberCount,
  topic: ScriptTopic = DEFAULT_SCRIPT_TOPIC,
): number {
  return suggestedPixelsPerTickForScript(
    scriptForTeamCount(count, topic),
    true,
    targetSecondsForTopic(topic),
  );
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
