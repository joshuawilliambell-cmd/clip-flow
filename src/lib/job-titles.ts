/** Preset Fleet Sales job titles (Title Case). */

export const PRESET_JOB_TITLES = [
  "Regional Account Manager",
  "Area Account Manager",
  "Total Truck Care Account Manager",
  "Account Manager",
  "Fleet Sales Administrative Coordinator",
  "Senior Manager of Fleet Sales",
  "Fleet Account Specialist",
  "Inside Sales Account Manager",
  "Inside Sales Account Manager Fleet Sales",
  "Manager of Inside Sales",
] as const;

export type PresetJobTitle = (typeof PRESET_JOB_TITLES)[number];

/** Sentinel value for the custom / free-text title option. */
export const CUSTOM_JOB_TITLE_VALUE = "__custom__";

export function isPresetJobTitle(title: string): boolean {
  return (PRESET_JOB_TITLES as readonly string[]).includes(title);
}
