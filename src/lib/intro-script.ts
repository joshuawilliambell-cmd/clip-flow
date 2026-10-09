import type { TeamMemberCount } from "@/lib/template";

/** Official Fleet Hub teleprompter scripts by how many teammates you introduce. */

export const INTRO_SCRIPTS: Record<
  TeamMemberCount,
  { title: string; script: string }
> = {
  0: {
    title: "Just me",
    script: `Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub!

This is a platform where you learn more about what Love's can do for your fleet. Everything is here in one place so you can review it and share it with your team.

I'm here to help as you go through the details, so take a look when you have a chance and give me a call with any questions.

I'm looking forward to working with you!`,
  },
  1: {
    title: "1 teammate",
    script: `Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! This is a platform where you learn more about what Love's can do for your fleet.

I also wanted to introduce someone who'll be working with us. You'll see their photo on screen while I keep talking.

This is [Team Member Name]. We work together to support your fleet, and you'll have both of us to reach out to along the way.

Take a look around, and let me know what questions you have. We're looking forward to working with you!`,
  },
  2: {
    title: "2 teammates",
    script: `Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! This is a platform where you learn more about what Love's can do for your fleet.

I also wanted to introduce two people who'll be working with us. Their photos will appear on screen as I introduce them.

This is [Team Member Name].

And this is [Team Member Name].

We work together to support your fleet, and you'll have all of us to reach out to along the way.

Take a look around, and let me know what questions you have. We're looking forward to working with you!`,
  },
  3: {
    title: "3 teammates",
    script: `Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! This is a platform where you learn more about what Love's can do for your fleet.

Before you take a look, I wanted to introduce your Love's Fleet Sales Team. Their photos will appear on screen as I keep talking.

This is [Team Member Name].

This is [Team Member Name].

And this is [Team Member Name].

We work closely together, so you'll have a whole team supporting your fleet.

Take a look around, and let me know what you think. We're looking forward to working with you!`,
  },
  4: {
    title: "4 teammates",
    script: `Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! This is a platform where you learn more about what Love's can do for your fleet.

Let me put some faces to the names of your Love's Fleet Sales Team. Their photos will appear on screen while I introduce them.

This is [Team Member Name].

This is [Team Member Name].

This is [Team Member Name].

And this is [Team Member Name].

We're all here to help support your fleet. Take a look around, and give me a call with any questions!`,
  },
};

export function scriptForTeamCount(count: TeamMemberCount): string {
  return INTRO_SCRIPTS[count].script;
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
