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

export function resizeThumbnailMembers(
  prev: ThumbnailMember[],
  count: number,
): ThumbnailMember[] {
  const nextCount = Math.max(1, count);
  if (prev.length === nextCount) return prev;
  if (prev.length > nextCount) {
    prev.slice(nextCount).forEach((m) => {
      if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
    });
    return prev.slice(0, nextCount);
  }
  return [...prev, ...emptyThumbnailMembers(nextCount - prev.length)];
}

export function clearThumbnailMembers(members: ThumbnailMember[]): void {
  members.forEach((m) => {
    if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
  });
}
