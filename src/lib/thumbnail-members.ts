import { v4 as uuid } from "uuid";
import {
  defaultPhotoFit,
  type ThumbnailMember,
} from "@/lib/thumbnail-template";

export function emptyThumbnailMembers(count: number): ThumbnailMember[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    id: uuid(),
    photoUrl: null,
    name: "",
    title: "",
    photoFit: defaultPhotoFit(),
  }));
}

/**
 * Resize thumbnail slots. Photo URLs come from the Your teammates roster,
 * so we never revoke them here.
 */
export function resizeThumbnailMembers(
  prev: ThumbnailMember[],
  count: number,
): ThumbnailMember[] {
  const nextCount = Math.max(1, count);
  if (prev.length === nextCount) return prev;
  if (prev.length > nextCount) return prev.slice(0, nextCount);
  return [...prev, ...emptyThumbnailMembers(nextCount - prev.length)];
}

/** No-op cleanup — roster owns headshot object URLs. */
export function clearThumbnailMembers(_members: ThumbnailMember[]): void {
  // Intentionally empty.
}
