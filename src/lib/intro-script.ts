/** Starter script for the webcam teleprompter. */

export const SAMPLE_INTRO_SCRIPT = `Hi, I'm [Your Name] with Love's Travel Stops.

Thanks for watching. I'd like to introduce our team.

First, meet [Teammate Name], our [Job Title].

Next is [Teammate Name], who helps with [what they do].

We're here to support your fleet and make every stop easier.

Thanks again — we look forward to working with you.`;

export const TELEPROMPTER_SPEEDS = [
  { id: "slow", label: "Slow", pixelsPerTick: 0.6 },
  { id: "medium", label: "Medium", pixelsPerTick: 1.2 },
  { id: "fast", label: "Fast", pixelsPerTick: 2.2 },
] as const;

export type TeleprompterSpeedId = (typeof TELEPROMPTER_SPEEDS)[number]["id"];
