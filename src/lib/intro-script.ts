import type { TeamMemberCount } from "@/lib/template";

/** Official Fleet Hub teleprompter scripts by how many teammates you introduce. */

export const INTRO_SCRIPTS: Record<
  TeamMemberCount,
  { title: string; script: string }
> = {
  0: {
    title: "Just me",
    script: `Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub!

I've included your proposal and some helpful information here so you can review everything in one place and share it with your team.

I'm here to help as you go through the details, so take a look when you have a chance and give me a call with any questions.

I'm looking forward to working with you!`,
  },
  1: {
    title: "1 teammate",
    script: `[On camera]

Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! Your proposal is here for you to review and share with your team.

I also wanted to introduce someone who'll be working with us.

[Show team member's photo]

This is [Team Member Name]. We work together to support your fleet, and you'll have both of us to reach out to along the way.

[Return to camera]

Take a look around, and let me know what questions you have. We're looking forward to working with you!`,
  },
  2: {
    title: "2 teammates",
    script: `[On camera]

Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! Your proposal is here for you to review and share with your team.

I also wanted to introduce two people who'll be working with us.

[Show first photo]

This is [Team Member Name].

[Show second photo]

And this is [Team Member Name].

[Return to camera]

We work together to support your fleet, and you'll have all of us to reach out to along the way.

Take a look around, and let me know what questions you have. We're looking forward to working with you!`,
  },
  3: {
    title: "3 teammates",
    script: `[On camera]

Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! Your proposal is here for you to review and share.

Before you take a look, I wanted to introduce your Love's Fleet Sales Team.

[Show first photo]

This is [Team Member Name].

[Show second photo]

This is [Team Member Name].

[Show third photo]

And this is [Team Member Name].

[Return to camera]

We work closely together, so you'll have a whole team supporting your fleet.

Take a look around, and let me know what you think. We're looking forward to working with you!`,
  },
  4: {
    title: "4 teammates",
    script: `[On camera]

Hey [Customer Name], it's [Your Name] with Love's. Welcome to your Fleet Hub! I've included your proposal here for you to review and share with your team.

Let me put some faces to the names of your Love's Fleet Sales Team.

[Show first photo]

This is [Team Member Name].

[Show second photo]

This is [Team Member Name].

[Show third photo]

This is [Team Member Name].

[Show fourth photo]

And this is [Team Member Name].

[Return to camera]

We're all here to help support your fleet. Take a look at the proposal, and give me a call with any questions!`,
  },
};

export function scriptForTeamCount(count: TeamMemberCount): string {
  return INTRO_SCRIPTS[count].script;
}

/** @deprecated use INTRO_SCRIPTS / scriptForTeamCount */
export const SAMPLE_INTRO_SCRIPT = INTRO_SCRIPTS[2].script;

/** Scroll speed presets (pixels added every 40ms tick). */
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

/** Accept plain-text script uploads. */
export function isScriptUploadFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    /\.(txt|md|text|rtf)$/i.test(name) ||
    file.type === "application/rtf"
  );
}
