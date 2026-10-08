"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Download, Loader2, Mic, Music2, Volume2, VolumeX } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { MUSIC_TRACKS } from "@/lib/template";
import { exportIntroductionVideo } from "@/lib/export-video";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";

export function PreviewExportStep() {
  const {
    video,
    compositionProps,
    musicEnabled,
    musicVolume,
    videoVolume,
    musicTrackId,
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
      setStatus("Your MP4 is ready to download.");
    } catch (e) {
      console.error(e);
      setProgress(null);
      setStatus(null);
      setError(
        e instanceof Error
          ? e.message
          : "Export failed. Try a shorter clip or another browser (Chrome/Edge work best).",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-wide text-[var(--ink)] md:text-4xl">
          Preview and download
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Choose one of three music beds, balance narration vs music volume, then
          export your project as an Allego-ready MP4 (1920×1080).
        </p>
      </div>

      <VideoPreview />
      <Timeline />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl tracking-wide text-[var(--ink)]">
              Audio tracks
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Pick one background track. Your video narration stays on its own
              volume slider.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMusicEnabled(!musicEnabled)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold"
          >
            {musicEnabled ? (
              <>
                <Volume2 className="h-4 w-4" /> Music on
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" /> Music off
              </>
            )}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {MUSIC_TRACKS.map((track) => {
            const selected = musicTrackId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                disabled={!musicEnabled}
                onClick={() => setMusicTrackId(track.id)}
                className={clsx(
                  "rounded-2xl border px-4 py-4 text-left transition disabled:opacity-40",
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                    : "border-[var(--border)] bg-[var(--panel-soft)] hover:border-[var(--border-strong)]",
                )}
              >
                <div className="flex items-center gap-2">
                  <Music2
                    className={clsx(
                      "h-4 w-4",
                      selected ? "text-[var(--primary)]" : "text-[var(--muted)]",
                    )}
                  />
                  <span className="font-semibold text-[var(--ink)]">
                    {track.label}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                  {track.description}
                </p>
                {selected ? (
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                    Selected
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] p-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <Mic className="h-4 w-4 text-[var(--primary)]" />
              Video narration volume ({Math.round(videoVolume * 100)}%)
            </span>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Spoken audio from your uploaded introduction video.
            </p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={videoVolume}
              onChange={(e) => setVideoVolume(Number(e.target.value))}
              className="mt-4 w-full accent-[var(--primary)]"
            />
          </label>

          <label className="block rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] p-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <Music2 className="h-4 w-4 text-[var(--primary)]" />
              Music track volume ({Math.round(musicVolume * 100)}%)
            </span>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Background bed under narration. Default 30%.
            </p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicVolume}
              disabled={!musicEnabled}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="mt-4 w-full accent-[var(--primary)] disabled:opacity-40"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-[var(--muted)]">
          Placeholder instrumentals for this prototype. Replace with
          Love&apos;s-approved licensed tracks before production.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={autoArrange}
          disabled={photos.length === 0}
          className="rounded-xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Auto Arrange Photos
        </button>
        <button
          type="button"
          onClick={resetTimeline}
          disabled={photos.length === 0}
          className="rounded-xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Reset Timeline
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-white to-[#fff5f5] p-5">
        <h3 className="font-display text-xl tracking-wide text-[var(--ink)]">
          Export project to MP4
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Renders your trimmed video, photo overlays, names/titles, and mixed
          audio into a single 1920×1080 file.
        </p>
        <button
          type="button"
          disabled={!video || generating}
          onClick={() => void exportMp4()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-4 text-lg font-bold text-white shadow-[0_16px_40px_rgba(200,16,46,0.35)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Exporting MP4…
            </>
          ) : (
            "Export to MP4"
          )}
        </button>

        {progress !== null ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm text-[var(--muted)]">
              <span>{status}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download="loves-team-introduction.mp4"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" /> Download MP4
          </a>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-sm text-[var(--muted)]">
          Download the MP4, then upload it manually to Allego. Corporate SSO and
          direct Allego publishing are planned for a later phase.
        </p>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-xl border border-[var(--border-strong)] bg-white px-5 py-3 text-sm font-semibold"
        >
          Back
        </button>
      </div>
    </div>
  );
}
