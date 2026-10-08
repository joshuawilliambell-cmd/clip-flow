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
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { MUSIC_TRACKS } from "@/lib/template";
import { THUMBNAIL_TEMPLATE } from "@/lib/thumbnail-template";
import { exportIntroductionVideo } from "@/lib/export-video";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";

const MUSIC_SAMPLE_SECONDS = 30;

export function PreviewExportStep({
  onCreateThumbnail,
}: {
  onCreateThumbnail?: () => void;
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
    autoArrange,
    resetTimeline,
    photos,
  } = useStudio();

  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [samplingTrackId, setSamplingTrackId] = useState<string | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const sampleTimerRef = useRef<number | null>(null);

  const stopMusicSample = () => {
    if (sampleTimerRef.current !== null) {
      window.clearTimeout(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
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
    const audio = new Audio(src);
    audio.volume = Math.min(1, Math.max(0.15, musicVolume));
    sampleAudioRef.current = audio;
    setSamplingTrackId(trackId);
    void audio.play().catch(() => {
      setSamplingTrackId(null);
      sampleAudioRef.current = null;
    });
    sampleTimerRef.current = window.setTimeout(() => {
      stopMusicSample();
    }, MUSIC_SAMPLE_SECONDS * 1000);
    audio.onended = () => stopMusicSample();
  };

  useEffect(() => {
    return () => {
      if (sampleTimerRef.current !== null) {
        window.clearTimeout(sampleTimerRef.current);
      }
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
    };
  }, []);
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
          <h2 className="font-display text-4xl tracking-wide text-[var(--ink)] md:text-5xl">
            Step 3: Finish and download
          </h2>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">
            Pick a music track, set the volumes, watch the preview, then export
            your MP4.
          </p>
        </div>
        <HelpTip title="What do I do on this page?" size="lg">
          <p>
            <strong>1.</strong> Optional: turn the opening team thumbnail on or
            off (first {THUMBNAIL_TEMPLATE.introDurationSeconds} second only).
          </p>
          <p>
            <strong>2.</strong> Tap one of the four music cards (or turn music
            off).
          </p>
          <p>
            <strong>3.</strong> Move the two volume sliders until speech is easy
            to hear and music is softer in the background.
          </p>
          <p>
            <strong>4.</strong> Tap Play to preview — the thumbnail flashes at
            the start if enabled.
          </p>
          <p>
            <strong>5.</strong> Tap Export to MP4, wait for the green progress to
            finish, then tap Download MP4.
          </p>
        </HelpTip>
      </div>

      <div className="how-banner">
        Keep your voice louder than the music. Voice starts at 50% (raise it if
        you need to) and music near 30%, then adjust.
      </div>

      <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="text-2xl font-bold text-[var(--ink)]">
                Opening thumbnail (optional)
              </h3>
              <p className="mt-1 text-lg text-[var(--muted)]">
                Shows for {THUMBNAIL_TEMPLATE.introDurationSeconds} second at
                the very start when a customer presses play, then disappears.
              </p>
            </div>
            <HelpTip title="Opening thumbnail">
              <p>
                This is the Love&apos;s Team image from the Team thumbnail tool.
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
                    ? "Thumbnail on (1s at start) ✓"
                    : "Thumbnail off"}
                </button>
                <button
                  type="button"
                  onClick={clearIntroThumbnail}
                  className="btn-secondary"
                >
                  Remove thumbnail
                </button>
                {onCreateThumbnail ? (
                  <button
                    type="button"
                    onClick={onCreateThumbnail}
                    className="btn-secondary"
                  >
                    Edit in Team thumbnail
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
              No opening thumbnail yet. You can skip this, or create one in{" "}
              <strong>Team thumbnail</strong> and tap{" "}
              <strong>Add to start of video</strong>.
            </p>
            {onCreateThumbnail ? (
              <button
                type="button"
                onClick={onCreateThumbnail}
                className="btn-yellow mt-4"
              >
                <ImageIcon className="h-5 w-5" />
                Create team thumbnail
              </button>
            ) : null}
          </div>
        )}
      </section>

      <VideoPreview />
      <Timeline />

      <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="text-2xl font-bold text-[var(--ink)]">
                Choose background music
              </h3>
              <p className="mt-1 text-lg text-[var(--muted)]">
                Tap a track to select it. Use the Play / 30s button to hear a
                thirty-second sample.
              </p>
            </div>
            <HelpTip title="Background music">
              <p>There are four Corporate Chill music choices.</p>
              <p>Tap a card to select it. The yellow border means “selected.”</p>
              <p>
                Tap the small Play button on a track for a {MUSIC_SAMPLE_SECONDS}
                -second sample before you choose.
              </p>
              <p>
                Tap Music off if you want only your voice with no background
                music.
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
                <Volume2 className="h-5 w-5" /> Music on
              </>
            ) : (
              <>
                <VolumeX className="h-5 w-5" /> Music off
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
                  "min-h-[8rem] rounded-2xl border-2 px-4 py-4 text-left transition",
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
                    className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--olive)]"
                  >
                    <div className="flex items-center gap-2">
                      <Music2 className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                      <span className="text-lg font-bold text-[var(--ink)]">
                        {track.label}
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
                    {sampling ? "Stop" : "30s"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] p-4">
            <span className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
              <Mic className="h-5 w-5 text-[var(--primary)]" />
              Your voice volume: {Math.round(videoVolume * 100)}%
              <HelpTip title="Your voice volume">
                <p>This controls how loud your talking video sounds.</p>
                <p>Drag right to make your voice louder.</p>
                <p>Drag left to make your voice quieter.</p>
                <p>
                  Starts at 50% so playback is not too loud. Raise it if your
                  voice is hard to hear.
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

          <label className="block rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] p-4">
            <span className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
              <Music2 className="h-5 w-5 text-[var(--primary)]" />
              Music volume: {Math.round(musicVolume * 100)}%
              <HelpTip title="Music volume">
                <p>This controls how loud the background music is.</p>
                <p>Keep it quieter than your voice so customers can hear you.</p>
                <p>A good starting point is about 30%.</p>
              </HelpTip>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicVolume}
              disabled={!musicEnabled}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="mt-5 h-3 w-full accent-[var(--primary)] disabled:opacity-40"
              aria-label="Music volume"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={autoArrange}
          disabled={photos.length === 0}
          className="btn-secondary"
        >
          Auto Arrange Photos
        </button>
        <button
          type="button"
          onClick={resetTimeline}
          disabled={photos.length === 0}
          className="btn-secondary"
        >
          Reset Timeline
        </button>
      </div>

      <div className="rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-[var(--ink)]">
              Export your video to MP4
            </h3>
            <p className="mt-1 text-lg text-[var(--muted)]">
              Creates one finished file you can upload to Allego.
            </p>
          </div>
          <HelpTip title="Export to MP4" size="lg">
            <p>Tap Export to MP4 and wait. A progress bar shows the work.</p>
            <p>When it finishes, tap Download MP4 to save the file.</p>
            <p>
              Next, upload that MP4 in Allego and add it to a digital sales room
              you can share with customers. This tool does not upload to Allego
              by itself yet.
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
            "Export to MP4"
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
          <a href={downloadUrl} download="loves-team-introduction.mp4" className="btn-yellow mt-4 inline-flex">
            <Download className="h-5 w-5" /> Download MP4
          </a>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 rounded-2xl border-2 border-[var(--ink)] bg-white px-4 py-4">
          <p className="text-lg font-bold text-[var(--ink)]">After you download</p>
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-base leading-relaxed text-[var(--ink)] md:text-lg">
            <li>Open Allego and upload your MP4.</li>
            <li>Add the video to a digital sales room.</li>
            <li>Share that sales room link with your customer.</li>
          </ol>
        </div>
      </div>

      <div className="flex justify-start border-t-2 border-[var(--border)] pt-4">
        <button type="button" onClick={() => setStep(2)} className="btn-secondary">
          Back
        </button>
      </div>
    </div>
  );
}
