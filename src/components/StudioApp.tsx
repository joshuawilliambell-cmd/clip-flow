"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Clapperboard, ImageIcon } from "lucide-react";
import { StudioProvider, useStudio } from "@/lib/studio-context";
import { StepIndicator } from "@/components/StepIndicator";
import { HelpTip } from "@/components/HelpTip";
import { PurposeGuide } from "@/components/PurposeGuide";
import { ThumbnailCreator } from "@/components/ThumbnailCreator";
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
    <div className="mb-6 rounded-3xl border-2 border-[var(--ink)] bg-white p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <p className="text-lg font-bold text-[var(--ink)]">What do you want to make?</p>
        <HelpTip title="Video or thumbnail?">
          <p>
            <strong>Team intro video</strong> builds the ~60 second Allego video
            with your talking clip and teammate photo overlays.
          </p>
          <p>
            <strong>Team thumbnail</strong> builds a Love&apos;s Team image with
            up to four headshots. You can download a PNG or add it as a 1-second
            opening card on your intro video.
          </p>
        </HelpTip>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("video")}
          className={clsx(
            "flex min-h-[5.5rem] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--yellow)]",
            mode === "video"
              ? "border-[var(--ink)] bg-[var(--yellow)]"
              : "border-[var(--border)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white">
            <Clapperboard className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-xl font-bold text-[var(--ink)]">
              Team intro video
            </span>
            <span className="block text-base text-[var(--muted)]">
              Record/upload video + photo overlays → MP4
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("thumbnail")}
          className={clsx(
            "flex min-h-[5.5rem] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--yellow)]",
            mode === "thumbnail"
              ? "border-[var(--ink)] bg-[var(--yellow)]"
              : "border-[var(--border)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2C5C] text-white">
            <ImageIcon className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-xl font-bold text-[var(--ink)]">
              Team thumbnail
            </span>
            <span className="block text-base text-[var(--muted)]">
              Headshots + names → PNG or 1-second video opener
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function StudioShell() {
  const { step, setStep } = useStudio();
  const [mode, setMode] = useState<AppMode>("video");

  return (
    <div className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fffdf2_0%,#ffffff_45%,#fff7f7_100%)]" />
        <div className="absolute left-0 right-0 top-0 h-2 bg-[var(--primary)]" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[var(--yellow)]" />
      </div>

      <header className="border-b-2 border-[var(--ink)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="animate-fade-up flex items-center gap-3 md:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/loves-logo.png"
              alt="Love's"
              className="h-12 w-auto md:h-16"
              width={194}
              height={50}
            />
            <div className="border-l-2 border-[var(--ink)] pl-3 md:pl-4">
              <p className="text-base font-bold uppercase tracking-[0.18em] text-[var(--ink)] md:text-lg">
                Video Studio
              </p>
              <p className="text-sm font-medium text-[var(--muted)] md:text-base">
                Team intros for Allego
              </p>
            </div>
          </div>

          <div className="flex max-w-md items-start gap-2">
            <p className="text-right text-base font-medium leading-snug text-[var(--ink)] md:text-lg">
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
                Use <strong>Team thumbnail</strong> for a navy-and-gold Love&apos;s
                Team image with headshots, names, and titles.
              </p>
              <p>Tap any yellow ? button anytime for help.</p>
            </HelpTip>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <ModeSwitcher mode={mode} onChange={setMode} />

        {mode === "video" ? (
          <>
            <div className="animate-fade-up-delay">
              <PurposeGuide />
            </div>
            <div className="mb-6">
              <StepIndicator step={step} onChange={setStep} />
            </div>
            <section className="animate-rise rounded-3xl border-2 border-[var(--ink)] bg-white p-4 shadow-[0_12px_0_rgba(0,0,0,0.06)] md:p-8">
              {step === 1 ? <VideoUploadStep /> : null}
              {step === 2 ? <TeamPhotosStep /> : null}
              {step === 3 ? (
                <PreviewExportStep
                  onCreateThumbnail={() => setMode("thumbnail")}
                />
              ) : null}
            </section>
          </>
        ) : (
          <section className="animate-rise rounded-3xl border-2 border-[var(--ink)] bg-white p-4 shadow-[0_12px_0_rgba(0,0,0,0.06)] md:p-8">
            <ThumbnailCreator
              onAddedToVideo={() => {
                setMode("video");
                setStep(3);
              }}
            />
          </section>
        )}
      </main>
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
