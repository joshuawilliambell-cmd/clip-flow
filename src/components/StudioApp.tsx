"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Clapperboard, ImageIcon } from "lucide-react";
import { StudioProvider, useStudio } from "@/lib/studio-context";
import { StepIndicator } from "@/components/StepIndicator";
import { HelpTip } from "@/components/HelpTip";
import { PurposeGuide } from "@/components/PurposeGuide";
import { ThumbnailCreator } from "@/components/ThumbnailCreator";
import { StartOverButton } from "@/components/StartOverButton";
import { VideoUploadStep } from "@/components/steps/VideoUploadStep";
import { TeamPhotosStep } from "@/components/steps/TeamPhotosStep";
import { PreviewExportStep } from "@/components/steps/PreviewExportStep";

type AppMode = "video" | "thumbnail";

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}) {
  return (
    <div className="studio-panel mb-6 p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <p className="text-lg font-extrabold text-[var(--ink)]">
          What do you want to make?
        </p>
        <HelpTip title="Video or thumbnail?">
          <p>
            <strong>Team intro video</strong> builds the ~60 second Allego video
            with your talking clip and teammate photo overlays.
          </p>
          <p>
            <strong>Team thumbnail</strong> builds a red, yellow, and orange
            Love&apos;s Team image with up to four headshots. Download a PNG or
            add it as a 1-second opening card on your intro video.
          </p>
        </HelpTip>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("video")}
          className={clsx(
            "flex min-h-[5.5rem] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--olive)]",
            mode === "video"
              ? "border-[var(--ink)] bg-[var(--yellow-bright)]"
              : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white">
            <Clapperboard className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-xl font-extrabold text-[var(--ink)]">
              Team intro video
            </span>
            <span className="block text-base font-semibold text-[var(--muted)]">
              Record/upload video + photo overlays → MP4
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("thumbnail")}
          className={clsx(
            "flex min-h-[5.5rem] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--olive)]",
            mode === "thumbnail"
              ? "border-[var(--ink)] bg-[var(--yellow-bright)]"
              : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--olive)] text-white">
            <ImageIcon className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-xl font-extrabold text-[var(--ink)]">
              Team thumbnail
            </span>
            <span className="block text-base font-semibold text-[var(--muted)]">
              Headshots + names → PNG or 1-second video opener
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function StudioShell() {
  const { step, setStep, projectEpoch } = useStudio();
  const [mode, setMode] = useState<AppMode>("video");

  // After Start over, return to the video flow on step 1.
  useEffect(() => {
    if (projectEpoch > 0) setMode("video");
  }, [projectEpoch]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Sunny Love's yellow field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#ffe34a_0%,#ffd400_55%,#f0c200_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      {/* Top brand bar — matches Love's yellow header strip */}
      <header className="border-b-2 border-[var(--ink)] bg-[var(--yellow)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="animate-fade-up flex items-center gap-3 md:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/loves-video-mascot.jpg"
              alt="Love's Video Studio mascot"
              className="h-16 w-16 rounded-2xl border-2 border-[var(--ink)] bg-white object-cover shadow-sm md:h-20 md:w-20"
              width={1024}
              height={1024}
            />
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/loves-logo.png"
                alt="Love's"
                className="h-9 w-auto md:h-11"
                width={194}
                height={50}
              />
              <p className="font-hero mt-1 text-3xl leading-none md:text-4xl">
                Video Studio
              </p>
            </div>
          </div>

          <div className="flex max-w-md items-start gap-2">
            <p className="text-right text-base font-extrabold leading-snug text-[var(--ink)] md:text-lg">
              Make a team intro video or a Love&apos;s Team thumbnail for Allego.
            </p>
            <HelpTip title="What is this tool?" size="lg">
              <p>
                This tool helps Love&apos;s employees introduce their team to
                customers.
              </p>
              <p>
                Use <strong>Team intro video</strong> for a ~60 second talking
                video with timed teammate photos.
              </p>
              <p>
                Use <strong>Team thumbnail</strong> for a Love&apos;s red,
                yellow, and orange Team image with headshots, names, and titles.
              </p>
              <p>Tap any yellow ? button anytime for help.</p>
            </HelpTip>
          </div>
        </div>

        {/* Dark olive nav strip like loves.com */}
        <div className="bg-[var(--olive)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white md:px-6 md:text-base">
            <div className="flex flex-wrap items-center gap-2">
              <span>Team intros</span>
              <span className="hidden text-white/70 sm:inline">·</span>
              <span className="hidden sm:inline">Photo overlays</span>
              <span className="hidden text-white/70 md:inline">·</span>
              <span className="hidden md:inline">Allego ready</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs tracking-wide md:text-sm">
                Easy for everyone
              </span>
              <StartOverButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <ModeSwitcher mode={mode} onChange={setMode} />

        {/* Keep both modes mounted (hidden) so thumbnail photos and video
            step work survive switching back and forth. */}
        <div className={mode === "video" ? "block" : "hidden"} aria-hidden={mode !== "video"}>
          <div className="animate-fade-up-delay">
            <PurposeGuide />
          </div>
          <div className="mb-6">
            <StepIndicator step={step} onChange={setStep} />
          </div>
          <section className="studio-panel animate-rise p-4 md:p-8">
            {step === 1 ? <VideoUploadStep /> : null}
            {step === 2 ? <TeamPhotosStep /> : null}
            {step === 3 ? (
              <PreviewExportStep
                onCreateThumbnail={() => setMode("thumbnail")}
              />
            ) : null}
          </section>
        </div>

        <div
          className={mode === "thumbnail" ? "block" : "hidden"}
          aria-hidden={mode !== "thumbnail"}
        >
          <section className="studio-panel animate-rise p-4 md:p-8">
            <ThumbnailCreator
              key={projectEpoch}
              active={mode === "thumbnail"}
              onAddedToVideo={() => {
                setMode("video");
                setStep(3);
              }}
            />
          </section>
        </div>
      </main>

      <footer className="mt-4 border-t-2 border-[var(--ink)] bg-[var(--olive)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-white md:px-6">
          <p className="text-base font-bold">
            Love&apos;s Video Studio · for Allego digital sales rooms
          </p>
          <p className="text-sm font-semibold text-white/80">
            Keep it short. Keep it friendly. Keep it you.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function StudioApp() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
