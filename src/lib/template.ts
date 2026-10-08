/**
 * Central video template definition.
 * Change PIP layout, branding, and timing defaults here —
 * the employee UI does not control positioning or scaling.
 */

export const VIDEO_TEMPLATE = {
  id: "loves-team-intro-v1",
  name: "Love's Team Introduction",
  width: 1920,
  height: 1080,
  fps: 30,
  targetDurationSeconds: 60,
  maxPhotos: 8,
  minPhotoDurationSeconds: 1,
  defaultPhotoDurationSeconds: 6,
  photoStartOffsetSeconds: 5,
  fadeInSeconds: 0.35,
  fadeOutSeconds: 0.35,
  musicFadeSeconds: 1.2,
  defaultMusicVolume: 0.3,
  branding: {
    brandName: "Love's",
    productName: "Video Studio",
    primary: "#C8102E",
    primaryDark: "#8B0A1E",
    accent: "#F5B700",
    ink: "#1A1A1A",
    soft: "#F7F4F0",
    panel: "#FFFFFF",
    muted: "#6B6560",
    trackVideo: "#2F3A4A",
    trackPhotoPalette: [
      "#C8102E",
      "#D64545",
      "#B45309",
      "#0F766E",
      "#1D4E89",
      "#6D28D9",
      "#BE185D",
      "#365314",
    ],
  },
  /** Fixed picture-in-picture region (percent of frame). */
  pip: {
    xPercent: 68.5,
    yPercent: 18,
    widthPercent: 26,
    heightPercent: 46,
    borderRadiusPx: 10,
    borderWidthPx: 3,
    borderColor: "rgba(255,255,255,0.92)",
    shadow: "0 18px 40px rgba(0,0,0,0.45)",
    label: {
      belowGapPx: 14,
      maxWidthPercent: 26,
      nameSizePx: 34,
      titleSizePx: 24,
      departmentSizePx: 20,
      textColor: "#FFFFFF",
      nameWeight: 700,
      titleWeight: 500,
      background: "rgba(16, 16, 16, 0.72)",
      paddingX: 16,
      paddingY: 12,
      borderRadiusPx: 8,
    },
  },
  uploads: {
    maxVideoBytes: 500 * 1024 * 1024,
    maxPhotoBytes: 15 * 1024 * 1024,
    videoAccept: ["video/mp4", "video/quicktime"] as string[],
    photoAccept: ["image/jpeg", "image/png", "image/webp"] as string[],
  },
};

export const MUSIC_TRACKS = [
  {
    id: "corporate-ambient",
    label: "Corporate Ambient",
    src: "/music/corporate-ambient.mp3",
  },
  {
    id: "soft-corporate",
    label: "Soft Corporate",
    src: "/music/soft-corporate.mp3",
  },
] as const;
