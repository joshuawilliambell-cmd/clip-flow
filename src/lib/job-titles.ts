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

/** Short “things like…” phrases for the teleprompter intro. */
export const PRESET_JOB_DUTIES: Record<PresetJobTitle, string> = {
  "Regional Account Manager":
    "pricing, fuel programs, and day-to-day account needs",
  "Area Account Manager":
    "local support, site needs, and account follow-up",
  "Total Truck Care Account Manager":
    "maintenance, repairs, and keeping your trucks on the road",
  "Account Manager": "your account needs and day-to-day support",
  "Fleet Sales Administrative Coordinator":
    "paperwork, scheduling, and getting answers quickly",
  "Senior Manager of Fleet Sales":
    "strategy, escalations, and making sure your team has what it needs",
  "Fleet Account Specialist": "orders, account details, and quick questions",
  "Inside Sales Account Manager": "quotes, orders, and remote support",
  "Inside Sales Account Manager Fleet Sales":
    "quotes, fleet programs, and remote support",
  "Manager of Inside Sales":
    "escalations, coverage, and keeping inside sales support on track",
};

/** Sentinel value for the custom / free-text title option. */
export const CUSTOM_JOB_TITLE_VALUE = "__custom__";

export function isPresetJobTitle(title: string): boolean {
  return (PRESET_JOB_TITLES as readonly string[]).includes(title);
}

export function defaultDutiesForTitle(title: string): string {
  if (!isPresetJobTitle(title)) return "";
  return PRESET_JOB_DUTIES[title as PresetJobTitle];
}
