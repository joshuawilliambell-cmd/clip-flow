import { v4 as uuid } from "uuid";
import { VIDEO_TEMPLATE, type TeamMemberCount } from "@/lib/template";
import {
  getScriptTopic,
  type ScriptTopicId,
} from "@/lib/script-topics";
import type { TeamPhoto } from "@/lib/types";

/** Build PIP photo slots from a product script's cue images. */
export function productPipPhotos(topicId: ScriptTopicId): TeamPhoto[] {
  const topic = getScriptTopic(topicId);
  if (topic.isTeamIntro) return [];
  return topic.pips.slice(0, 4).map((pip) => ({
    id: uuid(),
    url: pip.image,
    fileName: pip.image.split("/").pop() ?? pip.label,
    name: pip.cue,
    title: pip.label,
    pronoun: "" as const,
    duties: "",
    department: "",
    startSeconds: 0,
    durationSeconds: VIDEO_TEMPLATE.defaultPhotoDurationSeconds,
  }));
}

export function productPipCount(topicId: ScriptTopicId): TeamMemberCount {
  const n = productPipPhotos(topicId).length;
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 4;
}
