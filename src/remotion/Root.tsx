import { Composition } from "remotion";
import {
  defaultCompositionProps,
  IntroductionVideo,
} from "@/remotion/IntroductionVideo";
import { VIDEO_TEMPLATE } from "@/lib/template";
import type { CompositionProps } from "@/lib/types";

export const INTRO_COMPOSITION_ID = "LovesTeamIntro";

export function RemotionRoot() {
  return (
    <Composition
      id={INTRO_COMPOSITION_ID}
      component={IntroductionVideo}
      // Default for Remotion Studio only; calculateMetadata uses real props.
      durationInFrames={
        VIDEO_TEMPLATE.recommendedMaxDurationSeconds * VIDEO_TEMPLATE.fps
      }
      fps={VIDEO_TEMPLATE.fps}
      width={VIDEO_TEMPLATE.width}
      height={VIDEO_TEMPLATE.height}
      defaultProps={defaultCompositionProps}
      calculateMetadata={({ props }: { props: CompositionProps }) => {
        const durationInSeconds = Math.max(
          1,
          props.durationInSeconds || VIDEO_TEMPLATE.targetDurationSeconds,
        );
        return {
          durationInFrames: Math.round(durationInSeconds * VIDEO_TEMPLATE.fps),
          fps: VIDEO_TEMPLATE.fps,
          width: VIDEO_TEMPLATE.width,
          height: VIDEO_TEMPLATE.height,
        };
      }}
    />
  );
}
