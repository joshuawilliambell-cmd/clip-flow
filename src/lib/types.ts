export type TeamPhoto = {
  id: string;
  /** Null until the employee uploads a headshot into this slot. */
  url: string | null;
  fileName: string;
  name: string;
  title: string;
  department: string;
  startSeconds: number;
  durationSeconds: number;
};

export type SourceVideo = {
  url: string;
  fileName: string;
  durationSeconds: number;
  width: number;
  height: number;
};

export type MusicTrack = {
  id: string;
  label: string;
  src: string;
};

export type StudioStep = 1 | 2 | 3;

import type { PipSide } from "@/lib/template";

export type CompositionProps = {
  videoSrc: string;
  trimStartSeconds: number;
  durationInSeconds: number;
  photos: Array<{
    id: string;
    src: string;
    name: string;
    title: string;
    department: string;
    startSeconds: number;
    durationSeconds: number;
  }>;
  pipSide: PipSide;
  /** Optional Love's Team thumbnail shown for the first second. */
  introThumbnailSrc: string | null;
  introThumbnailEnabled: boolean;
  videoVolume: number;
  musicSrc: string | null;
  musicVolume: number;
  musicEnabled: boolean;
};
