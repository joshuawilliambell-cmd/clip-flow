import { v4 as uuid } from "uuid";
import { VIDEO_TEMPLATE, type TeamMemberCount } from "@/lib/template";
import type { TeamPhoto } from "@/lib/types";

export function createEmptyTeamPhoto(): TeamPhoto {
  return {
    id: uuid(),
    url: null,
    fileName: "",
    name: "",
    title: "",
    pronoun: "",
    duties: "",
    department: "",
    startSeconds: 0,
    durationSeconds: VIDEO_TEMPLATE.defaultPhotoDurationSeconds,
  };
}

/** Resize the photo slot list to exactly `count`, preserving filled slots. */
export function resizeTeamSlots(
  photos: TeamPhoto[],
  count: TeamMemberCount,
): TeamPhoto[] {
  const next = photos.slice(0, count).map((p) => ({ ...p }));
  while (next.length < count) {
    next.push(createEmptyTeamPhoto());
  }
  // Revoke URLs for slots that were trimmed off — caller should do that.
  return next;
}

export type FilledTeamPhoto = TeamPhoto & { url: string };

export function filledTeamPhotos(photos: TeamPhoto[]): FilledTeamPhoto[] {
  return photos.filter((p): p is FilledTeamPhoto => p.url != null && p.url !== "");
}
