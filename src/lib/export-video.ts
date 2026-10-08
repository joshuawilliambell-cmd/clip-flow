import { renderMediaOnWeb } from "@remotion/web-renderer";
import { IntroductionVideo } from "@/remotion/IntroductionVideo";
import { VIDEO_TEMPLATE } from "@/lib/template";
import type { CompositionProps } from "@/lib/types";

export type ExportProgress = {
  progress: number;
  message: string;
};

export async function exportIntroductionVideo(
  props: CompositionProps,
  onProgress?: (p: ExportProgress) => void,
): Promise<Blob> {
  onProgress?.({ progress: 0.02, message: "Preparing your video…" });

  const durationInFrames = Math.max(
    1,
    Math.round(props.durationInSeconds * VIDEO_TEMPLATE.fps),
  );

  const result = await renderMediaOnWeb({
    composition: {
      component: IntroductionVideo,
      durationInFrames,
      fps: VIDEO_TEMPLATE.fps,
      width: VIDEO_TEMPLATE.width,
      height: VIDEO_TEMPLATE.height,
      id: "LovesTeamIntro",
      defaultProps: props,
    },
    inputProps: props,
    container: "mp4",
    videoCodec: "h264",
    onProgress: ({ progress }) => {
      onProgress?.({
        progress: Math.min(0.99, Math.max(0.02, progress)),
        message:
          progress < 0.95
            ? `Rendering… ${Math.round(progress * 100)}%`
            : "Finishing your download…",
      });
    },
  });

  onProgress?.({ progress: 0.99, message: "Packaging MP4…" });
  const blob = await result.getBlob();
  onProgress?.({ progress: 1, message: "Ready to download" });
  return blob;
}
