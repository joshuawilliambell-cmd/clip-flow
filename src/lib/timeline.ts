import { VIDEO_TEMPLATE } from "@/lib/template";
import type { TeamPhoto } from "@/lib/types";

const MIN = VIDEO_TEMPLATE.minPhotoDurationSeconds;

export function roundToSecond(value: number): number {
  return Math.round(value * 10) / 10;
}

export function snapToSecond(value: number): number {
  return Math.round(value);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const tenths = Math.floor((safe % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${tenths}`;
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Place photos sequentially starting at the template offset. */
export function autoArrangePhotos(
  photos: TeamPhoto[],
  timelineDuration: number,
): TeamPhoto[] {
  if (photos.length === 0 || timelineDuration <= 0) return photos;

  const start = Math.min(
    VIDEO_TEMPLATE.photoStartOffsetSeconds,
    Math.max(0, timelineDuration - MIN),
  );
  const available = Math.max(0, timelineDuration - start);
  const defaultDur = VIDEO_TEMPLATE.defaultPhotoDurationSeconds;

  let duration: number = defaultDur;
  if (photos.length * defaultDur > available) {
    duration = Math.max(MIN, available / photos.length);
  }

  let cursor = start;
  return photos.map((photo) => {
    const remaining = Math.max(0, timelineDuration - cursor);
    const dur = Math.min(duration, remaining);
    const next: TeamPhoto = {
      ...photo,
      startSeconds: roundToSecond(cursor),
      durationSeconds: roundToSecond(Math.max(MIN, dur)),
    };
    cursor = next.startSeconds + next.durationSeconds;
    if (cursor > timelineDuration) {
      next.durationSeconds = roundToSecond(
        Math.max(MIN, timelineDuration - next.startSeconds),
      );
      cursor = next.startSeconds + next.durationSeconds;
    }
    return next;
  });
}

export function sortPhotosByStart(photos: TeamPhoto[]): TeamPhoto[] {
  return [...photos].sort((a, b) => a.startSeconds - b.startSeconds);
}

type NeighborBounds = {
  minStart: number;
  maxEnd: number;
};

export function getNeighborBounds(
  photos: TeamPhoto[],
  photoId: string,
  timelineDuration: number,
): NeighborBounds {
  const sorted = sortPhotosByStart(photos);
  const index = sorted.findIndex((p) => p.id === photoId);
  if (index === -1) {
    return { minStart: 0, maxEnd: timelineDuration };
  }

  const prev = sorted[index - 1];
  const next = sorted[index + 1];
  return {
    minStart: prev ? prev.startSeconds + prev.durationSeconds : 0,
    maxEnd: next ? next.startSeconds : timelineDuration,
  };
}

/** Move a photo block without changing duration; snap and avoid overlaps. */
export function movePhotoBlock(
  photos: TeamPhoto[],
  photoId: string,
  nextStart: number,
  timelineDuration: number,
): TeamPhoto[] {
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return photos;

  const { minStart, maxEnd } = getNeighborBounds(
    photos,
    photoId,
    timelineDuration,
  );
  const maxStart = Math.max(minStart, maxEnd - photo.durationSeconds);
  const snapped = snapToSecond(nextStart);
  const start = clamp(snapped, minStart, maxStart);

  return photos.map((p) =>
    p.id === photoId ? { ...p, startSeconds: start } : p,
  );
}

/** Resize from left edge; preserves end when possible. */
export function resizePhotoStart(
  photos: TeamPhoto[],
  photoId: string,
  nextStart: number,
  timelineDuration: number,
): TeamPhoto[] {
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return photos;

  const end = photo.startSeconds + photo.durationSeconds;
  const { minStart } = getNeighborBounds(photos, photoId, timelineDuration);
  const maxStart = end - MIN;
  const start = clamp(snapToSecond(nextStart), minStart, maxStart);
  const duration = roundToSecond(end - start);

  return photos.map((p) =>
    p.id === photoId
      ? { ...p, startSeconds: start, durationSeconds: duration }
      : p,
  );
}

/** Resize from right edge. */
export function resizePhotoEnd(
  photos: TeamPhoto[],
  photoId: string,
  nextEnd: number,
  timelineDuration: number,
): TeamPhoto[] {
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return photos;

  const { maxEnd } = getNeighborBounds(photos, photoId, timelineDuration);
  const minEnd = photo.startSeconds + MIN;
  const end = clamp(snapToSecond(nextEnd), minEnd, maxEnd);
  const duration = roundToSecond(end - photo.startSeconds);

  return photos.map((p) =>
    p.id === photoId ? { ...p, durationSeconds: duration } : p,
  );
}

/** Reorder photos while preserving each duration; pack sequentially from first start. */
export function reorderPhotos(
  photos: TeamPhoto[],
  fromId: string,
  toId: string,
  timelineDuration: number,
): TeamPhoto[] {
  if (fromId === toId) return photos;
  const sorted = sortPhotosByStart(photos);
  const fromIndex = sorted.findIndex((p) => p.id === fromId);
  const toIndex = sorted.findIndex((p) => p.id === toId);
  if (fromIndex < 0 || toIndex < 0) return photos;

  const next = [...sorted];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  const baseStart =
    next[0]?.startSeconds ?? VIDEO_TEMPLATE.photoStartOffsetSeconds;
  let cursor = Math.min(baseStart, Math.max(0, timelineDuration - MIN));

  return next.map((photo) => {
    const duration = Math.min(
      photo.durationSeconds,
      Math.max(MIN, timelineDuration - cursor),
    );
    const placed: TeamPhoto = {
      ...photo,
      startSeconds: roundToSecond(cursor),
      durationSeconds: roundToSecond(duration),
    };
    cursor = placed.startSeconds + placed.durationSeconds;
    return placed;
  });
}

export function trimBounds(
  trimStart: number,
  trimEnd: number,
  sourceDuration: number,
  edge: "start" | "end",
  nextValue: number,
): { trimStart: number; trimEnd: number } {
  const minLen = 3;
  if (edge === "start") {
    const start = clamp(snapToSecond(nextValue), 0, trimEnd - minLen);
    return { trimStart: start, trimEnd };
  }
  const end = clamp(
    snapToSecond(nextValue),
    trimStart + minLen,
    sourceDuration,
  );
  return { trimStart, trimEnd: end };
}

export function getOutputDuration(
  trimStart: number,
  trimEnd: number,
): number {
  return Math.max(0, roundToSecond(trimEnd - trimStart));
}
