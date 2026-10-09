import { v4 as uuid } from "uuid";
import {
  SPEAKER_THUMBNAIL_ID,
  defaultPhotoFit,
  type ThumbnailMember,
} from "@/lib/thumbnail-template";

function emptySpeakerMember(): ThumbnailMember {
  return {
    id: SPEAKER_THUMBNAIL_ID,
    photoUrl: null,
    name: "",
    title: "",
    photoFit: defaultPhotoFit(),
  };
}

function emptyTeammateMember(): ThumbnailMember {
  return {
    id: uuid(),
    photoUrl: null,
    name: "",
    title: "",
    photoFit: defaultPhotoFit(),
  };
}

/** Speaker card first, then one slot per teammate count (0 teammates → speaker only). */
export function emptyThumbnailMembers(teammateCount: number): ThumbnailMember[] {
  const teammates = Array.from(
    { length: Math.max(0, teammateCount) },
    () => emptyTeammateMember(),
  );
  return [emptySpeakerMember(), ...teammates];
}

/**
 * Resize teammate slots after the fixed speaker card.
 * Photo URLs for teammates come from the roster; speaker photo is owned separately.
 */
export function resizeThumbnailMembers(
  prev: ThumbnailMember[],
  teammateCount: number,
): ThumbnailMember[] {
  const nextTeammateCount = Math.max(0, teammateCount);
  const speaker =
    prev.find((m) => m.id === SPEAKER_THUMBNAIL_ID) ?? emptySpeakerMember();
  const teammates = prev.filter((m) => m.id !== SPEAKER_THUMBNAIL_ID);

  if (teammates.length === nextTeammateCount) {
    return [speaker, ...teammates];
  }
  if (teammates.length > nextTeammateCount) {
    return [speaker, ...teammates.slice(0, nextTeammateCount)];
  }
  return [
    speaker,
    ...teammates,
    ...Array.from(
      { length: nextTeammateCount - teammates.length },
      () => emptyTeammateMember(),
    ),
  ];
}

/** No-op cleanup — roster / speaker fields own headshot object URLs. */
export function clearThumbnailMembers(_members: ThumbnailMember[]): void {
  // Intentionally empty.
}
