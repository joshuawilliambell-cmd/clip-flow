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
    <div className="studio-panel mb-5 p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <p className="font-display text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
          What do you want to make?
        </p>
        <HelpTip title="Video or thumbnail?">
          <p>
            <strong>Team intro video</strong> builds the ~60 second Allego video
            with your talking clip and teammate photo overlays.
          </p>
          <p>
            <strong>Team thumbnail</strong> builds a Love&apos;s Team image with
            up to four headshots. Download a PNG or add it as a 1-second opening
            card on your intro video.
          </p>
        </HelpTip>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("video")}
          className={clsx(
            "flex min-h-[5rem] items-center gap-3 border px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
            "rounded-[var(--radius-md)]",
            mode === "video"
              ? "border-[var(--ink)] bg-[var(--yellow-bright)]"
              : "border-[var(--hairline)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[17px] font-semibold tracking-tight text-[var(--ink)]">
              Team intro video
            </span>
            <span className="mt-0.5 block text-[13px] font-medium text-[var(--muted)]">
              Record or upload · photo overlays · MP4 export
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("thumbnail")}
          className={clsx(
            "flex min-h-[5rem] items-center gap-3 border px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
            "rounded-[var(--radius-md)]",
            mode === "thumbnail"
              ? "border-[var(--ink)] bg-[var(--yellow-bright)]"
              : "border-[var(--hairline)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--olive)] text-white">
            <ImageIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[17px] font-semibold tracking-tight text-[var(--ink)]">
              Team thumbnail
            </span>
            <span className="mt-0.5 block text-[13px] font-medium text-[var(--muted)]">
              Headshots · names · PNG or 1-second opener
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

  useEffect(() => {
    if (projectEpoch > 0) setMode("video");
  }, [projectEpoch]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#ffe34a_0%,#ffd100_42%,#efc000_100%)]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(var(--ink)_1px,transparent_1px),linear-gradient(90deg,var(--ink)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <header className="border-b border-[var(--ink)] bg-[var(--yellow)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div className="animate-fade-up flex items-center gap-3 md:gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/loves-video-mascot.jpg"
              alt="Love's Video Studio mascot"
              className="h-14 w-14 rounded-[var(--radius-md)] border border-[var(--ink)] bg-white object-cover md:h-16 md:w-16"
              width={1024}
              height={1024}
            />
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/loves-logo.png"
                alt="Love's"
                className="h-8 w-auto md:h-9"
                width={194}
                height={50}
              />
              <p className="font-hero mt-0.5 text-[1.75rem] leading-none md:text-[2.1rem]">
                Video Studio
              </p>
            </div>
          </div>

          <div className="flex max-w-md items-start gap-2">
            <p className="text-right text-[14px] font-semibold leading-snug tracking-tight text-[var(--ink)] md:text-[15px]">
              Build Allego-ready team intro videos and Love&apos;s Team
              thumbnails.
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
                Use <strong>Team thumbnail</strong> for a Love&apos;s Team image
                with headshots, names, and titles.
              </p>
              <p>Tap any ? button anytime for help.</p>
            </HelpTip>
          </div>
        </div>

        <div className="border-t border-black/20 bg-[var(--olive)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 md:px-6 md:text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Fleet Sales</span>
              <span className="hidden text-white/35 sm:inline">|</span>
              <span className="hidden sm:inline">Team intros</span>
              <span className="hidden text-white/35 md:inline">|</span>
              <span className="hidden md:inline">Allego ready</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[var(--radius-sm)] border border-white/25 bg-[var(--primary)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] md:text-[11px]">
                Enterprise studio
              </span>
              <StartOverButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-7">
        <ModeSwitcher mode={mode} onChange={setMode} />

        <div
          className={mode === "video" ? "block" : "hidden"}
          aria-hidden={mode !== "video"}
        >
          <div className="animate-fade-up-delay">
            <PurposeGuide />
          </div>
          <div className="mb-5">
            <StepIndicator step={step} onChange={setStep} />
          </div>
          <section className="studio-panel animate-rise p-4 md:p-7">
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
          <section className="studio-panel animate-rise p-4 md:p-7">
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

      <footer className="mt-2 border-t border-[var(--ink)] bg-[var(--olive)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-white md:px-6">
          <p className="text-[13px] font-semibold tracking-tight">
            Love&apos;s Video Studio · Allego digital sales rooms
          </p>
          <p className="text-[12px] font-medium text-white/70">
            Short · Clear · On-brand
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
