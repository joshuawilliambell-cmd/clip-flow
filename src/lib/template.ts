/**
 * Central video template definition.
 * Change PIP layout, branding, and timing defaults here —
 * the employee UI does not control positioning or scaling.
 */

export type PipSide = "left" | "right";

/** How many teammates the employee plans to introduce (drives slots, thumbnail, script). */
export type TeamMemberCount = 0 | 1 | 2 | 3 | 4;

export const TEAM_MEMBER_COUNT_OPTIONS: TeamMemberCount[] = [0, 1, 2, 3, 4];

export const VIDEO_TEMPLATE = {
  id: "loves-team-intro-v1",
  name: "Love's Team Introduction",
  width: 1920,
  height: 1080,
  fps: 30,
  /**
   * Preferred Allego intro length (guidance + teleprompter pacing default).
   * Not a hard maximum — uploads, webcam takes, and trims may be longer
   * (2+ minutes supported; keep under maxVideoBytes).
   */
  targetDurationSeconds: 60,
  /** Soft upper guidance for copy only — not enforced as a hard cut. */
  recommendedMaxDurationSeconds: 180,
  /** Max teammates for intro videos / thumbnails (user picks 1–4 at the start). */
  maxPhotos: 4,
  defaultTeamMemberCount: 2 as TeamMemberCount,
  minPhotoDurationSeconds: 1,
  /** Default PIP still length — users can drag edges to change. */
  defaultPhotoDurationSeconds: 10,
  /**
   * Default start times (seconds into the finished/trimmed video) for teammate
   * PIP photos 1–4. Users can drag bars on the timeline to change these.
   */
  defaultPhotoStartSeconds: [23, 35, 47, 56] as const,
  /** @deprecated prefer defaultPhotoStartSeconds[0] */
  photoStartOffsetSeconds: 23,
  fadeInSeconds: 0.35,
  fadeOutSeconds: 0.35,
  /** Optional Love's Team opening card length (keep in sync with thumbnail template). */
  introThumbnailSeconds: 1,
  musicFadeSeconds: 1.2,
  /** Keep bed music quiet under the speaker voice (1%). */
  defaultMusicVolume: 0.01,
  /** Hard cap so music never overpowers the voice. */
  maxMusicVolume: 0.05,
  /** Start quieter so playback is comfortable; users can raise it. */
  defaultVideoVolume: 0.5,
  branding: {
    brandName: "Love's",
    productName: "Video Studio",
    primary: "#ED2024",
    primaryDark: "#C41418",
    accent: "#FFD400",
    ink: "#1A1A1A",
    soft: "#FFF8D6",
    panel: "#FFFFFF",
    muted: "#3F3A2A",
    olive: "#3A3A1F",
    trackVideo: "#1A1A1A",
    trackPhotoPalette: [
      "#ED2024",
      "#C41418",
      "#997B1D",
      "#000000",
      "#B91C1C",
      "#78350F",
      "#7F1D1D",
      "#44403C",
    ],
  },
  /**
   * Fixed picture-in-picture region on a 16:9 canvas.
   * Photos are always portrait (taller than wide) with safe-zone padding.
   * Users may choose left or right; they cannot drag/scale the frame.
   */
  pip: {
    /** Top inset from frame edge (~matches Allego-style screenshot). */
    paddingTopPercent: 6,
    /** Outer side inset (left edge when side=left, right edge when side=right). */
    paddingSidePercent: 5,
    /** Portrait box: ~3:4 on 1920×1080 (width ≈ 15.2%, height 36%). */
    widthPercent: 15.2,
    heightPercent: 36,
    defaultSide: "left" as PipSide,
    borderRadiusPx: 8,
    borderWidthPx: 3,
    borderColor: "rgba(255,255,255,0.95)",
    shadow: "0 14px 36px rgba(0,0,0,0.42)",
    label: {
      belowGapPx: 12,
      nameSizePx: 30,
      titleSizePx: 22,
      departmentSizePx: 18,
      textColor: "#FFFFFF",
      nameWeight: 700,
      titleWeight: 500,
      background: "rgba(16, 16, 16, 0.72)",
      paddingX: 14,
      paddingY: 10,
      borderRadiusPx: 8,
    },
  },
  uploads: {
    /** Browser-side ceiling for phone/camera files (about 4 GB). */
    maxVideoBytes: 4 * 1024 * 1024 * 1024,
    maxPhotoBytes: 15 * 1024 * 1024,
    videoAccept: [
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ] as string[],
    photoAccept: ["image/jpeg", "image/png", "image/webp"] as string[],
  },
};

/** Resolve absolute PIP box for a chosen side on the 16:9 canvas. */
export function getPipLayout(side: PipSide = VIDEO_TEMPLATE.pip.defaultSide) {
  const { paddingTopPercent, paddingSidePercent, widthPercent, heightPercent } =
    VIDEO_TEMPLATE.pip;
  const xPercent =
    side === "left"
      ? paddingSidePercent
      : 100 - paddingSidePercent - widthPercent;
  return {
    side,
    xPercent,
    yPercent: paddingTopPercent,
    widthPercent,
    heightPercent,
  };
}

export const MUSIC_TRACKS = [
  {
    id: "corporate-chill-2",
    label: "Corporate Chill 2",
    description: "Smooth corporate bed for team intros",
    src: "/music/corporate-chill-2.mp3",
  },
  {
    id: "corporate-chill-3",
    label: "Corporate Chill 3",
    description: "Warm, easy background for narration",
    src: "/music/corporate-chill-3.mp3",
  },
  {
    id: "corporate-chill-guitar-1",
    label: "Corporate Chill Guitar 1",
    description: "Light guitar bed that stays under your voice",
    src: "/music/corporate-chill-guitar-1.mp3",
  },
  {
    id: "corporate-chill-guitar-2",
    label: "Corporate Chill Guitar 2",
    description: "Gentle guitar alternative for customer videos",
    src: "/music/corporate-chill-guitar-2.mp3",
  },
] as const;
