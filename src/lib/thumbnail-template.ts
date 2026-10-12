/**
 * Love's Enterprise Sales Team thumbnail template.
 * Clean cream field + gradient title bar (matches in-app silhouette mockup).
 */

export const THUMBNAIL_TEMPLATE = {
  id: "loves-team-thumbnail-v3",
  width: 1920,
  height: 1080,
  /** Speaker + up to four teammates. */
  maxMembers: 5,
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
    /** Soft cream field (silhouette mockup) */
    background: "#FFF8E8",
    backgroundDeep: "#FFF3D6",
    card: "#FFFFFF",
    /** Near-black ink for crisp name/email type */
    text: "#0A0A0A",
    /** Dark charcoal for titles (was soft gray — looked blurry) */
    muted: "#1F1F1F",
    mutedPhoto: "#94A3B8",
    silhouette: "#1E293B",
    silhouetteMid: "#475569",
    ink: "#0A0A0A",
  },
  header: {
    title: "Your Love's Enterprise Sales Team",
    /** Top gradient bar height */
    barHeight: 168,
    fontSize: 64,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "800",
  },
  card: {
    width: 360,
    photoHeight: 400,
    /** Name + title + optional email */
    bodyHeight: 210,
    radius: 18,
    gap: 36,
    nameSize: 38,
    titleSize: 26,
    emailSize: 22,
    nameYOffset: 44,
    dividerYOffset: 72,
    titleYOffset: 106,
    emailYOffset: 150,
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

/** Stable id for the recording speaker’s thumbnail card (not a PIP teammate). */
export const SPEAKER_THUMBNAIL_ID = "speaker-self";

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
  /** Optional work email shown under the job title on the thumbnail. */
  email: string;
  photoFit: ThumbnailPhotoFit;
};

export function defaultPhotoFit(): ThumbnailPhotoFit {
  return {
    scale: THUMBNAIL_TEMPLATE.photoFit.defaultScale,
    focusX: THUMBNAIL_TEMPLATE.photoFit.defaultFocusX,
    focusY: THUMBNAIL_TEMPLATE.photoFit.defaultFocusY,
  };
}
