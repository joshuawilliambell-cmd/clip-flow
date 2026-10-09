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

/**
 * Estimate when each teammate’s name is spoken from their place in the
 * script text, then map that to the video timeline. Falls back to the
 * Allego defaults (23 / 35 / 47 / 56s) when a name is missing from the script.
 */
export function cueStartsFromScript(
  photos: TeamPhoto[],
  script: string | undefined,
  timelineDuration: number,
): number[] {
  const defaultStarts = VIDEO_TEMPLATE.defaultPhotoStartSeconds;
  const filled = photos.filter((p) => p.url);
  if (!script?.trim() || filled.length === 0 || timelineDuration <= 0) {
    return filled.map(
      (_, i) =>
        defaultStarts[Math.min(i, defaultStarts.length - 1)] ??
        defaultStarts[0],
    );
  }

  const lower = script.toLowerCase();
  let searchFrom = 0;
  return filled.map((photo, index) => {
    const name = photo.name.trim();
    let charIndex = -1;
    if (name.length >= 2) {
      const needle = name.toLowerCase();
      charIndex = lower.indexOf(needle, searchFrom);
      if (charIndex === -1) charIndex = lower.indexOf(needle);
      if (charIndex !== -1) searchFrom = charIndex + needle.length;
    }
    if (charIndex === -1) {
      return (
        defaultStarts[Math.min(index, defaultStarts.length - 1)] ??
        defaultStarts[0]
      );
    }
    // Leave a little lead-in so the face appears as the name is spoken.
    const fraction = clamp(charIndex / Math.max(script.length, 1), 0.08, 0.92);
    return fraction * timelineDuration;
  });
}

/**
 * Place filled photos when each name is cued in the script (preferred),
 * or at Allego defaults. Durations default to 10s; bars are clamped so they
 * fit without overlapping. Empty slots stay unused. Users can drag.
 */
export function autoArrangePhotos(
  photos: TeamPhoto[],
  timelineDuration: number,
  script?: string,
): TeamPhoto[] {
  if (photos.length === 0 || timelineDuration <= 0) return photos;

  const filled = photos.filter((p) => p.url);
  const empty = photos.filter((p) => !p.url);
  if (filled.length === 0) return photos;

  const defaultDur = VIDEO_TEMPLATE.defaultPhotoDurationSeconds;
  const cueStarts = cueStartsFromScript(filled, script, timelineDuration);

  // Very short videos: pack evenly from the start.
  if (timelineDuration < (cueStarts[0] ?? 23) + MIN) {
    const duration = Math.max(MIN, timelineDuration / filled.length);
    let cursor = 0;
    const packed = filled.map((photo) => {
      const start = clamp(cursor, 0, Math.max(0, timelineDuration - MIN));
      const dur = clamp(duration, MIN, timelineDuration - start);
      cursor = start + dur;
      return {
        ...photo,
        startSeconds: roundToSecond(start),
        durationSeconds: roundToSecond(dur),
      };
    });
    return [...packed, ...empty.map((p) => ({ ...p }))];
  }

  let previousEnd = 0;
  const arranged = filled.map((photo, index) => {
    const preferred = cueStarts[index] ?? VIDEO_TEMPLATE.defaultPhotoStartSeconds[0];
    let start = Math.max(preferred, previousEnd);
    start = clamp(start, 0, Math.max(0, timelineDuration - MIN));
    const duration = clamp(
      defaultDur,
      MIN,
      Math.max(MIN, timelineDuration - start),
    );
    previousEnd = start + duration;
    return {
      ...photo,
      startSeconds: roundToSecond(start),
      durationSeconds: roundToSecond(duration),
    };
  });

  return [...arranged, ...empty.map((p) => ({ ...p }))];
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
    next[0]?.startSeconds ?? VIDEO_TEMPLATE.defaultPhotoStartSeconds[0];
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

/** Minimum kept length after trim (seconds). */
export const MIN_TRIM_DURATION_SECONDS = 3;

/**
 * Clamp a trim edge. Uses 0.1s steps so short drags still shorten the clip
 * (whole-second snapping made the red handles feel broken).
 */
export function trimBounds(
  trimStart: number,
  trimEnd: number,
  sourceDuration: number,
  edge: "start" | "end",
  nextValue: number,
): { trimStart: number; trimEnd: number } {
  const minLen = MIN_TRIM_DURATION_SECONDS;
  const source = Math.max(minLen, sourceDuration);
  if (edge === "start") {
    const start = clamp(roundToSecond(nextValue), 0, trimEnd - minLen);
    return { trimStart: start, trimEnd };
  }
  const end = clamp(roundToSecond(nextValue), trimStart + minLen, source);
  return { trimStart, trimEnd: end };
}

export function getOutputDuration(
  trimStart: number,
  trimEnd: number,
): number {
  return Math.max(0, roundToSecond(trimEnd - trimStart));
}
