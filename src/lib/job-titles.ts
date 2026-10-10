/** Preset Fleet Sales job titles (Title Case). */

export const PRESET_JOB_TITLES = [
  "Account Manager",
  "Area Account Manager",
  "Business Development Specialist",
  "Enterprise Sales Manager",
  "Fleet Account Specialist",
  "Fleet Sales Administrative Coordinator",
  "General Manager of Fuel Sales",
  "Inside Sales Account Manager",
  "Inside Sales Account Manager Fleet Sales",
  "Manager of Fleet Maintenance & Service",
  "Manager of Inside Sales",
  "National Account Manager",
  "National Fuel Marketer",
  "Regional Account Manager",
  "Regional Marketer",
  "Senior Manager of Fleet Sales",
  "Total Truck Care Account Manager",
  "TTC National Account Manager",
] as const;

export type PresetJobTitle = (typeof PRESET_JOB_TITLES)[number];

/**
 * Short “things like…” phrases for the teleprompter intro.
 * Drawn from Love’s careers postings (jobs.loves.com) and public LinkedIn
 * role descriptions for Fleet Sales / fuel / Total Truck Care titles.
 */
export const PRESET_JOB_DUTIES: Record<PresetJobTitle, string> = {
  "Regional Account Manager":
    "growing diesel volume across your region, Love’s Express Card programs, and group discount support",
  "Area Account Manager":
    "local diesel and fleet growth, Express Card setup, and day-to-day support for your area accounts",
  "National Account Manager":
    "national fleet pricing and programs, multi-site fuel strategy, and enterprise account support",
  "TTC National Account Manager":
    "nationwide Total Truck Care programs, maintenance planning, and keeping your fleet uptime high",
  "Total Truck Care Account Manager":
    "tires, light mechanical work, roadside needs, and reducing your fleet’s maintenance costs",
  "Account Manager":
    "your fuel and fleet programs, account follow-up, and day-to-day Love’s support",
  "Enterprise Sales Manager":
    "enterprise fleet solutions, multi-location programs, and long-term growth for larger fleets",
  "Business Development Specialist":
    "new fleet opportunities, program options, and building your partnership with Love’s",
  "Regional Marketer":
    "regional fuel offers, delivered-in and wholesale options, and local market support",
  "National Fuel Marketer":
    "national fuel programs, pricing strategy, and saving across your fueling network",
  "General Manager of Fuel Sales":
    "fuel sales strategy, escalations, and making sure your fuel needs stay covered",
  "Fleet Sales Administrative Coordinator":
    "account setup, discount and billing details, and getting quick answers for your team",
  "Senior Manager of Fleet Sales":
    "fleet sales strategy, team coverage, and making sure the right people support your account",
  "Fleet Account Specialist":
    "account details, contracts and billing questions, and fast follow-up on fleet needs",
  "Inside Sales Account Manager":
    "phone support for Total Truck Care, fuel and tire programs, and smaller-fleet account growth",
  "Inside Sales Account Manager Fleet Sales":
    "remote fleet sales support, quotes and program setup, and growing your Love’s services by phone",
  "Manager of Inside Sales":
    "inside sales coverage, escalations, and keeping remote account support on track for you",
  "Manager of Fleet Maintenance & Service":
    "fleet maintenance planning, service coverage, and keeping your trucks running with Total Truck Care support",
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
