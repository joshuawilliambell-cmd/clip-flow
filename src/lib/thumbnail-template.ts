/**
 * Fixed "Love's Team" thumbnail template.
 * Employees only supply headshots, names, and titles.
 */

export const THUMBNAIL_TEMPLATE = {
  id: "loves-team-thumbnail-v1",
  width: 1920,
  height: 1080,
  maxMembers: 4,
  colors: {
    navy: "#0B2C5C",
    gold: "#F5C518",
    goldDark: "#D4A017",
    background: "#F4F5F7",
    card: "#FFFFFF",
    text: "#0B2C5C",
    mutedPhoto: "#D9DEE7",
  },
  header: {
    title: "Love's Team",
    y: 118,
    fontSize: 92,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "700",
    lineWidth: 160,
    lineGap: 36,
  },
  card: {
    width: 360,
    photoHeight: 420,
    bodyHeight: 150,
    radius: 18,
    gap: 36,
    nameSize: 34,
    titleSize: 24,
    nameYOffset: 52,
    dividerYOffset: 78,
    titleYOffset: 112,
  },
} as const;

export type ThumbnailMember = {
  id: string;
  photoUrl: string | null;
  name: string;
  title: string;
};
