/**
 * Fixed "Love's Team" thumbnail template.
 * Colors follow the Love's heart logo: red, yellow, and orange.
 */

export const THUMBNAIL_TEMPLATE = {
  id: "loves-team-thumbnail-v2",
  width: 1920,
  height: 1080,
  maxMembers: 4,
  /** How long the optional intro thumbnail covers the video (seconds). */
  introDurationSeconds: 1,
  colors: {
    /** Primary Love's heart red */
    red: "#ED2024",
    redDark: "#C41418",
    /** Heart stripe yellow */
    yellow: "#FFD400",
    yellowBright: "#FFE34A",
    /** Heart stripe orange */
    orange: "#F15A22",
    orangeDeep: "#E87722",
    background: "#FFF8E8",
    backgroundDeep: "#FFE9A8",
    card: "#FFFFFF",
    text: "#1A1A1A",
    mutedPhoto: "#F3E2B8",
    ink: "#1A1A1A",
  },
  header: {
    title: "Love's Team",
    y: 118,
    fontSize: 92,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "800",
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
  photoFit: {
    /** 1 = cover the portrait frame; higher zooms in. */
    minScale: 1,
    maxScale: 2.5,
    defaultScale: 1,
    /** Focal point in the source image (0–1). */
    defaultFocusX: 0.5,
    defaultFocusY: 0.28,
  },
} as const;

export type ThumbnailPhotoFit = {
  /** Zoom multiplier on cover-fit (1–2.5). */
  scale: number;
  /** Horizontal focal point 0–1 (0 = left, 1 = right). */
  focusX: number;
  /** Vertical focal point 0–1 (0 = top, 1 = bottom). */
  focusY: number;
};

export type ThumbnailMember = {
  id: string;
  photoUrl: string | null;
  name: string;
  title: string;
  photoFit: ThumbnailPhotoFit;
};

export function defaultPhotoFit(): ThumbnailPhotoFit {
  return {
    scale: THUMBNAIL_TEMPLATE.photoFit.defaultScale,
    focusX: THUMBNAIL_TEMPLATE.photoFit.defaultFocusX,
    focusY: THUMBNAIL_TEMPLATE.photoFit.defaultFocusY,
  };
}
