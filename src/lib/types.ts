export type TeamPhoto = {
  id: string;
  url: string;
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
  videoVolume: number;
  musicSrc: string | null;
  musicVolume: number;
  musicEnabled: boolean;
};
