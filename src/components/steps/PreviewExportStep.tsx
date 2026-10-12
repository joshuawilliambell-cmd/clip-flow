"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  Download,
  ImageIcon,
  Loader2,
  Mic,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { MUSIC_TRACKS, VIDEO_TEMPLATE } from "@/lib/template";
import { THUMBNAIL_TEMPLATE } from "@/lib/thumbnail-template";
import { exportIntroductionVideo } from "@/lib/export-video";
import {
  VideoPreview,
  type VideoPreviewHandle,
} from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { VideoOrientationPicker } from "@/components/VideoOrientationPicker";
import { HelpTip } from "@/components/HelpTip";
import { filledTeamPhotos } from "@/lib/team-slots";
import {
  orientationFileSuffix,
  orientationLabel,
} from "@/lib/orientation-ui";
import { createQuietAudio, type QuietAudio } from "@/lib/quiet-audio";

const MUSIC_SAMPLE_SECONDS = 30;

export function PreviewExportStep({
  onEditThumbnail,
}: {
  onEditThumbnail?: () => void;
} = {}) {
  const {
    video,
    compositionProps,
    musicEnabled,
    musicVolume,
    videoVolume,
    musicTrackId,
    introThumbnailUrl,
    introThumbnailEnabled,
    setIntroThumbnailEnabled,
    clearIntroThumbnail,
    setMusicEnabled,
    setMusicVolume,
    setVideoVolume,
    setMusicTrackId,
    setStep,
    beginReplaceVideo,
    photos,
    teamMemberCount,
    videoOrientation,
  } = useStudio();

  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [samplingTrackId, setSamplingTrackId] = useState<string | null>(null);
  const sampleAudioRef = useRef<QuietAudio | null>(null);
  const sampleTimerRef = useRef<number | null>(null);
  const previewRef = useRef<VideoPreviewHandle>(null);

  const filledCount = filledTeamPhotos(photos).length;

  const stopMusicSample = () => {
    if (sampleTimerRef.current !== null) {
      window.clearTimeout(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    if (sampleAudioRef.current) {
      sampleAudioRef.current.dispose();
      sampleAudioRef.current = null;
    }
    setSamplingTrackId(null);
  };

  const playMusicSample = (trackId: string, src: string) => {
    if (samplingTrackId === trackId) {
      stopMusicSample();
      return;
    }
    stopMusicSample();
    // Web Audio GainNode — HTMLAudio volume is ignored on iPhone.
    const audio = createQuietAudio(src, musicVolume, {
      loop: false,
      onEnded: () => stopMusicSample(),
    });
    sampleAudioRef.current = audio;
    setSamplingTrackId(trackId);
    void audio.play().catch(() => {
      stopMusicSample();
    });
    sampleTimerRef.current = window.setTimeout(() => {
      stopMusicSample();
    }, MUSIC_SAMPLE_SECONDS * 1000);
  };

  useEffect(() => {
    return () => {
      if (sampleTimerRef.current !== null) {
        window.clearTimeout(sampleTimerRef.current);
      }
      if (sampleAudioRef.current) {
        sampleAudioRef.current.dispose();
        sampleAudioRef.current = null;
      }
    };
  }, []);

  // Keep an in-progress sample at the studio fader level (esp. on iPhone).
  useEffect(() => {
    sampleAudioRef.current?.setVolume(musicVolume);
  }, [musicVolume]);

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const generating = progress !== null && progress < 1;

  const exportMp4 = async () => {
    if (!compositionProps || !video) return;
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setProgress(0);
    setStatus("Starting MP4 export…");
    try {
      const blob = await exportIntroductionVideo(compositionProps, (p) => {
        setProgress(p.progress);
        setStatus(p.message);
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(1);
      setStatus("Your MP4 is ready. Tap Download MP4 below.");
    } catch (e) {
      console.error(e);
      setProgress(null);
      setStatus(null);
      setError(
        e instanceof Error
          ? e.message
          : "Export failed. Try Chrome or Edge, or use a shorter video.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="step-title">Step 2: Finish And Download</h2>
          <p className="mt-2 text-[15px] font-medium text-[var(--muted)]">
            Finish your video here — confirm landscape or portrait, place
            teammate photos, trim, add quiet music, then export an MP4.
          </p>
        </div>
        <HelpTip title="What Do I Do On This Page?" size="lg">
          <p>
            Start with the <strong>video preview</strong>. The dark bar right
            under it trims and scrubs your talking video. Use the timeline below
            for teammate photo bars.
          </p>
          <p>
            Teammate photos are timed to when their name appears in your script.
            You can still drag the bars if you need to fine-tune.
          </p>
          <p>
            Don&apos;t like this take? Use{" "}
            <strong>Record or upload a new video</strong> — your names, photos,
            and thumbnail stay saved.
          </p>
        </HelpTip>
      </div>

      {video ? (
        <div className="how-banner flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1">
            <strong>Don&apos;t like this take?</strong> Record or upload a new
            talking video. Your names, teammate photos, thumbnail, and music
            settings stay — only the video is replaced.
          </p>
          <button
            type="button"
            onClick={beginReplaceVideo}
            className="btn-secondary shrink-0"
          >
            <RefreshCw className="h-5 w-5" />
            Click Here to Record or Upload a New Video
          </button>
        </div>
      ) : null}

      <VideoOrientationPicker compact />

      {/* Preview (filmstrip) with Fine-tune trim flush underneath. */}
      <section className="section-card space-y-2 bg-white p-3 md:p-4">
        <VideoPreview ref={previewRef} />
        <Timeline
          onRestart={() => previewRef.current?.restart()}
          onFullScreen={() => void previewRef.current?.fullScreen()}
        />
      </section>

      <section className="section-card bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                Opening Thumbnail
              </h3>
              <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
                Optional · {THUMBNAIL_TEMPLATE.introDurationSeconds}s at start
              </p>
            </div>
            <HelpTip title="Opening thumbnail">
              <p>
                This is the Love&apos;s Team image from Step 1 (Team thumbnail).
              </p>
              <p>
                It is optional. Leave it off if you only want your talking video.
              </p>
              <p>
                When on, customers see the team card for one quick second, then
                your video continues.
              </p>
            </HelpTip>
          </div>
        </div>

        {introThumbnailUrl ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,14rem)_1fr] md:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={introThumbnailUrl}
              alt="Opening team thumbnail"
              className="w-full rounded-xl border-2 border-[var(--ink)]"
            />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setIntroThumbnailEnabled(!introThumbnailEnabled)
                  }
                  className={clsx(
                    "btn-secondary",
                    introThumbnailEnabled && "bg-[var(--yellow)]",
                  )}
                >
                  <ImageIcon className="h-5 w-5" />
                  {introThumbnailEnabled
                    ? "Click Here — Thumbnail On (1s) ✓"
                    : "Click Here — Thumbnail Off"}
                </button>
                <button
                  type="button"
                  onClick={clearIntroThumbnail}
                  className="btn-secondary"
                >
                  Click Here to Remove Thumbnail
                </button>
                {onEditThumbnail ? (
                  <button
                    type="button"
                    onClick={onEditThumbnail}
                    className="btn-secondary"
                  >
                    Click Here to Edit In Step 1
                  </button>
                ) : null}
              </div>
              <p className="text-base text-[var(--muted)]">
                {introThumbnailEnabled
                  ? "Preview from the start of the timeline to see the 1-second opening card."
                  : "Thumbnail is saved but not shown in the video. Tap Thumbnail on to include it."}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border-2 border-dashed border-[var(--ink)] bg-[var(--panel-soft)] px-4 py-5">
            <p className="text-lg text-[var(--ink)]">
              No opening thumbnail yet. You can skip this, or go back to Step 1,
              build the Love&apos;s Team thumbnail, and tap{" "}
              <strong>Add to start of video</strong>.
            </p>
            {onEditThumbnail ? (
              <button
                type="button"
                onClick={onEditThumbnail}
                className="btn-yellow mt-4"
              >
                <ImageIcon className="h-5 w-5" />
                Click Here to Go To Step 1 Thumbnail
              </button>
            ) : null}
          </div>
        )}
      </section>

      {teamMemberCount > 0 ? (
        <div className="how-banner">
          <strong>
            {filledCount} of {teamMemberCount} teammate photos ready.
          </strong>{" "}
          Use the two small frames in <strong>Fine-tune trim</strong> to move
          team member photos to the left or right corner. Drag the colored bars
          on the photo timeline to change when each face appears.
        </div>
      ) : (
        <div className="how-banner">
          No teammate corner photos for this project. Trim your video above, add
          music if you like, then export.
        </div>
      )}

      <section className="section-card bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                Background Music
              </h3>
              <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
                Quiet under your voice · default{" "}
                {Math.round(VIDEO_TEMPLATE.defaultMusicVolume * 100)}% · max{" "}
                {Math.round(VIDEO_TEMPLATE.maxMusicVolume * 100)}% · same on
                phone and computer
              </p>
            </div>
            <HelpTip title="Background Music">
              <p>Pick a track or turn music off.</p>
              <p>
                Music stays very quiet so customers hear your voice. Max is{" "}
                {Math.round(VIDEO_TEMPLATE.maxMusicVolume * 100)}%.
              </p>
            </HelpTip>
          </div>
          <button
            type="button"
            onClick={() => {
              stopMusicSample();
              setMusicEnabled(!musicEnabled);
            }}
            className="btn-secondary"
          >
            {musicEnabled ? (
              <>
                <Volume2 className="h-5 w-5" /> Click Here — Music On
              </>
            ) : (
              <>
                <VolumeX className="h-5 w-5" /> Click Here — Music Off
              </>
            )}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MUSIC_TRACKS.map((track) => {
            const selected = musicTrackId === track.id;
            const sampling = samplingTrackId === track.id;
            return (
              <div
                key={track.id}
                className={clsx(
                  "min-h-[8rem] rounded-[var(--radius-md)] border px-4 py-4 text-left transition",
                  !musicEnabled && "opacity-40",
                  selected
                    ? "border-[var(--ink)] bg-[var(--yellow)]"
                    : "border-[var(--border-strong)] bg-[var(--panel-soft)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    disabled={!musicEnabled}
                    onClick={() => setMusicTrackId(track.id)}
                    className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]"
                  >
                    <div className="flex items-center gap-2">
                      <Music2 className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                      <span className="text-lg font-bold text-[var(--ink)]">
                        Click Here for {track.label}
                      </span>
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-[var(--muted)]">
                      {track.description}
                    </p>
                    {selected ? (
                      <p className="mt-3 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
                        Selected ✓
                      </p>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => playMusicSample(track.id, track.src)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-[var(--ink)] bg-white px-3 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[var(--panel-soft)]"
                    aria-label={
                      sampling
                        ? `Stop ${track.label} sample`
                        : `Play 30 second sample of ${track.label}`
                    }
                    title={`Play ${MUSIC_SAMPLE_SECONDS}s sample`}
                  >
                    {sampling ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                    {sampling ? "Stop" : "Click Here · 30s"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block section-card bg-[var(--panel-soft)] p-4">
            <span className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
              <Mic className="h-5 w-5 text-[var(--primary)]" />
              Your Voice Volume: {Math.round(videoVolume * 100)}%
              <HelpTip title="Your Voice Volume">
                <p>This controls how loud your talking video sounds.</p>
                <p>Drag right to make your voice louder.</p>
                <p>Drag left to make your voice quieter.</p>
                <p>
                  Starts at 50% so playback is not too loud. Raise it if your
                  voice is hard to hear. Works on phone and computer — tap Play
                  after you change it to hear the new level.
                </p>
              </HelpTip>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={videoVolume}
              onChange={(e) => setVideoVolume(Number(e.target.value))}
              className="mt-5 h-3 w-full accent-[var(--primary)]"
              aria-label="Your voice volume"
            />
          </label>

          <label className="block section-card bg-[var(--panel-soft)] p-4">
            <span className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
              <Music2 className="h-5 w-5 text-[var(--primary)]" />
              Music Volume: {Math.round(musicVolume * 100)}%
              <HelpTip title="Music Volume">
                <p>This controls how loud the background music is.</p>
                <p>
                  Default is {Math.round(VIDEO_TEMPLATE.defaultMusicVolume * 100)}%.
                  You can raise it up to{" "}
                  {Math.round(VIDEO_TEMPLATE.maxMusicVolume * 100)}% only — your
                  voice should stay louder than the music.
                </p>
              </HelpTip>
            </span>
            <input
              type="range"
              min={0}
              max={VIDEO_TEMPLATE.maxMusicVolume}
              step={0.01}
              value={Math.min(musicVolume, VIDEO_TEMPLATE.maxMusicVolume)}
              disabled={!musicEnabled}
              onChange={(e) =>
                setMusicVolume(
                  Math.min(
                    VIDEO_TEMPLATE.maxMusicVolume,
                    Number(e.target.value),
                  ),
                )
              }
              className="mt-5 h-3 w-full accent-[var(--primary)] disabled:opacity-40"
              aria-label="Music volume"
            />
          </label>
        </div>
      </section>

      <div className="section-card bg-[var(--panel-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-[var(--ink)]">
              Export your video to MP4
            </h3>
            <p className="mt-1 text-lg text-[var(--muted)]">
              Creates one finished{" "}
              <strong>{orientationLabel(videoOrientation)}</strong> MP4 you can
              download and share with customers.
            </p>
          </div>
          <HelpTip title="Export to MP4" size="lg">
            <p>Tap Export to MP4 and wait. A progress bar shows the work.</p>
            <p>When it finishes, tap Download MP4 to save the file.</p>
            <p>
              Share that MP4 with your customer however your team usually
              shares videos — email, chat, or your company tools.
            </p>
            <p>Chrome or Edge works best for exporting.</p>
          </HelpTip>
        </div>
        <button
          type="button"
          disabled={!video || generating}
          onClick={() => void exportMp4()}
          className="btn-primary mt-4 min-w-[16rem] text-xl"
        >
          {generating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" /> Exporting MP4…
            </>
          ) : (
            "Click Here to Export To MP4"
          )}
        </button>

        {progress !== null ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-base font-medium text-[var(--ink)]">
              <span>{status}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full border-2 border-[var(--ink)] bg-white">
              <div
                className="h-full bg-[var(--primary)] transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={`loves-team-introduction-${orientationFileSuffix(videoOrientation)}.mp4`}
            className="btn-yellow mt-4 inline-flex"
          >
            <Download className="h-5 w-5" /> Click Here to Download MP4
          </a>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 section-card bg-white px-4 py-4">
          <p className="text-lg font-bold text-[var(--ink)]">After you download</p>
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-base leading-relaxed text-[var(--ink)] md:text-lg">
            <li>Find the MP4 in your Downloads folder (or Files app on phone).</li>
            <li>Open it once to confirm it looks and sounds right.</li>
            <li>Share the file with your customer using your usual tools.</li>
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap justify-start gap-3 border-t-2 border-[var(--border)] pt-4">
        <button type="button" onClick={() => setStep(1)} className="btn-secondary">
          Click Here to Go Back
        </button>
        {video ? (
          <button
            type="button"
            onClick={beginReplaceVideo}
            className="btn-secondary"
          >
            <RefreshCw className="h-5 w-5" />
            Click Here to Record or Upload a New Video
          </button>
        ) : null}
      </div>
    </div>
  );
}
